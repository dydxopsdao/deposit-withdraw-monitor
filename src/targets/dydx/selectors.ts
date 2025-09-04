// targets/dydx/selectors.ts
import type { Page, Locator } from "@playwright/test";
import type { WalletType } from "../../utils/route/routes";

type Selector = (p: Page, ...args: any[]) => Locator;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re  = (s: string) => new RegExp(`\\b${esc(s)}\\b`, "i");
const DYDX_ADDRESS_RE = /dydx1[a-z0-9]+(?:\u2026|\.\.\.)[a-z0-9]+/i;

export const dydxSelectors = {
  /* header */
  connectWalletBtn: ((p) => p.getByRole("button", { name: /connect wallet/i })) as Selector,
  walletPickerDialog: ((p) => p.getByRole("dialog", { name: /connect (your )?wallet/i })) as Selector,
  accountMenuButton: ((p) =>
    p.getByRole("button", { name: new RegExp(`^(?:MetaMask|Phantom)?\\s*${DYDX_ADDRESS_RE.source}`, "i") })
  ) as Selector,
  accountMenuButtonLoose: ((p) => p.getByRole("button", { name: DYDX_ADDRESS_RE })) as Selector,
  chooseProviderBtn: ((p, wallet: WalletType) => {
    const dlg = dydxSelectors.walletPickerDialog(p);
    if (wallet === "metamask") return dlg.getByRole("button", { name: /metamask/i });
    if (wallet === "phantom")  return dlg.getByRole("button", { name: /phantom(\s*\(solana\))?/i });
    throw new Error(`Unsupported wallet: ${wallet}`);
  }) as Selector,
  sendRequestBtn: ((p) => p.getByRole("button", { name: /^send request$/i })) as Selector,

  /* deposit */
  depositDialog: ((p) => p.getByRole("dialog", { name: /^deposit$/i })) as Selector,
  tokenPickerDialog: ((p) => p.getByText('Your tokens')) as Selector,
  amountInput: ((p) => dydxSelectors.depositDialog(p).getByPlaceholder("0.00")) as Selector,
  depositButtons: ((p) => p.getByRole("button", { name: /^deposit$/i })) as Selector,
  depositClickableButton: ((p) => p.locator('button:has-text("Deposit"):not(:disabled)').first()) as Selector,
  depositFundsButton: ((p) =>
    dydxSelectors.depositDialog(p).getByRole("button", { name: /^deposit funds$/i })
  ) as Selector,

  /**
   * Token pill next to the Amount input.
   * Strategy: take the Amount input → its *nearest* container → first enabled button.
   * This avoids the header "X" and skips disabled token rows elsewhere.
   */
  tokenPillButton: ((p: Page) => {
    const input = (dydxSelectors.amountInput as Selector)(p);
    const container = input.locator("xpath=ancestor::div[1]");
    return container.locator("button:enabled").first();
  }) as Selector,

  // All candidate rows that contain BOTH the token and chain text
  tokenPickerCandidates: ((p: Page, token: string, chain: string) => {
    return p.getByRole("button")
      .filter({ hasText: token })   // substring match (no regex)
      .filter({ hasText: chain });  // substring match (no regex)
  }) as Selector,

  


  depositInProgress: (p) =>
    dydxSelectors.depositDialog(p).getByText(/deposit in progress/i),
  depositCompleted: (p) =>
    dydxSelectors.depositDialog(p).getByText(/deposit completed/i),
  depositTxLink: (p) =>
    dydxSelectors.depositDialog(p).locator('a[href*="/tx/0x"]').first(),

};
