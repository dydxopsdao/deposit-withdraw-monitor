import type { Selector } from "../types";
import { esc } from "./constants";
import { fundsDialog } from "./funds-dialog";

export const withdrawButtons: Selector = (page) =>
  page.getByRole("button", { name: /^withdraw$/i });

export const withdrawButton: Selector = (page) =>
  withdrawButtons(page).first();

export const chainPickerDialog: Selector = (page) =>
  page.getByRole("dialog", { name: /select (a )?chain/i });

export const chainPickerRow: Selector<[string]> = (page, chain) =>
  chainPickerDialog(page).getByRole("button", { name: new RegExp(`\\b${esc(chain)}\\b`, "i") });

export const withdrawFundsButton: Selector = (page) =>
  fundsDialog(page).getByRole("button", { name: "Withdraw" });

export const withdrawDoneLine: Selector = (page) =>
  fundsDialog(page).getByText(/your withdrawal.*is now available\./i).first();
