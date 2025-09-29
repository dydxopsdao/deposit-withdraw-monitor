import { expect, type BrowserContext, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { clickWithFallback, preferSecondCandidate, WalletType } from "../../../utils";
import { withdrawFundsButton, withdrawButton, chainPickerDialog, chainPickerRow } from "../selectors/withdraw";
import { closeDialogButton, fundsDialog, amountInput, tokenPillWithdraw } from "../selectors/funds-dialog";
import { handleWalletPopup } from "./wallet";
import { enterAmount } from "./shared";

export async function withdraw(
  page: Page,
  amount: string,
  dst_chain: string,
  token: string,
  wallet: WalletType
) {
  logger.step(`Withdrawing ${amount} ${token} to ${dst_chain}`);
  try {
    await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    await closeDialogButton(page).click();
  } catch {
    /* dialog not open */
  }

  await withdrawButton(page).click();
  await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
  logger.info("Withdraw dialog opened");

  if (wallet === "metamask") {
    await selectTokenWithdraw(page, token, dst_chain);
    logger.info("Token selected");
  }

  await enterAmount(page, amount);
  logger.info("Amount entered");
}

export async function selectTokenWithdraw(page: Page, token: string, chain: string) {
  const pill = tokenPillWithdraw(page);
  logger.debug("Token pill located for withdraw", { locator: pill });
  await expect(pill).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await pill.click();

  const picker = chainPickerDialog(page);
  logger.debug("Withdraw chain picker dialog located", { locator: picker });
  await expect(picker).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  const candidates = chainPickerRow(page, chain);
  logger.debug("Withdraw chain picker candidates", { count: await candidates.count() });
  await expect(candidates.first()).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
  const target = await preferSecondCandidate(candidates, TEST_TIMEOUTS.DEFAULT);
  await clickWithFallback(page, target, { label: "chain candidate" });
}

export async function submitWithdraw(page: Page, context: BrowserContext, wallet: WalletType) {
  const button = withdrawFundsButton(page);

  await expect(button).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await amountInput(page).press("Tab").catch(() => {});
  await expect(button).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });
  await button.click();

  await handleWalletPopup(context, wallet);
}
