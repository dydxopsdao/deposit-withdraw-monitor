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

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      `--disable-extensions-except=${METAMASK_EXT_PATH}`,
      `--load-extension=${METAMASK_EXT_PATH}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-infobars",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  // Reduce automation fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  logger.info("Starting tracing");
   // 🔴 Start tracing immediately (before any pages open)
   await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
  logger.debug(`METAMASK_EXT_PATH=${METAMASK_EXT_PATH}, exists=${fs.existsSync(METAMASK_EXT_PATH)}`);

  logger.debug(`service workers (pre): ${context.serviceWorkers().map(w => w.url()).join(",")}`);
  try {
    const sw = await context.waitForEvent("serviceworker", { timeout: TEST_TIMEOUTS.EXTENSIONS });
    logger.debug(`service worker (post): ${sw.url()}`);
  } catch { }

  logger.debug(`open pages: ${JSON.stringify(context.pages().map(p => p.url()))}`);

  return context;
}

/**
 * Run first-time onboarding: import SRP, set password, opt out of telemetry, etc.
 */
export async function setupWallet(context: BrowserContext, seedPhrase: string) {
  logger.step("Setting up MetaMask wallet");

  // deterministically open the UI (don’t wait for it to appear)
  const onboarding = await openMetamaskPage(context, "onboarding/welcome", {
    waitUntil: "domcontentloaded",
    navTimeoutMs: 60_000,
    retries: 2,
    retryDelayMs: 800,
    verifySelector: s.onboarding.start,  // first actionable element
  });
  logger.debug(`MetaMask onboarding page: ${onboarding.url()}`);
  // Welcome and Terms of Service
  await onboarding.locator(s.onboarding.start).click();
  await onboarding.locator(s.onboarding.termsScroll).click();
  await onboarding.locator(s.onboarding.termsCheckbox).check();
  await onboarding.locator(s.onboarding.termsAgree).click();
  logger.debug("MetaMask onboarding: Terms of Service accepted");

  // Import with Secret Recovery Phrase
  await onboarding.locator(s.onboarding.importWallet).click();
  await (await onboarding.waitForSelector(s.onboarding.importWithSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("MetaMask onboarding: SRP input field found");

  const srp = await onboarding.waitForSelector(s.onboarding.srpInput, { timeout: TEST_TIMEOUTS.ELEMENT });
  await srp.type(seedPhrase);
  logger.debug("MetaMask onboarding: SRP input field filled");

  await (await onboarding.waitForSelector(s.onboarding.confirmSrp, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("MetaMask onboarding: SRP confirmation button clicked");

  // Set Password
  await onboarding.locator(s.onboarding.pw).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwConfirm).fill(WALLET_PASSWORD);
  await onboarding.locator(s.onboarding.pwTerms).click();
  await onboarding.locator(s.onboarding.pwSubmit).click();
  logger.debug("MetaMask onboarding: Password set");

  // Telemetry → No thanks (optional)
  const noThanks = await onboarding.waitForSelector(s.onboarding.noThanks, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (noThanks) {
    logger.debug("MetaMask onboarding: Telemetry → No thanks (optional)");
    await noThanks.click();
  }
  // Click Done
  await (await onboarding.waitForSelector(s.onboarding.done, { timeout: TEST_TIMEOUTS.ELEMENT })).click();
  logger.debug("MetaMask onboarding: Done button clicked");

  const downloadAppContinue = await onboarding.waitForSelector(s.onboarding.downloadAppContinue, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (downloadAppContinue) {
    logger.debug("MetaMask onboarding: Telemetry → download app continue");
    await downloadAppContinue.click();
  }
  // Pin extension suggestion → Done (optional)
  const pin = await onboarding.waitForSelector(s.onboarding.pinDone, { timeout: TEST_TIMEOUTS.ELEMENT }).catch(() => null);
  if (pin) {
    logger.debug("MetaMask onboarding: Pin extension suggestion → Done (optional)");
    await pin.click();
  }

  await onboarding.close();
  logger.info("Wallet setup complete");
}


export async function unlockMetamaskWallet(context: BrowserContext) {
  logger.step("Unlocking MetaMask wallet");
  // MetaMask uses dynamic extension URLs → use regex from selectors
  const unlock = await findPageWithUrl(context, s.urls.unlock); 
  //TODO this is failing sometimes on the URL pattern /chrome-extension:\/\/.*\/home\.html#unlock/ vs chrome-extension://gipjnhcfkablljbiijlkcohbaniiimdi/home.html#onboarding/unlock
  if (!unlock) {
    logger.warning("MetaMask unlock page not found ");
  } else {
  logger.debug(`MetaMask unlock page: ${unlock.url()}`);
  
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

  const mm = await findPageWithUrl(context, s.urls.notification);

  if (!mm) {
    logger.warning("MetaMask popup did not appear; assuming connected or silent approval");
    return;
  }

  try {
    // Some builds show a "MetaMask Notification" title, others keep it blank.
    logger.debug(`MetaMask popup URL: ${mm.url()}`);
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

export async function getMetamaskId(ctx: BrowserContext, timeoutMs = 15000): Promise<string> {
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
  {
    waitUntil = "domcontentloaded",
    navTimeoutMs = 90_000,
    verifySelector,
    retries = 2,
    retryDelayMs = 800,
  }: {
    waitUntil?: "load" | "domcontentloaded";
    navTimeoutMs?: number;
    verifySelector?: string;
    retries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<Page> {
  const id   = await getMetamaskId(ctx); // your existing SW-based resolver
  const base = `chrome-extension://${id}`;
  const entry = pickEntryFile();

  const candidates = [
    `${base}/${entry}#${hashPath}`,
    `${base}/${entry}`,            // let MM route internally if hash not accepted
  ];

  const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

  // Reuse any existing MM tab first
  for (const p of ctx.pages()) {
    if (p.url().startsWith(`${base}/`)) {
      try {
        await p.goto(candidates[0], { waitUntil, timeout: 30_000 }).catch(()=>{});
        if (verifySelector) await p.waitForSelector(verifySelector, { timeout: navTimeoutMs });
        return p;
      } catch {}
    }
  }

  let lastErr:any;
  for (const url of candidates) {
    for (let i = 1; i <= (retries + 1); i++) {
      // A) direct goto
      try {
        const a = await ctx.newPage();
        await a.goto(url, { waitUntil, timeout: 30_000 }); // don’t wait forever
        if (verifySelector) await a.waitForSelector(verifySelector, { timeout: navTimeoutMs });
        return a;
      } catch (e:any) { lastErr = e; }

      // B) window.open fallback (often fixes CI/Xvfb)
      try {
        const opener = await ctx.newPage();
        await opener.goto("data:text/html,<html></html>", { waitUntil: "load", timeout: 5_000 });
        const newPage = ctx.waitForEvent("page", { timeout: navTimeoutMs });
        await opener.evaluate(u => window.open(u, "_blank"), url);
        const b = await newPage;
        await b.waitForLoadState(waitUntil, { timeout: 30_000 }).catch(()=>{});
        if (verifySelector) await b.waitForSelector(verifySelector, { timeout: navTimeoutMs });
        await opener.close().catch(()=>{});
        return b;
      } catch (e:any) { lastErr = e; }

      if (i <= retries) await sleep(retryDelayMs);
    }
  }

  throw new Error(`Failed to open MetaMask UI (last error: ${lastErr?.message ?? lastErr})`);
}

function pickEntryFile(): string {
  const candidates = ["home.html", "index.html", "popup.html", "notification.html"];
  for (const f of candidates) {
    if (fs.existsSync(path.join(METAMASK_EXT_PATH, f))) return f;
  }
  throw new Error(`MetaMask entry not found in ${METAMASK_EXT_PATH} (tried home.html, index.html, popup.html, notification.html)`);
}