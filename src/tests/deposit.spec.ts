// src/tests/deposit.spec.ts
//
// One Playwright test per enabled, unpaused DEPOSIT route from routes.yaml.
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
import { openApp, connectWallet, deposit, submitDeposit } from "../targets/dydx/flows";
import { dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { waitForFinality } from "../utils/finality/finality";
import { uploadTraceToS3 } from "../utils/helpers/tracing";
import { loadSecretsFromAWS } from "../utils/helpers/secrets.js";

// ---- Load secrets from AWS Secrets Manager, if configured, overwriting corresponding process.env entries ----
await loadSecretsFromAWS();

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
          kind: "deposit",
          wallet_type: route.wallet_type,
          wallet_alias: route.wallet_alias,
          wallet_address: route.wallet_address,
          dydx_address: route.dydx_address,
          route_kind: route.route_kind as any, // regular|instant
          amount: String(route.amount),
          src_chain: route.src_chain,
          dst_chain: route.dst_chain,
          token: route.token,
        },
        operation: "deposit",
      });

      let txHash: string | undefined;
      let explorerUrl: string | undefined;
      let passed = false; // becomes true ONLY after finality succeeds
      let error_stage: ErrorStage | "none" = "none";

      logger.info("Starting deposit", {
        route_id: route.id,
        wallet_type: route.wallet_type,
        wallet_alias: route.wallet_alias,
        wallet_address: route.wallet_address,
        dydx_address: route.dydx_address,
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
              afterNavigate: async (page) => {
                // e.g. build in click notifications etc
              },
            });
          });

          await test.step(`Connect wallet (${route.wallet_type})`, async () => {
            await connectWallet(page, context, route.wallet_type);
          });
          await test.step("Deposit", async () => {
            await deposit(page, context, route.amount, route.src_chain, route.token);
          });

        
        } catch (e: any) {
          error_stage = "pre_submit";
          logger.error("Pre-submit step failed", e, { route_id: route.id });
          // Datadog: mark failed with pre_submit stage (also sends failure log)
          await dd.routeResult({ passed: false, errorStage: error_stage, error: e });
          throw e;
        }

        // -------- Submit + finality block ------------------------------------
        try {
          await test.step("Submit deposit", async () => {
            return await submitDeposit(page, context, route.wallet_type);
          });


          await test.step("Wait for finality", async () => {
            const res = await waitForFinality(page);
            txHash = res.txHash;          
            explorerUrl = res.explorerUrl;
            expect(res.ok).toBeTruthy();
            passed = true;
          });
          logger.success("Deposit flow complete", { route_id: route.id, txHash, explorerUrl });
          //TODO close browser
          await page.close();
          // Datadog: success metric (no success log needed)
          await dd.routeResult({ passed: true, txHash, explorerUrl });
        } catch (e: any) {
          error_stage = "submit_or_finality";
          logger.error("Submit/finality failed", e, { route_id: route.id, txHash, explorerUrl });
          // Datadog: failure metric + failure log at submit/finality stage
          await dd.routeResult({ passed: false, errorStage: error_stage, error: e, txHash, explorerUrl });
          throw e;
        }

      } finally {
        // -------- Always attempt to rebalance — must not fail the test -------
        await test.step("Rebalance (teardown)", async () => {
          try {
            // Assume your rebalance returns optional balances; OK if it returns void
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
              // Datadog: rebalance failure metric + error log
              await dd.rebalanceResult({ passed: false, error: e });
              // swallow — do not rethrow
            }
          });
  
        // Stop tracing and process the trace file
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