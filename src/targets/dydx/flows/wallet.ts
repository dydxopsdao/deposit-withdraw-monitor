import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../config/timeouts";
import { logger } from "../../../logger";
import { WalletType, isVisible, closeNonPrimaryTabs, safeUrl } from "../../../utils";
import { retry, RetryError } from "../../../utils/retry";
import { handleMetamaskPopup } from "../../wallets/metamask/flows";
import { handlePhantomPopup } from "../../wallets/phantom/flows";
import {
  accountMenuButton,
  accountMenuButtonLoose,
  connectWalletBtn,
  signInWithWalletBtn,
  viewMoreWalletsBtn,
  walletPickerDialog,
} from "../selectors/header";
import { chooseProviderBtn, sendRequestBtn } from "../selectors/wallet";
import { fundsDialog } from "../selectors/funds-dialog";

const METAMASK_PENDING_REQUEST_TEXT = /request already pending/i;
const METAMASK_CONNECTION_ERROR_TEXT = /couldn'?t connect to metamask/i;

export async function connectWallet(
  page: Page,
  context: BrowserContext,
  wallet: WalletType,
  opts: { retries?: number } = {}
): Promise<Page> {
  const { retries = 2 } = opts;
  logger.step(`Connecting wallet: ${wallet}`);
  const attemptConnect = async (attemptNo: number) => {
    
    try {
      if (wallet === "phantom") {
        try {
          logger.info("Handling Phantom popup incase it is open");
          await page.pause();
          await handlePhantomPopup(context);
        } catch (error) {
          logger.warning("Failed to handle Phantom popup", { error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      
    }
    if (await walletAppearsConnected(page)) {
      logger.info("Wallet already connected; skipping connect flow");
      return page;
    }

    if (attemptNo > 1) {
      logger.info(`Retrying wallet connect (attempt ${attemptNo}/${retries + 1})`, { wallet });
    }
    if (await isPickerOpen(page)) {
      logger.info("Wallet picker already open; reusing existing modal");
    } else {
      await openWalletPicker(page);
    }
    if (wallet === "metamask") {
      try {
        logger.info("Handling MetaMask popup incase it is open");
        await handleMetamaskPopup(context);
      } catch (error) {
        
      }
    }
    const walletButton = signInWithWalletBtn(page, wallet);
    await isVisible(walletButton, { timeout: TEST_TIMEOUTS.ELEMENT });
    await walletButton.click({ force: true });
    logger.info("Clicked wallet button");
    
    if (wallet === "metamask") {
      await handlePendingWalletError(page, context, wallet);
    }
    logger.info("Handling wallet popup");
    await handleWalletPopup(context, wallet, 30);

    logger.info("Sending request");
    await sendRequest(page, sendRequestBtn(page));

    logger.info("Confirming request");
    await handleWalletPopup(context, wallet);

    try {
      await handleWalletPopup(context, wallet);
    } catch {
      /* optional second confirmation */
    }

    await assertWalletConnected(page, wallet);

    return page;
  };

  try {
    return await retry(attemptConnect, {
      retries,
      baseDelayMs: TEST_TIMEOUTS.DELAY,
      label: "connectWallet",
      onAttemptFailure: (attemptNo, error) => {
        logger.warning("Wallet connect attempt failed", {
          attempt: attemptNo,
          wallet,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    });
  } catch (err) {
    if (err instanceof RetryError) {
      logger.error(
        "Failed to connect wallet after retries",
        err.lastError instanceof Error ? err.lastError : err,
        { wallet }
      );
      if (err.lastError) {
        throw err.lastError instanceof Error ? err.lastError : new Error(String(err.lastError));
      }
    }
    throw err;
  }
}

export async function openWalletPicker(page: Page, retries = 2) {
  if (await isPickerOpen(page)) return;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await expect(connectWalletBtn(page)).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    await connectWalletBtn(page).click();

    if (await isPickerOpen(page)) return;

    if (attempt < retries) await page.waitForTimeout(500);
  }

  throw new Error("Wallet picker did not appear after clicking Connect wallet.");
}

export async function handleWalletPopup(context: BrowserContext, wallet: WalletType, retries: number = 30) {

  logger.debug(`----------ctx.pages(): ${context.pages().map(p => p.url()).join(', ')}`);

  if (wallet === "metamask") {
    await handleMetamaskPopup(context, retries);
    logger.info("MetaMask wallet popup handled");
  } else {
    await handlePhantomPopup(context);
    logger.info("Phantom wallet popup handled");
  }
}

async function walletAppearsConnected(page: Page): Promise<boolean> {
  const acctBtn = accountMenuButton(page).or(accountMenuButtonLoose(page));
  if (await isVisible(acctBtn, { timeout: TEST_TIMEOUTS.DELAY })) return true;
  return await isVisible(fundsDialog(page), { timeout: TEST_TIMEOUTS.DELAY });
}

async function assertWalletConnected(page: Page, wallet: WalletType): Promise<void> {
  try {
    const acctBtn = accountMenuButton(page).or(accountMenuButtonLoose(page));
    await expect(acctBtn).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
    logger.success(`Wallet connected: ${wallet}`, { wallet });
  } catch (err) {
    logger.warning(
      "Account menu not visible after wallet connect, checking for deposit dialog...",
      {
        wallet,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      }
    );

    try {
      const dialog = fundsDialog(page);
      await expect(dialog).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
      logger.success(`Wallet connected (inferred from deposit dialog): ${wallet}`, { wallet });
    } catch (dialogErr) {
      logger.error(
        "Neither account menu nor deposit dialog found after wallet connect",
        dialogErr instanceof Error ? dialogErr : new Error(String(dialogErr)),
        { wallet }
      );
      throw err;
    }
  }
}

async function handlePendingWalletError(
  page: Page,
  context: BrowserContext,
  wallet: WalletType
): Promise<void> {
  if (wallet !== "metamask") return;

  const pendingRequest = page.getByText(METAMASK_PENDING_REQUEST_TEXT);
  const connectionError = page.getByText(METAMASK_CONNECTION_ERROR_TEXT);

  const visibleIndicators: Locator[] = [];
  if (await isVisible(pendingRequest, { timeout: TEST_TIMEOUTS.DELAY })) {
    visibleIndicators.push(pendingRequest);
  }
  if (await isVisible(connectionError, { timeout: TEST_TIMEOUTS.DELAY })) {
    visibleIndicators.push(connectionError);
  }

  if (!visibleIndicators.length) return;

  logger.info("Detected MetaMask pending request on connect modal; opening wallet popup");
  logger.debug(`All pages: ${context.pages().map(p => safeUrl(p)).join(", ")}`);  
  await handleMetamaskPopup(context);

  await Promise.all(
    visibleIndicators.map((locator) =>
      locator.waitFor({ state: "hidden", timeout: TEST_TIMEOUTS.ACTION }).catch(() => {})
    )
  );
}

async function chooseProvider(page: Page, provider: Locator, name: string) {
  logger.info(`Selecting wallet provider: ${name}`);
  await expect(provider).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await provider.click();
}

async function sendRequest(page: Page, locator: Locator) {
  logger.info("Sending request");
  await expect(locator).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
  await locator.click();
}

async function isPickerOpen(page: Page) {
  return (
    (await isVisible(walletPickerDialog(page)))
  );
}
