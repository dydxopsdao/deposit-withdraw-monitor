import { type BrowserContext, type Page } from "@playwright/test";
import { DAPP_URL } from "../../../config/constants";
import { logger } from "../../../logger";
import type { WaitTarget } from "../types";
import { RetryError, retry } from "../../../utils/retry";

export type OpenAppOptions = {
  url?: string;
  path?: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  maxRetries?: number;
  retryDelayMs?: number;
  bringToFront?: boolean;
  waitFor?: WaitTarget[] | WaitTarget;
  afterNavigate?: (page: Page) => Promise<void> | void;
};

export async function openApp(
  page: Page,
  urlOrOptions?: string | OpenAppOptions
): Promise<Page> {
  // Normalize options: support a string URL for ergonomics.
  const opts: OpenAppOptions =
    typeof urlOrOptions === "string" ? { url: urlOrOptions } : (urlOrOptions ?? {});

  const {
    url,
    path,
    waitUntil = "domcontentloaded", // SPA-friendly default
    maxRetries = 3,
    retryDelayMs = 1_000,
    bringToFront = true,
    waitFor,
    afterNavigate,
  } = opts;

    // Build the target URL from base + path unless an absolute URL was provided.
    const targetUrl = url ?? new URL(path ?? "", DAPP_URL).toString();
    logger.step(`Navigating to app: ${targetUrl}`);
    try {
      await retry(
        async (attemptNo) => {
          // Navigate and bring the tab forward (wallet popups often assume focus).
          await page.goto(targetUrl, { waitUntil });
          if (bringToFront) await page.bringToFront();
          //TODO build a helper function to wait for the UI to be ready  
          if (attemptNo > 1) {
            logger.success(`Navigated to dYdX on attempt ${attemptNo}: ${targetUrl}`);
          } else {
            logger.success(`Navigated to dYdX: ${targetUrl}`);
          }
  
          // Post-nav hook: last chance to tidy up (cookie/region banners, etc).
          if (afterNavigate) {
            await afterNavigate(page);
          }
        },
        {
          retries: maxRetries,
          baseDelayMs: retryDelayMs,
          jitterRatio: 0.2,
          onAttemptFailure: (attemptNo, err) => {
            const total = maxRetries + 1;
            const remaining = maxRetries - (attemptNo - 1);
            const msg = (err as Error)?.message ?? String(err);
            logger.warning(
              `Navigation attempt ${attemptNo}/${total} failed for ${targetUrl} (${remaining} retries left): ${msg}`
            );
          },
        }
      );
  
      return page;
    } catch (e) {
      if (e instanceof RetryError) {
        const lastMsg =
          (e.lastError as Error)?.message ?? (typeof e.lastError === "string" ? e.lastError : "Unknown error");
        logger.error(
          `Failed to navigate after ${e.attempts} attempts: ${targetUrl} (last error: ${lastMsg})`,
          (e.lastError as Error) ?? e
        );
        throw (e.lastError as Error) ?? e;
      }
      logger.error(`Failed to navigate to ${targetUrl}`, e as Error);
      throw e;
    }
  }
