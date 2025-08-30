import type { Page, Locator } from "@playwright/test";
import { WalletType } from "../../utils/route/routes";
type Selector = (page: Page, walletType?: WalletType) => Locator;

export const dydxSelectors = {
  connectWalletBtn: ((page) =>
    page.getByRole('button', { name: 'Connect wallet' })) as Selector,
  accountMenuButton: ((page, walletType: WalletType) => {
    switch (walletType) {
      case 'metamask':
        return page.getByRole('button', { name: /MetaMask dydx1[a-z0-9]+\.\.\.[a-z0-9]+/i });
      case 'phantom':
        return page.getByRole('button', { name: /dydx1[a-z0-9]+\.\.\.[a-z0-9]+/i });
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }) as Selector,
  chooseProviderBtn: ((page, walletType: WalletType) => {
    switch (walletType) {
      case 'metamask':
        return page.getByRole('button', { name: 'MetaMask MetaMask' });
      case 'phantom':
        return page.getByRole('button', { name: 'Phantom (Solana)' });
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }) as Selector,
  sendRequestBtn: ((page) =>
    page.getByRole('button', { name: 'Send request' })) as Selector,
  depositPopupXButton: ((page) =>
    page.locator('h2:has-text("Deposit") + button')) as Selector,
};
