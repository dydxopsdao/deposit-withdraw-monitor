// src/utils/datadog/logger.ts
// Datadog logger with namespace pattern for comprehensive test run logging
// Emits one comprehensive log at test completion with funnel analysis

import { logger as consoleLogger } from "../logger/logging-utils";
import { Route } from "../route/routes";
import { TEST_TIMEOUTS } from "../../config/timeouts";
import os from "os";
import { logger } from "../logger/logging-utils";

// Datadog configuration
const DD_API_KEY = process.env.DD_API_KEY || process.env.DATADOG_API_KEY || "";
const DD_SITE = process.env.DD_SITE || "ap1.datadoghq.com";
const DD_SERVICE = process.env.DD_SERVICE || "dos-synth";
const DD_SOURCE = process.env.DD_SOURCE || "playwright";
const DD_DRY_RUN = process.env.DD_DRY_RUN === "1";
const DD_VERBOSE = process.env.DD_VERBOSE === "1";

// Report configuration
const REPORTS_CLOUDFRONT_URL = process.env.REPORTS_CLOUDFRONT_URL;
const UPLOAD_TIMESTAMP = process.env.UPLOAD_TIMESTAMP; // Set by entrypoint.sh
const LOGS_URL = `https://http-intake.logs.${DD_SITE}/api/v2/logs`;

// v4-web-aligned funnel steps
export type FunnelStep = "NavigateDialog" | "DepositInitiated" | "DepositSubmitted" | "DepositFinalized";

export interface TestRunLog {
  // Core identification
  timestamp: string;
  test_id: string;
  route_id: string;
  
  // Test outcome
  test_status: "passed" | "failed";
  duration_ms: number;
  
  // Funnel analysis
  steps_completed: FunnelStep[];
  failure_step?: FunnelStep;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
  
  // Step performance
  step_timings: {
    NavigateDialog?: number;
    DepositInitiated?: number; 
    DepositSubmitted?: number;
    DepositFinalized?: number;
  };
  
  // Route details (available from route object)
  wallet_type: "metamask" | "phantom";
  src_chain: string;
  dst_chain: string;
  token: string;
  amount: string;
  route_kind: "regular" | "instant";
  
  // Transaction details (for successful flows)
  tx_hash?: string;
  explorer_url?: string;
  
  // Report URLs
  report_url?: string;
  trace_url?: string;
  
  // Rebalance status
  rebalance_attempted: boolean;
  rebalance_success?: boolean;
}

export interface TestResult {
  status: "passed" | "failed";
  error?: Error;
  txHash?: string;
  explorerUrl?: string;
  rebalanceAttempted?: boolean;
  rebalanceSuccess?: boolean;
}

class TestRunLogger {
  private readonly startTime: number;
  private readonly testId: string;
  private readonly route: Route;
  private completedSteps: FunnelStep[] = [];
  private stepStartTimes: Record<FunnelStep, number> = {} as any;
  private stepTimings: Record<FunnelStep, number> = {} as any;
  private currentStep?: FunnelStep;

  constructor(route: Route, testId?: string) {
    this.route = route;
    this.testId = testId || this.generateTestId();
    this.startTime = Date.now();
    
    if (DD_VERBOSE) {
      consoleLogger.debug("TestRunLogger initialized", { 
        test_id: this.testId, 
        route_id: route.id 
      });
    }
  }

  /**
   * Mark the start of a funnel step
   */
  startStep(step: FunnelStep): void {
    this.currentStep = step;
    this.stepStartTimes[step] = Date.now();
    
    if (DD_VERBOSE) {
      consoleLogger.debug(`Started funnel step: ${step}`, { 
        test_id: this.testId,
        step 
      });
    }
  }

  /**
   * Mark a funnel step as completed successfully
   */
  completeStep(step: FunnelStep): void {
    if (!this.stepStartTimes[step]) {
      consoleLogger.warning(`Step ${step} completed but never started`, { 
        test_id: this.testId 
      });
      this.stepStartTimes[step] = this.startTime; // fallback
    }

    this.completedSteps.push(step);
    this.stepTimings[step] = Date.now() - this.stepStartTimes[step];
    
    if (DD_VERBOSE) {
      consoleLogger.debug(`Completed funnel step: ${step}`, { 
        test_id: this.testId,
        step,
        duration_ms: this.stepTimings[step]
      });
    }
  }

  /**
   * Emit the final test run log to Datadog
   */
  async logTestResult(result: TestResult): Promise<void> {
    logger.info("Logging test result", { result });
    const totalDuration = Date.now() - this.startTime;
    
    const log: TestRunLog = {
      timestamp: new Date().toISOString(),
      test_id: this.testId,
      route_id: this.route.id,
      
      test_status: result.status,
      duration_ms: totalDuration,
      
      steps_completed: [...this.completedSteps],
      failure_step: result.status === "failed" ? this.getFailureStep() : undefined,
      error: result.error ? this.serializeError(result.error) : undefined,
      
      step_timings: { ...this.stepTimings },
      
      // Route details
      wallet_type: this.route.wallet_type,
      src_chain: this.route.src_chain,
      dst_chain: this.route.dst_chain,
      token: this.route.token,
      amount: this.route.amount,
      route_kind: this.route.route_kind || "regular",
      
      // Transaction details
      tx_hash: result.txHash,
      explorer_url: result.explorerUrl,
      
      // Report URLs (generated at completion time to match upload timing)
      report_url: this.generateReportUrl(),
      trace_url: this.generateTraceUrl(),
      
      // Rebalance status
      rebalance_attempted: result.rebalanceAttempted || false,
      rebalance_success: result.rebalanceSuccess,
    };

    await this.sendLogToDatadog(log);
  }

  /**
   * Determine which step failed based on completed steps
   */
  private getFailureStep(): FunnelStep | undefined {
    const allSteps: FunnelStep[] = ["NavigateDialog", "DepositInitiated", "DepositSubmitted", "DepositFinalized"];
    
    // If we have a current step that wasn't completed, that's the failure point
    if (this.currentStep && !this.completedSteps.includes(this.currentStep)) {
      return this.currentStep;
    }
    
    // Otherwise, find the first step that wasn't completed
    for (const step of allSteps) {
      if (!this.completedSteps.includes(step)) {
        return step;
      }
    }
    
    // If all steps were completed but test still failed, it's a finality issue
    return "DepositFinalized";
  }

  /**
   * Serialize error object for logging
   */
  private serializeError(error: Error): { message: string; name?: string; stack?: string } {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack?.slice(0, 2000), // truncate stack traces
    };
  }

  /**
   * Generate a unique test ID
   */
  private generateTestId(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .slice(0, 19)           // Take YYYY-MM-DDTHH:MM:SS
      .replace('T', '_')      // Replace T with _
      .replace(/:/g, '-');    // Replace colons with dashes
    
    // Format: route-id/timestamp (matches S3 path structure)
    return `${this.route.id}/${timestamp}`;
  }

  /**
   * Generate CloudFront report URL matching the S3 upload path structure
   * Uses upload timestamp if available, otherwise current time
   */
  private generateReportUrl(): string {       
    // Format: https://d15e662yct7lwz.cloudfront.net/route-id/timestamp/index.html
    return `${REPORTS_CLOUDFRONT_URL}/${this.route.id}/${UPLOAD_TIMESTAMP}/index.html`;
  }

  /**
   * Generate trace URL for the test run
   * Uses upload timestamp if available, otherwise current time
   */
  private generateTraceUrl(): string {
    // Format: https://d15e662yct7lwz.cloudfront.net/route-id/timestamp/trace.zip
    return `${REPORTS_CLOUDFRONT_URL}/${this.route.id}/${UPLOAD_TIMESTAMP}/trace.zip`;
  }

  /**
   * Send log to Datadog via HTTP API
   */
  private async sendLogToDatadog(log: TestRunLog): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const ddLogItem = {
      message: `[synthetic_test_run] ${log.test_status.toUpperCase()}: ${log.route_id}`,
      status: log.test_status === "failed" ? "error" : "info",
      ddtags: this.buildTags(log).join(","),
      ddsource: DD_SOURCE,
      service: DD_SERVICE,
      hostname: os.hostname(),
      attributes: log,
    };

    if (DD_DRY_RUN) {
      consoleLogger.info("DD (dry-run) test run log", { 
        test_id: log.test_id,
        status: log.test_status,
        route_id: log.route_id,
        steps_completed: log.steps_completed.length,
        duration_ms: log.duration_ms
      });
      return;
    }

    try {
      const response = await this.postToDatadog([ddLogItem]);
      
      if (DD_VERBOSE) {
        consoleLogger.debug("Test run log sent to Datadog", {
          test_id: log.test_id,
          status: log.test_status,
          response_status: response?.status
        });
      }
    } catch (error) {
      consoleLogger.warning("Failed to send test run log to Datadog", {
        test_id: log.test_id,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - logging failures shouldn't break tests
    }
  }

  /**
   * Build Datadog tags for filtering and grouping
   */
  private buildTags(log: TestRunLog): string[] {
    return [
      `service:${DD_SERVICE}`,
      `test_status:${log.test_status}`,
      `route_id:${log.route_id}`,
      `wallet_type:${log.wallet_type}`,
      `src_chain:${log.src_chain}`,
      `dst_chain:${log.dst_chain}`,
      `token:${log.token}`,
      `route_kind:${log.route_kind}`,
      log.failure_step ? `failure_step:${log.failure_step}` : null,
    ].filter(Boolean) as string[];
  }


  /**
   * Check if Datadog logging is enabled
   */
  private isEnabled(): boolean {
    const enabled = Boolean(DD_API_KEY);
    if (!enabled && DD_VERBOSE) {
      consoleLogger.warning("Datadog logging disabled (missing DD_API_KEY)");
    }
    return enabled;
  }

  /**
   * Post data to Datadog HTTP API
   */
  private async postToDatadog(items: any[]): Promise<Response | undefined> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUTS.ACTION);

    try {
      const response = await fetch(LOGS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": DD_API_KEY,
        },
        body: JSON.stringify(items),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text().catch(() => "Unknown error")}`);
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Namespace export
export const datadog = {
  /**
   * Create a new test run logger for tracking funnel steps and comprehensive test logging
   */
  createTestRunLogger: (route: Route, testId?: string) => new TestRunLogger(route, testId),

  /**
   * Send a direct log to Datadog (for ad-hoc logging)
   */
  sendLog: async (message: string, attributes: Record<string, any> = {}, tags: string[] = []) => {
    if (!DD_API_KEY) return;

    const ddLogItem = {
      message,
      status: "info",
      ddtags: [`service:${DD_SERVICE}`, ...tags].join(","),
      ddsource: DD_SOURCE,
      service: DD_SERVICE,
      hostname: os.hostname(),
      attributes,
    };

    if (DD_DRY_RUN) {
      consoleLogger.info("DD (dry-run) direct log", { message, attributes, tags });
      return;
    }

    try {
      await fetch(LOGS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": DD_API_KEY,
        },
        body: JSON.stringify([ddLogItem]),
      });
    } catch (error) {
      consoleLogger.warning("Failed to send direct log to Datadog", {
        message,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Check if Datadog is enabled
   */
  isEnabled: () => Boolean(DD_API_KEY),

  /**
   * Generate report URL for a given route and timestamp
   */
  generateReportUrl: (routeId: string, timestamp?: string) => {
    const ts = timestamp || UPLOAD_TIMESTAMP
      .slice(0, 19)
      .replace('T', '_')
      .replace(/:/g, '-');
    return `${REPORTS_CLOUDFRONT_URL}/${routeId}/${ts}/index.html`;
  },

  /**
   * Generate trace URL for a given route and timestamp
   */
  generateTraceUrl: (routeId: string, timestamp?: string) => {
    const ts = timestamp || UPLOAD_TIMESTAMP
      .slice(0, 19)
      .replace('T', '_')
      .replace(/:/g, '-');
    return `${REPORTS_CLOUDFRONT_URL}/${routeId}/${ts}/trace.zip`;
  },

  /**
   * Get current Datadog configuration
   */
  getConfig: () => ({
    apiKey: DD_API_KEY ? "[REDACTED]" : undefined,
    site: DD_SITE,
    service: DD_SERVICE,
    source: DD_SOURCE,
    dryRun: DD_DRY_RUN,
    verbose: DD_VERBOSE,
    enabled: Boolean(DD_API_KEY),
    reportsUrl: REPORTS_CLOUDFRONT_URL,
  }),
};