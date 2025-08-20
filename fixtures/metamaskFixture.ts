// tests/fixtures.ts
import { chromium, test as base } from '@playwright/test';
import { findPageWithUrl } from './helpers';
import { METAMASK_EXT_PATH, USER_DATA_DIR, DAPP_URL, METAMASK_EXT_ID } from './constants';

export const metamaskTest = base.extend<{
  context: import('@playwright/test').BrowserContext;
  dappPage: import('@playwright/test').Page;
}>({
  context: async ({}, use) => {
    console.log('➜ Loading Metamask extension from:', METAMASK_EXT_PATH);

    // Create persistent browser context with Phantom extension
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        `--disable-extensions-except=${METAMASK_EXT_PATH}`,
        `--load-extension=${METAMASK_EXT_PATH}`,
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

    console.log('🔧 Setting up Metamask wallet...');
    await setupMetamaskWallet(context);

    // Make the context available to the test
    await use(context);
    await context.close();
  },

  dappPage: async ({ context }, use) => {
    // Get the first page from the context for the test
    const [page] = context.pages();

    // Navigate to the DApp URL and wait for it to load
    await page.goto(DAPP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await connectMetamaskWallet(page, context);

    // Make the loaded page available to the test
    await use(page);
  },
});

// Helper function to setup Metamask wallet
async function setupMetamaskWallet(context: any) {
  console.log('🔧 Starting Metamask wallet setup...');

  // MetaMask has use_dynamic_url enabled, so we need to find the page with an arbitrary ID
  const metamaskWalletOnboarding = await findPageWithUrl(
    context,
    /chrome-extension:\/\/.*\/home\.html#onboarding\/welcome/
  );

  console.log('📋 Step 1: Click Get Started and agree to the terms of service');
  await metamaskWalletOnboarding.getByTestId('onboarding-get-started-button').click();
  await metamaskWalletOnboarding.getByTestId('terms-of-use-scroll-button').click();
  await metamaskWalletOnboarding.locator('[id="terms-of-use__checkbox"]').check();
  await metamaskWalletOnboarding.getByTestId('terms-of-use-agree-button').click();

  console.log('📋 Step 2: Click Import Recovery Phrase and enter the seed phrase');
  await metamaskWalletOnboarding.locator('[data-testid="onboarding-import-wallet"]').click();
  const importSRPButton = await metamaskWalletOnboarding.waitForSelector(
    '[data-testid="onboarding-import-with-srp-button"]',
    {
      timeout: 30000,
    }
  );
  await importSRPButton.click();
  const seedPhraseInput = await metamaskWalletOnboarding.waitForSelector('[data-testid="srp-input-import__srp-note"]', {
    timeout: 30000,
  });
  await seedPhraseInput.type(process.env.SEED_PHRASE!);
  const confirmSRPButton = await metamaskWalletOnboarding.waitForSelector('[data-testid="import-srp-confirm"]', {
    timeout: 30000,
  });
  await confirmSRPButton.click();

  console.log('📋 Step 3: Set up password');
  await metamaskWalletOnboarding.getByTestId('create-password-new-input').fill(process.env.WALLET_PASSWORD!);
  await metamaskWalletOnboarding.getByTestId('create-password-confirm-input').fill(process.env.WALLET_PASSWORD!);
  await metamaskWalletOnboarding.getByTestId('create-password-terms').click();
  await metamaskWalletOnboarding.getByTestId('create-password-submit').click();

  console.log('📋 Step 4: Not Sharing MM metrics');
  const noThanksButton = await metamaskWalletOnboarding.waitForSelector('[data-testid="metametrics-no-thanks"]', {
    timeout: 30000,
  });
  await noThanksButton.click();

  console.log('📋 Step 5: Click Done');
  const doneButton = await metamaskWalletOnboarding.waitForSelector('[data-testid="onboarding-complete-done"]', {
    timeout: 30000,
  });
  await doneButton.click();

  console.log('📋 Step 6: Pin extension');
  const pinExtensionButton = await metamaskWalletOnboarding.waitForSelector('[data-testid="pin-extension-done"]', {
    timeout: 30000,
  });
  await pinExtensionButton.click();

  console.log('📋 Step 7: Solana on MetaMask - Not now');
  const notNowButton = await metamaskWalletOnboarding.waitForSelector('[data-testid="not-now-button"]', {
    timeout: 30000,
  });
  await notNowButton.click();

  await metamaskWalletOnboarding.close();
  console.log('✅ Metamask wallet setup completed successfully');
}

// Connects to the Phantom wallet on the dApp page
async function connectMetamaskWallet(dappPage: any, context: any) {
  console.log('🚀 Starting Metamask wallet connection...');

  console.log('📋 Step 1: Connecting MetaMask to dYdX');
  await dappPage.getByRole('button', { name: 'Connect wallet' }).click();
  await dappPage.getByRole('button', { name: 'MetaMask MetaMask' }).click();
  const metamaskPopup1 = await findPageWithUrl(context, /chrome-extension:\/\/.*\/notification\.html/);
  await metamaskPopup1.getByTestId('confirm-btn').click();
  await metamaskPopup1.close();

  console.log('📋 Step 2: Generating dYdX Chain wallet');
  await dappPage.getByRole('button', { name: 'Send request' }).click();
  const metamaskPopup2 = await findPageWithUrl(context, /chrome-extension:\/\/.*\/notification\.html/);
  await metamaskPopup2.getByTestId('confirm-footer-button').click();
  await metamaskPopup2.close();

  console.log('📋 Step 3: Verifying wallet compatibility');
  const metamaskPopup3 = await findPageWithUrl(context, /chrome-extension:\/\/.*\/notification\.html/);
  await metamaskPopup3.getByTestId('confirm-footer-button').click();
  await metamaskPopup3.close();

  console.log('✅ Metamask wallet connection completed');
}
