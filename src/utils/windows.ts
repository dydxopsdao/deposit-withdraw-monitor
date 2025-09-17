import { BrowserContext, Page } from "@playwright/test";
import { logger } from "../logger";
import { TEST_TIMEOUTS } from "../config/timeouts";

const t = TEST_TIMEOUTS;

type LoadState = "domcontentloaded" | "load" | "networkidle";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toRegex(pattern: string | RegExp): RegExp {
  return pattern instanceof RegExp ? pattern : new RegExp(escapeRegExp(pattern));
}
function safeUrl(p: Page): string {
  try { return p.url(); } catch { return "(unavailable)"; }
}

/**
 * Polls an extension/browser context for a page whose URL matches a pattern.
 * @param context Browser context to inspect for open or newly created pages.
 * @param urlPattern String or RegExp to match against each page url.
 * @param maxRetries How many polling rounds to perform before giving up.
 * @param retryDelayMs Wait between retries while watching for popup events.
 * @param waitForState Load state to wait for when a match is found.
 * @returns The matching page or null when it never appears.
 */
export async function findPageWithUrl(
  context: BrowserContext,
  urlPattern: string | RegExp,
  maxRetries = 10,
  retryDelayMs = t.DELAY,
  waitForState: LoadState = "domcontentloaded",
): Promise<Page | null> {
  const rx = toRegex(urlPattern);
  logger.debug(`🔎 findPageWithUrl → pattern: ${rx}, retries: ${maxRetries}, delay: ${retryDelayMs}ms`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    logger.debug(`Attempt ${attempt}/${maxRetries}`);

    // Log current pages
    const urls = context.pages().map(p => safeUrl(p));
    logger.debug(`context.pages(): ${urls.join(" | ") || "(none)"}`);

    // 1) check all existing pages
    for (const p of context.pages()) {
      const u = safeUrl(p);
      if (rx.test(u)) {
        logger.debug(`✅ Match found in existing page: ${u}`);
        try {
          await p.waitForLoadState(waitForState);
          logger.debug(`Page reached load state: ${waitForState}`);
        } catch (e) {
          logger.warning(`Load state wait failed: ${(e as Error).message}`);
        }
        return p;
      }
    }

    // 2) wait briefly for a new page event
    try {
      logger.debug(`Waiting up to ${retryDelayMs}ms for a new page event…`);
      const p = await context.waitForEvent("page", { timeout: retryDelayMs });
      const u = safeUrl(p);
      logger.debug(`New page detected: ${u}`);
      if (rx.test(u)) {
        logger.debug(`✅ Match found in new page: ${u}`);
        try {
          await p.waitForLoadState(waitForState);
          logger.debug(`Page reached load state: ${waitForState}`);
        } catch (e) {
          logger.warning(`Load state wait failed: ${(e as Error).message}`);
        }
        return p;
      }
    } catch {
      logger.debug(`No new page within ${retryDelayMs}ms`);
    }
  }

  // TODO: Optionally throw when not found (e.g. required=true) to avoid silent nulls.
  // TODO: Consider listening for 'popup' events and scanning their URLs as well.
  logger.error(`❌ No page found matching pattern after ${maxRetries} retries`);
  return null;
}
