import type { BrowserContext, Page } from "@playwright/test";
import { DAPP_URL } from "../../config/constants";
import { WalletType } from "../../utils/route/routes";
import { selectors } from "./selectors";


//Just to fix the import error
export async function openApp(context: BrowserContext, url = DAPP_URL): Promise<Page> {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.waitForTimeout(999999999);
    await page.pause();
    await page.getByRole('button', { name: 'MetaMask dydx14dz...8yup' }).waitFor({ state: 'visible' });
    return page;
  }

  export async function connectWallet(page: Page, context: BrowserContext, wallet: WalletType) {
    /* await page.locator(selectors.connectWallet).click({ force: true });
    await page.waitForTimeout(100000000000000);
    await page.waitForSelector(selectors.walletConnectModal, {
      state: "visible",
      timeout: 10000,
    });
    const selector = getWalletSelector(wallet);
    await page.click(selector);
    await page.pause(); */
  }

  function getWalletSelector(walletType: string): string {
    switch (walletType) {
      case "MetaMask":
        return selectors.metaMaskWalletSelect;
      case "Phantom":
        return selectors.phantomWalletSelect;
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }