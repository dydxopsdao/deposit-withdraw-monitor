// targets/dydx/flows.ts


import { expect, type BrowserContext, type Page, type Locator } from "@playwright/test";
import { DAPP_URL } from "../../config/constants";
import { logger } from "../../logger";
import { WalletType, isVisible } from "../../utils";
import { TEST_TIMEOUTS } from "../../config/timeouts";
import { handleMetamaskPopup, conditionallyUnlockMetamask } from "../wallets/metamask/flows";
import { handlePhantomPopup as handlePhantomPopup } from "../wallets/phantom/flows";
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
 * @param page Page instance performing the navigation.
 * @param context Browser context used for popup focus tweaks.
 * @param urlOrOptions Either a direct URL string or an options bag.
 * @returns Promise that resolves to the navigated Page.
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
  // TODO: Extract this retry/backoff block into a shared helper to keep navigation logic DRY.
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
      //TODO Handle concurrent runs with connected vs not.
      /* if (waitFor) {
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
      } */

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
      // TODO: Optionally capture details to be used on the final error.
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
 * @param page Active dYdX page.
 * @param context Browser context for wallet popup handling.
 * @param wallet Wallet provider to connect.
 * @returns Promise resolving with the connected page once complete.
 */
export async function connectWallet(
  page: Page,
  context: BrowserContext,
  wallet: WalletType
): Promise<Page> {
  logger.step(`Connecting wallet: ${wallet}`);
  
  // TODO: Emit metrics or structured logs for each connection attempt to aid debugging in CI.
  //TODO add hahndling of the warning / disconnect
  // TODO: If stale wallet popups are open from previous runs, close them proactively.
  // 1) If already connected, short-circuit (account/user menu present)
  if (await isVisible(dydxSelectors.accountMenuButton(page, wallet))) {
    logger.info("Wallet appears already connected (account menu visible)");
    return page;
  }
  // 2) Open the wallet picker if needed
  await openWalletPicker(page);
  
  // 3) Choose provider and trigger the request from within the dApp
  logger.info("Choose provider");
  await chooseProvider(page, dydxSelectors.chooseProviderBtn(page, wallet), wallet);
  // 4) Handle occasionaly wallet sign in
  if (wallet === "metamask") {
    await conditionallyUnlockMetamask(context);
  }
  // 5) Handle the extension popup (delegated to wallet-specific helpers)
  logger.info("Handling wallet popup");
  await handleWalletPopup(context, wallet);

  // 6) Send request 
  logger.info("Sending request");
  await sendRequest(page, dydxSelectors.sendRequestBtn(page));

  // 7) Confirm the request
  logger.info("Confirming request");
  await handleWalletPopup(context, wallet);

  // 7.1 ) Second Confirm if needed
  try {
    await handleWalletPopup(context, wallet);
  } catch (error) {
    
  }

  // 8) Assert the dApp now shows a connected state
  try {
    const acctBtn = dydxSelectors
      .accountMenuButton(page, wallet)
      .or(dydxSelectors.accountMenuButtonLoose(page));
  
    await expect(acctBtn).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    logger.success(`Wallet connected: ${wallet}`, { wallet });
  } catch (err) {
    logger.warning(
      "Account menu not visible after wallet connect, checking for deposit dialog...",
      {
        wallet,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }
    );
  
    try {
      const depositDialog = dydxSelectors.fundsDialog(page);
      await expect(depositDialog).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
      logger.success(`Wallet connected (inferred from deposit dialog): ${wallet}`, { wallet });
    } catch (dialogErr) {
      logger.error(
        "Neither account menu nor deposit dialog found after wallet connect",
        dialogErr instanceof Error ? dialogErr : new Error(String(dialogErr)),
        { wallet }
      );
      throw err; // rethrow original error
    }
  }
  

  return page;
}

/* =========================
   Helpers (small, focused)
   ========================= */

// Click the provider tile/button in the wallet picker.
async function chooseProvider(page: Page, provider: Locator, name: string) {
  logger.info(`Selecting wallet provider: ${name}`);
  // TODO: Add retry or clearer error messaging if the provider element is not found.
  // TODO: Handle the case where the wallet picker is behind a modal or overlay (scroll into view).
  await expect(provider).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await provider.click();
}
//TODO improve this as it doesn'throw or inform if not found properly
async function handleWalletPopup(context: BrowserContext, wallet: WalletType) {
  // TODO: Surface an explicit error when wallet popups fail to appear to avoid silent skips.
  if (wallet === "metamask") {
    await handleMetamaskPopup(context);
    logger.info("MetaMask wallet popup handled");
  } else {
    await handlePhantomPopup(context);
    logger.info("Phantom wallet popup handled");
  }
}

async function sendRequest(page: Page, locator: Locator) {
  logger.info("Sending request");
  await expect(locator).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await locator.click();
  // TODO: Verify UI transitions to a pending/confirmation state after sending.
}

/**
 * Opens the wallet picker, retrying the Connect button until the modal appears.
 * @param page Active dYdX page.
 * @param retries Number of follow-up attempts before failing.
 * @returns Promise that resolves once the picker is visible.
 */
export async function openWalletPicker(page: Page, retries = 2) {
  // If already open, we're done
  if (await isPickerOpen(page)) return;
  // TODO: Consider adding logging for each retry attempt for better traceability.
  // TODO: Add a short jitter between retries to reduce sync collisions.

  for (let attempt = 0; attempt <= retries; attempt++) {
    // 1) wait for button, then click
    await expect(dydxSelectors.connectWalletBtn(page)).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    await dydxSelectors.connectWalletBtn(page).click();

    // 2) confirm picker appeared
    if (await isPickerOpen(page)) return;

    // optional small wait before next try
    if (attempt < retries) await page.waitForTimeout(500);
  }

  throw new Error("Wallet picker did not appear after clicking Connect wallet.");
}

/** Picker is "open" if any wallet option is visible */
async function isPickerOpen(page: Page) {
  return (
    (await isVisible(dydxSelectors.chooseProviderBtn(page, "metamask"))) ||
    (await isVisible(dydxSelectors.chooseProviderBtn(page, "phantom")))
  );
}
//#endregion

//#region deposit
/**
 * Deposit funds to the dApp.
 */
const T = TEST_TIMEOUTS.ELEMENT ?? 30_000;
const re = (txt: string) => new RegExp(`\\b${txt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

/**
 * Drives the deposit dialog through token selection and amount entry.
 * Wallet popups and final submission are handled separately.
 * @param page Active dYdX page.
 * @param _context Reserved for parity with withdraw flow (unused here).
 * @param amount Amount to enter into the deposit form.
 * @param src_chain Source chain name shown in the UI selector.
 * @param token Token symbol to pair with the source chain.
 * @param wallet Wallet provider used for any conditional logic.
 * @returns Promise that resolves once the dialog is populated.
 */
export async function deposit(
  page: Page,
  _context: BrowserContext,
  amount: string,
  src_chain: string, // e.g. "polygon"
  token: string,      // e.g. "USDC"
  wallet: WalletType
) {
  logger.step(`Depositing ${amount} ${token} from ${src_chain}`);
  // TODO: Validate inputs (amount/token/chain) before interacting with the UI to fail fast.
  // Open the deposit dialog
  
  await clickAnyDeposit(page);
  await expect(dydxSelectors.fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
  logger.info("Deposit dialog opened");
  // Pick the right token+chain 
  if (wallet === "metamask") {
    await selectTokenDeposit(page, token, src_chain);
    logger.info("Token selected");
  }

  // Enter amount
  await enterAmount(page, amount);
  logger.info("Amount entered");
}

/**
 * Chooses a token/chain combination inside the deposit picker dialog.
 * @param page Active dYdX page.
 * @param token Token symbol to match inside the picker row.
 * @param chain Chain name to combine with the token text.
 * @returns Promise that resolves after clicking the chosen option.
 */
export async function selectTokenDeposit(page: Page, token: string, chain: string) {
  //TODO wrap in a try catch retry
  // Open the picker
  const pill = dydxSelectors.tokenPillDeposit(page);
  logger.debug("Token pill located for deposit", { locator: pill });
  await expect(pill).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await pill.click();
  const picker = dydxSelectors.tokenPickerDialogDeposit(page);
  await expect(picker).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Find candidates that contain both pieces of text
  const candidates = dydxSelectors.tokenPickerCandidates(page, token, chain);
  // TODO: If multiple matches exist (duplicate token bridges), prefer an exact/labelled match.

  // Wait for at least one match
  await expect(candidates.first()).toBeVisible({ timeout: TEST_TIMEOUTS.ACTION });

  // For a short window, if a second appears, prefer it
  let target = candidates.first();
  const deadline = Date.now() + TEST_TIMEOUTS.ACTION;
  while (Date.now() < deadline) {
    if ((await candidates.count()) >= 2) {
      target = candidates.nth(1);
      break;
    }
    await page.waitForTimeout(TEST_TIMEOUTS.POLL);
  }

  // Make sure we can click it
  await target.evaluate(el => el.scrollIntoView({ block: "center" })).catch(() => {});
  await expect(target).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await expect(target).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Click with a safe fallback if something overlays briefly
  try {
    await target.click({ timeout: TEST_TIMEOUTS.ELEMENT });
  } catch {
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      await target.click({ force: true });
    }
  }
  // TODO: Extract this click-with-fallback pattern into a shared helper (DRY).
}

/** Fill the Amount input and blur to trigger validation */
async function enterAmount(page: Page, amount: string) {
  const input = dydxSelectors.amountInput(page);
  await expect(input).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await input.fill("");
  await input.fill(amount);
  await page.keyboard.press("Tab").catch(() => {}); // blur
}

/**
 * Opens the deposit modal by clicking whichever deposit button is available.
 * Falls back across multiple deposit CTAs if the preferred one is disabled.
 * @param page Active dYdX page that has deposit buttons rendered.
 * @returns Resolves once a deposit button has been clicked.
 */
export async function clickAnyDeposit(page: Page) {
  try {
    await expect(dydxSelectors.fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    return; // already open
  } catch {
    /* not open yet → continue */
  }
  const btns = dydxSelectors.depositButtons(page);
  const n = await btns.count();
  // TODO: Add logging for which deposit button was clicked to aid debugging.

  for (let i = 0; i < n; i++) {
    const btn = btns.nth(i);
    try {
      await expect(btn).toBeVisible({ timeout: TEST_TIMEOUTS.POLL });
      await expect(btn).toBeEnabled({ timeout: TEST_TIMEOUTS.POLL });
    } catch {
      continue;
    }
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click();
    return;
  }
  throw new Error('No clickable "Deposit" button found (all hidden or disabled).');
}


/**
 * Submits the deposit dialog and handles follow-up wallet confirmation popups.
 * @param page Active dYdX page whose dialog has already been configured.
 * @param context Browser context used to locate wallet popups.
 * @param wallet Wallet provider to route popup handling logic.
 * @returns Promise that resolves after popups are handled.
 */
export async function submitDeposit(page: Page, context: BrowserContext, wallet: WalletType): Promise<void> {
  const btn = dydxSelectors.depositFundsButton(page);
  // TODO: Consolidate transaction submission logic to reduce duplication with withdraw flow.

  // Make sure the dialog is present and the button is on-screen
  await expect(btn).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Trigger validation (some UIs only enable after blur)
  await dydxSelectors.amountInput(page).press("Tab").catch(() => {});

  // Wait until it’s actually enabled (handles disabled/aria-disabled)
  await expect(btn).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });
  // Click for real
  await btn.click();
  logger.info("Deposit funds button clicked");

  // Add / Approve Network
  await handleWalletPopup(context, wallet);
  // Confirm the transaction
  // TODO handle alert for network costs
  //Here just to approve spending cap
  await handleWalletPopup(context, wallet);


}
//#endregion

//#region withdraw
/**
 * Navigates the withdraw dialog to pick the destination and amount to send.
 * @param page Active dYdX page.
 * @param _context Reserved for parity with deposit flow (unused here).
 * @param amount Amount to withdraw.
 * @param dst_chain Destination chain shown in the UI selector.
 * @param token Token symbol pairing the withdrawal route.
 * @param wallet Wallet provider to account for chain selection quirks.
 * @returns Promise that resolves once withdraw dialog is primed.
 */
export async function withdraw(
  page: Page,
  _context: BrowserContext,
  amount: string,
  dst_chain: string, // e.g. "polygon"
  token: string,      // e.g. "USDC"
  wallet: WalletType
) {
  logger.step(`Withdrawing ${amount} ${token} to ${dst_chain}`);
  // Close the deposit dialog if open
  try {
    await expect(dydxSelectors.fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    await dydxSelectors.closeDialogButton(page).click();

  } catch (error) {
    
  }
  // Open the withdraw dialog
  await dydxSelectors.withdrawButton(page).click();
  //await clickAnyWithdraw(page);
  await expect(dydxSelectors.fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
  logger.info("Withdraw dialog opened");
  // Pick the right token+chain 
  if (wallet === "metamask") {
    await selectTokenWithdraw(page, token, dst_chain);
    logger.info("Token selected");
  }

  // Enter amount
  await enterAmount(page, amount);
  logger.info("Amount entered");
}

/**
 * Chooses a destination chain and token combination in the withdraw dialog.
 * @param page Active dYdX page.
 * @param token Token symbol for the withdrawal.
 * @param chain Chain name that must match the picker row text.
 * @returns Promise that resolves after the picker selection is made.
 */
export async function selectTokenWithdraw(page: Page, token: string, chain: string) {
  //TODO wrap in a try catch retry
  // Open the picker
  const pill = dydxSelectors.tokenPillWithdraw(page);
  logger.debug("Token pill located for withdraw", { locator: pill });
  await expect(pill).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await pill.click();
  const picker = dydxSelectors.chainPickerDialog(page);
  logger.debug("Withdraw chain picker dialog located", { locator: picker });
  await expect(picker).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Find candidates that contain both pieces of text
  const candidates = dydxSelectors.chainPickerRow(page, chain);
  logger.debug("Withdraw chain picker candidates", { count: await candidates.count() });
  // Wait up to 5s for at least one match
  await expect(candidates.first()).toBeVisible({ timeout: 5_000 });

  // For up to 5s, if a second appears, prefer it
  let target = candidates.first();
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if ((await candidates.count()) >= 2) {
      target = candidates.nth(1);
      break;
    }
    await page.waitForTimeout(TEST_TIMEOUTS.POLL);
  }

  // Make sure we can click it
  await target.evaluate(el => el.scrollIntoView({ block: "center" })).catch(() => {});
  await expect(target).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await expect(target).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Click with a safe fallback if something overlays briefly
  try {
    await target.click({ timeout: TEST_TIMEOUTS.ELEMENT });
  } catch {
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      await target.click({ force: true });
    }
  }
}


/**
 * Clicks the withdraw CTA once validation passes and delegates wallet approval.
 * @param page Active dYdX page whose withdraw dialog is already populated.
 * @param context Browser context used for wallet popup handling.
 * @param wallet Wallet provider for routing popup handling.
 * @returns Promise that resolves once the withdraw button is clicked.
 */
export async function submitWithdraw(page: Page, context: BrowserContext, wallet: WalletType): Promise<void> {
  const btn = dydxSelectors.withdrawFundsButton(page);

  // Make sure the dialog is present and the button is on-screen
  await expect(btn).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Trigger validation (some UIs only enable after blur)
  await dydxSelectors.amountInput(page).press("Tab").catch(() => {});

  // Wait until it’s actually enabled (handles disabled/aria-disabled)
  await expect(btn).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });

  // Click for real
  await btn.click();

}
//#endregion
