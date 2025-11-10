// flows.ts (or targets/dydx/flows.ts)
import { expect, type Page } from "@playwright/test";
import { dydxSelectors as dydxSelectors } from "../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../config/timeouts";
import { logger } from "../logger";
import { isVisible } from "./ui-helper";
import type { RouteKind } from "./routes";
import { TokenAmount } from "../rebalancer/interop";
import { parseUsdcAmount } from "../rebalancer/interop/balances";

type FinalityResult = { ok: boolean; explorerUrl?: string; txHash?: string; explorerUrlsAll?: string[]; txHashesAll?: (string | undefined)[] };

const DEFAULT_FINALITY_TIMEOUT =
  (TEST_TIMEOUTS as any)?.FINALITY ??
  (TEST_TIMEOUTS as any)?.NETWORK ??
  (TEST_TIMEOUTS as any)?.TEST ??
  10 * 60_000; // fallback 10m

/**
 * Watches the dYdX transfer dialog until the operation completes or times out.
 * Scrapes any transaction links that appear once the flow finishes.
 * @param page Active dYdX page containing the funds dialog.
 * @param options Flow configuration and timing overrides (kind, timeoutMs, pollMs, graceMs).
 * @returns Aggregated status plus any explorer URLs and hashes observed.
 */
type WaitForUIFinalityOptions = {
  kind?: RouteKind;
  timeoutMs?: number;
  pollMs?: number;
  graceMs?: number;
};

export async function waitForUIFinality(
  page: Page,
  {
    kind = "deposit",
    timeoutMs = DEFAULT_FINALITY_TIMEOUT,
    pollMs = 1500,
    graceMs = 500,
  }: WaitForUIFinalityOptions = {}
): Promise<FinalityResult> {
  const dlg = dydxSelectors.fundsDialog(page);
  const inProgress = dydxSelectors.transferInProgress(page);
  const depDone    = dydxSelectors.depositDoneTitle(page);
  const depCTA     = dydxSelectors.depositDoneCta(page);
  const wdrDone    = dydxSelectors.withdrawDoneLine(page);

  const scrapeTxLinks = async (): Promise<{
    explorerUrl?: string;
    txHash?: string;
    explorerUrlsAll: string[];
    txHashesAll: (string | undefined)[];
  }> => {
    let explorerUrl: string | undefined;
    let txHash: string | undefined;
    let explorerUrlsAll: string[] = [];
    let txHashesAll: (string | undefined)[] = [];

    try {
      logger.info("Extracting transaction links");
      const links = dydxSelectors.transferTxLinks(page);
      // grab all hrefs currently in the dialog
      const hrefs = await links.evaluateAll((els) =>
        Array.from(
          new Set(
            els
              .map((e) => (e as HTMLAnchorElement).href)
              .filter(Boolean)
          )
        )
      );

      explorerUrlsAll = hrefs;
      txHashesAll = hrefs.map(extractTxHash);

      // backwards compatible “primary” pick: first with a parsed hash, else first href
      const firstWithHash = hrefs.find((h, i) => txHashesAll[i]);
      if (firstWithHash) {
        explorerUrl = firstWithHash;
        txHash = extractTxHash(firstWithHash);
      } else if (hrefs[0]) {
        explorerUrl = hrefs[0];
      }
    } catch {
      // links optional; ignore
    }

    return { explorerUrl, txHash, explorerUrlsAll, txHashesAll };
  };

  const collectCompletion = async (): Promise<FinalityResult | undefined> => {
    let transferComplete = false;

    if (kind === "deposit") {
      transferComplete =
        (await isVisible(depDone, { timeout: graceMs })) ||
        (await isVisible(depCTA, { timeout: graceMs }));
    } else if (kind === "withdraw") {
      transferComplete = await isVisible(wdrDone, { timeout: graceMs });
    }

    if (!transferComplete) return undefined;

    logger.info("Transfer completed", { kind });
    const linkInfo = await scrapeTxLinks();

    return {
      ok: true,
      ...linkInfo,
    } as FinalityResult & {
      explorerUrlsAll?: string[];
      txHashesAll?: (string | undefined)[];
    };
  };

  const end = Date.now() + timeoutMs;

  // Flow might complete before we start monitoring: capture early success.
  const earlyCompletion = await collectCompletion();
  if (earlyCompletion) return earlyCompletion;

  // Make sure the dialog is open
  await expect(dlg).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  try {
    await expect(inProgress).toBeVisible({ timeout: TEST_TIMEOUTS.PAGE_LOAD });
  } catch (err) {
    const completion = await collectCompletion();
    if (completion) return completion;
    throw err;
  }

  // Poll until completed or timeout
  while (Date.now() < end) {
    const completion = await collectCompletion();
    if (completion) return completion;

    // If dialog vanished unexpectedly, bail (after one last completion check)
    if (!(await isVisible(dlg))) {
      const lastAttempt = await collectCompletion();
      if (lastAttempt) return lastAttempt;
      break;
    }

    // Still “in progress”? keep polling
    if (await isVisible(inProgress)) {
      await page.waitForTimeout(pollMs);
      continue;
    }

    await page.waitForTimeout(graceMs);
  }

  // Timed out or dialog closed without completion
  const linkInfo = await scrapeTxLinks();
  return {
    ok: false,
    ...linkInfo,
  };
}

/**
 * Tries to extract a transaction hash from a variety of explorer URL formats.
 * @param href Explorer link captured from the dApp UI.
 * @returns Parsed transaction hash when recognised, otherwise undefined.
 */
function extractTxHash(href: string): string | undefined {
  return (
    // EVM
    href.match(/\/tx\/(0x[a-fA-F0-9]{64})/i)?.[1] ??
    // Cosmos (mintscan…/txs/<hex-ish or base64-ish>; be tolerant)
    href.match(/\/txs\/([A-Za-z0-9_-]{32,})/)?.[1] ??
    // Solana (base58-ish)
    href.match(/\/tx\/([1-9A-HJ-NP-Za-km-z]{32,})/)?.[1] ??
    // Some explorers use /transaction/<id>
    href.match(/\/transaction\/([A-Za-z0-9_-]{32,})/)?.[1] ??
    undefined
  );
}

/**
 * Checks if the API finality is met for the given transfer.
 * The finality is met if the balance after the transfer is within the fees threshold of the balance before the transfer plus the transfer amount.
 * Note that this is from the perspective of the destination wallet, so its balance should always be increased by the transfer amount minus the fees.
 * Basically, `endAmount = beginAmount + transferAmount - fees`, where `fees` is between 0 and TRANSFER_FEES_THRESHOLD.
 * @param destinationBalanceBefore - The balance before the transfer on the destination wallet
 * @param destinationBalanceAfter - The balance after the transfer on the destination wallet
 * @param transferAmount - The amount of the transfer. Must be positive non-zero in USDC format.
 * @returns True if the API finality is met, false otherwise
 */
export function checkAPIFinality(
  destinationBalanceBefore: TokenAmount,
  destinationBalanceAfter: TokenAmount,
  transferAmount: string,
): boolean {
  const TRANSFER_FEES_THRESHOLD = parseUsdcAmount('5.0').amount;
  const transferAmountBigInt = parseUsdcAmount(transferAmount).amount;

  logger.debug('Checking API finality', {
    destinationBalanceBefore: destinationBalanceBefore.amount,
    destinationBalanceAfter: destinationBalanceAfter.amount,
    transferAmountBigInt,
    TRANSFER_FEES_THRESHOLD
  });

  return (
    destinationBalanceAfter.amount <= destinationBalanceBefore.amount + transferAmountBigInt &&
    destinationBalanceAfter.amount >= destinationBalanceBefore.amount + transferAmountBigInt - TRANSFER_FEES_THRESHOLD
  );
}