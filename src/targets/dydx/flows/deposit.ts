import { expect, type BrowserContext, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { WalletType } from "../../../utils";
import { depositFundsButton, tokenPickerDialogDeposit } from "../selectors/deposit";
import { tokenPickerCandidates, tokenPillDeposit, fundsDialog, amountInput } from "../selectors/funds-dialog";
import { handleWalletPopup } from "./wallet";
import { clickAnyDeposit, enterAmount } from "./shared";

export async function deposit(
  page: Page,
  _context: BrowserContext,
  amount: string,
  src_chain: string,
  token: string,
  wallet: WalletType
) {
  logger.step(`Depositing ${amount} ${token} from ${src_chain}`);

  await clickAnyDeposit(page);
  await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
  logger.info("Deposit dialog opened");

  if (wallet === "metamask") {
    await selectTokenDeposit(page, token, src_chain);
    logger.info("Token selected");
  }

  await enterAmount(page, amount);
  logger.info("Amount entered");
}

export async function selectTokenDeposit(page: Page, token: string, chain: string) {
  const pill = tokenPillDeposit(page);
  logger.debug("Token pill located for deposit", { locator: pill });
  await expect(pill).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await pill.click();

  const picker = tokenPickerDialogDeposit(page);
  await expect(picker).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });

  const candidates = tokenPickerCandidates(page, token, chain);
  await expect(candidates.first()).toBeVisible({ timeout: TEST_TIMEOUTS.ACTION });

  let target = candidates.first();
  const deadline = Date.now() + TEST_TIMEOUTS.ACTION;
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

export async function submitDeposit(page: Page, context: BrowserContext, wallet: WalletType) {
  const button = depositFundsButton(page);

  await expect(button).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await amountInput(page).press("Tab").catch(() => {});
  await expect(button).toBeEnabled({ timeout: TEST_TIMEOUTS.ELEMENT });
  await button.click();
  logger.info("Deposit funds button clicked");

  await handleWalletPopup(context, wallet);
  await handleWalletPopup(context, wallet);
}
