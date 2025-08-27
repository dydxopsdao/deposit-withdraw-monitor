// Only secrets live here.
export const SEED_PHRASE     = process.env.SEED_PHRASE || "";
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || "";

// Optional: tiny assert if you want an early, clear error
export function assertPhantomSecrets() {
  if (!SEED_PHRASE || !WALLET_PASSWORD) {
    throw new Error("Set SEED_PHRASE and WALLET_PASSWORD environment variables.");
  }
}