// flows.ts (or targets/dydx/flows.ts)
import { expect, type Page } from "@playwright/test";
import { dydxSelectors as dydxSelectors } from "../../targets/dydx/selectors";
import { TEST_TIMEOUTS } from "../../config/timeouts";

type FinalityResult = { ok: boolean; explorerUrl?: string; txHash?: string };

const DEFAULT_FINALITY_TIMEOUT =
  (TEST_TIMEOUTS as any)?.FINALITY ??
  (TEST_TIMEOUTS as any)?.NETWORK ??
  (TEST_TIMEOUTS as any)?.TEST ??
  10 * 60_000; // fallback 10m

export async function waitForFinality(
  page: Page,
  timeoutMs = DEFAULT_FINALITY_TIMEOUT,
  pollMs = 1500
): Promise<FinalityResult> {
  const dlg = dydxSelectors.depositDialog(page);

  // Make sure the dialog is open
  await expect(dlg).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT ?? 30_000 });

  const end = Date.now() + timeoutMs;

  // Locators inside the dialog
  const inProgress   = dydxSelectors.depositInProgress(page);
  const completed    = dydxSelectors.depositCompleted(page);
  const explorerLink = dydxSelectors.depositTxLink(page); // e.g. polygonscan/etherscan link

  // Poll until completed or timeout
  while (Date.now() < end) {
    // If dialog vanished unexpectedly, bail
    if (!(await dlg.isVisible())) break;

    // Completed?
    if (await completed.isVisible().catch(() => false)) {
        // Move explorerUrl and txHash declarations outside try-catch to ensure scope
        let explorerUrl: string | undefined = undefined;
        let txHash: string | undefined = undefined;
        try {
          explorerUrl = (await explorerLink.getAttribute("href").catch(() => null)) ?? undefined;
          txHash =
            explorerUrl?.match(/\/tx\/(0x[a-fA-F0-9]{64})/)?.[1] ??
            undefined;
        } catch (error) {
        }
      
        return { ok: true, explorerUrl, txHash };
    }

    // Still “in progress”? keep polling
    if (await inProgress.isVisible().catch(() => false)) {
      await page.waitForTimeout(pollMs);
      continue;
    }

    // Neither in-progress nor completed: small grace wait then re-check
    await page.waitForTimeout(500);
  }

  // Timed out or dialog closed without completion
  return { ok: false };
}
