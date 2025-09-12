import { loadSecretsFromAWS } from './src/utils/helpers/secrets.js';

/**
 * Playwright global setup function
 * This runs once before all tests begin
 */
export default async function globalSetup() {
  console.log('Running global setup...');

  // Load secrets from AWS Secrets Manager
  await loadSecretsFromAWS();

  console.log('Global setup completed');
}
