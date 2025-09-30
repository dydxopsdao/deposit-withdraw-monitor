// src/targets/wallets/metamask/flows.ts
import { chromium, BrowserContext, Page } from "@playwright/test";
import { METAMASK_EXT_PATH } from "../../../config/constants";
import { WALLET_PASSWORD, assertMetamaskSecrets } from "./constants";
import { metamaskSelectors as s } from "./selectors";
import { findPageWithUrl, clickAnyButton } from "../../../utils";
import { logger } from "../../../logger";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import fs from "fs";

/**
 * Launches a persistent Chromium context with the MetaMask extension loaded.
 * @param userDataDir Directory where extension state should persist between runs.
 * @returns Browser context ready for MetaMask automation.
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
  return context;
}

/**
 * Runs first-time MetaMask onboarding: import SRP, set password, opt out of telemetry.
 * @param context Browser context with MetaMask extension pages.
 * @param seedPhrase Secret recovery phrase for the wallet being restored.
 * @returns Promise that resolves when onboarding is finished.
 */
export async function setupWallet(context: BrowserContext, seedPhrase: string) {
  logger.step("Setting up MetaMask wallet");
  // TODO: Add explicit error handling for selector changes between MetaMask versions.
  // TODO: Feature-detect onboarding flow version and branch accordingly to reduce flakiness across versions.
  const onboarding = await findPageWithUrl(context, s.urls.onboarding);
  if (!onboarding) {
    throw new Error("MetaMask onboarding page not found");
  }
  logger.debug(`MetaMask onboarding page: ${onboarding.url()}`);

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

/**
 * Navigates to the MetaMask unlock screen (if present) and enters the password.
 * @param context Browser context with the MetaMask extension profile.
 * @returns Promise that resolves after MetaMask is unlocked or skipped.
 */
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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const redactSensitive = (text: string): string => {
  if (!WALLET_PASSWORD) return text;
  return text.replace(new RegExp(escapeRegExp(WALLET_PASSWORD), "g"), "[REDACTED]");
};

const isUnlockOrNotificationPage = (page: Page): boolean => {
  const url = page.url();
  return s.urls.unlock.test(url) || s.urls.notification.test(url);
};

/**
 * Scans the browser context for an existing MetaMask page that needs unlocking.
 * @param context The Playwright BrowserContext.
 * @returns A promise that resolves to the found Page, or undefined if not found.
 */
async function findExistingUnlockPage(context: BrowserContext): Promise<Page | undefined> {
  for (const page of context.pages()) {
    if (isUnlockOrNotificationPage(page)) {
      return page;
    }
  }
  return undefined;
}

/**
 * Conditionally unlocks the MetaMask wallet, reusing an existing popup if present.
 * @param context The Playwright BrowserContext.
 * @returns Promise that resolves when the unlock attempt completes.
 */
export async function conditionallyUnlockMetamask(context: BrowserContext) {
  logger.step("Checking for MetaMask unlock page");
  let unlockPage = await findExistingUnlockPage(context);

  if (unlockPage) {
    logger.info(`Found existing MetaMask page: ${unlockPage.url()}`);
  } else {
    logger.info("No existing MetaMask page found, waiting for it to appear...");
    try {
      // Wait for either the unlock or notification page to be created
      unlockPage = await context.waitForEvent('page', {
        predicate: isUnlockOrNotificationPage,
        timeout: TEST_TIMEOUTS.POPUP_TIMEOUT,
      });
      logger.info(`MetaMask page appeared: ${unlockPage.url()}`);
    } catch (error) {
      logger.warning("MetaMask unlock page did not appear within the timeout. Continuing...");
      return; // Exit if no page is found or appears
    }
  }

  // If we have a page, proceed with unlocking
  if (unlockPage) {
    try {
      await unlockPage.bringToFront();
      await unlockPage.waitForLoadState("domcontentloaded").catch(() => {});
      logger.info("Attempting to unlock MetaMask wallet...");
      const passwordField = unlockPage.locator(s.unlock.pw);
      try {
        await passwordField.waitFor({ state: "visible", timeout: TEST_TIMEOUTS.POPUP_TIMEOUT });
      } catch {
        logger.info("MetaMask unlock field not found; assuming unlock not required.");
        return;
      }
      await passwordField.fill(WALLET_PASSWORD, { timeout: TEST_TIMEOUTS.DEFAULT });
      await unlockPage.locator(s.unlock.pwSubmit).click({ timeout: TEST_TIMEOUTS.DEFAULT });
      logger.info("MetaMask unlocked successfully");
    } catch (error) {
        const sanitized = redactSensitive(error instanceof Error ? error.message : String(error));
        logger.info(`Wallet unlock not required or failed: ${sanitized}`);
    }
  }
}

/**
 * MetaMask connection popup flows vary slightly by version/permissions.
 * We try a short sequence of common buttons: Next → Connect → Approve.
 * (If a Sign prompt appears later during auth, handle it in your auth flow.)
 * @param context Browser context that emits the popup window.
 * @returns Promise that resolves once the popup has been actioned.
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
   const clicks = await clickAnyButton(mm, [/^Next$/, /^Connect$/, /^Approve$/, /^Confirm$/], "MetaMask connect flow", {
      overallTimeoutMs: 10000,
      pollMs: 150,
      maxClicks: 10,
    });
    logger.info(`MetaMask popup handled: ${clicks} clicks`);
    // Close if MetaMask leaves the window open
    await mm.close().catch(() => {});
    logger.info("MetaMask popup handled");
  } catch (e: any) {
    logger.warning(`MetaMask popup handling had issues: ${e?.message ?? e}`);
    try { await mm.close(); } catch {}
  }
}
