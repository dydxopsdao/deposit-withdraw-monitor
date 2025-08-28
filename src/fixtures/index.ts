// src/fixtures/index.ts
import fs from "fs";
import path from "path";
import { test as base, chromium, expect as pwExpect } from "@playwright/test";

export const test = base.extend({
  context: async ({}, use) => {
    const WALLET = (process.env.WALLET || "metamask").toLowerCase(); // metamask | phantom
    const EXT_DIR = process.env.EXT_DIR || path.join(process.cwd(), "extensions");
    const USER_DATA_DIR =
      process.env.USER_DATA_DIR || path.join(process.cwd(), "user-data", WALLET, "default");
    const PROFILE_MODE = (process.env.PROFILE_MODE || "baked").toLowerCase(); // 'baked' | 'hot'
    const HEADFUL = process.env.HEADFUL === "1";
    const DEBUG_PORT = process.env.DEBUG_PORT; // e.g. 9222

    // --- Preflight checks (clear errors instead of “failed at launch”) ---
    const extPath = path.resolve(EXT_DIR, WALLET);
    const manifest = path.join(extPath, "manifest.json");
    if (!fs.existsSync(manifest)) {
      throw new Error(
        `Wallet extension not found at ${manifest}. ` +
        `Set EXT_DIR correctly or mount extensions (e.g. -v "$PWD/extensions:/extensions:ro").`
      );
    }

    // USER_DATA_DIR must be absolute & writable
    const absProfile = path.resolve(USER_DATA_DIR);
    fs.mkdirSync(absProfile, { recursive: true });
    try { fs.accessSync(absProfile, fs.constants.W_OK); }
    catch {
      throw new Error(
        `USER_DATA_DIR not writable: ${absProfile}. ` +
        `If running in Docker, either omit --user or chown the mounted folder / use --user $(id -u):$(id -g).`
      );
    }

    // If you requested HEADFUL, ensure an X server exists (Xvfb/VNC sets DISPLAY)
    if (HEADFUL && !process.env.DISPLAY) {
      throw new Error(
        `HEADFUL=1 but no DISPLAY is set. Start Xvfb/VNC in your entry script, or run headless (HEADFUL=0).`
      );
    }

    // Build launch options
    const args: string[] = ["--disable-blink-features=AutomationControlled"];
    if (PROFILE_MODE === "hot") {
      // load unpacked wallet from EXT_DIR
      args.push(`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`);
    }
    if (DEBUG_PORT) {
      args.push("--remote-debugging-address=0.0.0.0", `--remote-debugging-port=${DEBUG_PORT}`);
    }

    // Remove defaults that block extensions. If you set a DEBUG_PORT, also drop the pipe so the port actually opens.
    const ignoreDefaultArgs = DEBUG_PORT
      ? ["--enable-automation", "--remote-debugging-pipe", "--disable-extensions"]
      : ["--enable-automation", "--disable-extensions"];

    // Nice-to-haves to avoid first-run noise
    args.push("--no-first-run", "--no-default-browser-check", "--password-store=basic");

    // --- Launch with strong error reporting ---
    let ctx;
    try {
      ctx = await chromium.launchPersistentContext(absProfile, {
        headless: !HEADFUL,
        ignoreDefaultArgs,
        args,
        // Uncomment if ever running as root without sandbox support:
        // chromiumSandbox: false,
      });
    } catch (e: any) {
      const msg = e?.message || String(e);
      // Common patterns -> actionable hints
      if (/X server/i.test(msg) || /no DISPLAY/i.test(msg)) {
        console.error("✖ Headed launch failed: no X server. Start Xvfb/VNC or set HEADFUL=0.");
      }
      if (/EACCES|permission denied/i.test(msg)) {
        console.error(`✖ Cannot write to USER_DATA_DIR: ${absProfile}. Check mount ownership or pass --user $(id -u):$(id -g).`);
      }
      if (/no such file or directory/i.test(msg) && /chrome|chromium/i.test(msg)) {
        console.error("✖ Chromium missing? You should be on the Playwright base image which already includes browsers.");
      }
      throw e;
    }

    await use(ctx);
    await ctx.close();
  },
});

export const expect = pwExpect;
