export const SEED_PHRASE     = process.env.SEED_PHRASE || "";
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || "";

export function assertMetamaskSecrets() {
  if (!SEED_PHRASE || !WALLET_PASSWORD) {
    throw new Error("Set SEED_PHRASE and WALLET_PASSWORD environment variables.");
  }
}