import type { Selector } from "../types";
import type { WalletType } from "../../../utils";
import { DYDX_ADDRESS_RE } from "./constants";

export const connectWalletBtn: Selector = (page) =>
  page.getByRole("button", { name: /sign in/i });

export const walletPickerDialog: Selector = (page) =>
  page.getByRole("dialog", { name: /Sign in/i });

export const accountMenuButton: Selector = (page) =>
  page.getByRole("button", {
    name: new RegExp(`^(?:MetaMask)?\\s*${DYDX_ADDRESS_RE.source}`, "i"),
  });

export const accountMenuButtonLoose: Selector = (page) =>
  page.getByRole("button", { name: DYDX_ADDRESS_RE });

export const signInWithWalletBtn: Selector<[WalletType]> = (page, wallet) => {
  const dialog = walletPickerDialog(page);
  if (wallet === "metamask") {
    return dialog.getByRole("button", { name: /MetaMask/i });
  }
  if (wallet === "phantom") {
    return dialog.getByRole("button", { name: /Phantom(\s*\(Solana\))?/i });
  }
  throw new Error(`Unsupported wallet: ${wallet}`);
};

export const viewMoreWalletsBtn: Selector = (page) =>
  page.getByRole("button", { name: /View More Wallets/i });
