// src/utils/datadog/metrics.ts
// Datadog metrics module for sending gauge metrics via HTTP API

import { logger as consoleLogger } from "../../logger";
import { Route } from "../../utils";

// Datadog configuration
const DD_API_KEY = process.env.DD_API_KEY;
const DD_SITE = process.env.DD_SITE;
const DD_SERVICE = process.env.DD_SERVICE;
const DD_SOURCE = process.env.DD_SOURCE;
const DD_ENV = process.env.DD_ENV ?? "prod";
const DD_DRY_RUN = process.env.DD_DRY_RUN === "1";
const DD_VERBOSE = process.env.DD_VERBOSE === "1";

// Metrics API URL
const METRICS_URL = `https://api.${DD_SITE}/api/v2/series`;

interface MetricTag {
  key: string;
  value: string;
}

/**
 * Datadog metrics client for sending metrics via HTTP API
 */
export class DatadogMetricsClient {
  private readonly apiKey: string;
  private readonly site: string;
  private readonly service: string;
  private readonly source: string;
  private readonly env: string;

  constructor(
    apiKey?: string,
    site?: string,
    service?: string,
    source?: string,
    env?: string
  ) {
    this.apiKey = apiKey || DD_API_KEY || "";
    this.site = site || DD_SITE || "";
    this.service = service || DD_SERVICE || "";
    this.source = source || DD_SOURCE || "";
    this.env = env || DD_ENV || "";

    if (DD_VERBOSE) {
      consoleLogger.debug("DatadogMetricsClient initialized", {
        site: this.site,
        service: this.service,
        source: this.source,
        env: this.env,
      });
    }
  }

  /**
   * Send a gauge metric to Datadog
   */
  async sendGauge(
    metricName: string,
    value: number,
    tags: MetricTag[] = [],
    timestamp?: number,
    source?: string
  ): Promise<void> {
    if (DD_DRY_RUN) {
      consoleLogger.info(`DD (dry-run) metric: ${metricName}`, {
        value,
        tags,
        timestamp: timestamp || Math.floor(Date.now() / 1000)
      });
      return;
    }

    // Check if we have API key for real sending
    if (!this.apiKey) {
      if (DD_VERBOSE) {
        consoleLogger.warning(`Datadog metrics disabled (missing DD_API_KEY) - skipping metric: ${metricName}`);
      }
      return;
    }

    const tagStrings = tags.map(tag => `${tag.key}:${tag.value}`);
    
    const payload = {
      series: [
        {
          metric: metricName,
          type: 0, // gauge type
          points: [
            {
              timestamp: Number(timestamp || Math.floor(Date.now() / 1000)),
              value: Number(value)
            }
          ],
          tags: tagStrings,
          source_type_name: source || this.source,
        },
      ],
    };

    if (DD_VERBOSE) {
      consoleLogger.info(`DD metric to datadog: ${metricName}`, payload as any);
    }

    try {
      await this.postToDatadog(payload);
    } catch (error) {
      consoleLogger.warning(`Failed to send metric ${metricName} to Datadog`, {
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - metrics failures shouldn't break tests
    }
  }

  /**
   * Build standard tags for test run metrics
   */
  buildTestRunTags(route: Route, flowName: string, testStatus: "passed" | "failed", failureStep?: string): MetricTag[] {
    const tags: MetricTag[] = [
      { key: "route_id", value: route.id },
      { key: "wallet_type", value: route.wallet_type },
      { key: "src_chain", value: route.src_chain },
      { key: "dst_chain", value: route.dst_chain },
      { key: "token", value: route.token },
      { key: "flow", value: flowName },
      { key: "env", value: this.env },
    ];

    // Add chain tag (non-dydx chain)
    const chain = route.src_chain !== "dydx" ? route.src_chain : route.dst_chain;
    tags.push({ key: "chain", value: chain });

    // Add route_kind for deposit routes
    if (route.route_kind) {
      tags.push({ key: "route_kind", value: route.route_kind });
    }

    // Add failure step if provided
    if (failureStep) {
      tags.push({ key: "failure_step", value: failureStep });
    }

    return tags;
  }

  /**
   * Post metric data to Datadog HTTP API
   */
  private async postToDatadog(payload: any): Promise<Response | undefined> {
    if (!this.apiKey) {
      throw new Error("DD_API_KEY is required for Datadog metrics");
    }

    if (DD_VERBOSE) {
      consoleLogger.info("++++++ Sending metrics request to Datadog ++++++", {
        url: METRICS_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": "[REDACTED]"
        },
        body: JSON.stringify(payload, null, 2)
      });
    }

    const response = await fetch(METRICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text().catch(() => "Failed to read response");

    if (DD_VERBOSE) {
      consoleLogger.info("++++++ Received metrics response from Datadog ++++++", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return response;
  }
}

// Default client instance
export const datadogMetrics = new DatadogMetricsClient();

/**
 * Send metric to Datadog
 */
export async function sendMetricToDatadog(
  route: Route,
  flowName: "deposit" | "withdraw",
  testStatus: "passed" | "failed",
  failureStep?: string,
  client: DatadogMetricsClient = datadogMetrics
): Promise<void> {
  const tags = client.buildTestRunTags(route, flowName, testStatus, failureStep);
  const isPassed = testStatus === "passed" ? 1 : 0;
  
  // Use "playwright" as source for test metrics
  await client.sendGauge("synthetic_test_run.is_passed", isPassed, tags, undefined, "playwright");
}

/**
 * Build rebalancer-specific tags for balance metrics
 */
export function buildRebalancerTags(route: Route, chain: string): MetricTag[] {
  return [
    { key: "route_id", value: route.id },
    { key: "flow", value: route.kind },
    { key: "route_kind", value: route.route_kind || "unknown" },
    { key: "chain", value: chain },
    { key: "asset", value: "USDC" },
  ];
}

/**
 * Send rebalancer balance metrics to Datadog
 */
export async function sendRebalancerBalanceMetrics(
  route: Route,
  balancesAfter: Array<{ asset: string; chain: string; amount: string }>,
  client: DatadogMetricsClient = datadogMetrics
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);

  // Send current USDC balance for each chain
  for (const balance of balancesAfter) {
    if (balance.asset === 'USDC') {
      const tags = buildRebalancerTags(route, balance.chain);
      const amount = parseFloat(balance.amount);
      
      await client.sendGauge("rebalancer.balance", amount, tags, timestamp);
    }
  }
}