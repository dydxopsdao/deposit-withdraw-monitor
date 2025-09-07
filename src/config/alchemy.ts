// Only secrets live here.
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

// Optional: tiny assert if you want an early, clear error
export function assertAlchemySecrets() {
  if (!ALCHEMY_API_KEY) {
    throw new Error("Set ALCHEMY_API_KEY environment variable.");
  }
}