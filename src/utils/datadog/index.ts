// src/utils/datadog/index.ts
// Main export for Datadog utilities with modular flow pattern

import { FlowTestRunLogger } from './core/logger';
import { depositFlowConfig, DepositFunnelSteps } from './flows/deposit';
import { withdrawFlowConfig, WithdrawFunnelSteps } from './flows/withdraw';
import { Route } from '../../utils';

// Namespace export with flow-specific factory functions
export const datadog = {
  /**
   * Create a new deposit test run logger for tracking funnel steps and comprehensive test logging
   */
  createDepositLogger: (route: Route, testId?: string) => 
    new FlowTestRunLogger(depositFlowConfig, route, testId),
    
  /**
   * Create a new withdraw test run logger for tracking funnel steps and comprehensive test logging
   */
  createWithdrawLogger: (route: Route, testId?: string) => 
    new FlowTestRunLogger(withdrawFlowConfig, route, testId),
};

// Minimal re-exports used by tests
export { DepositFunnelSteps };
export { WithdrawFunnelSteps };