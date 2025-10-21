// src/tests/deposit.spec.ts
//
// One Playwright test per enabled, unpaused DEPOSIT route from routes.yaml.
// Filters:
//   - ROUTE_ID=<id>
//   - WALLET=metamask|phantom
//
// Logging: ConsoleLogger at milestones + TestRunLogger for comprehensive Datadog logs.
// Telemetry (Datadog): Single log per test run with v4-web funnel steps:
//   - NavigateDialog, DepositInitiated, DepositSubmitted, DepositFinalized
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
import { openApp, connectWallet, deposit, submitDeposit } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { datadog, DepositFunnelSteps } from "../utils/datadog";
import { sendTestRunMetricsToDatadog, sendRebalancerBalanceMetrics } from "../utils/datadog/metrics";
import { rebalanceNow } from "../rebalancer";

// ---- Route discovery (sync so tests can be defined at import time) ----------
const onlyRouteId = process.env.ROUTE_ID?.trim();
const onlyWallet = process.env.WALLET?.trim()?.toLowerCase() as WalletType | undefined;

const allRoutes: Route[] = getRoutesSync();
const depositRoutes = allRoutes
  .filter(r => r.kind === "deposit")
  .filter(r => (r.enabled ?? true) && !(r.paused ?? false))
  .filter(r => (onlyRouteId ? r.id === onlyRouteId : true))
  .filter(r => (onlyWallet ? r.wallet_type === onlyWallet : true));

if (depositRoutes.length === 0) {
  logger.warning("No matching deposit routes found", { onlyRouteId, onlyWallet });
  test("no deposit routes matched", () => { test.skip(); });
}


// ---- Per-route test definitions -------------------------------------------
for (const route of depositRoutes) {
  const title = `deposit: ${route.id} — ${route.wallet_type} — ${route.src_chain}→${route.dst_chain} — $${route.amount} — ${route.token}`;
  const timestamp = new Date().toISOString();

  // Create a describe block for each route to isolate the test.use() scope
  test.describe(`Route: ${route.id}`, () => {
    // Set route option within this describe block scope
    test.use({ route });

    test.beforeEach(async ({ }, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUTS.TEST);
    });

    test(title, async ({ page, context }, testInfo) => {
      const testRunLogger = datadog.createDepositLogger(route);

      let txHash: string | undefined;
      let explorerUrl: string | undefined;
      let passed = false;

      logger.info(`Starting test: (${route.id})`, {
        route_id: route.id,
        wallet_type: route.wallet_type,
        wallet_alias: route.wallet_alias,
        wallet_address: route.wallet_address,
        dydx_address: route.dydx_address,
        route_kind: route.route_kind,
        amount: route.amount,
        rebalance_threshold: route.rebalance_threshold,
        src_chain: route.src_chain,
        dst_chain: route.dst_chain,
        token: route.token,
      });

      try {
          // NavigateDialog: Open app and connect wallet to reach deposit dialog
          testRunLogger.startStep(DepositFunnelSteps.NavigateDialog);
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
          testRunLogger.completeStep(DepositFunnelSteps.NavigateDialog);

          // DepositInitiated: User fills deposit dialog and initiates deposit
          testRunLogger.startStep(DepositFunnelSteps.DepositInitiated);
          await test.step("Deposit Dialog Input", async () => {
            await deposit(page, route.amount, route.src_chain, route.token, route.wallet_type);
          });
          testRunLogger.completeStep(DepositFunnelSteps.DepositInitiated);

          // DepositSubmitted: Transaction submitted to blockchain
          testRunLogger.startStep(DepositFunnelSteps.DepositSubmitted);
          await test.step("Submit deposit", async () => {
            logger.info("Submitting deposit");
            return await submitDeposit(page, context, route.wallet_type);
          });
          testRunLogger.completeStep(DepositFunnelSteps.DepositSubmitted);

          // DepositFinalized: Transaction confirmed on-chain
          testRunLogger.startStep(DepositFunnelSteps.DepositFinalized);
          await test.step("Wait for finality", async () => {
            logger.info("Waiting for finality");
            const res = await waitForFinality(page, { kind: "deposit" });
            txHash = res.txHash;
            explorerUrl = res.explorerUrl;
            expect(res.ok).toBeTruthy();
            passed = true;
          });
          testRunLogger.completeStep(DepositFunnelSteps.DepositFinalized);

          logger.success("Deposit flow complete", { route_id: route.id, txHash, explorerUrl });
          
          // Emit comprehensive test run log for successful tests
          await testRunLogger.logTestResult({
            status: "passed",
            txHash,
            explorerUrl,
          });
          
          // Send metrics for successful test
          await sendTestRunMetricsToDatadog(route, "deposit", "passed");
          
          // TODO: Consider closing the entire context here to avoid cross-test leakage when running multiple routes.
        } catch (e: any) {
          logger.error("Deposit failed", e, { route_id: route.id, txHash, explorerUrl });
          
          // Emit comprehensive test run log for failed tests
          await testRunLogger.logTestResult({
            status: "failed",
            error: e,
            txHash,
            explorerUrl,
          });
          
          // Send metrics for failed test
          await sendTestRunMetricsToDatadog(route, "deposit", "failed");
          
          throw e;
      } finally {
        // -------- Always attempt to rebalance — must not fail the test -------
        await test.step("Rebalance (teardown)", async () => {
          try {
            // Assume your rebalance returns optional balances; OK if it returns void
            const result = await rebalanceNow(route);
            const balancesBefore = (result as any)?.balancesBefore;
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
            // swallow — do not rethrow
          }
        });
      }
    });
  });
}
