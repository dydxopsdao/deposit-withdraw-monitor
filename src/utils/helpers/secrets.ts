import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../logger/logging-utils';

/**
 * Loads secrets from AWS Secrets Manager and populates process.env
 */
export async function loadSecretsFromAWS(): Promise<void> {
  await loadSeedPhrases();
  await loadWalletPassword();
}

/**
 * Loads seed phrases. Only runs when SEED_PHRASES_SECRET_ARN is present
 */
async function loadSeedPhrases(): Promise<void> {
  const secretArn = process.env.SEED_PHRASES_SECRET_ARN;
  
  // Skip if no AWS secrets configured
  if (!secretArn) {
    logger.info("No AWS Secrets Manager secrets configured, skipping seed phrases load");
    return;
  }

  try {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION
    });

    const command = new GetSecretValueCommand({
      SecretId: secretArn
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty or binary (expected JSON string)');
    }

    const seedPhrases = JSON.parse(response.SecretString) as Record<string, string>;
    
    // Overwrite process.env with seed phrases
    for (const [key, value] of Object.entries(seedPhrases)) {
      process.env[key] = value;
    }

    logger.info(`🥷 Loaded ${Object.keys(seedPhrases).length} seed phrases from AWS Secrets Manager`);
  } catch (error) {
    logger.error('❌ Failed to load seed phrases from AWS Secrets Manager:', error);
    throw error;
  }
}

/**
 * Loads wallet password. Only runs when WALLET_PASSWORD_SECRET_ARN is present
 */
async function loadWalletPassword(): Promise<void> {
  const secretArn = process.env.WALLET_PASSWORD_SECRET_ARN;
  
  // Skip if no AWS secrets configured
  if (!secretArn) {
    logger.info("No AWS Secrets Manager wallet password secret configured, skipping wallet password load");
    return;
  }

  try {
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION
    });

    const command = new GetSecretValueCommand({
      SecretId: secretArn
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Wallet password secret value is empty or binary (expected string)');
    }

    // Set the wallet password directly in process.env
    process.env.WALLET_PASSWORD = response.SecretString;

    logger.info(`🔐 Loaded wallet password from AWS Secrets Manager`);
  } catch (error) {
    logger.error('❌ Failed to load wallet password from AWS Secrets Manager:', error);
    throw error;
  }
}
