const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const wallet = process.argv[2]; // 'metamask' | 'phantom'
  const profileRel = process.argv[3];
  if (!wallet || !profileRel) {
    console.error("Usage: node scripts/open-profile.cjs <metamask|phantom> <profile-path>");
    process.exit(1);
  }

  const userDataDir = path.resolve(process.cwd(), profileRel);
  const extPath = path.resolve(process.cwd(), "extensions", wallet);

  console.log("Launching persistent Chromium with:");
  console.log("  user-data:", userDataDir);
  console.log("  extension:", extPath);

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      "--disable-infobars",
    ],
  });

  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto("chrome://version");

  console.log("\n👉 Chromium is open with the wallet extension loaded.");
  console.log("   Manually import the wallet (SRP), set password, finish onboarding.");
  console.log("   Close the window to save the profile.\n");
})();
