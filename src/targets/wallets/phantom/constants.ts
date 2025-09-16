// Only secrets live here.
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || "";

// Optional: tiny assert if you want an early, clear error
/**
 * Validates that required Phantom secrets are present before launching tests.
 * Throws with a helpful message so CI fails fast when env vars are missing.
 * @throws When WALLET_PASSWORD is absent.
 */
export function assertPhantomSecrets() {
  if (!WALLET_PASSWORD) {
    throw new Error("Set WALLET_PASSWORD environment variable.");
  }
}
