import { Account, createWalletClient, http, WalletClient } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

export { getEvmSigner, deriveEvmAddress };

/**
 * Gets a Viem WalletClient for Skip API's executeRoute
 * @param rpcEndpoint - The RPC endpoint to create the wallet client for
 * @param derivationPath - The derivation path - default for EVMs: m/44'/60'/0'/0/0
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns A Viem WalletClient compatible with Skip API
 */
function getEvmSigner(rpcEndpoint: string, derivationPath: string, mnemonic: string): WalletClient {
  // Convert mnemonic directly to Viem account with derivation path
  const account = getAccount(derivationPath, mnemonic);

  // Create WalletClient with transport
  return createWalletClient({
    account,
    transport: http(rpcEndpoint),
  });
}

/**
 * Derives an EVM address from a mnemonic (for address-only operations)
 * @param derivationPath - The derivation path - default for EVMs: m/44'/60'/0'/0/0
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns The derived address
 */
function deriveEvmAddress(derivationPath: string, mnemonic: string): string {
  const account = getAccount(derivationPath, mnemonic);
  return account.address;
}

// --------- HELPER FUNCTIONS ---------

/**
 * Gets an account from a mnemonic and derivation path
 * @param derivationPath - The derivation path - default for EVMs: m/44'/60'/0'/0/0
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns The account
 */
function getAccount(derivationPath: string, mnemonic: string): Account {
  const pathParts = derivationPath.split('/');
  const addressIndex = parseInt(pathParts[4] || '0');
  const changeIndex = parseInt(pathParts[3] || '0');

  return mnemonicToAccount(mnemonic, { addressIndex, changeIndex });
}
