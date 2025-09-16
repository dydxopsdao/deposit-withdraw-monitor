// src/utils/datadog/index.ts
// Main export for Datadog utilities with modular flow pattern

import { FlowTestRunLogger } from './core/logger';
import { depositFlowConfig } from './flows/deposit';
import { Route } from '../route/routes';

// Namespace export with flow-specific factory functions
export const datadog = {
  /**
   * Create a new deposit test run logger for tracking funnel steps and comprehensive test logging
   */
  createDepositLogger: (route: Route, testId?: string) => 
    new FlowTestRunLogger(depositFlowConfig, route, testId),
};

// Re-export deposit flow-specific types and constants for backward compatibility and convenience
export { 
  DepositFunnelSteps, 
  type DepositFunnelStep, 
  type DepositTestRunLog,
  allDepositSteps 
} from './flows/deposit';

// Re-export core types for advanced usage
export type { BaseTestRunLog, TestResult } from './core/types';

// Backward compatibility exports (deprecated - use DepositFunnelSteps instead)
export { DepositFunnelSteps as FunnelSteps } from './flows/deposit';
export type { DepositFunnelStep as FunnelStep } from './flows/deposit';