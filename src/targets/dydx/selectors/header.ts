import type { Selector } from "../types";
import { DYDX_ADDRESS_RE } from "./constants";

export const connectWalletBtn: Selector = (page) =>
  page.getByRole("button", { name: /sign in/i });

export const walletPickerDialog: Selector = (page) =>
  page.getByRole("dialog", { name: /Sign in with Wallet/i });

export const accountMenuButton: Selector = (page) =>
  page.getByRole("button", {
    name: new RegExp(`^(?:MetaMask)?\\s*${DYDX_ADDRESS_RE.source}`, "i"),
  });

export const accountMenuButtonLoose: Selector = (page) =>
  page.getByRole("button", { name: DYDX_ADDRESS_RE });

export const signInWithWalletBtn: Selector = (page) =>
  page.getByRole("button", { name: /MetaMask|Phantom/i });