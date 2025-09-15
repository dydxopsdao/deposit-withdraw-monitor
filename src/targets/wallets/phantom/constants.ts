// Only secrets live here.
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || '';

// Optional: tiny assert if you want an early, clear error
export function assertPhantomSecrets() {
  if (!WALLET_PASSWORD) {
    throw new Error('Set WALLET_PASSWORD environment variable.');
  }
}
