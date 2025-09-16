// src/utils/datadog/flows/withdraw.ts
// Withdraw flow specific configuration for datadog logging

import { BaseTestRunLog, BaseFlowConfig, FlowStepData } from '../core/types';

// v4-web-aligned funnel steps for withdraw flow
export const WithdrawFunnelSteps = {
  NavigateDialog: "NavigateDialog",        // Open app and connect wallet to reach withdraw dialog
  WithdrawInitiated: "WithdrawInitiated",  // User fills withdraw dialog and initiates a withdrawal
  WithdrawSubmitted: "WithdrawSubmitted",  // Transaction submitted to blockchain
  WithdrawFinalized: "WithdrawFinalized",  // Transaction confirmed on destination chain
} as const;

type WithdrawFunnelStep = (typeof WithdrawFunnelSteps)[keyof typeof WithdrawFunnelSteps];
const allWithdrawSteps: WithdrawFunnelStep[] = Object.values(WithdrawFunnelSteps);

interface WithdrawTestRunLog extends BaseTestRunLog {
  // Funnel analysis specific to withdraw
  steps_completed: WithdrawFunnelStep[];
  failure_step?: WithdrawFunnelStep;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
  
  // Step performance
  step_timings: Partial<Record<WithdrawFunnelStep, number>>;
}

export const withdrawFlowConfig: BaseFlowConfig<WithdrawFunnelStep, WithdrawTestRunLog> = {
  flowName: "withdraw",
  steps: WithdrawFunnelSteps,
  allSteps: allWithdrawSteps,
  createLogInterface: (base: BaseTestRunLog, stepData: FlowStepData<WithdrawFunnelStep>): WithdrawTestRunLog => ({
    ...base,
    ...stepData,
  }),
};
