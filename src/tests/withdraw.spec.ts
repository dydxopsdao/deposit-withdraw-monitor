// src/tests/withdraw.spec.ts
//
// One Playwright test per enabled, unpaused WITHDRAW route from routes.yaml.
// Filters:
//   - ROUTE_ID=<id>
//   - WALLET=metamask|phantom
//
// Logging: ConsoleLogger at milestones + TestRunLogger for comprehensive Datadog logs.
// Telemetry (Datadog): Single log per test run with v4-web funnel steps:
//   - NavigateDialog, WithdrawInitiated, WithdrawSubmitted, WithdrawFinalized
//   - Step timings, test outcome, transaction details
// Rebalance: never fails the test.

import { test, expect } from "../fixtures";
import { logger } from "../logger";
import {
  getRoutesSync,
  type Route,
  type WalletType,
  waitForFinality,
} from "../utils";
import { datadog, WithdrawFunnelSteps } from "../utils/datadog";
import { sendMetricToDatadog } from "../utils/datadog/metrics";
import { openApp, connectWallet, withdraw, submitWithdraw } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { rebalanceNow } from "../rebalancer";

// ---- Route discovery (sync so tests can be defined at import time) ----------
const onlyRouteId = process.env.ROUTE_ID?.trim();
const onlyWallet = process.env.WALLET?.trim()?.toLowerCase() as WalletType | undefined;

const allRoutes: Route[] = getRoutesSync();
const withdrawRoutes = allRoutes
  .filter(r => r.kind === "withdraw")
  .filter(r => (r.enabled ?? true) && !(r.paused ?? false))
  .filter(r => (onlyRouteId ? r.id === onlyRouteId : true))
  .filter(r => (onlyWallet ? r.wallet_type === onlyWallet : true));

if (withdrawRoutes.length === 0) {
  logger.warning("No matching withdraw routes found", { onlyRouteId, onlyWallet });
  test("no withdraw routes matched", () => { test.skip(); });
}

// ---- Per-route test definitions -------------------------------------------
for (const route of withdrawRoutes) {
  const title = `withdraw: ${route.id} — ${route.wallet_type} — ${route.src_chain}→${route.dst_chain} — $${route.amount} — ${route.token}`;

  test.describe(`Route: ${route.id}`, () => {
    test.use({ route });

    test.beforeEach(async ({}, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUTS.TEST);
    });

    test(title, async ({ page, context }, testInfo) => {    
      const testRunLogger = datadog.createWithdrawLogger(route);

      let txHash: string | undefined;
      let explorerUrl: string | undefined;
      let explorerUrlsAll: string[] = [];
      let txHashesAll: (string | undefined)[] = [];
      let passed = false;

      logger.info("Starting withdraw", {
        route_id: route.id,
        wallet_type: route.wallet_type,
        wallet_alias: route.wallet_alias,
        wallet_address: route.wallet_address,
        dydx_address: (route as any).dydx_address,
        route_kind: route.route_kind,
        amount: route.amount,
        src_chain: route.src_chain,
        dst_chain: route.dst_chain,
        token: route.token,
      });

      try {
        try {
          // NavigateDialog: Open app and connect wallet to reach withdraw dialog
          testRunLogger.startStep(WithdrawFunnelSteps.NavigateDialog);
          await test.step("Open app", async () => {
            await openApp(page, {
              waitUntil: "domcontentloaded",
              maxRetries: 3,
              retryDelayMs: 1500,
              waitFor: [dydxSelectors.connectWalletBtn]
            });
          });

          await test.step(`Connect wallet (${route.wallet_type})`, async () => {
            await connectWallet(page, context, route.wallet_type);
          });
          testRunLogger.completeStep(WithdrawFunnelSteps.NavigateDialog);

          // WithdrawInitiated: User fills withdraw dialog and initiates a withdrawal
          testRunLogger.startStep(WithdrawFunnelSteps.WithdrawInitiated);
          await test.step("Withdraw Dialog Input", async () => {
            await withdraw(page, String(route.amount), route.dst_chain, route.token, route.wallet_type);
          });
          testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawInitiated);

          // WithdrawSubmitted: Transaction submitted to blockchain
          testRunLogger.startStep(WithdrawFunnelSteps.WithdrawSubmitted);
          await test.step("Submit withdraw", async () => {
            logger.info("Submitting withdraw");
            return await submitWithdraw(page, context, route.wallet_type);
          });
          testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawSubmitted);

          // WithdrawFinalized: Transaction confirmed on destination chain
          testRunLogger.startStep(WithdrawFunnelSteps.WithdrawFinalized);
          await test.step("Wait for finality", async () => {
            logger.info("Waiting for finality");
            const res = await waitForFinality(page);
            logger.info("Finality result", { res });
            txHash = res.txHash;
            explorerUrl = res.explorerUrl;
            explorerUrlsAll = res.explorerUrlsAll ?? [];
            txHashesAll = res.txHashesAll ?? [];
            expect(res.ok).toBeTruthy();
            passed = true;
          });
          testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawFinalized);
          /* =========================
            TEST PASSED
            ========================= */
          logger.success("Withdraw flow complete", { route_id: route.id, explorerUrlsAll, txHashesAll });
          
          // Emit comprehensive test run log for successful tests
          await testRunLogger.logTestResult({
            status: "passed",
            txHash,
            explorerUrl,
          });
          
          // Send metrics for successful test
          await sendMetricToDatadog(route, "withdraw", "passed");
        } catch (e: any) {
          /* =========================
            TEST FAILED
            ========================= */
          logger.error("Withdraw failed", e, { route_id: route.id, explorerUrlsAll, txHashesAll });
          
          // Emit comprehensive test run log for failed tests
          await testRunLogger.logTestResult({
            status: "failed",
            error: e,
            txHash,
            explorerUrl,
          });
          
          // Send metrics for failed test
          await sendMetricToDatadog(route, "withdraw", "failed");
          
          throw e;
        }

      } finally {
        // -------- Always attempt to rebalance — must not fail the test -------
        await test.step("Rebalance (teardown)", async () => {
          try {
            const result = await rebalanceNow(route);
            const balancesBefore = (result as any)?.balancesBefore;
            const balancesAfter = (result as any)?.balancesAfter;

            // Note: Rebalance logging could be added to the modular system in the future if needed
          } catch (e: any) {
            logger.warning("Rebalance failed", { route_id: route.id, error: { message: e?.message } });
            // Note: Rebalance logging could be added to the modular system in the future if needed
          }
        });        
      }
    });
  });
}
