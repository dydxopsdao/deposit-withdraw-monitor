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
   // Start tracing
   logger.info("Starting tracing");
   await ctx.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
  logger.debug(`openMetamaskPage: Starting with hashPath=${hashPath}, waitUntil=${waitUntil}, navTimeoutMs=${navTimeoutMs}, retries=${retries}, verifySelector=${verifySelector}`);
  
  logger.debug("openMetamaskPage: Getting MetaMask extension ID");
  const id   = await getMetamaskId(ctx);
  logger.debug(`openMetamaskPage: MetaMask extension ID: ${id}`);
  
  const base = `chrome-extension://${id}`;
  logger.debug(`openMetamaskPage: Base URL: ${base}`);
  
  logger.debug("openMetamaskPage: Picking entry file");
  const entry = pickEntryFile();
  logger.debug(`openMetamaskPage: Entry file: ${entry}`);

  const candidates = [
    `${base}/${entry}#${hashPath}`,
    `${base}/${entry}`,            // let MM route internally if hash not accepted
  ];
  logger.debug(`openMetamaskPage: Candidate URLs: ${JSON.stringify(candidates)}`);

  const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms));

  // Reuse any existing MM tab first
  logger.debug(`openMetamaskPage: Checking ${ctx.pages().length} existing pages for reusable MM tabs`);
  for (const p of ctx.pages()) {
    logger.debug(`openMetamaskPage: Checking page URL: ${p.url()}`);
    if (p.url().startsWith(`${base}/`)) {
      logger.debug(`openMetamaskPage: Found existing MM tab, attempting to reuse: ${p.url()}`);
      try {
        logger.debug(`openMetamaskPage: Navigating existing tab to: ${candidates[0]}`);
        await p.goto(candidates[0], { waitUntil, timeout: 30_000 }).catch(()=>{});
        logger.debug(`openMetamaskPage: Navigation completed for existing tab`);
        
        if (verifySelector) {
          logger.debug(`openMetamaskPage: Waiting for verify selector: ${verifySelector}`);
          await p.waitForSelector(verifySelector, { timeout: navTimeoutMs });
          logger.debug(`openMetamaskPage: Verify selector found on existing tab`);
        }
        
        logger.debug(`openMetamaskPage: Successfully reused existing tab: ${p.url()}`);
        return p;
      } catch (e: any) {
        logger.debug(`openMetamaskPage: Failed to reuse existing tab: ${e?.message ?? e}`);
      }
    }
  }

  logger.debug("openMetamaskPage: No reusable tabs found, creating new page");
  let lastErr:any;
  for (const url of candidates) {
    logger.debug(`openMetamaskPage: Trying URL candidate: ${url}`);
    
    for (let i = 1; i <= (retries + 1); i++) {
      logger.debug(`openMetamaskPage: Attempt ${i}/${retries + 1} for URL: ${url}`);
      
      // A) direct goto
      logger.debug(`openMetamaskPage: Trying direct goto method`);
      try {
        logger.debug(`openMetamaskPage: Creating new page for direct goto`);
        const a = await ctx.newPage();
        logger.debug(`openMetamaskPage: New page created, URL: ${a.url()}`);
        
        // Dump extensive execution context before navigation
        logger.debug(`openMetamaskPage: === EXECUTION CONTEXT DUMP ===`);
        logger.debug(`openMetamaskPage: Target URL: ${url}`);
        logger.debug(`openMetamaskPage: Page object type: ${typeof a}`);
        logger.debug(`openMetamaskPage: Page isClosed: ${a.isClosed()}`);
        logger.debug(`openMetamaskPage: Page URL before nav: ${a.url()}`);
        logger.debug(`openMetamaskPage: BrowserContext isConnected: ${!ctx.browser()?.isConnected || ctx.browser()?.isConnected()}`);
        logger.debug(`openMetamaskPage: BrowserContext pages count: ${ctx.pages().length}`);
        logger.debug(`openMetamaskPage: BrowserContext serviceWorkers count: ${ctx.serviceWorkers().length}`);
        logger.debug(`openMetamaskPage: Navigation options: waitUntil=${waitUntil}, timeout=30000`);
        logger.debug(`openMetamaskPage: Attempt ${i}/${retries + 1}, URL candidate ${candidates.indexOf(url) + 1}/${candidates.length}`);
        
        try {
          logger.debug(`openMetamaskPage: Page viewport: ${JSON.stringify(a.viewportSize())}`);
        } catch (e) {
          logger.debug(`openMetamaskPage: Failed to get viewport: ${e}`);
        }
        
        try {
          logger.debug(`openMetamaskPage: Browser version: ${ctx.browser()?.version()}`);
        } catch (e) {
          logger.debug(`openMetamaskPage: Failed to get browser version: ${e}`);
        }
        
        try {
          const allPages = ctx.pages();
          logger.debug(`openMetamaskPage: All context pages: ${JSON.stringify(allPages.map(p => ({ url: p.url(), isClosed: p.isClosed() })))}`);
        } catch (e) {
          logger.debug(`openMetamaskPage: Failed to enumerate pages: ${e}`);
        }
        
        try {
          const sws = ctx.serviceWorkers();
          logger.debug(`openMetamaskPage: Service workers: ${JSON.stringify(sws.map(sw => sw.url()))}`);
        } catch (e) {
          logger.debug(`openMetamaskPage: Failed to enumerate service workers: ${e}`);
        }
        
        logger.debug(`openMetamaskPage: === END CONTEXT DUMP ===`);
        
        logger.debug(`openMetamaskPage: Navigating to: ${url}`);
        await a.goto(url, { waitUntil, timeout: 30_000 }); // don't wait forever
        logger.debug(`openMetamaskPage: Direct navigation completed to: ${a.url()}`);
        
        if (verifySelector) {
          logger.debug(`openMetamaskPage: Waiting for verify selector: ${verifySelector}`);
          await a.waitForSelector(verifySelector, { timeout: navTimeoutMs });
          logger.debug(`openMetamaskPage: Verify selector found via direct goto`);
        }
        
        logger.debug(`openMetamaskPage: Direct goto successful, returning page: ${a.url()}`);
        return a;
      } catch (e:any) { 
        lastErr = e; 
        logger.debug(`openMetamaskPage: Direct goto failed: ${e?.message ?? e}`);
      }

      // B) window.open fallback (often fixes CI/Xvfb)
      logger.debug(`openMetamaskPage: Trying window.open fallback method`);
      try {
        logger.debug(`openMetamaskPage: Creating opener page for window.open`);
        const opener = await ctx.newPage();
        logger.debug(`openMetamaskPage: Opener page created, navigating to data URL`);
        
        await opener.goto("data:text/html,<html></html>", { waitUntil: "load", timeout: 5_000 });
        logger.debug(`openMetamaskPage: Opener page ready, setting up page event listener`);
        
        const newPage = ctx.waitForEvent("page", { timeout: navTimeoutMs });
        logger.debug(`openMetamaskPage: Executing window.open for: ${url}`);
        await opener.evaluate(u => window.open(u, "_blank"), url);
        
        logger.debug(`openMetamaskPage: Waiting for new page from window.open`);
        const b = await newPage;
        logger.debug(`openMetamaskPage: New page received from window.open: ${b.url()}`);
        
        logger.debug(`openMetamaskPage: Waiting for load state: ${waitUntil}`);
        await b.waitForLoadState(waitUntil, { timeout: 30_000 }).catch(()=>{});
        logger.debug(`openMetamaskPage: Load state achieved for window.open page`);
        
        if (verifySelector) {
          logger.debug(`openMetamaskPage: Waiting for verify selector: ${verifySelector}`);
          await b.waitForSelector(verifySelector, { timeout: navTimeoutMs });
          logger.debug(`openMetamaskPage: Verify selector found via window.open`);
        }
        
        logger.debug(`openMetamaskPage: Closing opener page`);
        await opener.close().catch(()=>{});
        logger.debug(`openMetamaskPage: Window.open successful, returning page: ${b.url()}`);
        return b;
      } catch (e:any) { 
        lastErr = e; 
        logger.debug(`openMetamaskPage: Window.open fallback failed: ${e?.message ?? e}`);
      }

      if (i <= retries) {
        logger.debug(`openMetamaskPage: Sleeping ${retryDelayMs}ms before retry ${i + 1}`);
        await sleep(retryDelayMs);
      }
    }
    logger.debug(`openMetamaskPage: All attempts failed for URL: ${url}, trying next candidate`);
  }

  logger.debug(`openMetamaskPage: All URL candidates and retries exhausted, throwing error`);
  throw new Error(`Failed to open MetaMask UI (last error: ${lastErr?.message ?? lastErr})`);
}

function pickEntryFile(): string {
  const candidates = ["home.html", "index.html", "popup.html", "notification.html"];
  for (const f of candidates) {
    if (fs.existsSync(path.join(METAMASK_EXT_PATH, f))) return f;
  }
  throw new Error(`MetaMask entry not found in ${METAMASK_EXT_PATH} (tried home.html, index.html, popup.html, notification.html)`);
}