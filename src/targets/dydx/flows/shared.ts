import { expect, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { depositButtons } from "../selectors/deposit";
import { amountInput, fundsDialog } from "../selectors/funds-dialog";

export async function enterAmount(page: Page, value: string) {
  const input = amountInput(page);
  await expect(input).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await input.fill("");
  await input.fill(value);
  await page.keyboard.press("Tab").catch(() => {});
}

export async function clickAnyDeposit(page: Page) {
  try {
    await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    return;
  } catch {
    /* dialog not open */
  }

  const buttons = depositButtons(page);
  const count = await buttons.count();

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    try {
      await expect(button).toBeVisible({ timeout: TEST_TIMEOUTS.POLL });
      await expect(button).toBeEnabled({ timeout: TEST_TIMEOUTS.POLL });
    } catch {
      continue;
    }

    await button.scrollIntoViewIfNeeded().catch(() => {});
    await button.click();
    return;
  }

  throw new Error('No clickable "Deposit" button found (all hidden or disabled).');
}
