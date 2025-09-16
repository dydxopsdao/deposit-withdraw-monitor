import { loadSecretsFromAWS } from "./src/utils/secrets";
import { logger } from "./src/logger/logging-utils";

/**
 * Playwright global setup function
 * This runs once before all tests begin
 */
export default async function globalSetup() {
  logger.info("Running global setup...");
  
  // Load secrets from AWS Secrets Manager
  await loadSecretsFromAWS();
  
  logger.info("Global setup completed");
}
