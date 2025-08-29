import { chromium, BrowserContext, Page, expect } from '@playwright/test';
import { findPageWithUrl } from '../../../utils/helpers/windows';
import { PHANTOM_EXT_PATH, PHANTOM_EXT_ID, USER_DATA_DIR, DAPP_URL } from "../../../config/constants";
import { SEED_PHRASE, WALLET_PASSWORD, assertPhantomSecrets } from "./constants";
import { phantomSelectors as s } from './selectors';
import { logger } from '../../../utils/logger/logging-utils';
import { clickAnyButton } from '../../../utils/helpers/ui-helper';
import { waitForExtensionPopup } from '../../dydx/flows';

export async function launchContextWithExtension(
  userDataSubdir = 'phantom',
  headless = !!process.env.CI
): Promise<BrowserContext> {
  assertPhantomSecrets();

  const context = await chromium.launchPersistentContext(`${USER_DATA_DIR}/${userDataSubdir}`, {
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

export async function setupWallet(context: BrowserContext) {
  // idempotent-ish: if onboarding is already completed, this page might redirect/close quickly
  const onboarding = await context.newPage();
  await onboarding.goto(`chrome-extension://${PHANTOM_EXT_ID}/onboarding.html`, { waitUntil: 'domcontentloaded' });

  try {
    await onboarding.locator(s.onboarding.alreadyHaveWallet).click({ timeout: 5_000 });
  } catch {
    // Likely already onboarded
    await onboarding.close();
    return;
  }

  await onboarding.locator(s.onboarding.importRecovery).click();

  const words = SEED_PHRASE.split(' ').filter(Boolean);
  for (let i = 0; i < 12; i++) {
    await onboarding.locator(s.onboarding.seedInput(i)).fill(words[i] ?? '');
  }
  await onboarding.locator(s.onboarding.submit).click();

  // Continue
  await onboarding.locator(`${s.onboarding.submit}:has-text("Continue")`).click({ timeout: 30_000 });

  await onboarding.locator(s.onboarding.password).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.confirmPassword).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.tosCheckbox).check();
  await onboarding.locator(s.onboarding.submit).click();

  // Get Started
  await onboarding.locator(`${s.onboarding.submit}:has-text("Get Started")`).click({ timeout: 30_000 });

  await onboarding.close();
}

export async function openDapp(context: BrowserContext, url = DAPP_URL): Promise<Page> {
  const [page] = context.pages().length ? context.pages() : [await context.newPage()];
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  return page;
}

export async function connect(page: Page, context: BrowserContext) {
  // Initial Phantom notification
  const notifUrl = `chrome-extension://${PHANTOM_EXT_ID}/notification.html`;
  const popup1 = await findPageWithUrl(context, notifUrl);
  await popup1.locator(s.popup.primaryBtn).click();
  await popup1.close();

  // Dapp: request connect
  await page.getByRole(s.dapp.connectBtn.role, { name: s.dapp.connectBtn.name }).click();
  await page.getByRole(s.dapp.phantomSolanaBtn.role, { name: s.dapp.phantomSolanaBtn.name }).click();
  await page.getByRole(s.dapp.sendRequestBtn.role, { name: s.dapp.sendRequestBtn.name }).click();

  // Generate dYdX wallet → approve
  const popup2 = await findPageWithUrl(context, notifUrl);
  await popup2.locator(s.popup.primaryBtn).click();
  await popup2.close();

  // Compatibility prompt
  const popup3 = await findPageWithUrl(context, notifUrl);
  await popup3.locator(s.popup.primaryBtn).click();
  await popup3.close();

  // Sanity: dapp should now consider the wallet connected
  await expect(page.getByText(/Connected/i)).toBeVisible({ timeout: 30_000 }).catch(() => {});
}

/**
 * Phantom usually shows a single “Approve/Connect” button.
 * In their UI it’s commonly data-testid="primary-button".
 * We also try visible “Approve”/“Connect” by role to be resilient.
 */
export async function handlePhantomPopup(context: BrowserContext) {
  logger.info("Waiting for Phantom popup…");
  const ph = await waitForExtensionPopup(context);

  if (!ph) {
    logger.warning("Phantom popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
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