import { test, expect } from '../fixtures';

const EXTENSION_ID = 'bfnaelmomeimhlpmgjnjophhpkkoljpa';
const DAPP_URL      = 'https://dydx.trade/portfolio/overview';

test.beforeEach(async ({ page }) => {
  
  await page.goto(DAPP_URL);
  await page.reload();
});

  test('Regular deposit flow', async ({ page, context }) => {
    
    //await page.locator('data-testid=connect-wallet-button').click();


    const phantomWallet = context.pages().find(p =>
      p.url().startsWith(`chrome-extension://${EXTENSION_ID}`)
    );
    if (!phantomWallet) throw new Error('Phantom popup not found');
  
    await phantomWallet.waitForLoadState();
    await phantomWallet.bringToFront();
    console.log('➜ Filling password');
    await phantomWallet.locator('data-testid=unlock-form-password-input').fill(process.env.WALLET_PASSWORD!);
    console.log('➜ Filled password'+ process.env.WALLET_PASSWORD!);
    await phantomWallet.pause();
    await phantomWallet.locator('data-testid=unlock-form-submit-button').click();
  });
