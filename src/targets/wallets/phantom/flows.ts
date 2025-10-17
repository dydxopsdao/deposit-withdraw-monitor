// src/targets/wallets/phantom/flows.ts
import { chromium, BrowserContext, Page } from '@playwright/test';
import { PHANTOM_EXT_PATH } from "../../../config/constants";
import { WALLET_PASSWORD, assertPhantomSecrets } from "./constants";
import { clickAnyButton, isVisible } from '../../../utils';
import { logger } from '../../../logger';
import { phantomSelectors as s } from './selectors';
import { TEST_TIMEOUTS } from "../../../config/timeouts";


/**
 * Launches Chromium with the Phantom extension side-loaded and automation tweaks.
 * @param userDataDir Persistent profile directory so extension state is kept.
 * @param headless Whether to run without a visible UI; defaults to CI heuristic.
 * @returns Browser context primed for interacting with Phantom.
 */
export async function launchContextWithExtension(
  userDataDir: string
): Promise<BrowserContext> {
  assertPhantomSecrets();

  const context = await chromium.launchPersistentContext(userDataDir, {
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
      '--start-maximized',
    ],
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  return context;
}

/**
 * Walks through Phantom's onboarding flow to import an existing wallet.
 * @param context Browser context with the Phantom extension loaded.
 * @param seedPhrase 12-word mnemonic used to restore the test wallet.
 * @returns Promise that resolves when onboarding is complete or skipped.
 */
export async function setupWallet(context: BrowserContext, seedPhrase: string) {
  logger.step("Setting up Phantom wallet");

  // deterministically open onboarding
  const onboarding = await openPhantomUrl(context, s.urls.onboarding, "domcontentloaded");
  logger.debug(`Phantom onboarding page: ${onboarding.url()}`);

  try {
    await (await onboarding.waitForSelector(s.onboarding.alreadyHaveWallet, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
    logger.debug("Phantom onboarding: Already have wallet clicked");
  } catch {
    // Likely already onboarded
    await onboarding.close().catch(() => {});
    logger.info("Phantom onboarding skipped (already onboarded)");
    return;
  }

  await (await onboarding.waitForSelector(s.onboarding.importRecovery, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Import Recovery clicked");

  const words = seedPhrase.split(" ").filter(Boolean);
  for (let i = 0; i < 12; i++) {
    await onboarding.locator(s.onboarding.seedInput(i)).fill(words[i] ?? "");
  }
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Submit clicked");

  await (await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Continue")`, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Continue clicked");

  await (await onboarding.waitForSelector(s.onboarding.password, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
  await (await onboarding.waitForSelector(s.onboarding.confirmPassword, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
  await (await onboarding.waitForSelector(s.onboarding.tosCheckbox, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  await (await onboarding.waitForSelector(s.onboarding.submit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Password set");
  
  await (await onboarding.waitForSelector(`${s.onboarding.submit}:has-text("Get Started")`, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("Phantom onboarding: Get Started clicked");
  logger.debug(`----------ctx.pages(): ${context.pages().map(p => p.url()).join(', ')}`);
  await new Promise(resolve => setTimeout(resolve, 10000));
  logger.debug(`----------ctx.pages(): ${context.pages().map(p => p.url()).join(', ')}`);
  logger.info("Phantom wallet setup complete");
}

/**
 * Opens the Phantom unlock page and retries entering the password if needed.
 * @param context Browser context that should contain the extension UI.
 * @param maxRetries Number of attempts before surfacing an error.
 * @param retryDelay Delay between attempts so the UI can settle.
 * @returns Promise that resolves once the wallet is unlocked.
 */
export async function unlockPhantomWallet(
  context: BrowserContext,
  maxRetries = 3,
  retryDelay = 1000
) {
  logger.step("Unlocking Phantom wallet");

  let page: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      page = await openPhantomUrl(context, s.urls.unlock, "domcontentloaded");
      logger.debug(`Phantom unlock page: ${page.url()}`);

      await (await page.waitForSelector(s.unlock.pw, { timeout: TEST_TIMEOUTS.ELEMENT })).fill(WALLET_PASSWORD);
      await (await page.waitForSelector(s.unlock.pwSubmit, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
      logger.debug("Phantom unlock flow completed");
      await page.close().catch(() => {});
      logger.info("Phantom unlocked");
      return;
    } catch (err: any) {
      logger.debug(`Unlock attempt ${attempt}/${maxRetries} failed: ${err?.message ?? err}`);
      try { await page?.close(); } catch {}
      if (attempt < maxRetries) {
        logger.debug(`Retrying in ${retryDelay}ms…`);
        await new Promise(r => setTimeout(r, retryDelay));
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
 * @param context Browser context that will surface the popup window.
 * @returns Promise that resolves once the popup is handled or dismissed.
 */
export async function handlePhantomPopup(context: BrowserContext) {
  logger.info("Waiting for Phantom popup…");
  const ph = await findPhantomPage(
    context,
    [s.urls.notification, s.urls.unlock],
    "domcontentloaded",
    TEST_TIMEOUTS.POPUP_TIMEOUT
  );

  if (!ph) {
    logger.warning("Phantom popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
    logger.debug(`Phantom popup URL: ${ph.url()}`);

    // First try canonical test id:
    const primary = ph.getByTestId("primary-button");
    if (await isVisible(primary)) {
      await primary.click();
    } else {
      // Fallback to common labels:
      await clickAnyButton(ph, [/^Approve$/i, /^Connect$/i, /^Confirm$/i], "Phantom connect flow");
    }

    await ph.close().catch(() => {});
    logger.info("Phantom popup handled: successfull clicked");
  } catch (e: any) {
    logger.warning(`Phantom popup handling had issues: ${e?.message ?? e}`);
    try { await ph.close(); } catch {}
  }
}

function extractId(u: string): string | null {
  const m = u.match(/^chrome-extension:\/\/([a-p]{32})\//);
  return m ? m[1] : null;
}

function replaceExtensionId(url: string, id: string): string {
  const withPlaceholder = url.includes("{id}") ? url.replace("{id}", id) : url;
  if (withPlaceholder.startsWith("chrome-extension://")) {
    return withPlaceholder.replace(/^chrome-extension:\/\/[^/]+/, `chrome-extension://${id}`);
  }
  return withPlaceholder;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function urlPattern(url: string): RegExp {
  try {
    const u = new URL(url);
    const origin = u.origin === "null"
      ? `${u.protocol}//${u.host}`
      : u.origin;
    const base = `${origin}${u.pathname}`;
    return new RegExp(`^${escapeRegex(base)}(?:[?#].*)?$`, "i");
  } catch {
    return new RegExp(`^${escapeRegex(url)}(?:[?#].*)?$`, "i");
  }
}

function safeUrl(page: Page): string {
  try {
    return page.url();
  } catch {
    return "";
  }
}

async function findPhantomPage(
  ctx: BrowserContext,
  urlTemplates: string[],
  waitUntil: "load" | "domcontentloaded",
  timeoutMs = 0,
  idOverride?: string
): Promise<Page | null> {
  const id = idOverride ?? await getPhantomId(ctx);
  const urls = urlTemplates.map((template) => replaceExtensionId(template, id));
  const patterns = urls.map(urlPattern);
  const matches = (page: Page): boolean => {
    const currentUrl = safeUrl(page);
    logger.debug(`current URL: ${currentUrl}`);
    logger.debug(`All pages: ${ctx.pages().map(p => safeUrl(p)).join(", ")}`);
    return !!currentUrl && patterns.some((rx) => rx.test(currentUrl));
  };

  for (const page of ctx.pages()) {
    if (!matches(page)) continue;
    try {
      await page.waitForLoadState(waitUntil);
    } catch (err) {
      logger.warning(`Phantom page wait failed (${waitUntil}): ${(err as Error).message}`);
    }
    try {
      await page.bringToFront();
    } catch { /* bringToFront can fail for panels; ignore */ }
    return page;
  }

  if (timeoutMs <= 0) return null;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = Math.max(0, deadline - Date.now());
    try {
      const page = await ctx.waitForEvent("page", { timeout: remaining });
      if (!matches(page)) continue;
      try {
        await page.waitForLoadState(waitUntil);
      } catch (err) {
        logger.warning(`Phantom page wait failed (${waitUntil}): ${(err as Error).message}`);
      }
      try {
        await page.bringToFront();
      } catch { /* ignore */ }
      return page;
    } catch {
      break;
    }
  }

  const extensionOrigin = `chrome-extension://${id}/`;
  const fallback = ctx.pages().find((page) => safeUrl(page).startsWith(extensionOrigin));
  if (fallback) {
    logger.debug(`Phantom fallback matched via extension origin: ${safeUrl(fallback)}`);
    try {
      await fallback.waitForLoadState(waitUntil);
    } catch (err) {
      logger.warning(`Phantom fallback wait failed (${waitUntil}): ${(err as Error).message}`);
    }
    try {
      await fallback.bringToFront();
    } catch { /* ignore */ }
    return fallback;
  }

  return null;
}

/**
 * Since you launch with ONLY Phantom loaded (disable-extensions-except + load-extension),
 * the first chrome-extension service worker is Phantom.
 */
/**
 * Discovers the Phantom extension id by inspecting existing or new service workers.
 * @param ctx Browser context created via `launchContextWithExtension`.
 * @param timeoutMs How long to wait for a service worker to appear.
 * @returns The resolved extension id (32-char string).
 */
export async function getPhantomId(ctx: BrowserContext, timeoutMs = TEST_TIMEOUTS.EXTENSIONS): Promise<string> {
  const existing = ctx.serviceWorkers().filter(w => w.url().startsWith("chrome-extension://"));
  if (existing.length) {
    const id = extractId(existing[0].url());
    if (id) return id;
  }
  const sw = await ctx.waitForEvent("serviceworker", { timeout: timeoutMs });
  const id = extractId(sw.url());
  if (!id) throw new Error(`Phantom ID not found from SW url: ${sw.url()}`);
  return id;
}

/**
 * Opens a Phantom internal page. `urlOrTemplate` can be either:
 *  - A full chrome-extension URL with any ID (we'll replace the ID), or
 *  - A template with "{id}" placeholder, e.g. "chrome-extension://{id}/onboarding.html"
 */
/**
 * Opens a Chrome-extension URL inside the Phantom context, substituting the real id.
 * @param ctx Browser context running Phantom.
 * @param urlWithAnyId Chrome-extension URL or template containing `{id}` placeholder.
 * @param waitUntil Load state to wait for before returning.
 * @returns Newly opened Phantom page.
 */
export async function openPhantomUrl(
  ctx: BrowserContext,
  urlWithAnyId: string,
  waitUntil: "load" | "domcontentloaded" = "load"
): Promise<Page> {
  const id = await getPhantomId(ctx);
  const url = replaceExtensionId(urlWithAnyId, id);

  const existing = await findPhantomPage(ctx, [url], waitUntil, 1000, id);
  if (existing) {
    return existing;
  }

  const page = await ctx.newPage();
  await page.goto(url, { waitUntil });
  return page;
}
