import { Account, createWalletClient, http, WalletClient } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../../config/chains';

/**
 * Gets a Viem WalletClient for Skip API's executeRoute
 * @param mnemonic - The BIP39 mnemonic phrase
 * @param chain - The chain to create the wallet client for
 * @returns A Viem WalletClient compatible with Skip API
 */
export function getEvmSigner(mnemonic: string, chainId: string): WalletClient {
  // Get RPC endpoint from config
  const chainConfig = CHAIN_CONFIGS[chainId];
  if (!chainConfig?.rpcEndpoint) {
    throw new Error(`No RPC endpoint found for chain ID: ${chainId}`);
  }
  if (!chainConfig?.derivationPath) {
    throw new Error(`No derivation path found for chain ID: ${chainId}`);
  }

  // Convert mnemonic directly to Viem account with derivation path
  const account = getAccount(mnemonic, chainConfig.derivationPath);

  // Create WalletClient with transport
  return createWalletClient({
    account,
    transport: http(chainConfig.rpcEndpoint),
  });
}

/**
 * Derives an EVM address from a mnemonic (for address-only operations)
 */
export function deriveEvmAddress(mnemonic: string, chainId: string): string {
  const chainConfig = CHAIN_CONFIGS[chainId];
  if (!chainConfig?.derivationPath) {
    throw new Error(`No derivation path found for chain ID: ${chainId}`);
  }

  const account = getAccount(mnemonic, chainConfig.derivationPath);
  return account.address;
}

// --------- HELPER FUNCTIONS ---------

/**
 * Gets an account from a mnemonic and derivation path
 * @param mnemonic - The BIP39 mnemonic phrase
 * @param derivationPath - The derivation path - default for EVMs: m/44'/60'/0'/0/0
 * @returns The account
 */
function getAccount(mnemonic: string, derivationPath: string): Account {
  const pathParts = derivationPath.split('/');
  const addressIndex = parseInt(pathParts[4] || '0');
  const changeIndex = parseInt(pathParts[3] || '0');

  return mnemonicToAccount(mnemonic, { addressIndex, changeIndex });
}