// src/tests/deposit.spec.ts
//
// One Playwright test per enabled, unpaused DEPOSIT route from routes.yaml.
// ENV filters:
//   - ROUTE_ID=<id>     → run only that route
//   - WALLET=metamask|phantom
//
// Logging: uses ConsoleLogger at milestones.
// Error handling: distinct "pre_submit" vs "submit_or_finality".
// Telemetry: single Datadog emit (pass/fail) at the very end.
// Rebalance: never fails the test (errors swallowed + logged).

import { test, expect } from "../fixtures"; // your thin glue
import { logger } from "../utils/logger/logging-utils";
import { emitResult, emitLog } from "../utils/datadog/datadog-utils";
import { getRoutesSync, type Route, type WalletType } from "../utils/route/routes";

// ---- Route discovery (sync so tests can be defined at import time) ----------
const onlyRouteId = process.env.ROUTE_ID?.trim();
const onlyWallet = process.env.WALLET?.trim()?.toLowerCase() as WalletType | undefined;
const envTag = process.env.ENVIRONMENT ?? "prod";

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
    const tags = makeTags(route, envTag);
    let txHash: string | undefined;
    let passed = false; // becomes true ONLY after finality succeeds
    let error_stage: "none" | "pre_submit" | "submit_or_finality" = "none";

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
      // -------- Pre-submit block (open app, connect wallet, navigate, fill amount) ----
      try {
        await test.step("Open app", async () => {
          await openApp(page); // TODO: implement using DAPP_URL
        });

        await test.step(`Connect wallet (${route.wallet_type})`, async () => {
          await connectWallet(page, context, route.wallet_type); // TODO
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
        throw e;
      }

      // -------- Submit + finality block --------------------------------------------
      try {
        txHash = await test.step("Submit deposit", async () => {
          return await submitDeposit(page); // TODO: return tx hash if available
        });

        await test.step("Wait for finality", async () => {
          const ok = await waitForFinality({ route, txHash }); // TODO: return boolean or throw
          expect(ok).toBeTruthy();
          passed = true; // finality success → mark test as passed
        });

        logger.success("Deposit flow complete", { route_id: route.id, txHash });
      } catch (e: any) {
        error_stage = "submit_or_finality";
        logger.error("Submit/finality failed", e, { route_id: route.id, txHash });
        throw e;
      }

    } finally {
      // -------- Always attempt to rebalance — must not fail the test ---------------
      await test.step("Rebalance (teardown)", async () => {
        try {
          await rebalanceNow(route, { reason: "post_test_teardown", last_tx: txHash, passed }); // TODO - Include datadog emit in the rebalance function
        } catch (e: any) {
          logger.warning("Rebalance failed", { route_id: route.id, error: { message: e?.message } });
          // swallow — do not rethrow
        }
      });

      // -------- Single Datadog emit at the very end --------------------------------
      try {
        await emitResult(passed, tags);
        await emitLog(passed ? "deposit.ok" : "deposit.error", {
          route_id: route.id,
          wallet_alias: route.wallet_alias,
          route_kind: route.route_kind,
          amount: route.amount,
          src_chain: route.src_chain,
          dst_chain: route.dst_chain,
          tx_hash: txHash,
          status: passed ? "ok" : "error",
          error_stage: passed ? undefined : error_stage,
        });
      } catch {
        // Telemetry errors should not fail tests
      }
    }
  });
}

// ---- Local utilities -------------------------------------------------------
function makeTags(route: Route, env: string): string[] {
  return [
    `route_id:${route.id}`,
    `wallet:${route.wallet_type}`,
    `route_kind:${route.route_kind ?? "regular"}`,
    `src:${route.src_chain}`,
    `dst:${route.dst_chain}`,
    `env:${env}`,
  ];
}

/* =========================
   Helper placeholders (TODO)
   Keep this spec readable — implement these in targets flows.ts
   ========================= */

async function openApp(_page: any) {
  // TODO: page.goto(DAPP_URL) and handle any gating (cookie banners)
}

async function connectWallet(_page: any, _context: any, _wallet: WalletType) {
  // TODO:
}

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
  // TODO: call your rebalancer to reset balances for next run
}
