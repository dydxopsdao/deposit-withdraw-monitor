import type { Selector } from "../types";
import { fundsDialog } from "./funds-dialog";

export const depositButtons: Selector = (page) =>
  page.getByRole("button", { name: /^deposit$/i });

export const depositClickableButton: Selector = (page) =>
  page.locator('button:has-text("Deposit"):not(:disabled)').first();

export const tokenPickerDialogDeposit: Selector = (page) =>
  page.getByText("Your tokens");

export const depositFundsButton: Selector = (page) =>
  fundsDialog(page).locator(':is(button[type="submit"], button[action="Primary"])').first();

export const depositDoneTitle: Selector = (page) =>
  fundsDialog(page).getByText(/^deposit completed$/i).first();

export const depositDoneCta: Selector = (page) =>
  fundsDialog(page).getByRole("button", { name: /start trading/i });
