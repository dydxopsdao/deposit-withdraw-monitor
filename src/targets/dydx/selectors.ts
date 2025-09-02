// targets/dydx/selectors.ts
import type { Page, Locator } from "@playwright/test";
import type { WalletType } from "../../utils/route/routes";

type Selector = (page: Page, ...args: any[]) => Locator;
const re = (s: string) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

export const dydxSelectors = {
  /* ---------- Global / header ---------- */

  connectWalletBtn: ((p) =>
    p.getByRole("button", { name: /connect wallet/i })) as Selector,

  walletPickerDialog: ((p) =>
    p.getByRole("dialog", { name: /connect (your )?wallet/i })) as Selector,

  // Account/user button once connected (works for both wallets)
  accountMenuButton: ((p) =>
    p.getByRole("button", { name: /^dydx1[a-z0-9]+\.\.\.[a-z0-9]+$/i })) as Selector,

  // Choose provider tile inside the wallet picker
  chooseProviderBtn: ((p, walletType: WalletType) => {
    const dlg = dydxSelectors.walletPickerDialog(p);
    if (walletType === "metamask") {
      return dlg.getByRole("button", { name: /metamask/i });
    }
    if (walletType === "phantom") {
      // allow “Phantom (Solana)” or just “Phantom”
      return dlg.getByRole("button", { name: /phantom(\s*\(solana\))?/i });
    }
    throw new Error(`Unsupported wallet type: ${walletType}`);
  }) as Selector,

  // Optional in-page step after provider selection
  sendRequestBtn: ((p) =>
    p.getByRole("button", { name: /^send request$/i })) as Selector,

  /* ---------- Deposit flow ---------- */

  // Button that opens the Deposit dialog (on Portfolio/wherever it shows)
  depositButton: ((p) =>
    p.getByRole("button", { name: /^deposit$/i })) as Selector,

  // The Deposit dialog itself
  depositDialog: ((p) =>
    p.getByRole("dialog", { name: /^deposit$/i })) as Selector,

  // The “Deposit funds” CTA *inside* the dialog
  depositFundsButton: ((p) =>
    dydxSelectors.depositDialog(p).getByRole("button", { name: /^deposit funds$/i })) as Selector,

  // Amount input inside the dialog
  amountInput: ((p) =>
    dydxSelectors.depositDialog(p).getByPlaceholder("0.00")) as Selector,

  // The small pill-like button next to Amount showing the current token (e.g., “USDC”).
  // We look for any button in the Amount row that contains a token-ish label.
  tokenSelectorButton: ((p) =>
    dydxSelectors
      .depositDialog(p)
      .locator('div:has-text("^Amount")')
      .locator("button")
      .filter({ hasText: /[A-Z]{2,6}/ })
      .first()) as Selector,

  // The “Select token” picker dialog that opens after clicking the token pill
  tokenPickerDialog: ((p) =>
    p.getByRole("dialog", { name: /select token/i })) as Selector,

  // A specific token+chain row in the picker: e.g. token="USDC", chain="Polygon"
  tokenPickerRow: ((p, token: string, chain: string) =>
    dydxSelectors
      .tokenPickerDialog(p)
      .getByRole("button", { name: re(token) })
      .filter({ hasText: re(chain) })
      .first()) as Selector,
};
