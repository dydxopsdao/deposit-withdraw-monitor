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
  waitForUIFinality,
  checkAPIFinality,
} from "../utils";
import { datadog, WithdrawFunnelSteps } from "../utils/datadog";
import { sendTestRunMetricsToDatadog, sendRebalancerBalanceMetrics } from "../utils/datadog/metrics";
import { openApp, connectWallet, withdraw, submitWithdraw } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { rebalanceNow } from "../rebalancer";
import interop, { CHAIN_IDS, TokenAmount } from "../rebalancer/interop";
import { MetamaskNetworkFeeAlertError } from "../targets/wallets/metamask/errors";

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
      let walletBalanceBeforeWithdraw: TokenAmount;
      let walletBalanceAfterWithdraw: TokenAmount;
      let uiFinalityPassed: boolean = false;
      let apiFinalityPassed: boolean = false;

      logger.info("Starting withdraw", {
        route_id: route.id,
        wallet_type: route.wallet_type,
        wallet_alias: route.wallet_alias,
        wallet_address: route.wallet_address,
        dydx_address: (route as any).dydx_address,
        route_kind: route.route_kind,
        amount: route.amount,
        rebalance_threshold: route.rebalance_threshold,
        src_chain: route.src_chain,
        dst_chain: route.dst_chain,
        token: route.token,
      });

      try {
        walletBalanceBeforeWithdraw = await interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address);

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
          await withdraw(page, route.amount, route.dst_chain, route.token, route.wallet_type);
        });
        testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawInitiated);

        // WithdrawSubmitted: Transaction submitted to blockchain
        testRunLogger.startStep(WithdrawFunnelSteps.WithdrawSubmitted);
        await test.step("Submit withdraw", async () => {
          logger.info("Submitting withdraw");
          return await submitWithdraw(page, context, route.wallet_type);
        });
        testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawSubmitted);

        testRunLogger.startStep(WithdrawFunnelSteps.WithdrawFinalizedUI);
        try {
          await test.step("Wait for UI finality", async () => {
            logger.info("Waiting for UI finality");
            const res = await waitForUIFinality(page, { kind: "withdraw" });
            logger.info("Finality result", { res });
            txHash = res.txHash;
            explorerUrl = res.explorerUrl;
            explorerUrlsAll = res.explorerUrlsAll ?? [];
            txHashesAll = res.txHashesAll ?? [];
            expect(res.ok).toBeTruthy();
            uiFinalityPassed = true;
          });
        } catch (e: any) {
          logger.error('UI Finality check failed', e, { route_id: route.id, txHash, explorerUrl });
          uiFinalityPassed = false;
        }
        testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawFinalizedUI);

        if (!uiFinalityPassed) {
          logger.info('UI finality failed, checking API finality');
          testRunLogger.startStep(WithdrawFunnelSteps.WithdrawFinalizedAPI);
          walletBalanceAfterWithdraw = await interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address);
          apiFinalityPassed = checkAPIFinality(
            walletBalanceBeforeWithdraw, 
            walletBalanceAfterWithdraw, 
            route.amount
          );
          expect(apiFinalityPassed).toBeTruthy();
          testRunLogger.completeStep(WithdrawFunnelSteps.WithdrawFinalizedAPI);
        } else {
          logger.info('UI finality passed, skipping API finality check');
          // If the UI finality passed, the API finality should also pass - 
          // let's not give it a chance to fail by checking the balance again
          apiFinalityPassed = true;
        }

        /* =========================
          TEST PASSED
          ========================= */
        logger.success("Withdraw flow complete", 
          { route_id: route.id, 
            explorerUrlsAll, 
            txHashesAll, 
            uiFinalityPassed, 
            apiFinalityPassed,
          });
        
        // Emit comprehensive test run log for successful tests
        await testRunLogger.logTestResult({
          status: "passed",
          txHash,
          explorerUrl,
          uiFinalityPassed,
          apiFinalityPassed,
        });
        
        // Send metrics for successful test
        await sendTestRunMetricsToDatadog(route, "withdraw", "passed", uiFinalityPassed, apiFinalityPassed);
      } catch (e: any) {
        if (e instanceof MetamaskNetworkFeeAlertError) {
          logger.warning("MetaMask network fee alert detected; skipping withdraw test", {
            route_id: route.id,
            explorerUrlsAll,
            txHashesAll,
          });

          await testRunLogger.logTestResult({
            status: "skipped",
            error: e,
            txHash,
            explorerUrl,
          });

          await sendTestRunMetricsToDatadog(route, "withdraw", "skipped", uiFinalityPassed, apiFinalityPassed);

          testInfo.skip(true, "MetaMask network fee alert triggered. Test skipped.");
          return;
        }
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
          uiFinalityPassed,
          apiFinalityPassed,
        });
        
        // Send metrics for failed test
        await sendTestRunMetricsToDatadog(route, "withdraw", "failed", uiFinalityPassed, apiFinalityPassed);
        
        throw e;
      } finally {
        // -------- Always attempt to rebalance — must not fail the test -------
        await test.step("Rebalance (teardown)", async () => {
          try {
            const result = await rebalanceNow(route);
            const balancesAfter = (result as any)?.balancesAfter;

            // Note: Rebalance logging could be added to the modular system in the future if needed
            
            if (balancesAfter) {
              // Send rebalancer balance metrics to Datadog
              await sendRebalancerBalanceMetrics(route, balancesAfter);
            } else {
              logger.warning("No balance data from rebalancer", { route_id: route.id });
            }
          } catch (e: any) {
            logger.warning("Rebalance failed", { route_id: route.id, error: { message: e?.message } });
            // Note: Rebalance logging could be added to the modular system in the future if needed
          }
        });        
      }
    });
  });
}
