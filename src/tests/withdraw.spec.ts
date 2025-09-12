// src/tests/withdraw.spec.ts
//
// One Playwright test per enabled, unpaused WITHDRAW route from routes.yaml.
// Filters:
//   - ROUTE_ID=<id>
//   - WALLET=metamask|phantom
//
// Logging: ConsoleLogger at milestones.
// Error handling: separates "pre_submit" vs "submit_or_finality".
// Telemetry (Datadog):
//   - route result metric (1/0) once per test
//   - route failure log with error_stage
//   - rebalance result metric + log (with balances when provided)
// Rebalance: never fails the test.

import { test, expect } from "../fixtures";
import { logger } from "../utils/logger/logging-utils";
import { getRoutesSync, type Route, type WalletType } from "../utils/route/routes";
import { createTelemetryContext} from "../utils/datadog/datadog-utils";
import { openApp, connectWallet, withdraw, submitWithdraw } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { waitForFinality } from "../utils/finality/finality";

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
      // Datadog context (keeps tags consistent, sends metrics/logs)
      const dd = createTelemetryContext({
        route: {
          id: route.id,
          kind: "withdraw",
          wallet_type: route.wallet_type,
          wallet_alias: route.wallet_alias,
          wallet_address: route.wallet_address,
          dydx_address: (route as any).dydx_address,
          amount: String(route.amount),
          src_chain: route.src_chain,
          dst_chain: route.dst_chain,
          token: route.token,
        },
        operation: "withdraw",
      });

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
          await test.step("Open app", async () => {
            await openApp(page, context, {
              waitUntil: "domcontentloaded",
              maxRetries: 3,
              retryDelayMs: 1500,
              waitFor: [dydxSelectors.connectWalletBtn]
            });
          });

          await test.step(`Connect wallet (${route.wallet_type})`, async () => {
            await connectWallet(page, context, route.wallet_type);
          });

          await test.step("Withdraw", async () => {
            await withdraw(page, context, String(route.amount), route.dst_chain, route.token, route.wallet_type);
          });
          await test.step("Submit withdraw", async () => {
            return await submitWithdraw(page, context, route.wallet_type);
          });

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
          /* =========================
            TEST PASSED
            ========================= */
          logger.success("Withdraw flow complete", { route_id: route.id, explorerUrlsAll, txHashesAll });
          await dd.routeResult({ passed: true, txHash, explorerUrlsAll, txHashesAll });
        } catch (e: any) {
          /* =========================
            TEST FAILED
            ========================= */
          logger.error("Submit/finality failed", e, { route_id: route.id, explorerUrlsAll, txHashesAll });
          await dd.routeResult({ passed: false, error: e, explorerUrlsAll, txHashesAll });
          throw e;
        }

      } finally {
        // -------- Always attempt to rebalance — must not fail the test -------
        await test.step("Rebalance (teardown)", async () => {
          try {
            const result = await rebalanceNow(route, { reason: "post_test_teardown", last_tx: txHash, passed });
            const balancesBefore = (result as any)?.balancesBefore;
            const balancesAfter  = (result as any)?.balancesAfter;

            await dd.rebalanceResult({
              passed: true,
              balancesBefore,
              balancesAfter,
            });
          } catch (e: any) {
            logger.warning("Rebalance failed", { route_id: route.id, error: { message: e?.message } });
            await dd.rebalanceResult({ passed: false, error: e });
          }
        });        
      }
    });
  });
}

async function rebalanceNow(_route: Route, _opts: { reason: string; last_tx?: string; passed: boolean }) {
  // TODO: implement; return { balancesBefore?: {...}, balancesAfter?: {...} } if you can
}
