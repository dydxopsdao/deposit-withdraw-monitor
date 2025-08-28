import fs from "fs";
import path from "path";
import { test as base, chromium, expect as pwExpect, BrowserContext } from "@playwright/test";

async function waitForExtension(ctx: BrowserContext, ms = 6000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const bg = ctx.backgroundPages().map(p => p.url());
    const sw = ctx.serviceWorkers().map(w => w.url());
    if (bg.some(u => u.startsWith("chrome-extension://")) || sw.some(u => u.startsWith("chrome-extension://"))) {
      console.log("[EXT] background pages:", bg);
      console.log("[EXT] service workers:", sw);
      return true;
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

export const test = base.extend({
  context: async ({}, use) => {
    const WALLET = (process.env.WALLET || "metamask").toLowerCase();
    const EXT_DIR = process.env.EXT_DIR || path.join(process.cwd(), "extensions");
    const USER_DATA_DIR = process.env.USER_DATA_DIR || path.join(process.cwd(), "user-data", WALLET, "default");
    const HEADFUL = process.env.HEADFUL === "1";
    const DEBUG_PORT = process.env.DEBUG_PORT;

    if (!HEADFUL) throw new Error("Extensions require headed Chromium. Set HEADFUL=1.");
    if (!process.env.DISPLAY) throw new Error("HEADFUL=1 but no DISPLAY set (Xvfb/VNC).");

    const extPath = path.resolve(EXT_DIR, WALLET);
    const manifest = path.join(extPath, "manifest.json");
    if (!fs.existsSync(manifest)) throw new Error(`Wallet extension not found at ${manifest}`);

    const absProfile = path.resolve(USER_DATA_DIR);
    fs.mkdirSync(absProfile, { recursive: true });
    fs.accessSync(absProfile, fs.constants.W_OK);

    const args = [
      "--disable-blink-features=AutomationControlled",
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--password-store=basic",
      ...(DEBUG_PORT ? ["--remote-debugging-address=0.0.0.0", `--remote-debugging-port=${DEBUG_PORT}`] : []),
    ];

    // Only drop the defaults that actually get in the way.
    const ignoreDefaultArgs = ["--enable-automation"]; // keep everything else (incl. dev-shm fixes)

    console.log("[LAUNCH] profile:", absProfile);
    console.log("[LAUNCH] ext:", extPath);
    console.log("[LAUNCH] args:", args);

    let ctx;
    try {
      ctx = await chromium.launchPersistentContext(absProfile, {
        headless: false,
        args,
        ignoreDefaultArgs,
        // If you ever run as root in CI and see sandbox errors, uncomment:
        // chromiumSandbox: false,
      });
    } catch (e: any) {
      console.error("[LAUNCH ERROR]", e?.message || e);
      throw e;
    }

    if (!(await waitForExtension(ctx, 6000))) {
      await ctx.close();
      throw new Error(`Wallet extension did not appear after launch from ${extPath}`);
    }

    await use(ctx);
    await ctx.close();
  },
});

export const expect = pwExpect;
