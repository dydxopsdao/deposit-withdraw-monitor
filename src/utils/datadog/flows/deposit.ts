// src/utils/datadog/flows/deposit.ts
// Deposit flow specific configuration for datadog logging

import { BaseTestRunLog, BaseFlowConfig, FlowStepData } from '../core/types';
import type { Route } from "../../../utils";

// v4-web-aligned funnel steps for deposit flow
export const DepositFunnelSteps = {
  NavigateDialog: "NavigateDialog",
  DepositInitiated: "DepositInitiated",
  DepositSubmitted: "DepositSubmitted",
  DepositFinalizedUI: "DepositFinalizedUI",
  DepositFinalizedAPI: "DepositFinalizedAPI",
} as const;

type DepositFunnelStep = (typeof DepositFunnelSteps)[keyof typeof DepositFunnelSteps];
const allDepositSteps: DepositFunnelStep[] = Object.values(DepositFunnelSteps);

interface DepositTestRunLog extends BaseTestRunLog {
  route_kind: "regular" | "instant";
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
  createLogInterface: (base: BaseTestRunLog, stepData: FlowStepData<DepositFunnelStep>, route: Route): DepositTestRunLog => ({
    ...base,
    ...stepData,
    route_kind: route.route_kind || (() => { throw new Error(`Route ${route.id} is missing required route_kind field`); })(),
  }),
};
