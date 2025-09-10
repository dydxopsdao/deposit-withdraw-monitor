// src/utils/datadog/datadog-utils.ts
// Minimal Datadog client for our synth tests with improved internal logging.
// - Safe no-op if DD_API_KEY is missing
// - 5s HTTP timeout; never throws to callers
// - Low-cardinality, consistent tags
// - Logs only on route failures; rebalancer logs always

import os from "os";
import { logger } from "../logger/logging-utils";
import { TEST_TIMEOUTS } from "../../config/timeouts";

// ----- Config (keep defaults tiny) ------------------------------------------
const DD_API_KEY = process.env.DD_API_KEY || process.env.DATADOG_API_KEY || "";
const DD_SITE = process.env.DD_SITE || "ap1.datadoghq.com"; // we use ap1
const DD_SERVICE = process.env.DD_SERVICE || "dos-synth";
const DD_SOURCE = process.env.DD_SOURCE || "playwright";
const HOSTNAME = os.hostname();
const DD_DRY_RUN = process.env.DD_DRY_RUN === "1";
const DD_VERBOSE = process.env.DD_VERBOSE === "1"; // extra logs about requests/results

// Metric names
const METRIC_ROUTE_RESULT = process.env.DD_METRIC_ROUTE_RESULT || "synth.route.result";
const METRIC_REBALANCE_RESULT = process.env.DD_METRIC_REBALANCE_RESULT || "synth.rebalance.result";
const METRIC_WALLET_BALANCE = process.env.DD_METRIC_WALLET_BALANCE || "synth.wallet.balance";

// Endpoints
const METRICS_URL = `https://api.${DD_SITE}/api/v1/series?api_key=${encodeURIComponent(DD_API_KEY)}`;
const LOGS_URL = `https://http-intake.logs.${DD_SITE}/api/v2/logs`;

// ----- Types ----------------------------------------------------------------
export type WalletType = "metamask" | "phantom";
export type Operation = "deposit" | "withdraw" | "rebalance";

// Single source of truth for error stages
export const ERROR_STAGES = [
  "setup",
  "pre_submit",
  "submit",
  "finality",
  "submit_or_finality",
  "rebalance",
] as const;
export type ErrorStage = typeof ERROR_STAGES[number];

export interface RouteSummary {
  id: string;
  kind: "deposit" | "withdraw";
  wallet_type: WalletType;
  wallet_alias?: string;
  wallet_address: string;
  dydx_address: string;
  route_kind?: "regular" | "instant";
  amount: string;
  src_chain: string;
  dst_chain: string;
  token?: string;
}

type ErrorLike = { name?: string; message?: string; stack?: string; code?: string } | undefined;

type BalanceMap =
  | Record<string, number> // { "USDC": 15.2, "ETH": 0.01 }
  | Array<{ token: string; chain: string; amount: number }>; // [{ token, chain, amount }]

// ----- Public API -----------------------------------------------------------

export function createTelemetryContext(cfg: {
  route: RouteSummary;
  wallet?: WalletType;         // defaults to route.wallet_type
  operation?: Operation;       // for route tests, set to deposit|withdraw
  extraTags?: string[];        // optional static tags
}) {
  const route = cfg.route;
  const wallet = cfg.wallet ?? route.wallet_type;
  const op = cfg.operation ?? route.kind;
  const staticTags = normalizeTags(cfg.extraTags ?? []);
  const baseTags = makeRouteTags(route, wallet, op);

  return {
    // Metric + (on fail) error log
    async routeResult(args: {
      passed: boolean;
      txHash?: string;
      explorerUrl?: string;
      errorStage?: ErrorStage;
      error?: ErrorLike;
    }) {
      const tags = baseTags;
      await sendRouteResultMetric(args.passed, tags);
      if (!args.passed) {
        await sendRouteLog(
          `${op}.error`,
          {
            route: routeSummaryForLog(route),
            tx_hash: args.txHash,
            explorer_url: args.explorerUrl,
            error_stage: args.errorStage ?? "submit_or_finality",
            error: toErrorLike(args.error),
          },
          tags
        );
      } else if (DD_VERBOSE) {
        logger.info("DD: route success metric sent", { metric: METRIC_ROUTE_RESULT, tags });
      }
    },

    // Optional explicit route log (use if you want success logs occasionally)
    async routeLog(
      event: "deposit.ok" | "deposit.error" | "withdraw.ok" | "withdraw.error",
      payload?: Record<string, unknown>
    ) {
      const tags = baseTags;
      await sendRouteLog(event, { route: routeSummaryForLog(route), ...(payload || {}) }, tags);
    },

    // Rebalancer: metric + always log (with balances if provided)
    async rebalanceResult(args: {
      passed: boolean;
      balancesBefore?: BalanceMap;
      balancesAfter?: BalanceMap;
      error?: ErrorLike;
    }) {
      const tags = withOperation(baseTags, "rebalance");
      await sendRebalanceResultMetric(args.passed, tags);
      const event = args.passed ? "rebalance.ok" : "rebalance.error";
      const payload: Record<string, unknown> = {
        route_id: route.id,
        wallet_alias: route.wallet_alias,
        balances_before: args.balancesBefore,
        balances_after: args.balancesAfter,
      };
      if (!args.passed) payload.error = toErrorLike(args.error);
      await sendRouteLog(event, payload, tags);
    },

    // Wallet balance gauges (emit one per token/chain)
    async walletBalance(p: { alias: string; token: string; chain: string; amount: number }) {
      const tags = normalizeTags([`wallet_alias:${p.alias}`, `token:${p.token}`, `chain:${p.chain}`].concat(staticTags));
      await sendGauge(METRIC_WALLET_BALANCE, p.amount, tags);
    },
  };
}

// ----- Implementation -------------------------------------------------------

function makeRouteTags(route: RouteSummary, wallet: WalletType, operation: Operation): string[] {
  const tags = [
    `route_id:${route.id}`,
    `wallet:${wallet}`,
    `operation:${operation}`,
    route.route_kind ? `route_kind:${route.route_kind}` : null,
    route.src_chain ? `src:${route.src_chain}` : null,
    route.dst_chain ? `dst:${route.dst_chain}` : null,
    route.wallet_alias ? `wallet_alias:${route.wallet_alias}` : null,
  ];
  return normalizeTags(tags);
}

function withOperation(tags: string[], operation: Operation): string[] {
  // replace or append operation:<...>
  const rest = tags.filter((t) => !t.startsWith("operation:"));
  return rest.concat(`operation:${operation}`);
}

async function sendRouteResultMetric(passed: boolean, tags: string[]) {
  await sendGauge(METRIC_ROUTE_RESULT, passed ? 1 : 0, tags);
}

async function sendRebalanceResultMetric(passed: boolean, tags: string[]) {
  await sendGauge(METRIC_REBALANCE_RESULT, passed ? 1 : 0, tags);
}

async function sendGauge(metric: string, value: number, tags: string[]) {
  // TODO: Support batching metrics to minimize HTTP overhead when emitting high volumes.
  if (!enabled()) return;
  const now = Math.floor(Date.now() / 1000);
  const body = {
    series: [
      {
        metric,
        type: "gauge",
        points: [[now, value]],
        tags,
        resources: [{ name: DD_SERVICE, type: "service" }],
      },
    ],
  };
  if (DD_DRY_RUN) {
    logger.info("DD (dry-run) metric", { metric, value, tags });
    return;
  }
  const size = byteLen(body);
  if (DD_VERBOSE) logger.debug("DD: sending metric", { metric, value, tags, bytes: size });
  await postJSON(METRICS_URL, body, { "Content-Type": "application/json" }, { kind: "metric", metric });
}

async function sendRouteLog(event: string, payload: Record<string, unknown>, tags: string[]) {
  if (!enabled()) return;

  const ddtags = normalizeTags(tags).concat([`service:${DD_SERVICE}`]).join(",");
  const items = [
    {
      message: `[${event}] ${summarize(payload)}`,
      status: payload && (payload as any).error ? "error" : "info",
      ddtags,
      ddsource: DD_SOURCE,
      service: DD_SERVICE,
      hostname: HOSTNAME,
      attributes: sanitizeAttrs({ event, ...payload }),
    },
  ];

  if (DD_DRY_RUN) {
    logger.info("DD (dry-run) log", { event, tags, preview: summarize(payload) });
    return;
  }
  const size = byteLen(items);
  if (DD_VERBOSE) logger.debug("DD: sending log", { event, tags, bytes: size });
  await postJSON(
    LOGS_URL,
    items,
    {
      "Content-Type": "application/json",
      "DD-API-KEY": DD_API_KEY,
    },
    { kind: "log", event }
  );
}

// ----- Helpers --------------------------------------------------------------

let warnedDisabled = false;
function enabled(): boolean {
  const ok = Boolean(DD_API_KEY);
  if (!ok && !warnedDisabled) {
    warnedDisabled = true;
    logger.warning("Datadog disabled (missing DD_API_KEY). Telemetry will be a no-op.");
  }
  return ok;
}

function normalizeTags(tags: Array<string | null | undefined>): string[] {
  return (tags || []).map(String).map((s) => s.trim()).filter(Boolean);
}

// Summarize the route for logs (keeps payload compact & stable)
function routeSummaryForLog(route: RouteSummary) {
  return {
    id: route.id,
    kind: route.kind,
    wallet_type: route.wallet_type,
    wallet_alias: route.wallet_alias,
    route_kind: route.route_kind,
    amount: route.amount,
    src_chain: route.src_chain,
    dst_chain: route.dst_chain,
    token: route.token,
  };
}

function summarize(obj: Record<string, unknown>): string {
  try {
    const keys = Object.keys(obj || {});
    if (!keys.length) return "";
    const preview: Record<string, unknown> = {};
    for (const k of keys.slice(0, 6)) {
      const v = (obj as any)[k];
      preview[k] = typeof v === "string" ? v.slice(0, 160) : v;
    }
    return JSON.stringify(preview);
  } catch {
    return "";
  }
}

function sanitizeAttrs(obj: Record<string, unknown>): Record<string, unknown> {
  // Basic redaction – keep it here to avoid coupling
  const REDACT_KEYS = new Set([
    "password",
    "passphrase",
    "secret",
    "seed",
    "mnemonic",
    "privateKey",
    "token",
    "authorization",
    "apiKey",
    "api_key",
    "accessToken",
    "refreshToken",
  ]);
  const out: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (REDACT_KEYS.has(k)) {
      out[k] = "[REDACTED]";
      continue;
    }
    if (v && typeof v === "object") {
      out[k] = sanitizeAttrs(v as any);
      continue;
    }
    out[k] = v;
  }
  return out;
}

function toErrorLike(e: ErrorLike): ErrorLike {
  if (!e) return undefined;
  if (typeof e === "object" && ("message" in e || "name" in e || "stack" in e)) {
    const stack = (e as any).stack ? String((e as any).stack).slice(0, 4000) : undefined;
    return { name: (e as any).name, message: (e as any).message, stack, code: (e as any).code };
  }
  return { message: String(e) };
}

function byteLen(body: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return 0;
  }
}

async function postJSON(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  meta: { kind: "metric"; metric: string } | { kind: "log"; event: string }
) {
  // TODO: Allow configurable timeout and add retry/backoff for transient network failures.
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TEST_TIMEOUTS.ACTION);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctl.signal,
    }).catch((err) => {
      if (DD_VERBOSE) logger.warning("DD: fetch error", { target: url, kind: meta.kind, error: String(err?.message || err) });
      // swallow
      return undefined as any;
    });

    const elapsed = Date.now() - started;

    if (!res) return;
    if (!("ok" in res)) return; // defensive for odd runtimes

    if (!res.ok) {
      const text = await safeReadText(res);
      logger.warning("DD: non-2xx response", {
        target: url,
        kind: meta.kind,
        code: res.status,
        elapsed_ms: elapsed,
        body_preview: text?.slice(0, 300),
      });
      return;
    }

    if (DD_VERBOSE) {
      logger.debug("DD: sent successfully", {
        kind: meta.kind,
        code: res.status,
        elapsed_ms: elapsed,
      });
    }
  } finally {
    clearTimeout(t);
  }
}

async function safeReadText(res: any): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}
