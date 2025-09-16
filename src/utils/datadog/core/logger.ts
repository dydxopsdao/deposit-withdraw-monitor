// src/utils/datadog/core/logger.ts
// Generic flow-agnostic test run logger for comprehensive datadog logging
// Emits one comprehensive log at test completion with funnel analysis

import { logger as consoleLogger } from "../../logger/logging-utils";
import { Route } from "../../route/routes";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { hostname } from "os";
import { BaseTestRunLog, BaseFlowConfig, FlowStepData, TestResult } from './types';

// Datadog configuration
const DD_API_KEY = process.env.DD_API_KEY;
const DD_SITE = process.env.DD_SITE;
const DD_SERVICE = process.env.DD_SERVICE;
const DD_SOURCE = process.env.DD_SOURCE;
const DD_DRY_RUN = process.env.DD_DRY_RUN === "1";
const DD_VERBOSE = process.env.DD_VERBOSE === "1";

// Report configuration
const REPORTS_CLOUDFRONT_URL = process.env.REPORTS_CLOUDFRONT_URL;
const UPLOAD_TIMESTAMP = process.env.UPLOAD_TIMESTAMP; // Set by entrypoint.sh
const LOGS_URL = `https://http-intake.logs.${DD_SITE}/api/v2/logs`;

export class FlowTestRunLogger<TStep extends string, TLog extends BaseTestRunLog> {
  private readonly startTime: number;
  private readonly testId: string;
  private readonly route: Route;
  private readonly config: BaseFlowConfig<TStep, TLog>;
  private completedSteps: TStep[] = [];
  private stepStartTimes: Record<TStep, number> = {} as any;
  private stepTimings: Record<TStep, number> = {} as any;
  private currentStep?: TStep;

  constructor(config: BaseFlowConfig<TStep, TLog>, route: Route, testId?: string) {
    this.config = config;
    this.route = route;
    this.testId = testId || this.generateTestId();
    this.startTime = Date.now();
    
    if (DD_VERBOSE) {
      consoleLogger.debug(`${config.flowName} TestRunLogger initialized`, { 
        test_id: this.testId, 
        route_id: route.id,
        flow: config.flowName
      });
    }
  }

  /**
   * Mark the start of a funnel step
   */
  startStep(step: TStep): void {
    this.currentStep = step;
    this.stepStartTimes[step] = Date.now();
    
    if (DD_VERBOSE) {
      consoleLogger.debug(`Started ${this.config.flowName} funnel step: ${step}`, { 
        test_id: this.testId,
        step,
        flow: this.config.flowName
      });
    }
  }

  /**
   * Mark a funnel step as completed successfully
   */
  completeStep(step: TStep): void {
    if (!this.stepStartTimes[step]) {
      consoleLogger.warning(`Step ${step} completed but never started`, { 
        test_id: this.testId,
        flow: this.config.flowName
      });
      this.stepStartTimes[step] = this.startTime; // fallback
    }

    this.completedSteps.push(step);
    this.stepTimings[step] = Date.now() - this.stepStartTimes[step];
    
    if (DD_VERBOSE) {
      consoleLogger.debug(`Completed ${this.config.flowName} funnel step: ${step}`, { 
        test_id: this.testId,
        step,
        duration_ms: this.stepTimings[step],
        flow: this.config.flowName
      });
    }
  }

  /**
   * Assembles the final test run log and sends it to Datadog
   */
  async logTestResult(result: TestResult): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    
    // Create base log structure
    const baseLog: BaseTestRunLog = {
      timestamp: new Date().toISOString(),
      test_id: this.testId,
      route_id: this.route.id,
      
      test_status: result.status,
      duration_ms: totalDuration,
      
      // Route details
      wallet_type: this.route.wallet_type,
      src_chain: this.route.src_chain,
      dst_chain: this.route.dst_chain,
      token: this.route.token,
      amount: this.route.amount,
      route_kind: this.route.route_kind || (() => {
        throw new Error(`Route ${this.route.id} is missing required route_kind field`);
      })(),

      // Transaction details
      tx_hash: result.txHash,
      explorer_url: result.explorerUrl,
      
      // Playwright report URL
      report_url: this.generateReportUrl(),
    };

    // Create flow-specific step data
    const stepData: FlowStepData<TStep> = {
      steps_completed: [...this.completedSteps],
      failure_step: result.status === "failed" ? this.getFailureStep() : undefined,
      error: result.error ? this.serializeError(result.error) : undefined,
      step_timings: { ...this.stepTimings },
    };

    // Use flow config to create the final log interface
    const log = this.config.createLogInterface(baseLog, stepData);

    await this.sendLogToDatadog(log);
  }

  /**
   * Determine which step failed based on completed steps
   */
  private getFailureStep(): TStep | undefined {
    // If we have a current step that wasn't completed, that's the failure point
    if (this.currentStep && !this.completedSteps.includes(this.currentStep)) {
      return this.currentStep;
    }
    
    // Otherwise, find the first step that wasn't completed
    for (const step of this.config.allSteps) {
      if (!this.completedSteps.includes(step)) {
        return step;
      }
    }
    
    // If all steps were completed but test still failed, it's the final step (finality issue)
    return this.config.allSteps[this.config.allSteps.length - 1];
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
   */
  private generateReportUrl(): string {       
    // Format: https://d15e662yct7lwz.cloudfront.net/route-id/timestamp/index.html
    if (!UPLOAD_TIMESTAMP) {
      throw new Error("UPLOAD_TIMESTAMP environment variable is required for report URL generation");
    }
    return `${REPORTS_CLOUDFRONT_URL}/${this.route.id}/${UPLOAD_TIMESTAMP}/index.html`;
  }

  /**
   * Send log to Datadog via HTTP API
   */
  private async sendLogToDatadog(log: TLog): Promise<void> {
    if (DD_DRY_RUN) {
      consoleLogger.info(`DD (dry-run) ${this.config.flowName} test run log`, log as any);
      return;
    }

    // Check if we have API key for real sending
    if (!DD_API_KEY) {
      if (DD_VERBOSE) {
        consoleLogger.warning("Datadog logging disabled (missing DD_API_KEY)");
      }
      return;
    }

    // Show what we're sending if verbose
    if (DD_VERBOSE) {
      consoleLogger.info(`DD log to datadog (${this.config.flowName})`, log as any);
    }

    const ddLogItem = {
      message: `[synthetic_test_run] ${log.test_status.toUpperCase()}: ${log.route_id} (${this.config.flowName})`,
      status: log.test_status === "failed" ? "error" : "info",
      ddtags: this.buildTags(log).join(","),
      ddsource: DD_SOURCE,
      service: DD_SERVICE,
      hostname: hostname(),
      attributes: log,
    };

    try {
      await this.postToDatadog([ddLogItem]);
    } catch (error) {
      consoleLogger.warning(`Failed to send ${this.config.flowName} test run log to Datadog`, {
        test_id: log.test_id,
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - logging failures shouldn't break tests
    }
  }

  /**
   * Build Datadog tags for filtering and grouping
   */
  private buildTags(log: TLog): string[] {
    const baseTags = [
      `service:${DD_SERVICE}`,
      `test_status:${log.test_status}`,
      `route_id:${log.route_id}`,
      `wallet_type:${log.wallet_type}`,
      `src_chain:${log.src_chain}`,
      `dst_chain:${log.dst_chain}`,
      `token:${log.token}`,
      `route_kind:${log.route_kind}`,
      `flow:${this.config.flowName}`,
    ];

    // Add failure step tag if present
    if ('failure_step' in log && log.failure_step) {
      baseTags.push(`failure_step:${log.failure_step}`);
    }

    return baseTags.filter(Boolean) as string[];
  }

  /**
   * Post data to Datadog HTTP API
   */
  private async postToDatadog(items: any[]): Promise<Response | undefined> {
    if (!DD_API_KEY) {
      throw new Error("DD_API_KEY is required for Datadog logging");
    }

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
