// targets/dydx/flows.ts


import { expect, type BrowserContext, type Page, type Locator } from "@playwright/test";
import { DAPP_URL } from "../../config/constants";
import { logger } from "../../utils/logger/logging-utils";
import { WalletType } from "../../utils/route/routes";
import { TEST_TIMEOUTS } from "../../config/timeouts";
import { handleWalletPopup as handleMetaMaskPopup } from "../wallets/metamask/flows";
import { handleWalletPopup as handlePhantomPopup } from "../wallets/phantom/flows";
import { dydxSelectors } from "./selectors";

//#region openApp
/**
 * openApp
 * -----------------------------------------------------------------------------
 * Purpose
 *   Reliable, observable navigation for a SPA (dYdX) that uses websockets and
 *   late-loading UI. A plain `page.goto()` is often not enough; this wraps it
 *   with:
 *     - retry with exponential backoff (flaky network / cold starts),
 *     - deterministic "readiness" waits (specific UI hooks becoming visible),
 *     - an optional post-nav hook (dismiss banners, accept cookies, etc.),
 *     - structured logging so failures are diagnosable in CI.
 *
 * Why this exists
 *   On modern FE apps, `waitUntil: "load"`/`"networkidle"` can be noisy because
 *   of WS streams and lazy data. We instead wait for *the UI you actually need*
 *   (e.g. “Connect wallet” **or** account menu), and only then proceed.
 *
 * Usage examples
 *   1) Base URL:
 *        await openApp(context)
 *
 *   2) Absolute URL:
 *        await openApp(context, "https://dydx.trade/trade/BTC-USD")
 *
 *   3) Base + path + robust waits:
 *        await openApp(context, {
 *          path: "/trade/BTC-USD",
 *          waitUntil: "domcontentloaded",
 *          maxRetries: 3,
 *          retryDelayMs: 1500,
 *          // Prefer locator factories over "getByRole(...)" strings
 *          waitFor: [selectors.connectWalletBtn, selectors.accountMenuButton],
 *          afterNavigate: async (page) => {
 *            // e.g. dismiss cookie banner if shown
 *          },
 *        })
 *
 * Notes
 *   - `waitFor` accepts either selector strings (CSS / text / `role=` engine),
 *     or locator factories `(page: Page) => Locator`. Do NOT pass API calls as
 *     strings (e.g. "getByRole('button', …)"); use a locator factory instead.
 *   - Retries swallow intermediate errors and keep logs; the last error is
 *     rethrown for Playwright to report.
 */

type WaitTarget = string | ((page: Page) => Locator);

export type OpenAppOptions = {
  /** Absolute URL (overrides base + path) */
  url?: string;
  /** Path appended to DAPP_URL (ignored if `url` is provided) */
  path?: string;
  /** Document readiness signal for `page.goto` (SPA-friendly default) */
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  /** Max retry attempts (total tries = maxRetries + 1) */
  maxRetries?: number;
  /** Initial backoff in ms; doubles each retry (1x, 2x, 4x…) */
  retryDelayMs?: number;
  /** If true, bring tab to front after navigating (useful with wallet popups) */
  bringToFront?: boolean;
  /**
   * UI readiness gates. All provided targets must be visible before we proceed.
   * Accepts CSS/text/`role=` strings or locator factories `(page)=>Locator`.
   */
  waitFor?: WaitTarget[] | WaitTarget;
  /** Runs after nav + waits. Good place to dismiss banners or run small fixes. */
  afterNavigate?: (page: Page) => Promise<void> | void;
};

/**
 * Backwards compatibility:
 *   openApp(context)                              // uses DAPP_URL
 *   openApp(context, "https://dydx.trade/...")    // explicit URL
 *   openApp(context, { path: "/trade/BTC-USD" })  // base + path + waits/retries
 */
export async function openApp(
  page: Page,
  context: BrowserContext,
  urlOrOptions?: string | OpenAppOptions
): Promise<Page> {
  // Normalize options: support a string URL for ergonomics.
  const opts: OpenAppOptions =
    typeof urlOrOptions === "string" ? { url: urlOrOptions } : (urlOrOptions ?? {});

  const {
    url,
    path,
    waitUntil = "domcontentloaded", // SPA-friendly default
    maxRetries = 3,
    retryDelayMs = 1_000,
    bringToFront = true,
    waitFor,
    afterNavigate,
  } = opts;

  // Build the target URL from base + path unless an absolute URL was provided.
  const targetUrl = url ?? new URL(path ?? "", DAPP_URL).toString();
  logger.step(`Navigating to app: ${targetUrl}`);

  let lastError: unknown;

  // Retry loop: we intentionally catch errors, log context, back off, and retry
  // a bounded number of times before surfacing the final error.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptNo = attempt + 1;

    try {
      // On retries, wait with exponential backoff: 1x, 2x, 4x…
      if (attempt > 0) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1);
        logger.info(`Retry ${attempt} of ${maxRetries} → waiting ${delay}ms`);
        await page.waitForTimeout(delay);
      }

      // Navigate and bring the tab forward (wallet popups often assume focus).
      await page.goto(targetUrl, { waitUntil });
      if (bringToFront) await page.bringToFront();

      // UI readiness gates: wait until the *real* controls we need are visible.
      if (waitFor) {
        const list = Array.isArray(waitFor) ? waitFor : [waitFor];
        logger.info(`Waiting for ${list.length} selector(s) to be visible`);
        for (const item of list) {
          if (typeof item === "string") {
            // For strings use CSS / text / `role=` selector engines.
            logger.debug(`waitForSelector: ${item}`);
            await page.waitForSelector(item, {
              state: "visible",
              timeout: TEST_TIMEOUTS.ELEMENT,
            });
          } else {
            // For factories, resolve to a Locator and wait for visibility.
            const loc = item(page);
            logger.debug(`waitFor locator(factory)`);
            await loc.first().waitFor({
              state: "visible",
              timeout: TEST_TIMEOUTS.ELEMENT,
            });
          }
        }
      }

      // Post-nav hook: last chance to tidy up (cookie/region banners, etc).
      if (afterNavigate) {
        await afterNavigate(page);
      }

      logger.success(
        `Navigated to dYdX: ${targetUrl}${attempt > 0 ? ` on attempt ${attemptNo}` : ""}`
      );
      return page; // ✅ success
    } catch (err) {
      // Keep the last error so we can rethrow it after all retries are exhausted.
      lastError = err;
      logger.warning(
        `Navigation attempt ${attemptNo} failed for ${targetUrl}: ${(err as Error)?.message}`
      );
      // Loop continues unless we hit the max retries; then we break below.
    }
  }

  // All attempts failed → surface the final error with context.
  logger.error(
    `Failed to navigate after ${maxRetries + 1} attempts: ${targetUrl}`,
    lastError as Error
  );
  throw lastError;
}
//#endregion

//#region connectWallet
/**
 * Connect a wallet to the dApp.
 *
 * What this does (high-level):
 *  - If needed, clicks "Connect wallet".
 *  - Picks the requested wallet provider (MetaMask | Phantom).
 *  - Clicks "Send request" if the dApp shows it.
 *  - Confirms the connection in the extension popup (handles common variants).
 *  - Verifies the dApp looks connected (account menu visible).
 *
 * Why we structure it this way:
 *  - dApps differ slightly across sessions (fresh vs already connected).
 *  - Wallet extensions spawn separate popup pages we must confirm in.
 *  - We keep logs granular so CI failures are diagnosable from output alone.
 */
export async function connectWallet(
  page: Page,
  context: BrowserContext,
  wallet: WalletType
): Promise<Page> {
  logger.step(`Connecting wallet: ${wallet}`);

  // 1) If already connected, short-circuit (account/user menu present)
  if (await dydxSelectors.accountMenuButton(page, wallet).isVisible()) {
    logger.info("Wallet appears already connected (account menu visible)");
    return page;
  }

  // 2) Open the wallet picker if needed
  if (await dydxSelectors.connectWalletBtn(page).isVisible()) {
    await dydxSelectors.connectWalletBtn(page).click();
    logger.debug("Connect button clicked");
  } else {
    // Sometimes the picker is open already (from a previous run or hot reload)
    logger.info(`Connect button not visible — assuming wallet picker may be open`);
  }

  // 3) Choose provider and trigger the request from within the dApp
  await chooseProvider(page, dydxSelectors.chooseProviderBtn(page, wallet), wallet);

  // 4) Handle the extension popup (MetaMask/Phantom)
  await handleWalletPopup(context, wallet);

  // Optional: some UIs require an explicit "Send request" button press in-page
  const sendRequestBtnVisible = await clickIfVisible( dydxSelectors.sendRequestBtn(page), "Send request", TEST_TIMEOUTS.ELEMENT);
  if (sendRequestBtnVisible) {
    logger.debug("Send request button clicked");
    await handleWalletPopup(context, wallet);
  } else {
    logger.debug("Send request button not visible — skipping");
  }

  // 5) Confirm signature request
  await handleWalletPopup(context, wallet);

  // 6) Close Deposit pop-up if it's open
  await clickIfVisible(dydxSelectors.depositPopupXButton(page), "Deposit popup X button", TEST_TIMEOUTS.ELEMENT);

  // 7) Assert the dApp now shows a connected state
  await expect(dydxSelectors.accountMenuButton(page, wallet)).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  logger.success(`Wallet connected: ${wallet}`);

  return page;
}

/* =========================
   Helpers (small, focused)
   ========================= */

// Click the provider tile/button in the wallet picker.
async function chooseProvider(page: Page, provider: Locator, name: string) {
  logger.info(`Selecting wallet provider: ${name}`);
  await expect(provider).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await provider.click();
}

async function handleWalletPopup(context: BrowserContext, wallet: WalletType) {
  if (wallet === "metamask") {
    await handleMetaMaskPopup(context);
  } else {
    await handlePhantomPopup(context);
  }
}

// Click a locator if it’s visible; log what happened.
async function clickIfVisible(locator: Locator, label: string, timeout: number ): Promise<boolean> {
  await locator.first().waitFor({ state: "visible", timeout }).catch(() => {});
  if (await locator.first().isVisible()) {
    logger.info(`Clicking: ${label}`);
    await locator.first().click();
    return true;
  } else {
    logger.debug(`"${label}" not visible — skipping`);
    return false;
  }
}
//#endregion