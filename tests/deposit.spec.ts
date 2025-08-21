import { phantomTest, expect, phantomPopupConfirmation, walletConnectPhantom } from "../fixtures";

phantomTest("Regular deposit flow with Phantom Wallet", async ({ dappPage, context }) => {
  phantomTest.setTimeout(600_000);
  
  // 1. Navigate to dydx.trade and handle wallet injection popup
  await phantomPopupConfirmation(context, () => dappPage.goto('https://dydx.trade/trade/BTC-USD'), "navigation");

  // 2. Wallet connection
  await walletConnectPhantom(dappPage, context);

  // 3. Deposit flow
  await dappPage.getByRole('button', { name: /^dydx.*/ }).click();
  await dappPage.getByRole('menu', { name: /^dydx.*/ }).getByRole('button').nth(2).click();
  await dappPage.locator('div:has-text("Amount")').locator('input[placeholder="0.00"]').click();
  await dappPage.locator('div:has-text("Amount")').locator('input[placeholder="0.00"]').fill('10');
  
  console.log("⏳ Waiting for 'Deposit funds' button to be ready...");
  await expect(dappPage.getByRole('button', { name: 'Deposit funds' })).toBeVisible({ timeout: 20_000 });
  console.log("✅ 'Deposit funds' button is ready");
  await phantomPopupConfirmation(context, () => dappPage.getByRole('button', { name: 'Deposit funds' }).click(), "deposit transaction");
  
  // 4. Wait for deposit to complete
  console.log("⏳ Waiting for deposit to process (this should not take more than 5 minutes)...");

  try {
    await expect(
      dappPage.locator('div')
        .filter({ hasText: /^Deposit completedYour funds are now available for trading\.$/ })
        .first()
    ).toBeVisible({ timeout: 300_000 });
    
    console.log("✅ Deposit completed successfully");
    
  } catch (error) {
    console.log("❌ Deposit did not complete within 2 minutes - likely performance issue");
    throw error;
  }
});