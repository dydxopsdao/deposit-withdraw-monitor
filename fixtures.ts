// tests/fixtures.ts
import { chromium, test } from "@playwright/test";
import path from "path";

export const USER_DATA_DIR = path.resolve(process.cwd(), "user-data");
export const DAPP_URL = "https://dydx.trade/portfolio/overview";

export const PHANTOM_EXT_PATH = path.resolve(
  process.cwd(),
  "extensions/phantom"
);
export const PHANTOM_EXT_ID = "bfnaelmomeimhlpmgjnjophhpkkoljpa";

// export const METAMASK_EXT_PATH = path.resolve(
// process.cwd(),
// "extensions/metamask"
//);
//export const METAMASK_EXT_ID = "nkbihfbeogaeaoehlefnkodbefgpgknn";

export const testWithPhantom = test.extend<{
  context: import("@playwright/test").BrowserContext;
  dappPage: import("@playwright/test").Page;
}>({
  context: async ({}, use) => {
    console.log("➜ Loading Phantom extension from:", PHANTOM_EXT_PATH);
    
    // Create persistent browser context with Phantom extension
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--disable-blink-features=AutomationControlled",
        `--disable-extensions-except=${PHANTOM_EXT_PATH}`,
        `--load-extension=${PHANTOM_EXT_PATH}`,
      ],
    });
    
    await context.addInitScript(() => {
      // Prevent websites from detecting automation by overriding navigator.webdriver
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    console.log("🔧 Setting up Phantom wallet...");
    await setupPhantomWallet(context);
    
    // Make the context available to the test
    await use(context);
    await context.close();
  },

  dappPage: async ({ context }, use) => {
    // Get the first page from the context for the test
    const [page] = context.pages();

    await page.pause();
    
    // Navigate to the DApp URL and wait for it to load
    await page.goto(DAPP_URL);
    await page.waitForLoadState('domcontentloaded');
    
    // Make the loaded page available to the test
    await use(page);
  },
});

// Helper function to setup Phantom wallet
async function setupPhantomWallet(context: any) {
  const phantomWalletOnboarding = await context.newPage();
  await phantomWalletOnboarding.goto(
    `chrome-extension://${PHANTOM_EXT_ID}/onboarding.html`
  );

  // Import Recovery Phrase
  await phantomWalletOnboarding
    .locator('text="I already have a wallet"')
    .click();
  await phantomWalletOnboarding
    .locator('text="Import Recovery Phrase"')
    .click();

  const seedPhrase = process.env.SEED_PHRASE?.split(" ") || [];
  for (let i = 0; i < 12; i++) {
    await phantomWalletOnboarding
      .locator(`[data-testid="secret-recovery-phrase-word-input-${i}"]`)
      .fill(seedPhrase[i]);
  }
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-submit-button"]')
    .click();

  // Wait for the "Import Accounts" screen to load and click Continue
  await phantomWalletOnboarding.waitForSelector('text="Import Accounts"', {
    timeout: 30000,
  });
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-submit-button"]')
    .click();

  // Fill in password, confirm password and check the terms of service checkbox
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-password-input"]')
    .fill(process.env.WALLET_PASSWORD!);
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-confirm-password-input"]')
    .fill(process.env.WALLET_PASSWORD!);
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-terms-of-service-checkbox"]')
    .click();
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-submit-button"]')
    .click();

  // Wait for all splash screens to finish and the final "Get Started" button to appear
  await phantomWalletOnboarding.waitForSelector(
    '[data-testid="onboarding-form-submit-button"]:has-text("Get Started")',
    { timeout: 30000 }
  );
  await phantomWalletOnboarding
    .locator('[data-testid="onboarding-form-submit-button"]')
    .click();

  await phantomWalletOnboarding.close();
  console.log("✅ Phantom wallet setup completed successfully");
}

export { expect } from "@playwright/test";
