import { expect, type BrowserContext, type Page, type Locator } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { clickWithFallback, preferSecondCandidate, WalletType } from "../../../utils";
import { depositFundsButton, tokenPickerDialogDeposit } from "../selectors/deposit";
import { tokenPickerCandidates, tokenPillDeposit, fundsDialog, amountInput } from "../selectors/funds-dialog";
import { handleWalletPopup, openMetamaskNotificationPage } from "./wallet";
import { clickAnyDeposit, enterAmount } from "./shared";

export async function deposit(
  page: Page,
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

  const target = await preferSecondCandidate(candidates, TEST_TIMEOUTS.ACTION);
  await clickWithFallback(page, target, { label: "token/chain candidate" });
}

/** -------- helpers for submitDeposit -------- */

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

async function waitForEnabledOrExplain(button: Locator, timeoutMs: number): Promise<string /* last label */> {
  const start = Date.now();
  let lastLabel = "";
  const INSUFFICIENT_GRACE_MS = 5000;
  let insufficientSince: number | null = null;

  while (Date.now() - start < timeoutMs) {
    const label = await readButtonLabel(button);
    logger.info("Deposit button label", { label });
    if (label) lastLabel = label;

    if (/insufficient/i.test(label)) {
      if (!insufficientSince) {
        insufficientSince = Date.now();
        logger.info("Deposit button shows insufficient; starting grace wait", {
          graceMs: INSUFFICIENT_GRACE_MS,
        });
      } else if (Date.now() - insufficientSince >= INSUFFICIENT_GRACE_MS) {
        throw new Error(`deposit button not enabled after grace period: ${label}`);
      }
    } else {
      insufficientSince = null;
    }

    const enabled = await button.isEnabled().catch(() => false);
    logger.info("Deposit button enabled", { enabled });
    if (enabled) return lastLabel;

    // Keep the locator alive/visible; small poll gap.
    await button.waitFor({ state: "visible", timeout: Math.min(2000, timeoutMs) }).catch(() => {});
    logger.info("Deposit button visible", { visible: await button.isVisible() });
    await new Promise((r) => setTimeout(r, Math.min(TEST_TIMEOUTS.POLL ?? 150, 300)));
  }

  // Timeout; attach extra context.
  const [ariaDisabled, disabledAttr] = await Promise.all([
    button.getAttribute("aria-disabled").catch(() => null),
    button.getAttribute("disabled").catch(() => null),
  ]);

  const reason =
    lastLabel ||
    `aria-disabled=${ariaDisabled ?? "null"} disabled=${disabledAttr ?? "null"}`;

  throw new Error(`deposit button not enabled after ${timeoutMs}ms: ${reason}`);
}

/** ------------------------------------------ */

export async function submitDeposit(page: Page, context: BrowserContext, wallet: WalletType) {
  const button = depositFundsButton(page);

  // Trigger any validation that depends on blur/focus order
  await amountInput(page).press("Tab").catch(() => {});

  const maxWaitMs = TEST_TIMEOUTS.ELEMENT;

  // Wait until the button is enabled OR fail early with an explicit label
  const lastLabel = await waitForEnabledOrExplain(button, maxWaitMs);

  // Click with robust fallback
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

  logger.info("Deposit funds button clicked", {
    label: lastLabel || (await readButtonLabel(button).catch(() => "")),
  });
  //CONFIRM TRANSACTION
  if (wallet == "metamask") {
    await openMetamaskNotificationPage(context);
  }
  await handleWalletPopup(context, wallet, 10, false);
}
