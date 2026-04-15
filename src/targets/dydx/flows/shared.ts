import { expect, type Locator, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { clickWithFallback } from "../../../utils";
import { depositButtons } from "../selectors/deposit";
import { withdrawButtons } from "../selectors/withdraw";
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

  await clickAnyVisibleEnabledButton(page, depositButtons(page), "Deposit");
}

export async function clickAnyWithdraw(page: Page) {
  try {
    await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    return;
  } catch {
    /* dialog not open */
  }

  await clickAnyVisibleEnabledButton(page, withdrawButtons(page), "Withdraw");
}

async function clickAnyVisibleEnabledButton(
  page: Page,
  buttons: Locator,
  label: string
) {
  const deadline = Date.now() + TEST_TIMEOUTS.ACTION;
  let sawVisibleDisabled = false;
  let sawVisibleButton = false;

  while (Date.now() < deadline) {
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const visible = await button.isVisible().catch(() => false);
      if (!visible) continue;

      sawVisibleButton = true;

      const enabled = await button.isEnabled().catch(() => false);
      if (!enabled) {
        sawVisibleDisabled = true;
        continue;
      }

      await clickWithFallback(page, button, {
        timeout: TEST_TIMEOUTS.DEFAULT,
        retries: 0,
        label: `${label} button ${i + 1}`,
      });
      return;
    }

    await page.waitForTimeout(TEST_TIMEOUTS.POLL).catch(() => {});
  }

  if (sawVisibleDisabled) {
    throw new Error(`"${label}" button stayed disabled for ${TEST_TIMEOUTS.ACTION}ms.`);
  }

  if (sawVisibleButton) {
    throw new Error(`"${label}" button was visible but never became clickable.`);
  }

  throw new Error(`No visible "${label}" button found.`);
}
