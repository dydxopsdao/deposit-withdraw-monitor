import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../logger/logging-utils';

/**
 * Loads secrets from AWS Secrets Manager and populates process.env
 */
export async function loadSecretsFromAWS(): Promise<void> {
  // TODO: Cache secrets in-memory between calls to avoid repeated AWS roundtrips.
  // TODO: Provide optional local .env fallback when AWS is unavailable (dev mode).
  await loadSeedPhrases();
  await loadWalletPassword();
  await loadDatadogApiKey();
}

/**
 * Loads seed phrases. Only runs when SEED_PHRASES_SECRET_ARN is present
 */
async function loadSeedPhrases(): Promise<void> {
  const secretArn = process.env.SEED_PHRASES_SECRET_ARN;

  // Skip if no AWS secrets configured
  if (!secretArn) {
    logger.info('No AWS Secrets Manager secrets configured, skipping seed phrases load');
    return;
  }

  const secretString = await getSecretFromAWS(secretArn);

  // TODO: Validate secret JSON shape and handle JSON parse errors gracefully.
  const seedPhrases = JSON.parse(secretString) as Record<string, string>;

  // Overwrite process.env with seed phrases
  for (const [key, value] of Object.entries(seedPhrases)) {
    process.env[key] = value;
  }

  logger.info(`🥷 Loaded ${Object.keys(seedPhrases).length} seed phrases from AWS Secrets Manager`);
}

/**
 * Loads wallet password. Only runs when WALLET_PASSWORD_SECRET_ARN is present
 */
async function loadWalletPassword(): Promise<void> {
  const secretArn = process.env.WALLET_PASSWORD_SECRET_ARN;

  // Skip if no AWS secrets configured
  if (!secretArn) {
    logger.info('No AWS Secrets Manager wallet password secret configured, skipping wallet password load');
    return;
  }

  const secretString = await getSecretFromAWS(secretArn);

  // Set the wallet password directly in process.env
  process.env.WALLET_PASSWORD = secretString;

  logger.info(`🔐 Loaded wallet password from AWS Secrets Manager`);
}

/**
 * Loads Datadog API key. Only runs when DATADOG_API_KEY_SECRET_ARN is present
 */
async function loadDatadogApiKey(): Promise<void> {
  const secretArn = process.env.DATADOG_API_KEY_SECRET_ARN;

  // Skip if no AWS secrets configured
  if (!secretArn) {
    logger.info('No AWS Secrets Manager Datadog API key secret configured, skipping Datadog API key load');
    return;
  }

  const secretString = await getSecretFromAWS(secretArn);

  // Set the Datadog API key directly in process.env
  process.env.DD_API_KEY = secretString;

  logger.info(`📊 Loaded Datadog API key from AWS Secrets Manager`);
}

/**
 * Common function to retrieve a secret value from AWS Secrets Manager
 */
async function getSecretFromAWS(secretArn: string): Promise<string> {
  try {
    const client = new SecretsManagerClient({
      // TODO: Provide a sensible region default or allow override per secret.
      region: process.env.AWS_REGION,
    });

    const command = new GetSecretValueCommand({
      SecretId: secretArn,
    });

    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret value is empty or binary (expected string)`);
    }

    return response.SecretString;
  } catch (error) {
    logger.error(`❌ Failed to load secret from AWS Secrets Manager:`, error);
    throw error;
  }
}
