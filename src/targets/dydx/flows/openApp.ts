import { type BrowserContext, type Page } from "@playwright/test";
import { DAPP_URL } from "../../../config/constants";
import { logger } from "../../../logger";
import type { WaitTarget } from "../types";

export type OpenAppOptions = {
  url?: string;
  path?: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  maxRetries?: number;
  retryDelayMs?: number;
  bringToFront?: boolean;
  waitFor?: WaitTarget[] | WaitTarget;
  afterNavigate?: (page: Page) => Promise<void> | void;
};

export async function openApp(
  page: Page,
  context: BrowserContext,
  urlOrOptions?: string | OpenAppOptions
): Promise<Page> {
  const opts: OpenAppOptions =
    typeof urlOrOptions === "string" ? { url: urlOrOptions } : (urlOrOptions ?? {});

  const {
    url,
    path,
    waitUntil = "domcontentloaded",
    maxRetries = 3,
    retryDelayMs = 1_000,
    bringToFront = true,
    waitFor,
    afterNavigate,
  } = opts;

  const targetUrl = url ?? new URL(path ?? "", DAPP_URL).toString();
  logger.step(`Navigating to app: ${targetUrl}`);

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptNo = attempt + 1;

    try {
      if (attempt > 0) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        logger.info(`Retry ${attempt} of ${maxRetries} → waiting ${delay}ms`);
        await page.waitForTimeout(delay);
      }

      await page.goto(targetUrl, { waitUntil });
      if (bringToFront) await page.bringToFront();

      /* TODO: Handle concurrent runs with connected vs not.
      if (waitFor) {
        const list = Array.isArray(waitFor) ? waitFor : [waitFor];
        logger.info(`Waiting for ${list.length} selector(s) to be visible`);
        for (const item of list) {
          if (typeof item === "string") {
            logger.debug(`waitForSelector: ${item}`);
            await page.waitForSelector(item, {
              state: "visible",
              timeout: TEST_TIMEOUTS.ELEMENT,
            });
          } else {
            const loc = item(page);
            logger.debug("waitFor locator(factory)");
            await loc.first().waitFor({
              state: "visible",
              timeout: TEST_TIMEOUTS.ELEMENT,
            });
          }
        }
      } */

      if (afterNavigate) {
        await afterNavigate(page);
      }

      logger.success(
        `Navigated to dYdX: ${targetUrl}${attempt > 0 ? ` on attempt ${attemptNo}` : ""}`
      );
      return page;
    } catch (err) {
      lastError = err;
      logger.warning(
        `Navigation attempt ${attemptNo} failed for ${targetUrl}: ${(err as Error)?.message}`
      );
    }
  }

  logger.error(
    `Failed to navigate after ${maxRetries + 1} attempts: ${targetUrl}`,
    lastError as Error
  );
  throw lastError;
}
