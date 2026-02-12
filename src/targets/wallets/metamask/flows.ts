// src/targets/wallets/metamask/flows.ts
import { chromium, BrowserContext, Page, expect } from "@playwright/test";
import { METAMASK_EXT_PATH } from "../../../config/constants";
import { WALLET_PASSWORD, assertMetamaskSecrets } from "./constants";
import { metamaskSelectors as s } from "./selectors";
import { findPageWithUrl, safeUrl } from "../../../utils";
import { logger } from "../../../logger";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import fs from "fs";
import { MetamaskNetworkFeeAlertError } from "./errors";

let warnedMissingWalletPassword = false;
const metamaskExtensionIdCache = new WeakMap<BrowserContext, string>();

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
    viewport: { width: 1920, height: 1080 },
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

  // Welcome and Terms of Service
  await onboarding.locator(s.onboarding.iHaveExistingWallet).click();
  
  // Import with Secret Recovery Phrase
  await onboarding.locator(s.onboarding.importWallet).click();
  await (await onboarding.waitForSelector(s.onboarding.importWithSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  const seedWords = seedPhrase.trim().split(/\s+/).filter(Boolean);
  for (let i = 0; i < seedWords.length; i++) {
    const wordInput = i === 0
      ? await onboarding.waitForSelector(s.onboarding.srpInput, { timeout: TEST_TIMEOUTS.ELEMENT })
      : await onboarding.waitForSelector(`[data-testid="import-srp__srp-word-${i}"]`, { timeout: TEST_TIMEOUTS.ELEMENT });
    await wordInput.fill(seedWords[i]);
    await onboarding.keyboard.press("Space");
  }

  await (await onboarding.waitForSelector(s.onboarding.confirmSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();

  // Set Password
  await onboarding.locator(s.onboarding.pw).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwConfirm).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwTerms).click();
  await onboarding.locator(s.onboarding.pwSubmit).click();
  
  await onboarding.locator(s.onboarding.helpImproveMetaMask).click();
  // Click Done
  await (await onboarding.waitForSelector(s.onboarding.done, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  await expect(onboarding.locator(s.onboarding.done)).toBeDisabled();
  await onboarding.close().catch(() => {});
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

  //await unlock.close();
  logger.info("MetaMask unlocked");
} }

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const redactSensitive = (text: string): string => {
  if (!WALLET_PASSWORD) return text;
  return text.replace(new RegExp(escapeRegExp(WALLET_PASSWORD), "g"), "[REDACTED]");
};

const isExtensionPage = (page: Page): boolean => s.urls.extensionPage.test(page.url());

/**
 * Scans the browser context for an existing MetaMask page that needs unlocking.
 * @param context The Playwright BrowserContext.
 * @returns A promise that resolves to the found Page, or undefined if not found.
 */
async function findExistingUnlockPage(context: BrowserContext): Promise<Page | undefined> {
  for (const page of context.pages()) {
    if (isExtensionPage(page)) {
      return page;
    }
  }
  return undefined;
}

const isNotificationView = (page: Page): boolean => /notification\.html/i.test(safeUrl(page));

const extractExtensionId = (url: string): string | null => {
  const match = url.match(/^chrome-extension:\/\/([a-p]{32})\//i);
  return match?.[1] ?? null;
};

async function getMetamaskExtensionId(context: BrowserContext): Promise<string | null> {
  const cached = metamaskExtensionIdCache.get(context);
  if (cached) return cached;

  for (const sw of context.serviceWorkers()) {
    const id = extractExtensionId(sw.url());
    if (id) {
      metamaskExtensionIdCache.set(context, id);
      return id;
    }
  }
  for (const page of context.pages()) {
    const id = extractExtensionId(safeUrl(page));
    if (id) {
      metamaskExtensionIdCache.set(context, id);
      return id;
    }
  }
  try {
    const sw = await context.waitForEvent("serviceworker", { timeout: TEST_TIMEOUTS.EXTENSIONS });
    const id = extractExtensionId(sw.url());
    if (id) metamaskExtensionIdCache.set(context, id);
    return id;
  } catch {
    return null;
  }
}

export async function primeMetamaskExtensionId(context: BrowserContext): Promise<string | null> {
  const id = await getMetamaskExtensionId(context);
  if (id) {
    logger.debug(`MetaMask extension ID cached: ${id}`);
  } else {
    logger.warning("Unable to cache MetaMask extension ID at context startup");
  }
  return id;
}

async function openMetamaskNotificationPage(context: BrowserContext): Promise<Page | null> {
  const extensionId = await getMetamaskExtensionId(context);
  if (!extensionId) {
    logger.warning("MetaMask extension ID could not be resolved");
    return null;
  }

  const url = s.urls.notificationTemplate.replace("{id}", extensionId);
  const existing = context.pages().find((page) => safeUrl(page).startsWith(url));
  const page = existing ?? await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    logger.info(`MetaMask notification opened via dynamic extension ID: ${url}`);
    return page;
  } catch (error: any) {
    logger.warning(`Failed to open MetaMask notification URL ${url}: ${error?.message ?? error}`);
    if (!existing) {
      await page.close().catch(() => {});
    }
    return null;
  }
}

async function findMetamaskExtensionPage(
  context: BrowserContext,
  retries: number
): Promise<Page | null> {
  const candidates = context.pages().filter(isExtensionPage);
  if (candidates.length) {
    candidates.sort((a, b) => Number(isNotificationView(a)) - Number(isNotificationView(b)));
    return candidates[0];
  }
  if (retries <= 0) {
    return null;
  }
  return await findPageWithUrl(context, s.urls.extensionPage, retries);
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
        predicate: isExtensionPage,
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

async function attemptMetamaskUnlock(page: Page): Promise<boolean> {
  if (!WALLET_PASSWORD) {
    if (!warnedMissingWalletPassword) {
      logger.warning("WALLET_PASSWORD not set; cannot auto-unlock MetaMask prompt");
      warnedMissingWalletPassword = true;
    }
    return false;
  }

  const passwordField = page.locator(s.unlock.pw);
  const submitButton = page.locator(s.unlock.pwSubmit);

  try {
    await passwordField.waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ACTION });
  } catch (err: any) {
    logger.debug(`MetaMask unlock password field not visible: ${err?.message ?? err}`);
    return false;
  }

  try {
    logger.info("MetaMask unlock prompt detected; filling password");
    await passwordField.fill(WALLET_PASSWORD);
    await submitButton.waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => {});
    await submitButton.click({ timeout: TEST_TIMEOUTS.DEFAULT });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    logger.info("MetaMask unlock submitted");
    return true;
  } catch (err: any) {
    logger.warning(`MetaMask unlock submission failed: ${err?.message ?? err}`);
    return false;
  }
}

/**
 * Handles MetaMask UI interactions within a given page.
 * Optionally reloads the page (useful for the pinned tab) and keeps the page open unless specified.
 */
type HandleMetamaskPageOptions = {
  label?: string;
  closeOnComplete?: boolean;
  clickTimeoutMs?: number;
  returnPage?: Page;
  maxReloads?: number;
};

async function handleMetamaskPage(
  page: Page,
  opts: HandleMetamaskPageOptions = {},
  unlock?: boolean
): Promise<boolean> {
  const {
    label = "MetaMask connect flow",
    clickTimeoutMs = 25000,
    closeOnComplete = true,
    returnPage,
    maxReloads = 3,
  } = opts;

  logger.info(`${label}: focusing MetaMask page → ${safeUrl(page)}`);
  try {
    await page.bringToFront().catch(() => {});
    await page.waitForTimeout(2500);

    const ensureNoNetworkFeeAlert = async () => {
      const reviewAlertButton = page.getByRole("button", { name: /^review alert$/i }).first();
      const visible = await reviewAlertButton.isVisible().catch(() => false);
      if (visible) {
        logger.warning(`${label}: MetaMask network fee alert detected`, {
          metamask_url: safeUrl(page),
        });
        throw new MetamaskNetworkFeeAlertError();
      }
    };

    await ensureNoNetworkFeeAlert();

    const patterns = [/^Unlock$/i, /^Next$/i, /^Connect$/i, /^Approve$/i, /^Confirm$/i];
    const pollMs = TEST_TIMEOUTS.POLL;
    const deadline = Date.now() + clickTimeoutMs;

    let clickedPattern: RegExp | null = null;
    let reloadAttempts = 0;

    while (!page.isClosed() && Date.now() < deadline && reloadAttempts <= maxReloads) {
      logger.info(`${label}: reload attempt ${reloadAttempts + 1}/${maxReloads}`);
      const scanDeadline = Math.min(deadline, Date.now() + 2000);
      while (!page.isClosed() && Date.now() < scanDeadline) {
        await ensureNoNetworkFeeAlert();
        for (const pattern of patterns) {
          const button = page.getByRole("button", { name: pattern }).first();
          const visible = await button.isVisible().catch(() => false);
          if (!visible) continue;

          try {
            await button.click({ timeout: TEST_TIMEOUTS.DEFAULT });
            clickedPattern = pattern;
            logger.info(`${label}: clicked MetaMask button matching /${pattern.source}/i`);
          } catch (err: any) {
            logger.debug(
              `${label}: failed to click MetaMask button /${pattern.source}/i (${err?.message ?? err})`
            );
          }
          if (clickedPattern) break;
        }

        if (clickedPattern) break;
        await page.waitForTimeout(pollMs).catch(() => {});
      }

      if (clickedPattern) break;

      reloadAttempts += 1;
    }

    if (clickedPattern && returnPage) {
      try {
        await returnPage.bringToFront();
        logger.info(`${label}: returned focus to dYdX page → ${safeUrl(returnPage)}`);
      } catch (focusErr: any) {
        logger.debug(`${label}: failed to refocus dYdX page (${focusErr?.message ?? focusErr})`);
      }
    }

    if (!clickedPattern) {
      logger.info(
        `${label}: no actionable MetaMask buttons found after ${reloadAttempts} reload${reloadAttempts === 1 ? "" : "s"}`
      );
    }

    if (closeOnComplete) {
      await page.close().catch(() => {});
    }

    return clickedPattern !== null;
  } catch (err: any) {
    if (err instanceof MetamaskNetworkFeeAlertError) {
      throw err;
    }
    const sanitized = redactSensitive(err?.message ?? err);
    logger.warning(`${label}: failed to handle MetaMask page: ${sanitized}`);
    return false;
  }
}

/**
 * MetaMask connection popup flows vary slightly by version/permissions.
 * We try a short sequence of common buttons: Next → Connect → Approve.
 * (If a Sign prompt appears later during auth, handle it in your auth flow.)
 * @param context Browser context that emits the popup window.
 * @returns Promise that resolves once the popup has been actioned.
 */
export async function handleMetamaskPopup(context: BrowserContext, retries: number = 10, unlock: boolean = false) {
  logger.info("MetaMask: checking pinned tab for pending interaction");
  const primaryDappPage = context.pages().find((p) => !isExtensionPage(p));
  const extensionPage = await findMetamaskExtensionPage(context, Math.min(retries, 5));

  if (extensionPage) {
    const handledViaTab = await handleMetamaskPage(extensionPage, {
      label: "MetaMask tab flow",
      returnPage: primaryDappPage,
      clickTimeoutMs: 25000,
      maxReloads: 3,
    });
    if (handledViaTab) {
      logger.info("MetaMask tab flow completed after interaction");
      return;
    }
    logger.info("MetaMask tab flow reported no actions; trying dynamic notification URL");
  } else {
    logger.info("MetaMask pinned tab not found; trying dynamic notification URL");
  }

  const notificationPage = await openMetamaskNotificationPage(context);
  if (!notificationPage) {
    logger.warning("MetaMask notification page could not be opened");
    return;
  }

  const handledViaNotification = await handleMetamaskPage(notificationPage, {
    label: "MetaMask notification flow",
    returnPage: primaryDappPage,
    closeOnComplete: true,
    clickTimeoutMs: 25000,
    maxReloads: 3,
  }, unlock);

  if (handledViaNotification) {
    logger.info("MetaMask notification flow completed after interaction");
  } else {
    logger.info("MetaMask notification flow finished without interaction");
  }
}
