// tests/fixtures.ts
import { chromium, test as base } from "@playwright/test";
import { findPageWithUrl } from "./helpers";
import { PHANTOM_EXT_PATH, USER_DATA_DIR, DAPP_URL, PHANTOM_EXT_ID } from "./constants";


export const phantomTest = base.extend<{
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
    // Navigate to the DApp URL and wait for it to load
    //await page.goto(DAPP_URL);
    //await page.waitForLoadState('domcontentloaded', {timeout: 30000});

   //await connectPhantomWallet(page, context);
    
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

// Connects to the Phantom wallet on the dApp page
async function connectPhantomWallet(dappPage: any, context: any) {
  console.log("🚀 Starting Phantom wallet connection...");
  
  console.log("📋 Step 1: Initial connection prompt");
  const phantomPopup1 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup1.getByTestId('primary-button').click();
  await phantomPopup1.close(); // Close after use
  
  console.log("📋 Step 2: Choosing Solana wallet");
  await dappPage.getByRole('button', { name: 'Connect wallet' }).click();
  await dappPage.getByRole('button', { name: 'Phantom (Solana)' }).click();
  await dappPage.getByRole('button', { name: 'Send request' }).click();

  console.log("📋 Step 3: Generating dYdX Chain wallet");
  const phantomPopup2 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup2.getByTestId('primary-button').click();
  await phantomPopup2.close(); // Close after use

  console.log("📋 Step 4: Verifying wallet compatibility");
  const phantomPopup3 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup3.getByTestId('primary-button').click();
  await phantomPopup3.close(); // Close after use
  
  console.log("✅ Phantom wallet connection completed");
}
