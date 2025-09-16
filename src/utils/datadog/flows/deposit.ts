// src/utils/datadog/flows/deposit.ts
// Deposit flow specific configuration for datadog logging

import { BaseTestRunLog, BaseFlowConfig, FlowStepData } from '../core/types';

// v4-web-aligned funnel steps for deposit flow
export const DepositFunnelSteps = {
  NavigateDialog: "NavigateDialog",
  DepositInitiated: "DepositInitiated",
  DepositSubmitted: "DepositSubmitted",
  DepositFinalized: "DepositFinalized",
} as const;

export type DepositFunnelStep = (typeof DepositFunnelSteps)[keyof typeof DepositFunnelSteps];
export const allDepositSteps: DepositFunnelStep[] = Object.values(DepositFunnelSteps);

export interface DepositTestRunLog extends BaseTestRunLog {
  // Funnel analysis specific to deposit
  steps_completed: DepositFunnelStep[];
  failure_step?: DepositFunnelStep;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
  
  // Step performance
  step_timings: Partial<Record<DepositFunnelStep, number>>;
}

export const depositFlowConfig: BaseFlowConfig<DepositFunnelStep, DepositTestRunLog> = {
  flowName: "deposit",
  steps: DepositFunnelSteps,
  allSteps: allDepositSteps,
  createLogInterface: (base: BaseTestRunLog, stepData: FlowStepData<DepositFunnelStep>): DepositTestRunLog => ({
    ...base,
    ...stepData,
  }),
};
