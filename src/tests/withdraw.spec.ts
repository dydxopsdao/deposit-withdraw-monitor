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

import path from "path";
import { test, expect } from "../fixtures";
import { logger } from "../utils/logger/logging-utils";
import { getRoutesSync, type Route, type WalletType } from "../utils/route/routes";
import { createTelemetryContext, type ErrorStage } from "../utils/datadog/datadog-utils";
import { openApp, connectWallet, withdraw, submitWithdraw } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { waitForFinality } from "../utils/finality/finality";
import { uploadTraceToS3 } from "../utils/helpers/tracing";
import { BrowserContext, Page } from "@playwright/test";

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
  const timestamp = new Date().toISOString();

  test.describe(`Route: ${route.id}`, () => {
    test.use({ route });

    test.beforeEach(async ({}, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUTS.TEST);
    });

    test(title, async ({ page, context }, testInfo) => {
      // Start tracing
      logger.info("Starting tracing", { route_id: route.id });
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });

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
      let passed = false;
      let error_stage: ErrorStage | "none" = "none";

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
        // -------- Pre-submit block (open, connect, navigate, fill amount) ----
        try {
          await test.step("Open app", async () => {
            await openApp(page, context, {
              waitUntil: "domcontentloaded",
              maxRetries: 3,
              retryDelayMs: 1500,
              waitFor: [dydxSelectors.connectWalletBtn],
              afterNavigate: async (_page) => {
                // place for any after-nav hooks
              },
            });
          });

          await test.step(`Connect wallet (${route.wallet_type})`, async () => {
            await connectWallet(page, context, route.wallet_type);
          });

          await test.step("Withdraw", async () => {
            // Implemented in targets/dydx/flows.ts similar to deposit()
            await withdraw(page, context, String(route.amount), route.dst_chain, route.token, route.wallet_type);
          });

        } catch (e: any) {
          error_stage = "pre_submit";
          logger.error("Pre-submit step failed", e, { route_id: route.id });
          await dd.routeResult({ passed: false, errorStage: error_stage, error: e });
          throw e;
        }

        // -------- Submit + finality block ------------------------------------
        try {
          await test.step("Submit withdraw", async () => {
            // Implemented in targets/dydx/flows.ts similar to submitDeposit()
            return await submitWithdraw(page, context, route.wallet_type);
          });

          await test.step("Wait for finality", async () => {
            const res = await waitForFinality(page);
            txHash = res.txHash;
            explorerUrl = res.explorerUrl;
            expect(res.ok).toBeTruthy();
            passed = true;
          });

          logger.success("Withdraw flow complete", { route_id: route.id, txHash, explorerUrl });
          await page.close();

          await dd.routeResult({ passed: true, txHash, explorerUrl });
        } catch (e: any) {
          error_stage = "submit_or_finality";
          logger.error("Submit/finality failed", e, { route_id: route.id, txHash, explorerUrl });
          await dd.routeResult({ passed: false, errorStage: error_stage, error: e, txHash, explorerUrl });
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

        // Stop tracing and upload
        try {
          logger.info("Stopping tracing", { route_id: route.id });
          const tracePath = path.join(testInfo.outputDir, `trace-${route.id}-${timestamp}/trace.zip`);
          await context.tracing.stop({ path: tracePath });
          await uploadTraceToS3(tracePath, route.id, timestamp);
        } catch (e: any) {
          logger.error("Trace file processing failed", e?.message, { route_id: route.id });
        }
      }
    });
  });
}

/* =========================
   Helper placeholders (TODO)
   Keep this spec readable — implement these in targets flows.ts
   ========================= */
async function rebalanceNow(_route: Route, _opts: { reason: string; last_tx?: string; passed: boolean }) {
  // TODO: implement; return { balancesBefore?: {...}, balancesAfter?: {...} } if you can
}
