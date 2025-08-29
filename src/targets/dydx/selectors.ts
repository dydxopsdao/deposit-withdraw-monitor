import type { Page, Locator } from "@playwright/test";
type Selector = (page: Page) => Locator;

export const dydxSelectors = {
  connectWalletBtn: ((page) =>
    page.getByRole('button', { name: 'Connect wallet' })) as Selector,

};
