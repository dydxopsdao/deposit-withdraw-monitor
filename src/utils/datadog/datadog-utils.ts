// src/utils/datadog-utils.ts
//
// Very rough Datadog stubs.
// - No deps (uses global fetch in Node 18+).
// - Safe no-op if DD_API_KEY is not set.
// - Swallows network errors (tests should not fail from telemetry).
//
// Usage:
//   await emitResult(true, ["route_id:dep-ethereum-usdc-...","env:prod"]);
//   await emitLog("deposit.ok", { route_id: "...", tx_hash }, ["env:prod"]);

import os from "os";

// --- Env / config -----------------------------------------------------------
const DD_API_KEY = process.env.DD_API_KEY || process.env.DATADOG_API_KEY || "";
const DD_SITE = process.env.DD_SITE || "datadoghq.com"; // or "datadoghq.eu"
const DD_SERVICE = process.env.DD_SERVICE || "dos-synth";
const DD_ENV = process.env.ENVIRONMENT || "prod";
const DD_SOURCE = process.env.DD_SOURCE || "playwright";
const HOSTNAME = os.hostname();

// Metric names (override if you like)
const METRIC_RESULT = process.env.DD_METRIC_RESULT || "synth.deposit.result";

// Endpoints
const METRICS_URL = `https://api.${DD_SITE}/api/v1/series?api_key=${encodeURIComponent(DD_API_KEY)}`;
const LOGS_URL = `https://http-intake.logs.${DD_SITE}/api/v2/logs`;

// --- Public API -------------------------------------------------------------

/**
 * Emit a simple pass/fail metric: 1 for pass, 0 for fail.
 */
export async function emitResult(passed: boolean, tags: string[] = []): Promise<void> {
  if (!isEnabled()) return;

  const now = Math.floor(Date.now() / 1000);
  const series = {
    series: [
      {
        metric: METRIC_RESULT,
        type: "gauge",
        points: [[now, passed ? 1 : 0]],
        tags: normalizeTags(tags),
        resources: [{ name: DD_SERVICE, type: "service" }],
      },
    ],
  };

  try {
    await postJSON(METRICS_URL, series, {
      "Content-Type": "application/json",
    });
  } catch {
    // swallow
  }
}

/**
 * Emit a structured log entry to Datadog logs intake.
 * `event` becomes part of the message; payload is JSON-stringified.
 */
export async function emitLog(
  event: string,
  payload: Record<string, unknown> = {},
  tags: string[] = []
): Promise<void> {
  if (!isEnabled()) return;

  const ddtags = normalizeTags(tags).concat([`service:${DD_SERVICE}`, `env:${DD_ENV}`]).join(",");

  const items = [
    {
      // Keep 'message' human readable; put the full object in 'attributes'
      message: `[${event}] ${payloadSummary(payload)}`,
      status: "info",
      ddtags,
      ddsource: DD_SOURCE,
      service: DD_SERVICE,
      hostname: HOSTNAME,
      // Full payload goes here for searchability
      attributes: {
        event,
        env: DD_ENV,
        ...payload,
      },
    },
  ];

  try {
    await postJSON(LOGS_URL, items, {
      "Content-Type": "application/json",
      "DD-API-KEY": DD_API_KEY,
    });
  } catch {
    // swallow
  }
}

// --- Helpers ----------------------------------------------------------------

function isEnabled(): boolean {
  return Boolean(DD_API_KEY);
}

function normalizeTags(tags: string[]): string[] {
  // Datadog expects "key:value" strings. We assume caller provides that shape.
  // Filter empties and whitespace.
  return (tags || []).map((t) => String(t).trim()).filter(Boolean);
}

function payloadSummary(obj: Record<string, unknown>): string {
  try {
    // very small summary string; avoid dumping massive JSON in 'message'
    const keys = Object.keys(obj || {});
    if (!keys.length) return "";
    const preview = keys.slice(0, 5).reduce((acc, k) => {
      const v = (obj as any)[k];
      acc[k] = typeof v === "string" ? v.slice(0, 120) : v;
      return acc;
    }, {} as Record<string, unknown>);
    return JSON.stringify(preview);
  } catch {
    return "";
  }
}

async function postJSON(url: string, body: unknown, headers: Record<string, string>) {
  // 5s timeout guard
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 5000);

  try {
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctl.signal,
    }).catch(() => {});
  } finally {
    clearTimeout(t);
  }
}
