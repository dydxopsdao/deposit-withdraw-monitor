import { expect, type BrowserContext, type Page, type Locator } from "@playwright/test";
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

  await closeChatIfPresent(page);
  await closeStatusPageIfPresent(page);
  try {
    await expect(fundsDialog(page)).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
    await closeDialogButton(page).click();
    logger.info("Closed pre-existing funds dialog");
  } catch {
    /* dialog not open */
  }

  logger.step("Clicking withdraw button");
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

/**
 * Closes the Global Chat panel if it is currently visible.
 */
async function closeChatIfPresent(page: Page): Promise<void> {
  try {
    const chatCloseButton = page.locator('.sc-l0nx5c-0.ergVgG.sc-1xochuw-0.ibmTXw.sc-mg0yzv-0.bFLbGV.sc-1opvvl2-6.bpTdGr');
    await chatCloseButton.waitFor({ state: "visible", timeout: 3000 });
    logger.step("Global Chat panel detected. Closing it.");
    await chatCloseButton.click();
    await page.waitForTimeout(600);
  } catch {
    logger.step("Global Chat panel not visible, proceeding.");
  }
}

/**
 * Dismisses the status page notification widget if it is currently visible.
 * The widget renders inside an iframe, so we iterate page.frames() to find it.
 */
async function closeStatusPageIfPresent(page: Page): Promise<void> {
  try {
    for (const frame of page.frames()) {
      const button = frame.locator('#frame-div button.svg-button');
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        logger.step("Status page notification detected. Closing it.");
        await button.click();
        await page.waitForTimeout(300);
        return;
      }
    }
    logger.step("Status page notification not visible, proceeding.");
  } catch {
    logger.step("Status page notification not visible, proceeding.");
  }
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

async function readButtonLabel(button: Locator): Promise<string> {
  const tc = (await button.textContent().catch(() => null))?.trim();
  if (tc) return tc;
  const it = (await button.innerText().catch(() => null))?.trim();
  if (it) return it;
  const aria = (await button.getAttribute("aria-label").catch(() => null))?.trim();
  if (aria) return aria;
  const title = (await button.getAttribute("title").catch(() => null))?.trim();
  if (title) return title;

  try {
    return await button.evaluate((el) => {
      const h = el as HTMLElement;
      return (
        h.innerText?.trim() ||
        h.textContent?.trim() ||
        h.getAttribute("aria-label")?.trim() ||
        h.getAttribute("title")?.trim() ||
        ""
      );
    });
  } catch {
    return "";
  }
}

async function waitForEnabledOrExplain(button: Locator, timeoutMs: number): Promise<string> {
  const start = Date.now();
  let lastLabel = "";
  const INSUFFICIENT_GRACE_MS = 5000;
  let insufficientSince: number | null = null;

  while (Date.now() - start < timeoutMs) {
    const label = await readButtonLabel(button);
    logger.info("Withdraw button label", { label });
    if (label) lastLabel = label;

    if (/insufficient/i.test(label)) {
      if (!insufficientSince) {
        insufficientSince = Date.now();
        logger.info("Withdraw button shows insufficient; starting grace wait", {
          graceMs: INSUFFICIENT_GRACE_MS,
        });
      } else if (Date.now() - insufficientSince >= INSUFFICIENT_GRACE_MS) {
        throw new Error(`withdraw button not enabled after grace period: ${label}`);
      }
    } else {
      insufficientSince = null;
    }

    const enabled = await button.isEnabled().catch(() => false);
    logger.info("Withdraw button enabled", { enabled });
    if (enabled) return lastLabel;

    await button.waitFor({ state: "visible", timeout: Math.min(2000, timeoutMs) }).catch(() => {});
    logger.info("Withdraw button visible", { visible: await button.isVisible() });
    await new Promise((r) => setTimeout(r, Math.min(TEST_TIMEOUTS.POLL ?? 150, 300)));
  }

  const [ariaDisabled, disabledAttr] = await Promise.all([
    button.getAttribute("aria-disabled").catch(() => null),
    button.getAttribute("disabled").catch(() => null),
  ]);

  const reason =
    lastLabel ||
    `aria-disabled=${ariaDisabled ?? "null"} disabled=${disabledAttr ?? "null"}`;

  throw new Error(`withdraw button not enabled after ${timeoutMs}ms: ${reason}`);
}

export async function submitWithdraw(page: Page, context: BrowserContext, wallet: WalletType) {
  const button = withdrawFundsButton(page);

  // Trigger validation that depends on blur/focus order
  await amountInput(page).press("Tab").catch(() => {});

  // Poll until button is stably enabled (handles the transient loading flash)
  const lastLabel = await waitForEnabledOrExplain(button, TEST_TIMEOUTS.NAVIGATION);

  // Click with bounding-box fallback in case the element is obscured
  try {
    await button.click();
  } catch {
    const box = await button.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else {
      await button.click({ force: true });
    }
  }

  logger.info("Withdraw funds button clicked", {
    label: lastLabel || (await readButtonLabel(button).catch(() => "")),
  });

  await handleWalletPopup(context, wallet);
}
