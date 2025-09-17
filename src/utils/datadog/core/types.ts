// src/utils/datadog/core/types.ts
// Base types and interfaces for flow-agnostic datadog logging

export interface BaseTestRunLog {
  // Core identification
  timestamp: string;
  test_id: string;
  route_id: string;
  
  // Test outcome
  test_status: "passed" | "failed";
  duration_ms: number;
  
  // Route details (available from route object)
  wallet_type: "metamask" | "phantom";
  src_chain: string;
  dst_chain: string;
  token: string;
  amount: string;
  
  // Transaction details (for successful flows only)
  tx_hash?: string;
  explorer_url?: string;
  
  // Playwright report URLs
  report_url?: string;
}

export interface FlowStepData<TStep extends string> {
  steps_completed: TStep[];
  failure_step?: TStep;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
  step_timings: Partial<Record<TStep, number>>;
}

import type { Route } from "../../../utils";

export interface BaseFlowConfig<TStep extends string, TLog extends BaseTestRunLog> {
  flowName: string;
  steps: Record<string, TStep>;
  allSteps: TStep[];
  createLogInterface: (base: BaseTestRunLog, stepData: FlowStepData<TStep>, route: Route) => TLog;
}

export interface TestResult {
  status: "passed" | "failed";
  error?: Error;
  txHash?: string;
  explorerUrl?: string;
}
