import { expect, type BrowserContext, type Page, type Locator, selectors } from "@playwright/test";
import { DAPP_URL } from "../../config/constants";
import { logger } from "../../utils/logger/logging-utils";
import { WalletType } from "../../utils/route/routes";
import { TEST_TIMEOUTS } from "../../config/timeouts";

type WaitTarget = string | ((page: Page) => Locator);

export type OpenAppOptions = {
  /** Absolute URL overrides base+path */
  url?: string;
  /** Path appended to DAPP_URL (ignored if url is provided) */
  path?: string;
  /** Playwright waitUntil */
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  /** Max retry attempts (total attempts = maxRetries + 1) */
  maxRetries?: number;
  /** Initial retry delay in ms (exponential backoff) */
  retryDelayMs?: number;
  /** Bring page to front after navigation */
  bringToFront?: boolean;
  /** Wait until all provided targets are visible */
  waitFor?: WaitTarget[] | WaitTarget;
  /** Optional hook run after a successful nav & waits */
  afterNavigate?: (page: Page) => Promise<void> | void;
};

/**
 * Backwards compatible:
 *   openApp(context)                              // uses DAPP_URL
 *   openApp(context, "https://dydx.trade/...")    // explicit URL
 *   openApp(context, { path: "/trade/BTC-USD" })  // base + path + waits/retries
 */
export async function openApp(
  context: BrowserContext,
  urlOrOptions?: string | OpenAppOptions
): Promise<Page> {
  const page = context.pages()[0] ?? (await context.newPage());

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
        const delay = retryDelayMs * Math.pow(2, attempt - 1); // 1x,2x,4x...
        logger.info(`Retry ${attempt} of ${maxRetries} → waiting ${delay}ms`);
        await page.waitForTimeout(delay);
      }

      await page.goto(targetUrl, { waitUntil });
      if (bringToFront) await page.bringToFront();

      // Optional: wait for provided selectors/locators
      if (waitFor) {
        const list = Array.isArray(waitFor) ? waitFor : [waitFor];
        logger.info(`Waiting for ${list.length} selector(s) to be visible`);
        for (const item of list) {
          if (typeof item === "string") {
            logger.debug(`waitForSelector: ${item}`);
            await page.waitForSelector(item, { state: "visible", timeout: TEST_TIMEOUTS.ELEMENT });
          } else {
            const loc = item(page);
            logger.debug(`waitFor locator(factory)`);
            await loc.first().waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ELEMENT });
          }
        }
      }

      // Optional hook (e.g., remove notifications)
      if (afterNavigate) {
        await afterNavigate(page);
      }

      logger.success(
        `Navigated to dYdX: ${targetUrl}${attempt > 0 ? ` on attempt ${attemptNo}` : ""}`
      );
      return page; // success
    } catch (err) {
      lastError = err;
      logger.warning(
        `Navigation attempt ${attemptNo} failed for ${targetUrl}: ${(err as Error)?.message}`
      );
      // loop continues unless we exhausted retries
    }
  }

  logger.error(`Failed to navigate after ${maxRetries + 1} attempts: ${targetUrl}`, lastError as Error);
  throw lastError;
}

  export async function connectWallet(page: Page, context: BrowserContext, wallet: WalletType): Promise<Page> {
    await page.pause();
    //await page.locator(selectors.dydxConnectWallet).click({ force: true });
    return page;
  }