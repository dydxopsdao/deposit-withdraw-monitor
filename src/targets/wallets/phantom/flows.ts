// src/targets/wallets/phantom/flows.ts
import { chromium, BrowserContext } from '@playwright/test';
import { PHANTOM_EXT_PATH } from "../../../config/constants";
import { WALLET_PASSWORD, assertPhantomSecrets } from "./constants";
import { findPageWithUrl } from '../../../utils/helpers/windows';
import { clickAnyButton } from '../../../utils/helpers/ui-helper';
import { logger } from '../../../utils/logger/logging-utils';
import { phantomSelectors as s } from './selectors';
import { TEST_TIMEOUTS } from "../../../config/timeouts";


export async function launchContextWithExtension(
  userDataDir: string,
  headless = !!process.env.CI
): Promise<BrowserContext> {
  assertPhantomSecrets();

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      `--disable-extensions-except=${PHANTOM_EXT_PATH}`,
      `--load-extension=${PHANTOM_EXT_PATH}`,
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  return context;
}

export async function setupWallet(context: BrowserContext, seedPhrase: string) {
  logger.step("Setting up Phantom wallet");

  // idempotent-ish: if onboarding is already completed, this page might redirect/close quickly
  const onboarding = await context.newPage();
  await onboarding.goto(s.urls.onboarding, { waitUntil: 'domcontentloaded' });
  logger.debug("Phantom onboarding page loaded");

  try {
    await (await onboarding.waitForSelector(s.onboarding.alreadyHaveWallet, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
    logger.debug("Phantom onboarding: Already have wallet button clicked");
  } catch {
    // Likely already onboarded
    await onboarding.close();
    return;
  }

  await (await onboarding.waitForSelector(s.onboarding.importRecovery, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Import Recovery Phrase button clicked");
  const words = seedPhrase.split(' ').filter(Boolean);
  for (let i = 0; i < 12; i++) {
    await onboarding.locator(s.onboarding.seedInput(i)).fill(words[i] ?? '');
  }
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Submit button clicked");

  // Continue
  await (await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Continue")`, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Continue button clicked");

  await (await onboarding.waitForSelector(s.onboarding.password, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
  await (await onboarding.waitForSelector(s.onboarding.confirmPassword, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
  await (await onboarding.waitForSelector(s.onboarding.tosCheckbox, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Password set");

  // Get Started
  await (await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Get Started")`, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Get Started button clicked");

  await onboarding.close();
  logger.info("Phantom wallet setup complete");
}

export async function unlockPhantomWallet(
  context: BrowserContext, 
  maxRetries = 3, 
  retryDelay = 1000
) {
  logger.step("Unlocking Phantom wallet");

  // Retry logic for page load
  let unlock: any = null;
  
  // Sometimes the page would load but for whatever reason will then crash and selectors would not be found
  // This is a workaround to retry the page load
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      unlock = await context.newPage();
      await unlock.goto(s.urls.unlock, { waitUntil: 'domcontentloaded' });
      logger.debug("Phantom unlock page loaded: " + unlock.url());

      // Proceed with unlock flow
      await (await unlock.waitForSelector(s.unlock.pw, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
      await (await unlock.waitForSelector(s.unlock.pwSubmit, { timeout: TEST_TIMEOUTS.ELEMENT })).click(); 
      logger.debug("Phantom unlock flow completed");

      break; // Success - exit the retry loop
      
    } catch (error) {
      if (unlock) {
        await unlock.close().catch(() => {}); // Clean up failed page
      }
      
      if (attempt === maxRetries) {
        logger.error(`Failed to load Phantom unlock page after ${maxRetries} attempts`);
        throw error; // Re-throw the error after all retries exhausted
      }
      
      logger.debug(`Phantom unlock page load failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  await unlock.close();
  logger.info("Phantom unlocked");
}

/**
 * Phantom usually shows a single “Approve/Connect” button.
 * In their UI it’s commonly data-testid="primary-button".
 * We also try visible “Approve”/“Connect” by role to be resilient.
 */
export async function handlePhantomPopup(context: BrowserContext) {
  logger.info("Waiting for Phantom popup…");
  const ph = await findPageWithUrl(context, s.urls.notification);

  if (!ph) {
    logger.warning("Phantom popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
    logger.debug(`Phantom popup URL: ${ph.url()}`);

    // First try canonical test id:
    const primary = ph.getByTestId("primary-button");
    if (await primary.isVisible()) {
      await primary.click();
    } else {
      // Fallback to common labels:
      await clickAnyButton(ph, [/^Approve$/i, /^Connect$/i, /^Confirm$/i], "Phantom connect flow");
    }

    await ph.close().catch(() => {});
    logger.info("Phantom popup handled");
  } catch (e: any) {
    logger.warning(`Phantom popup handling had issues: ${e?.message ?? e}`);
    try { await ph.close(); } catch {}
  }
}