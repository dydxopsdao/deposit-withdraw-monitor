// targets/dydx/selectors.ts
import type { Page, Locator } from "@playwright/test";
import type { WalletType } from "../../utils/route/routes";

type Selector = (p: Page, ...args: any[]) => Locator;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DYDX_ADDRESS_RE = /dydx1[a-z0-9]+(?:\u2026|\.\.\.)[a-z0-9]+/i;

export const dydxSelectors = {
  /* header */
  connectWalletBtn: ((p) => p.getByRole("button", { name: /connect wallet/i })) as Selector,
  walletPickerDialog: ((p) => p.getByRole("dialog", { name: /connect (your )?wallet/i })) as Selector,
  accountMenuButton: ((p) =>
    p.getByRole("button", { name: new RegExp(`^(?:MetaMask)?\\s*${DYDX_ADDRESS_RE.source}`, "i") })
  ) as Selector,
  accountMenuButtonLoose: ((p) => p.getByRole("button", { name: DYDX_ADDRESS_RE })) as Selector,
  chooseProviderBtn: ((p, wallet: WalletType) => {
    const dlg = dydxSelectors.walletPickerDialog(p);
    if (wallet === "metamask") return dlg.getByRole("button", { name: /metamask/i });
    if (wallet === "phantom")  return dlg.getByRole("button", { name: /phantom(\s*\(solana\))?/i });
    throw new Error(`Unsupported wallet: ${wallet}`);
  }) as Selector,
  sendRequestBtn: ((p) => p.getByRole("button", { name: /^send request$/i })) as Selector,
  closeDialogButton: ((p) => p.getByRole('button').filter({ hasText: /^$/ })) as Selector,
 

  /* deposit */
  fundsDialog: ((p) =>
    p.getByRole('dialog', { name: /^(deposit|withdraw)$/i }).first()) as Selector,
  tokenPickerDialogDeposit: ((p) => p.getByText('Your tokens')) as Selector,
  depositButtons: ((p) => p.getByRole("button", { name: /^deposit$/i })) as Selector,
  depositClickableButton: ((p) => p.locator('button:has-text("Deposit"):not(:disabled)').first()) as Selector,
  depositFundsButton: ((p) =>
    dydxSelectors.fundsDialog(p).getByRole("button", { name: /^deposit funds$/i })
  ) as Selector,

  amountInput: ((p) => dydxSelectors.fundsDialog(p).getByPlaceholder("0.00")) as Selector,
  /**
   * Token pill next to the Amount input.
   * Strategy: take the Amount input → its *nearest* container → first enabled button.
   * This avoids the header "X" and skips disabled token rows elsewhere.
   */
  tokenPillDeposit: ((p: Page) => {
    const input = (dydxSelectors.amountInput as Selector)(p);
    const container = input.locator("xpath=ancestor::div[1]");
    return container.locator("button:enabled").first();
  }) as Selector,
  // Pill button next to "Address" (works for both Deposit & Withdraw dialogs)
  tokenPillWithdraw: ((p) =>
    p.getByRole('dialog', { name: /^(deposit|withdraw)$/i })
      .locator('div:has-text("Address")')
      .locator('button')
      .filter({
        hasText: /^(ethereum|polygon|arbitrum|base|optimism|avalanche|solana|neutron|noble)$/i,
      })
      .first()
  ) as Selector,


  // All candidate rows that contain BOTH the token and chain text
  tokenPickerCandidates: ((p: Page, token: string, chain: string) => {
    return p.getByRole("button")
      .filter({ hasText: token })   // substring match (no regex)
      .filter({ hasText: chain });  // substring match (no regex)
  }) as Selector,

  


  transferInProgress: (p) =>
    dydxSelectors.fundsDialog(p).getByText(/ in progress/i),
  depositDoneTitle: (p) =>
    dydxSelectors.fundsDialog(p).getByText(/^deposit completed$/i).first(),  
  depositDoneCta: (p) =>
    dydxSelectors.fundsDialog(p).getByRole('button', { name: /start trading/i }),
  
  withdrawDoneLine: (p) =>
    dydxSelectors.fundsDialog(p).getByText(/your withdrawal.*is now available\./i).first(),
  transferTxLinks: (p) =>
    dydxSelectors
    .fundsDialog(p)
    .locator('a[href*="/txs/"], a[href*="/tx/"], a[href*="/transaction/"]'),

  /* withdraw */
  withdrawButton: ((p) => p.getByRole('button', { name: 'Withdraw' })) as Selector,
  chainPickerDialog: ((p) =>
    p.getByRole('dialog', { name: /select (a )?chain/i })
  ) as Selector,
  
  // A specific chain row in that dialog, e.g. "Ethereum", "Polygon", …
  chainPickerRow: ((p, chain: string) =>
    dydxSelectors
      .chainPickerDialog(p)
      .getByRole("button", { name: new RegExp(`\\b${esc(chain)}\\b`, "i") })
      ) as Selector,

  withdrawFundsButton: ((p) =>
    dydxSelectors.fundsDialog(p).getByRole('button', { name: 'Withdraw' })
  ) as Selector,

};
