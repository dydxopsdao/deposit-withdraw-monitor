import type { Selector } from "../types";
import type { WalletType } from "../../../utils";
import { walletPickerDialog } from "./header";

export const chooseProviderBtn: Selector<[WalletType]> = (page, wallet) => {
  const dialog = walletPickerDialog(page);
  if (wallet === "metamask") return dialog.getByRole("button", { name: /metamask/i });
  if (wallet === "phantom") return dialog.getByRole("button", { name: /phantom(\s*\(solana\))?/i });
  throw new Error(`Unsupported wallet: ${wallet}`);
};

export const sendRequestBtn: Selector = (page) =>
  page.getByRole("button", { name: /^send request$/i });
