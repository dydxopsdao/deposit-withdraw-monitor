// src/utils/retry.ts
/**
 * Generic retry helper with exponential backoff and optional jitter + abort support.
 *
 * Attempts are numbered starting at 1. On each failure (except the last), it waits
 * for an exponentially increasing delay before retrying:
 *   delay = baseDelayMs * 2^(attempt-1) [+ jitter]
 */
import { logger } from "./logger/logging-utils";

export class RetryError extends Error {
  readonly attempts: number;
  readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export type RetryOptions = {
  /** Number of retries after the initial attempt (total tries = retries + 1). Default: 3 */
  retries?: number;
  /** Base delay in ms for attempt #2 (attempt #1 has no delay). Default: 1000 */
  baseDelayMs?: number;
  /** Add random jitter up to this ratio of the computed delay (e.g. 0.2 = ±20%). Default: 0.2 */
  jitterRatio?: number;
  /** Abort the retry loop when signaled. */
  signal?: AbortSignal;
  /** Called after a failed attempt, before sleeping/backing off. */
  onAttemptFailure?: (attemptNo: number, error: unknown) => void;
  /** Optional predicate to decide whether to retry on a given error. Default: always retry until attempts exhausted. */
  shouldRetry?: (error: unknown) => boolean;
  /** Optional label to tag retry logs (e.g. "openApp", "clickWithFallback") */
  label?: string;
  /** Log backoff waits (debug). Default: true */
  logBackoff?: boolean;
  /** Log per-attempt outcomes (debug). Default: true */
  logAttempts?: boolean;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export async function retry<T>(
  fn: (attemptNo: number) => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 1_000,
    jitterRatio = 0.2,
    signal,
    onAttemptFailure,
    shouldRetry,
    label,
    logBackoff = true,
    logAttempts = true,
  } = opts;

  let lastError: unknown;

  const totalTries = retries + 1;
  for (let i = 0; i < totalTries; i++) {
    const attemptNo = i + 1;
    try {
      const result = await fn(attemptNo);
      if (logAttempts && attemptNo > 1) {
        logger.debug(`[retry${label ? `:${label}` : ""}] success on attempt ${attemptNo}/${totalTries}`);
      }
      return result;
    } catch (err) {
      lastError = err;

      const willRetry = attemptNo < totalTries && (shouldRetry ? shouldRetry(err) : true);
      if (!willRetry) {
        break;
      }

      onAttemptFailure?.(attemptNo, err);

      if (logAttempts) {
        const msg = (err as Error)?.message ?? String(err);
        const remaining = totalTries - attemptNo;
        logger.debug(
          `[retry${label ? `:${label}` : ""}] attempt ${attemptNo}/${totalTries} failed (${remaining} remaining): ${msg}`
        );
      }

      // Exponential backoff: base * 2^(attempt-1) for retries (attempt 1 had no delay)
      const rawDelay = baseDelayMs * Math.pow(2, attemptNo - 1);
      const jitter = rawDelay * jitterRatio * (Math.random() * 2 - 1); // [-jitter, +jitter]
      const delay = Math.max(0, Math.round(rawDelay + jitter));

      if (logBackoff) {
        logger.debug(
          `[retry${label ? `:${label}` : ""}] waiting ${delay}ms before attempt ${attemptNo + 1}/${totalTries}`
        );
      }

      await sleep(delay, signal);
    }
  }

  if (logAttempts) {
    const msg =
      (lastError as Error)?.message ?? (typeof lastError === "string" ? lastError : "Unknown error");
    logger.debug(
      `[retry${label ? `:${label}` : ""}] exhausted ${totalTries} attempts; last error: ${msg}`
    );
  }

  throw new RetryError(`All ${totalTries} attempts failed`, totalTries, lastError);
}