// Only secrets live here.
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || "";

// Optional: tiny assert if you want an early, clear error
/**
 * Ensures MetaMask-sensitive environment variables are populated before use.
 * Provides a deterministic error message instead of failing mid-test.
 * @throws When WALLET_PASSWORD is absent.
 */
export function assertMetamaskSecrets() {
  if (!WALLET_PASSWORD) {
    throw new Error("Set WALLET_PASSWORD environment variable.");
  }
}
