// flows.ts (or targets/dydx/flows.ts)
import { expect, type Page } from '@playwright/test';
import { dydxSelectors as dydxSelectors } from '../../targets/dydx/selectors';
import { TEST_TIMEOUTS } from '../../config/timeouts';
import { logger } from '../logger/logging-utils';

type FinalityResult = {
  ok: boolean;
  explorerUrl?: string;
  txHash?: string;
  explorerUrlsAll?: string[];
  txHashesAll?: (string | undefined)[];
};

const DEFAULT_FINALITY_TIMEOUT =
  TEST_TIMEOUTS.FINALITY ?? TEST_TIMEOUTS.NAVIGATION ?? TEST_TIMEOUTS.TEST ?? 10 * 60_000; // fallback 10m

export async function waitForFinality(
  page: Page,
  timeoutMs = DEFAULT_FINALITY_TIMEOUT,
  pollMs = 1500,
  graceMs = 500,
): Promise<FinalityResult> {
  const dlg = dydxSelectors.fundsDialog(page);
  const inProgress = dydxSelectors.transferInProgress(page);
  const depDone = dydxSelectors.depositDoneTitle(page);
  const depCTA = dydxSelectors.depositDoneCta(page);
  const wdrDone = dydxSelectors.withdrawDoneLine(page);

  // Make sure the dialog is open
  await expect(dlg).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await expect(inProgress).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  const end = Date.now() + timeoutMs;

  // Poll until completed or timeout
  while (Date.now() < end) {
    // If dialog vanished unexpectedly, bail
    if (!(await dlg.isVisible())) break;
    // Still “in progress”? keep polling
    if (await inProgress.isVisible().catch(() => false)) {
      await page.waitForTimeout(pollMs);
      continue;
    }
    const isDepositDone =
      (await depDone.isVisible().catch(() => false)) || (await depCTA.isVisible().catch(() => false));

    const isWithdrawDone = await wdrDone.isVisible().catch(() => false);
    // Completed?
    if (isDepositDone || isWithdrawDone) {
      logger.info('Transfer completed');
      let explorerUrl: string | undefined;
      let txHash: string | undefined;
      let explorerUrlsAll: string[] = [];
      let txHashesAll: (string | undefined)[] = [];

      try {
        logger.info('Extracting transaction links');
        const links = dydxSelectors.transferTxLinks(page);
        // grab all hrefs currently in the dialog
        const hrefs = await links.evaluateAll((els) =>
          Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).href).filter(Boolean))),
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

      return {
        ok: true,
        explorerUrl, // primary (for existing callers)
        txHash, // primary
        explorerUrlsAll, // all links
        txHashesAll, // all parsed hashes (may contain undefineds)
      } as FinalityResult & {
        explorerUrlsAll?: string[];
        txHashesAll?: (string | undefined)[];
      };
    }
    // Neither in-progress nor completed: small grace wait then re-check
    await page.waitForTimeout(graceMs);
  }

  // Timed out or dialog closed without completion
  return { ok: false };
}

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
