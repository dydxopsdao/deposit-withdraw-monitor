import type { Selector } from "../types";
import { DYDX_ADDRESS_RE } from "./constants";

export const connectWalletBtn: Selector = (page) =>
  page.getByRole("button", { name: /sign in/i });

export const walletPickerDialog: Selector = (page) =>
  page.getByRole("dialog", { name: /connect (your )?wallet/i });

export const accountMenuButton: Selector = (page) =>
  page.getByRole("button", {
    name: new RegExp(`^(?:MetaMask)?\\s*${DYDX_ADDRESS_RE.source}`, "i"),
  });

export const accountMenuButtonLoose: Selector = (page) =>
  page.getByRole("button", { name: DYDX_ADDRESS_RE });
