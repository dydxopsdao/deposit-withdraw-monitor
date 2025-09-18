import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { WalletType, isVisible } from "../../../utils";
import { conditionallyUnlockMetamask, handleMetamaskPopup } from "../../wallets/metamask/flows";
import { handlePhantomPopup } from "../../wallets/phantom/flows";
import { accountMenuButton, accountMenuButtonLoose, connectWalletBtn } from "../selectors/header";
import { chooseProviderBtn, sendRequestBtn } from "../selectors/wallet";
import { fundsDialog } from "../selectors/funds-dialog";

export async function connectWallet(
  page: Page,
  context: BrowserContext,
  wallet: WalletType
): Promise<Page> {
  logger.step(`Connecting wallet: ${wallet}`);

  if (await isVisible(accountMenuButton(page), {timeout: TEST_TIMEOUTS.DELAY})) {
    logger.info("Wallet appears already connected (account menu visible)");
    return page;
  }

  await openWalletPicker(page);

  logger.info("Choose provider");
  await chooseProvider(page, chooseProviderBtn(page, wallet), wallet);

  if (wallet === "metamask") {
    await conditionallyUnlockMetamask(context);
  }

  logger.info("Handling wallet popup");
  await handleWalletPopup(context, wallet);

  logger.info("Sending request");
  await sendRequest(page, sendRequestBtn(page));

  logger.info("Confirming request");
  await handleWalletPopup(context, wallet);

  try {
    await handleWalletPopup(context, wallet);
  } catch {
    /* optional second confirmation */
  }

  try {
    const acctBtn = accountMenuButton(page).or(accountMenuButtonLoose(page));
    await expect(acctBtn).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    logger.success(`Wallet connected: ${wallet}`, { wallet });
  } catch (err) {
    logger.warning(
      "Account menu not visible after wallet connect, checking for deposit dialog...",
      {
        wallet,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }
    );

    try {
      const dialog = fundsDialog(page);
      await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
      logger.success(`Wallet connected (inferred from deposit dialog): ${wallet}`, { wallet });
    } catch (dialogErr) {
      logger.error(
        "Neither account menu nor deposit dialog found after wallet connect",
        dialogErr instanceof Error ? dialogErr : new Error(String(dialogErr)),
        { wallet }
      );
      throw err;
    }
  }

  return page;
}

export async function openWalletPicker(page: Page, retries = 2) {
  if (await isPickerOpen(page)) return;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await expect(connectWalletBtn(page)).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    await connectWalletBtn(page).click();

    if (await isPickerOpen(page)) return;

    if (attempt < retries) await page.waitForTimeout(500);
  }

  throw new Error("Wallet picker did not appear after clicking Connect wallet.");
}

export async function handleWalletPopup(context: BrowserContext, wallet: WalletType) {
  if (wallet === "metamask") {
    await handleMetamaskPopup(context);
    logger.info("MetaMask wallet popup handled");
  } else {
    await handlePhantomPopup(context);
    logger.info("Phantom wallet popup handled");
  }
}

async function chooseProvider(page: Page, provider: Locator, name: string) {
  logger.info(`Selecting wallet provider: ${name}`);
  await expect(provider).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await provider.click();
}

async function sendRequest(page: Page, locator: Locator) {
  logger.info("Sending request");
  await expect(locator).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await locator.click();
}

async function isPickerOpen(page: Page) {
  return (
    (await isVisible(chooseProviderBtn(page, "metamask"))) ||
    (await isVisible(chooseProviderBtn(page, "phantom")))
  );
}
