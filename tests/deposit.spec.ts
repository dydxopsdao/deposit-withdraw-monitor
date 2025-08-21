import { phantomTest, expect } from "../fixtures";

phantomTest("Regular deposit flow with Phantom Wallet", async ({ dappPage, context }) => {
  
  // Set test timeout to 5 minutes
  phantomTest.setTimeout(300_000);

  // Helper function to handle extension popups
  async function withExtensionPopup(context: any, action: () => any, description: string) {
    const pagePromise = context.waitForEvent('page', {
      predicate: page => page.url().startsWith('chrome-extension://'),
      timeout: 10000
    });
    
    await action(); // Execute the triggering action
    
    try {
      const extensionPage = await pagePromise;
      await extensionPage.waitForLoadState('domcontentloaded');
      await extensionPage.getByTestId('primary-button').click();
      await extensionPage.close();
      console.log(`✅ Handled ${description} popup`);
    } catch (error) {
      console.log(`⚠️ ${description} popup not found`);
    }
  }
  
  // 1. Navigate to dydx.trade and handle wallet injection popup
  await withExtensionPopup(context, () => dappPage.goto('https://dydx.trade/trade/BTC-USD'), "navigation");

  // 2. Wallet connection
  await dappPage.getByRole('banner').getByRole('button', { name: 'Connect wallet' }).click();
  await dappPage.getByRole('button', { name: 'Phantom (Solana)' }).click();
  await withExtensionPopup(context, () => dappPage.getByRole('button', { name: 'Send request' }).click(),"wallet connection");  

  // 3. Deposit flow
  await dappPage.getByRole('button', { name: /^dydx.*/ }).click();
  await dappPage.getByRole('menu', { name: /^dydx.*/ }).getByRole('button').nth(2).click();
  await dappPage.getByRole('textbox', { name: '0.00' }).click();
  await dappPage.getByRole('textbox', { name: '0.00' }).fill('10');
  
  console.log("⏳ Waiting for 'Deposit funds' button to be ready...");
  await expect(dappPage.getByRole('button', { name: 'Deposit funds' })).toBeVisible({ timeout: 15_000 });
  console.log("✅ 'Deposit funds' button is ready");
  await withExtensionPopup(context, () => dappPage.getByRole('button', { name: 'Deposit funds' }).click(),"deposit transaction");
  
  // 4. Wait for deposit to complete
  console.log("⏳ Waiting for deposit to process (this may take up to 2 minutes)...");
  await expect(
    dappPage.locator('div')
      .filter({ hasText: /^Deposit completedYour funds are now available for trading\.$/ })
      .first()
  ).toBeVisible({ timeout: 120_000 });

  console.log("✅ Deposit flow test completed");
});