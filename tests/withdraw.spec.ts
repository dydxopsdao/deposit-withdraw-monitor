import { phantomTest, expect, phantomPopupConfirmation, walletConnectPhantom } from "../fixtures";

phantomTest("Withdraw flow with Phantom Wallet", async ({ dappPage, context }) => {
  phantomTest.setTimeout(600_000);

  // 1. Navigate to dydx.trade and handle wallet injection popup
  await phantomPopupConfirmation(context, () => dappPage.goto('https://dydx.trade/trade/BTC-USD'), "navigation");

  // 2. Wallet connection
  await walletConnectPhantom(dappPage, context);

  // 3. Withdraw flow
  await dappPage.getByRole('button', { name: /^dydx.*/ }).click();
  await dappPage.getByRole('menu', { name: /^dydx.*/ }).getByRole('button').nth(3).click();
  await dappPage.locator('div:has-text("Amount")').locator('input[type="number"]').click();
  await dappPage.locator('div:has-text("Amount")').locator('input[type="number"]').fill('10');
  
  console.log("⏳ Waiting for 'Withdraw' button to be ready...");
  await expect(dappPage.getByRole('button', { name: 'Withdraw' })).toBeVisible({ timeout: 20_000 });
  console.log("✅ 'Withdraw' button is ready");
  await phantomPopupConfirmation(context, () => dappPage.getByRole('button', { name: 'Withdraw' }).click(), "withdraw transaction");
  
  // 4. Wait for withdraw to complete
  console.log("⏳ Waiting for withdraw to process (this should not take more than 10 minutes)...");

  try {
    await expect(
      dappPage.getByText('Your funds have been withdrawn.')
    ).toBeVisible({ timeout: 600_000 });
    
    console.log("✅ Withdraw completed successfully");
    
  } catch (error) {
    console.log("❌ Withdraw did not complete within 5 minutes - likely performance issue");
    throw error;
  }
});