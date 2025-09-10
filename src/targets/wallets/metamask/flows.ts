// src/targets/wallets/metamask/flows.ts
import { chromium, BrowserContext, Page } from "@playwright/test";
import { METAMASK_EXT_PATH } from "../../../config/constants";
import { WALLET_PASSWORD, assertMetamaskSecrets } from "./constants";
import { metamaskSelectors as s } from "./selectors";
import { findPageWithUrl } from "../../../utils/helpers/windows";
import { clickAnyButton } from "../../../utils/helpers/ui-helper";
import { logger } from "../../../utils/logger/logging-utils";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import fs from "fs";
import path from "path";

/**
 * Launch a persistent context with the MetaMask extension loaded.
 */
export async function launchContextWithExtension(
  userDataDir: string
): Promise<BrowserContext> {
  assertMetamaskSecrets();

    const ciArgs = [
      `--disable-extensions-except=${METAMASK_EXT_PATH}`,
      `--load-extension=${METAMASK_EXT_PATH}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--start-maximized",
    ];
    // TODO: Allow overriding default launch arguments to support local debugging and different CI setups.
    // TODO: Share a common set of Chromium args with Phantom to avoid drift (DRY).

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreDefaultArgs: ["--enable-automation"],
    args: ciArgs,
  });

  // Reduce automation fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });


  logger.debug(`METAMASK_EXT_PATH=${METAMASK_EXT_PATH}, exists=${fs.existsSync(METAMASK_EXT_PATH)}`);

  try {
    await context.waitForEvent("serviceworker", { timeout: TEST_TIMEOUTS.EXTENSIONS });
    logger.debug("Service worker found. Adding extra delay for initialization...");
    // This delay is often the key to stability in CI.
    await new Promise(resolve => setTimeout(resolve, TEST_TIMEOUTS.DEFAULT));
  } catch (e) {
      logger.error("MetaMask service worker failed to initialize", e);
      // Fail fast if the extension itself is broken.
      throw new Error("MetaMask service worker failed to initialize.");
  }
  return context;
}

/**
 * Run first-time onboarding: import SRP, set password, opt out of telemetry, etc.
 */
export async function setupWallet(context: BrowserContext, seedPhrase: string) {
  logger.step("Setting up MetaMask wallet");
  // TODO: Add explicit error handling for selector changes between MetaMask versions.
  // TODO: Feature-detect onboarding flow version and branch accordingly to reduce flakiness across versions.

  // deterministically open the UI (don’t wait for it to appear)
  const onboarding = await openMetamaskPage(context, "onboarding/welcome", {
    waitUntil: "domcontentloaded",
    timeout: TEST_TIMEOUTS.NAVIGATION,
    verifySelector: s.onboarding.start,  // first actionable element
  });
  // Welcome and Terms of Service
  await onboarding.locator(s.onboarding.start).click();
  await onboarding.locator(s.onboarding.termsScroll).click();
  await onboarding.locator(s.onboarding.termsCheckbox).check();
  await onboarding.locator(s.onboarding.termsAgree).click();

  // Import with Secret Recovery Phrase
  await onboarding.locator(s.onboarding.importWallet).click();
  await (await onboarding.waitForSelector(s.onboarding.importWithSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();

  const srp = await onboarding.waitForSelector(s.onboarding.srpInput, { timeout: TEST_TIMEOUTS.ELEMENT });
  await srp.type(seedPhrase);

  await (await onboarding.waitForSelector(s.onboarding.confirmSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();

  // Set Password
  await onboarding.locator(s.onboarding.pw).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwConfirm).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwTerms).click();
  await onboarding.locator(s.onboarding.pwSubmit).click();

  // Telemetry → No thanks (optional)
  const noThanks = await onboarding.waitForSelector(s.onboarding.noThanks, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (noThanks) {
    await noThanks.click();
  }
  // Click Done
  await (await onboarding.waitForSelector(s.onboarding.done, { timeout: TEST_TIMEOUTS.ELEMENT })).click();

  const downloadAppContinue = await onboarding.waitForSelector(s.onboarding.downloadAppContinue, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (downloadAppContinue) {
    await downloadAppContinue.click();
  }
  // Pin extension suggestion → Done (optional)
  const pin = await onboarding.waitForSelector(s.onboarding.pinDone, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (pin) {
    await pin.click();
  }

  await onboarding.close();
  logger.info("Wallet setup complete");
}


export async function unlockMetamaskWallet(context: BrowserContext) {
  logger.step("Unlocking MetaMask wallet");
  // TODO: Retry if the unlock page isn't found immediately to reduce flakiness.
  // MetaMask uses dynamic extension URLs → use regex from selectors
  const unlock = await findPageWithUrl(context, s.urls.unlock);
  //TODO this is failing sometimes on the URL pattern /chrome-extension:\/\/.*\/home\.html#unlock/ vs chrome-extension://gipjnhcfkablljbiijlkcohbaniiimdi/home.html#onboarding/unlock
  if (!unlock) {
    logger.warning("MetaMask unlock page not found");
  } else {
  
  await (await unlock.waitForSelector(s.unlock.pw, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
  await (await unlock.waitForSelector(s.unlock.pwSubmit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();

  await unlock.close();
  logger.info("MetaMask unlocked");
} }

/**
 * MetaMask connection popup flows vary slightly by version/permissions.
 * We try a short sequence of common buttons: Next → Connect → Approve.
 * (If a Sign prompt appears later during auth, handle it in your auth flow.)
 */
export async function handleMetamaskPopup(context: BrowserContext) {
  logger.info("Waiting for MetaMask popup…");
  // TODO: Break out specific popup steps for clearer logging and easier reuse.
  // TODO: Add a maximum total wait with a helpful error when popups never appear.

  const mm = await findPageWithUrl(context, s.urls.notification);

  if (!mm) {
    logger.warning("MetaMask popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
    // Some builds show a "MetaMask Notification" title, others keep it blank.
    // Defensive: click the common flow buttons if present
    await clickAnyButton(mm, [/^Next$/, /^Connect$/, /^Approve$/, /^Confirm$/], "MetaMask connect flow", {
      overallTimeoutMs: 10000,
      pollMs: 150,
      maxClicks: 10,
    });

    // Close if MetaMask leaves the window open
    await mm.close().catch(() => {});
    logger.info("MetaMask popup handled");
  } catch (e: any) {
    logger.warning(`MetaMask popup handling had issues: ${e?.message ?? e}`);
    try { await mm.close(); } catch {}
  }
}

function extractId(u: string): string | null {
  const m = u.match(/^chrome-extension:\/\/([a-p]{32})\//);
  return m ? m[1] : null;
}

export async function getMetamaskId(ctx: BrowserContext, timeoutMs = TEST_TIMEOUTS.EXTENSIONS): Promise<string> {
  // TODO: Move extractId/get*Id helpers into a shared module (used by Phantom too).
  // Use existing SW if present; otherwise wait for the next one
  const existing = ctx.serviceWorkers();
  if (existing.length) {
    const id = extractId(existing[0].url());
    if (id) return id;
  }
  const sw = await ctx.waitForEvent("serviceworker", { timeout: timeoutMs });
  const id = extractId(sw.url());
  if (!id) throw new Error(`Could not extract extension ID from ${sw.url()}`);
  return id;
}

type OpenOpts = {
  waitUntil?: "load" | "domcontentloaded";
  navTimeoutMs?: number;
  retries?: number;          // extra tries after the first attempt
  retryDelayMs?: number;
  verifySelector?: string;   // e.g. s.onboarding.start
};

export async function openMetamaskPage(
  ctx: BrowserContext,
  hashPath: string,
  options: {
    timeout?: number;
    verifySelector?: string;
    waitUntil?: "load" | "domcontentloaded";
  }
): Promise<Page> {
  const {
    waitUntil = "domcontentloaded",
    timeout = TEST_TIMEOUTS.NAVIGATION,
    verifySelector,
  } = options;

  logger.debug(`Opening MetaMask page: ${hashPath}`);

  // --- 1. Get Extension ID and Construct URL ---
  const extensionId = await getMetamaskId(ctx);
  
  const entryFile = "home.html"; // The standard entry point for the full-page UI
  // TODO: Detect entry dynamically (e.g. pickEntryFile()) to tolerate packaging differences.
  const url = `chrome-extension://${extensionId}/${entryFile}#${hashPath}`;

  // --- 2. Create New Page and Prepare for Navigation ---
  let page: Page | null = null;
  try {
    page = await ctx.newPage();

    

    // --- 4. Execute Navigation ---
    await page.goto(url, { waitUntil, timeout });

    // --- 5. Verify Page is Ready ---
    if (verifySelector) {
      const locator = page.locator(verifySelector);
      // Using a specific, shorter timeout for the selector itself
      await locator.waitFor({ state: "visible", timeout: TEST_TIMEOUTS.PAGE_LOAD });
    }

    logger.info(`[SUCCESS] Successfully opened MetaMask page at ${hashPath}`);
    return page;

  } catch (error: any) {
    // --- 6. Detailed Error Handling ---
    logger.error(`Failed to open MetaMask page at ${hashPath}: ${error.message}`);
    // TODO: Attach a screenshot or dump console logs here to improve debuggability in CI.
    
    // Tracing will capture a full trace of this failure.
    // This is the most valuable artifact for debugging.
    
    if (page && !page.isClosed()) {
        logger.debug("[openMetamaskPage] Attempting to close failed page...");
        await page.close().catch(e => logger.warning(`Failed to close page on error: ${e.message}`));
    }
    
    // Rethrow the error to ensure the test fails clearly.
    throw new Error(
      `Failed to navigate to MetaMask page ('${hashPath}'). Last error: ${error.message}`
    );
  }
}

function pickEntryFile(): string {
  const candidates = ["home.html", "index.html", "popup.html", "notification.html"];
  for (const f of candidates) {
    if (fs.existsSync(path.join(METAMASK_EXT_PATH, f))) return f;
  }
  throw new Error(`MetaMask entry not found in ${METAMASK_EXT_PATH} (tried home.html, index.html, popup.html, notification.html)`);
}
