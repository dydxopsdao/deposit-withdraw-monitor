import type { Page, Locator } from "@playwright/test";
type Selector = (page: Page) => Locator;

export const dydxSelectors = {
  connectWalletBtn: ((page) =>
    page.getByRole('button', { name: 'Connect wallet' })) as Selector,
  accountMenuButton: ((page) =>
    page.getByRole('button', { name: 'Account Menu' })) as Selector,
  metamaskOption: ((page) =>
    page.getByRole('button', { name: 'MetaMask MetaMask' })) as Selector,
  phantomOption: ((page) =>
    page.getByRole('button', { name: 'Phantom (Solana)' })) as Selector,

};
