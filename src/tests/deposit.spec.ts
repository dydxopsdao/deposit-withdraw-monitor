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

import { test, expect } from "../fixtures";
import { logger } from "../utils/logger/logging-utils";
import { getRoutesSync, type Route, type WalletType } from "../utils/route/routes";
import { createTelemetryContext, type ErrorStage } from "../utils/datadog/datadog-utils";
import { openApp, connectWallet } from "../targets/dydx/flows";
import { logExtensionsOnce } from '../utils/debug/extensions';

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
  const title = `deposit: ${route.id} — ${route.wallet_type} — ${route.src_chain}→${route.dst_chain} — $${route.amount}`;

  test(title, async ({ page, context }) => {
    // Datadog context (keeps tags consistent, sends metrics/logs)
    const dd = createTelemetryContext({
      route: {
        id: route.id,
        kind: "deposit",
        wallet_type: route.wallet_type,
        wallet_alias: route.wallet_alias,
        route_kind: route.route_kind as any, // regular|instant
        amount: String(route.amount),
        src_chain: route.src_chain,
        dst_chain: route.dst_chain,
      },
      operation: "deposit",
    });

    let txHash: string | undefined;
    let passed = false; // becomes true ONLY after finality succeeds
    let error_stage: ErrorStage | "none" = "none";

    logger.info("Starting deposit", {
      route_id: route.id,
      wallet_type: route.wallet_type,
      wallet_alias: route.wallet_alias,
      route_kind: route.route_kind,
      amount: route.amount,
      src_chain: route.src_chain,
      dst_chain: route.dst_chain,
    });

    try {
      const p = await context.newPage();
      const cdp = await context.newCDPSession(p);
      const { targetInfos } = await cdp.send("Target.getTargets");
      const mm = targetInfos.find(t =>
        t.url.startsWith("chrome-extension://") && /metamask/i.test(t.title || "")
      );
      console.log("[MM ID]", mm?.url.split("/")[2]);
      await p.close();

      // -------- Pre-submit block (open, connect, navigate, fill amount) ----
      try {
        await test.step("Open app", async () => {
          await openApp(context); // TODO
        });

        await test.step(`Connect wallet (${route.wallet_type})`, async () => {
          await connectWallet(page, context, route.wallet_type);
        });

        await test.step("Navigate to Deposit", async () => {
          await navToDeposit(page); // TODO
        });

        await test.step("Enter amount", async () => {
          await fillAmount(page, route.amount); // TODO
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
        txHash = await test.step("Submit deposit", async () => {
          return await submitDeposit(page); // TODO: return tx hash if available
        });

        await test.step("Wait for finality", async () => {
          const ok = await waitForFinality({ route, txHash }); // TODO
          expect(ok).toBeTruthy();
          passed = true; // finality success → mark test as passed
        });

        logger.success("Deposit flow complete", { route_id: route.id, txHash });

        // Datadog: success metric (no success log needed)
        await dd.routeResult({ passed: true, txHash });
      } catch (e: any) {
        error_stage = "submit_or_finality";
        logger.error("Submit/finality failed", e, { route_id: route.id, txHash });
        // Datadog: failure metric + failure log at submit/finality stage
        await dd.routeResult({ passed: false, errorStage: error_stage, error: e, txHash });
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
    }
  });
}

/* =========================
   Helper placeholders (TODO)
   Keep this spec readable — implement these in targets flows.ts
   ========================= */


async function navToDeposit(_page: any) {
  // TODO: DYDX flows.navToDeposit(page)
}

async function fillAmount(_page: any, _amount: string) {
  // TODO: locator → fill
}

async function submitDeposit(_page: any): Promise<string | undefined> {
  // TODO: click "Deposit funds", wait for UI success; optionally parse tx hash
  return undefined;
}

async function waitForFinality(_args: { route: Route; txHash?: string }): Promise<boolean> {
  // TODO: poll indexer/RPC until finalised; return true/false or throw
  return true;
}

async function rebalanceNow(_route: Route, _opts: { reason: string; last_tx?: string; passed: boolean }) {
  // TODO: implement; return { balancesBefore?: {...}, balancesAfter?: {...} } if you can
}
