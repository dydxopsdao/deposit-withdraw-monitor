import { expect, Locator, Page } from "@playwright/test";
import { logger } from "../logger/logging-utils";
import { TEST_TIMEOUTS } from "../config/timeouts";

type ClickAnyOpts = {
  /** Total time to keep scanning/clicking */
  overallTimeoutMs?: number;
  /** Poll interval while waiting for buttons to appear */
  pollMs?: number;
  /** Stop after this many clicks (default: unlimited until timeout) */
  maxClicks?: number;
};
/**
 * Waits for a button matching any of the provided regular expressions to appear and clicks it.
 * Repeats this process, polling at a configurable interval, until either a maximum number of clicks
 * is reached or a total timeout elapses. Designed for handling wallet popups or flows where button
 * labels may vary between versions (e.g., "Next", "Connect", "Approve", "Confirm").
 *
 * @param page Playwright Page instance containing the buttons.
 * @param names Array of RegExp patterns to match button labels.
 * @param contextLabel String label for logging context (e.g., "MetaMask connect flow").
 * @param opts Optional settings:
 *   - overallTimeoutMs: Total time in ms to keep scanning/clicking (default: TEST_TIMEOUTS.ACTION).
 *   - pollMs: Interval in ms between polling attempts (default: TEST_TIMEOUTS.POLL).
 *   - maxClicks: Maximum number of buttons to click before stopping (default: unlimited).
 * @returns Promise resolving to the total number of buttons clicked during the scan loop.
 */

export async function isVisible(
  locator: Locator,
  timeout = TEST_TIMEOUTS.ELEMENT
): Promise<boolean> {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clicks whichever matching button becomes available, retrying until timeout.
 * Useful for wallet popups where labels vary between versions.
 * @param page Playwright page that owns the buttons.
 * @param names Regular expressions used to identify candidate buttons.
 * @param contextLabel Text added to logs so callers know which flow is running.
 * @param opts Optional tuning knobs for polling cadence and retry depth.
 * @returns Total number of buttons clicked during the scan loop.
 */
export async function clickAnyButton(
  page: Page,
  names: RegExp[],
  contextLabel: string,
  opts: ClickAnyOpts = {}
): Promise<number> {
  const {
    overallTimeoutMs = TEST_TIMEOUTS.ACTION,
    pollMs = TEST_TIMEOUTS.POLL,
    maxClicks = Number.POSITIVE_INFINITY,
  } = opts;

  const deadline = Date.now() + overallTimeoutMs;
  let clicks = 0;
  logger.info(`Clicking any button: ${names.join(", ")}`);
  while (!page.isClosed() && Date.now() < deadline && clicks < maxClicks) {
    let clickedThisLoop = false;

    for (const re of names) {
      const btn = page.getByRole("button", { name: re }).first();
      if (!(await isVisible(btn))) continue;

      logger.debug(`${contextLabel}: clicking "${re.source}"`);
      try {
        await btn.click();
        clicks++;
        clickedThisLoop = true;
        // Small gap for the next step (e.g. Next → Connect)
        await page.waitForTimeout(TEST_TIMEOUTS.POLL).catch(() => {});
      } catch (e: any) {
        // Button may disappear due to instant navigation/close — ignore and continue
        logger.debug(`${contextLabel}: click failed for "${re.source}" (${e?.message ?? e})`);
        // TODO: Add a fallback click via bounding box if standard click fails.
      }
      if (clicks >= maxClicks) break;
    }

    if (!clickedThisLoop) {
      // Nothing to click yet — wait a bit and scan again
      logger.info(`${contextLabel}: waiting for a button to appear (${pollMs}ms)`);
      await page.waitForTimeout(pollMs).catch(() => {});
    }
  }

  return clicks; // how many buttons we actually clicked
}
