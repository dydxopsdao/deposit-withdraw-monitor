import { expect, Locator, Page } from "@playwright/test";
import { logger } from "../logger";
import { retry } from "./retry";
import { TEST_TIMEOUTS } from "../config/timeouts";

export async function isVisible(
  locator: Locator,
  opts?: { timeout?: number }
): Promise<boolean> {
  const timeout = opts?.timeout ?? TEST_TIMEOUTS.DELAY;
  try {
    logger.info("Checking if locator is visible", { locator });
    logger.info("Timeout", { timeout });
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    logger.info("Locator is not visible", { locator });
    return false;
  }
}

/**
 * Prefer the second candidate if it appears within windowMs; otherwise return the first.
 */
export async function preferSecondCandidate(
  candidates: Locator,
  windowMs: number
): Promise<Locator> {
  const poll = TEST_TIMEOUTS.POLL;
  const maxWindow = Math.min(windowMs, 5000);
  const deadline = Date.now() + maxWindow;

  while (Date.now() < deadline) {
    const count = await candidates.count();
    if (count >= 2) return candidates.nth(1);
    const remaining = deadline - Date.now();
    await new Promise((r) => setTimeout(r, Math.min(poll, Math.max(0, remaining))));
  }

  return candidates.first();
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

export type ClickWithFallbackOptions = {
  timeout?: number;
  retries?: number;
  requireEnabled?: boolean;
  scroll?: boolean;
  label?: string;
};

export async function clickWithFallback(
  page: Page,
  locator: Locator,
  opts: ClickWithFallbackOptions = {}
): Promise<void> {
  const {
    timeout = TEST_TIMEOUTS.ELEMENT,
    retries = 2,
    requireEnabled = true,
    scroll = true,
    label,
  } = opts;

  await retry(
    async (attemptNo) => {
      if (scroll) await locator.scrollIntoViewIfNeeded().catch(() => {});
      await expect(locator).toBeVisible({ timeout });
      if (requireEnabled) {
        await expect(locator).toBeEnabled({ timeout });
      }

      try {
        await locator.click({ timeout });
        if (attemptNo > 1) {
          logger.debug(`clickWithFallback: success on attempt ${attemptNo}${label ? ` (${label})` : ""}`);
        }
        return;
      } catch (e) {
        // Fallback: bounding box click if available; else force
        const box = await locator.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          logger.debug(`clickWithFallback: used bounding box${label ? ` (${label})` : ""}`);
          return;
        }
        await locator.click({ force: true, timeout });
        logger.debug(`clickWithFallback: used force click${label ? ` (${label})` : ""}`);
      }
    },
    {
      retries,
      baseDelayMs: TEST_TIMEOUTS.POLL,
      jitterRatio: 0.15,
      onAttemptFailure: (attemptNo, err) => {
        const msg = (err as Error)?.message ?? String(err);
        logger.debug(
          `clickWithFallback: attempt ${attemptNo} failed${label ? ` (${label})` : ""}: ${msg}`
        );
      },
    }
  );
}