import { expect, type BrowserContext, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { WalletType } from "../../../utils";
import { withdrawFundsButton, withdrawButton, chainPickerDialog, chainPickerRow } from "../selectors/withdraw";
import { closeDialogButton, fundsDialog, amountInput, tokenPillWithdraw } from "../selectors/funds-dialog";
import { handleWalletPopup } from "./wallet";
import { enterAmount } from "./shared";

export async function withdraw(
  page: Page,
  _context: BrowserContext,
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
  await expect(candidates.first()).toBeVisible({ timeout: 5_000 });

  let target = candidates.first();
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if ((await candidates.count()) >= 2) {
      target = candidates.nth(1);
      break;
    }
    await page.waitForTimeout(TEST_TIMEOUTS.POLL);
  }

  await target.evaluate((el) => el.scrollIntoView({ block: "center" })).catch(() => {});
  await expect(target).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await expect(target).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });

  try {
    await target.click({ timeout: TEST_TIMEOUTS.ELEMENT });
  } catch {
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      await target.click({ force: true });
    }
  }
}

export async function submitWithdraw(page: Page, context: BrowserContext, wallet: WalletType) {
  const button = withdrawFundsButton(page);

  await expect(button).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await amountInput(page).press("Tab").catch(() => {});
  await expect(button).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });
  await button.click();

  await handleWalletPopup(context, wallet);
}
