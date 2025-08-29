// src/targets/wallets/metamask/flows.ts
import { chromium, BrowserContext, Page } from "@playwright/test";
import { METAMASK_EXT_PATH, USER_DATA_DIR, DAPP_URL } from "../../../config/constants";
import { SEED_PHRASE, WALLET_PASSWORD, assertMetamaskSecrets } from "./constants";
import { metamaskSelectors as s } from "./selectors";
import { findPageWithUrl } from "../../../utils/helpers/windows";
import { clickAnyButton } from "../../../utils/helpers/ui-helper";
import { logger } from "../../../utils/logger/logging-utils";
import { waitForExtensionPopup } from "../../dydx/flows";

/**
 * Launch a persistent context with the MetaMask extension loaded.
 */
export async function launchContextWithExtension(
  userDataSubdir = "metamask",
  headless = !!process.env.CI
): Promise<BrowserContext> {
  assertMetamaskSecrets();

  const context = await chromium.launchPersistentContext(`${USER_DATA_DIR}/${userDataSubdir}`, {
    headless,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      `--disable-extensions-except=${METAMASK_EXT_PATH}`,
      `--load-extension=${METAMASK_EXT_PATH}`,
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  // Reduce automation fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  return context;
}

/**
 * Run first-time onboarding: import SRP, set password, opt out of telemetry, etc.
 */
export async function setupWallet(context: BrowserContext) {
  // MetaMask uses dynamic extension URLs → use regex from selectors
  const onboarding = await findPageWithUrl(context, s.urls.onboarding);

  // 1) Welcome + ToS
  await onboarding.locator(s.onboarding.start).click();
  await onboarding.locator(s.onboarding.termsScroll).click();
  await onboarding.locator(s.onboarding.termsCheckbox).check();
  await onboarding.locator(s.onboarding.termsAgree).click();

  // 2) Import with SRP
  await onboarding.locator(s.onboarding.importWallet).click();
  await (await onboarding.waitForSelector(s.onboarding.importWithSrp, { timeout: 30_000 })).click();

  const srp = await onboarding.waitForSelector(s.onboarding.srpInput, { timeout: 30_000 });
  await srp.type(SEED_PHRASE);
  await (await onboarding.waitForSelector(s.onboarding.confirmSrp, { timeout: 30_000 })).click();

  // 3) Password
  await onboarding.locator(s.onboarding.pw).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwConfirm).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwTerms).click();
  await onboarding.locator(s.onboarding.pwSubmit).click();

  // 4) Telemetry → No thanks
  await (await onboarding.waitForSelector(s.onboarding.noThanks, { timeout: 30_000 })).click();

  // 5) Done
  await (await onboarding.waitForSelector(s.onboarding.done, { timeout: 30_000 })).click();

  // 6) Pin extension (optional)
  const pin = await onboarding.waitForSelector(s.onboarding.pinDone, { timeout: 30_000 }).catch(() => null);
  if (pin) await pin.click();

  // 7) “Solana on MetaMask” → Not now (if shown)
  const notNow = await onboarding.waitForSelector(s.onboarding.notNow, { timeout: 30_000 }).catch(() => null);
  if (notNow) await notNow.click();

  await onboarding.close();
}

/**
 * Open the dApp and wait for DOMContentLoaded.
 */
export async function openDapp(context: BrowserContext, url = DAPP_URL): Promise<Page> {
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  return page;
}

/**
 * Connect MetaMask to the dApp and approve prompts.
 */
export async function connect(page: Page, context: BrowserContext) {
  // 1) dApp → Connect with MetaMask
  await page.getByRole(s.dapp.connectBtn.role, { name: s.dapp.connectBtn.name }).click();
  await page.getByRole(s.dapp.pickMetamaskBtn.role, { name: s.dapp.pickMetamaskBtn.name }).click();

  // Approve initial connect
  const popup1 = await findPageWithUrl(context, s.urls.notification);
  await popup1.locator(s.popup.confirmBtn).click();
  await popup1.close();

  // 2) dApp → Send request (generate dYdX wallet)
  await page.getByRole(s.dapp.sendRequestBtn.role, { name: s.dapp.sendRequestBtn.name }).click();

  // Approve generation
  const popup2 = await findPageWithUrl(context, s.urls.notification);
  await popup2.locator(s.popup.confirmFooterBtn).click();
  await popup2.close();

  // 3) Compatibility prompt (approve)
  const popup3 = await findPageWithUrl(context, s.urls.notification);
  await popup3.locator(s.popup.confirmFooterBtn).click();
  await popup3.close();
}

/**
 * MetaMask connection popup flows vary slightly by version/permissions.
 * We try a short sequence of common buttons: Next → Connect → Approve.
 * (If a Sign prompt appears later during auth, handle it in your auth flow.)
 */
export async function handleMetaMaskPopup(context: BrowserContext) {
  logger.info("Waiting for MetaMask popup…");
  const mm = await waitForExtensionPopup(context);

  if (!mm) {
    logger.warning("MetaMask popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
    // Some builds show a "MetaMask Notification" title, others keep it blank.
    logger.debug(`MetaMask popup URL: ${mm.url()}`);

    // Defensive: click the common flow buttons if present
    await clickAnyButton(mm, [/^Next$/, /^Connect$/, /^Approve$/], "MetaMask connect flow");

    // Close if MetaMask leaves the window open
    await mm.close().catch(() => {});
    logger.info("MetaMask popup handled");
  } catch (e: any) {
    logger.warning(`MetaMask popup handling had issues: ${e?.message ?? e}`);
    try { await mm.close(); } catch {}
  }
}