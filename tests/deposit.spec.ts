import { test, expect, PHANTOM_EXT_ID } from "../fixtures";

const DAPP_URL = "https://dydx.trade/portfolio/overview";

test.beforeEach(async ({ page }) => {
  await page.goto(DAPP_URL);
  await page.reload();
});

test("Regular deposit flow", async ({ page, context }) => {
  // Click on the Connect wallet button
  await page.locator('button:has-text("Connect wallet")').click();

  await page.pause();

  const phantomWallet = context
    .pages()
    .find((p) => p.url().startsWith(`chrome-extension://${PHANTOM_EXT_ID}`));
  if (!phantomWallet) throw new Error("Phantom popup not found");

  phantomWallet.pause;

  await phantomWallet.waitForLoadState();
  await phantomWallet.bringToFront();
  await phantomWallet
    .locator("data-testid=unlock-form-password-input")
    .fill(process.env.WALLET_PASSWORD!);
  await phantomWallet.locator("data-testid=unlock-form-submit-button").click();
});
