import type { Selector } from "../types";

export const fundsDialog: Selector = (page) =>
  page.getByRole("dialog", { name: /^(deposit|withdraw)$/i }).first();

export const amountInput: Selector = (page) =>
  fundsDialog(page).getByPlaceholder("0.00");

export const closeDialogButton: Selector = (page) =>
  page.getByRole("button").filter({ hasText: /^$/ });

export const tokenPillDeposit: Selector = (page) => {
  const input = amountInput(page);
  const container = input.locator("xpath=ancestor::div[1]");
  return container.locator("button:enabled").first();
};

export const tokenPillWithdraw: Selector = (page) =>
  page
    .getByRole("dialog", { name: /^(deposit|withdraw)$/i })
    .locator('div:has-text("Address")')
    .locator("button")
    .filter({
      hasText: /^(ethereum|polygon|arbitrum|base|optimism|avalanche|solana|neutron|noble)$/i,
    })
    .first();

export const tokenPickerCandidates: Selector<[string, string]> = (page, token, chain) =>
  page
    .getByRole("button")
    .filter({ hasText: token })
    .filter({ hasText: chain });

export const transferInProgress: Selector = (page) =>
  fundsDialog(page).getByText(/ in progress/i);

export const transferTxLinks: Selector = (page) =>
  fundsDialog(page).locator('a[href*="/txs/"], a[href*="/tx/"], a[href*="/transaction/"]');
