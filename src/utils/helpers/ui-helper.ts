import { Page } from '@playwright/test';
import { logger } from '../logger/logging-utils';
import { TEST_TIMEOUTS } from '../../config/timeouts';

type ClickAnyOpts = {
  /** Total time to keep scanning/clicking */
  overallTimeoutMs?: number;
  /** Poll interval while waiting for buttons to appear */
  pollMs?: number;
  /** Stop after this many clicks (default: unlimited until timeout) */
  maxClicks?: number;
};

export async function clickAnyButton(
  page: Page,
  names: RegExp[],
  contextLabel: string,
  opts: ClickAnyOpts = {},
): Promise<number> {
  const {
    overallTimeoutMs = TEST_TIMEOUTS.ACTION,
    pollMs = TEST_TIMEOUTS.POLL,
    maxClicks = Number.POSITIVE_INFINITY,
  } = opts;

  const deadline = Date.now() + overallTimeoutMs;
  let clicks = 0;
  logger.info(`Clicking any button: ${names.join(', ')}`);
  while (!page.isClosed() && Date.now() < deadline && clicks < maxClicks) {
    let clickedThisLoop = false;

    for (const re of names) {
      const btn = page.getByRole('button', { name: re }).first();
      // `isVisible()` is cheap; we poll until one appears
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) continue;

      logger.debug(`${contextLabel}: clicking "${re.source}"`);
      try {
        await btn.click();
        clicks++;
        clickedThisLoop = true;
        // Small gap for the next step (e.g. Next → Connect)
        await page.waitForTimeout(250).catch(() => {});
      } catch (e: unknown) {
        // Button may disappear due to instant navigation/close — ignore and continue
        logger.debug(`${contextLabel}: click failed for "${re.source}" ${(e as Error)?.message ?? e}`);
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
