// tests/fixtures.ts
import { chromium, test as base } from '@playwright/test';
import { findPageWithUrl } from './helpers';
import { PHANTOM_EXT_PATH, USER_DATA_DIR, DAPP_URL, PHANTOM_EXT_ID } from './constants';

export const phantomTest = base.extend<{
  context: import('@playwright/test').BrowserContext;
  dappPage: import('@playwright/test').Page;
}>({
  context: async ({}, use) => {
    console.log('➜ Loading Phantom extension from:', PHANTOM_EXT_PATH);

    // Create persistent browser context with Phantom extension
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${PHANTOM_EXT_PATH}`,
        `--load-extension=${PHANTOM_EXT_PATH}`,
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    await context.addInitScript(() => {
      // Prevent websites from detecting automation by overriding navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.log('🔧 Setting up Phantom wallet...');
    await setupPhantomWallet(context);

    // Make the context available to the test
    await use(context);
    await context.close();
  },

  dappPage: async ({ context }, use) => {
    // Get the first page from the context for the test
    const [page] = context.pages();

    // Navigate to the DApp URL and wait for it to load
    await page.goto(DAPP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await connectPhantomWallet(page, context);

    // Make the loaded page available to the test
    await use(page);
  },
});

// Helper function to setup Phantom wallet
async function setupPhantomWallet(context: any) {
  console.log('🔧 Starting Phantom wallet setup...');

  const phantomWalletOnboarding = await context.newPage();
  await phantomWalletOnboarding.goto(`chrome-extension://${PHANTOM_EXT_ID}/onboarding.html`);

  console.log('📋 Step 1: Click I already have a wallet and Import Recovery Phrase');
  await phantomWalletOnboarding.locator('text="I already have a wallet"').click();
  await phantomWalletOnboarding.locator('text="Import Recovery Phrase"').click();

  console.log('📋 Step 2: Fill in seed phrase');
  const seedPhrase = process.env.SEED_PHRASE?.split(' ') || [];
  for (let i = 0; i < 12; i++) {
    await phantomWalletOnboarding.getByTestId(`secret-recovery-phrase-word-input-${i}`).fill(seedPhrase[i]);
  }
  await phantomWalletOnboarding.getByTestId('onboarding-form-submit-button').click();
  const continueButton = await phantomWalletOnboarding.waitForSelector(
    '[data-testid="onboarding-form-submit-button"]:has-text("Continue")',
    {
      timeout: 30000,
    }
  );
  await continueButton.click();

  console.log('📋 Step 3: Fill in password, confirm password and check the terms of service checkbox');
  await phantomWalletOnboarding.getByTestId('onboarding-form-password-input').fill(process.env.WALLET_PASSWORD!);
  await phantomWalletOnboarding
    .getByTestId('onboarding-form-confirm-password-input')
    .fill(process.env.WALLET_PASSWORD!);
  await phantomWalletOnboarding.getByTestId('onboarding-form-terms-of-service-checkbox').click();
  await phantomWalletOnboarding.getByTestId('onboarding-form-submit-button').click();

  console.log('📋 Step 4: Click Get Started');
  const getStartedButton = await phantomWalletOnboarding.waitForSelector(
    '[data-testid="onboarding-form-submit-button"]:has-text("Get Started")',
    { timeout: 30000 }
  );
  await getStartedButton.click();

  await phantomWalletOnboarding.close();
  console.log('✅ Phantom wallet setup completed successfully');
}

// Connects to the Phantom wallet on the dApp page
async function connectPhantomWallet(dappPage: any, context: any) {
  console.log('🚀 Starting Phantom wallet connection...');

  console.log('📋 Step 1: Initial connection prompt');
  const phantomPopup1 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup1.getByTestId('primary-button').click();
  await phantomPopup1.close();

  console.log('📋 Step 2: Choosing Solana wallet');
  await dappPage.getByRole('button', { name: 'Connect wallet' }).click();
  await dappPage.getByRole('button', { name: 'Phantom (Solana)' }).click();
  await dappPage.getByRole('button', { name: 'Send request' }).click();

  console.log('📋 Step 3: Generating dYdX Chain wallet');
  const phantomPopup2 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup2.getByTestId('primary-button').click();
  await phantomPopup2.close();

  console.log('📋 Step 4: Verifying wallet compatibility');
  const phantomPopup3 = await findPageWithUrl(context, `chrome-extension://${PHANTOM_EXT_ID}/notification.html`);
  await phantomPopup3.getByTestId('primary-button').click();
  await phantomPopup3.close();

  console.log('✅ Phantom wallet connection completed');
}
