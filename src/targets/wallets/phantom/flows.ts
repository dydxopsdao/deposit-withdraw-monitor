// src/targets/wallets/phantom/flows.ts
import { chromium, BrowserContext, Page } from '@playwright/test';
import { PHANTOM_EXT_PATH } from '../../../config/constants';
import { WALLET_PASSWORD, assertPhantomSecrets } from './constants';
import { findPageWithUrl } from '../../../utils/helpers/windows';
import { clickAnyButton } from '../../../utils/helpers/ui-helper';
import { logger } from '../../../utils/logger/logging-utils';
import { phantomSelectors as s } from './selectors';
import { TEST_TIMEOUTS } from '../../../config/timeouts';

export async function launchContextWithExtension(userDataDir: string): Promise<BrowserContext> {
  assertPhantomSecrets();

  const context = await chromium.launchPersistentContext(userDataDir, {
    // TODO: Respect the headless argument above instead of hardcoding false.
    headless: false,
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
  logger.step('Setting up Phantom wallet');

  // deterministically open onboarding
  const onboarding = await openPhantomUrl(context, s.urls.onboarding, 'domcontentloaded');
  logger.debug(`Phantom onboarding page: ${onboarding.url()}`);

  try {
    await (
      await onboarding.waitForSelector(s.onboarding.alreadyHaveWallet, { timeout: TEST_TIMEOUTS.ELEMENT })
    ).click();
    logger.debug('Phantom onboarding: Already have wallet clicked');
  } catch {
    // Likely already onboarded
    await onboarding.close().catch(() => {});
    logger.info('Phantom onboarding skipped (already onboarded)');
    return;
  }

  await (await onboarding.waitForSelector(s.onboarding.importRecovery, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug('Phantom onboarding: Import Recovery clicked');

  const words = seedPhrase.split(' ').filter(Boolean);
  for (let i = 0; i < 12; i++) {
    await onboarding.locator(s.onboarding.seedInput(i)).fill(words[i] ?? '');
  }
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug('Phantom onboarding: Submit clicked');

  await (
    await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Continue")`, { timeout: TEST_TIMEOUTS.ELEMENT })
  ).click();
  logger.debug('Phantom onboarding: Continue clicked');

  await (
    await onboarding.waitForSelector(s.onboarding.password, { timeout: TEST_TIMEOUTS.ELEMENT })
  ).fill(WALLET_PASSWORD);
  await (
    await onboarding.waitForSelector(s.onboarding.confirmPassword, { timeout: TEST_TIMEOUTS.ELEMENT })
  ).fill(WALLET_PASSWORD);
  await (await onboarding.waitForSelector(s.onboarding.tosCheckbox, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug('Phantom onboarding: Password set');

  await (
    await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Get Started")`, {
      timeout: TEST_TIMEOUTS.ELEMENT,
    })
  ).click();
  logger.debug('Phantom onboarding: Get Started clicked');

  await onboarding.close().catch(() => {});
  logger.info('Phantom wallet setup complete');
}

export async function unlockPhantomWallet(context: BrowserContext, maxRetries = 3, retryDelay = 1000) {
  logger.step('Unlocking Phantom wallet');

  let page: Page | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      page = await openPhantomUrl(context, s.urls.unlock, 'domcontentloaded');
      logger.debug(`Phantom unlock page: ${page.url()}`);

      await (await page.waitForSelector(s.unlock.pw, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
      await (await page.waitForSelector(s.unlock.pwSubmit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
      logger.debug('Phantom unlock flow completed');
      await page.close().catch(() => {});
      logger.info('Phantom unlocked');
      return;
    } catch (err: unknown) {
      logger.debug(`Unlock attempt ${attempt}/${maxRetries} failed: ${(err as Error)?.message ?? err}`);
      try {
        await page?.close();
      } catch {
        // Swallow the error
      }
      if (attempt < maxRetries) {
        logger.debug(`Retrying in ${retryDelay}ms…`);
        await new Promise((r) => setTimeout(r, retryDelay));
      } else {
        logger.error(`Failed to unlock Phantom after ${maxRetries} attempts`);
        throw err;
      }
    }
  }
}

/**
 * Phantom usually shows a single “Approve/Connect” button.
 * In their UI it’s commonly data-testid="primary-button".
 * We also try visible “Approve”/“Connect” by role to be resilient.
 */
export async function handlePhantomPopup(context: BrowserContext) {
  logger.info('Waiting for Phantom popup…');
  const ph = await findPageWithUrl(context, s.urls.notification);

  if (!ph) {
    logger.warning('Phantom popup did not appear; assuming connected or silent approval');
    return;
  }

  try {
    logger.debug(`Phantom popup URL: ${ph.url()}`);

    // First try canonical test id:
    const primary = ph.getByTestId('primary-button');
    if (await primary.isVisible()) {
      await primary.click();
    } else {
      // Fallback to common labels:
      await clickAnyButton(ph, [/^Approve$/i, /^Connect$/i, /^Confirm$/i], 'Phantom connect flow');
    }

    await ph.close().catch(() => {});
    logger.info('Phantom popup handled');
  } catch (e: unknown) {
    logger.warning(`Phantom popup handling had issues: ${(e as Error)?.message ?? e}`);
    try {
      await ph.close();
    } catch {
      // Swallow the error
    }
  }
}

function extractId(u: string): string | null {
  const m = u.match(/^chrome-extension:\/\/([a-p]{32})\//);
  return m ? m[1] : null;
}

/**
 * Since you launch with ONLY Phantom loaded (disable-extensions-except + load-extension),
 * the first chrome-extension service worker is Phantom.
 */
export async function getPhantomId(ctx: BrowserContext, timeoutMs = TEST_TIMEOUTS.EXTENSIONS): Promise<string> {
  const existing = ctx.serviceWorkers().filter((w) => w.url().startsWith('chrome-extension://'));
  if (existing.length) {
    const id = extractId(existing[0].url());
    if (id) return id;
  }
  const sw = await ctx.waitForEvent('serviceworker', { timeout: timeoutMs });
  const id = extractId(sw.url());
  if (!id) throw new Error(`Phantom ID not found from SW url: ${sw.url()}`);
  return id;
}

/**
 * Opens a Phantom internal page. `urlOrTemplate` can be either:
 *  - A full chrome-extension URL with any ID (we'll replace the ID), or
 *  - A template with "{id}" placeholder, e.g. "chrome-extension://{id}/onboarding.html"
 */
export async function openPhantomUrl(
  ctx: BrowserContext,
  urlWithAnyId: string,
  waitUntil: 'load' | 'domcontentloaded' = 'load',
): Promise<Page> {
  const id = await getPhantomId(ctx);
  const url = urlWithAnyId.replace(/^chrome-extension:\/\/[^/]+/, `chrome-extension://${id}`);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil });
  // TODO: Optionally verify a selector to assert the page is truly ready.
  return page;
}
