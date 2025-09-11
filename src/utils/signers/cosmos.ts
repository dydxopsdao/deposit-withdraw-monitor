import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

export { getCosmosSigner, deriveCosmosAddress };

/**
 * Gets an offline Cosmos signer for a given bech32 prefix and mnemonic
 * @param bech32Prefix - The chain's bech32 prefix to get the signer for
 * @param mnemonic - The mnemonic to get the signer for
 * @returns The Cosmos signer
 */
async function getCosmosSigner(bech32Prefix: string, mnemonic: string): Promise<DirectSecp256k1HdWallet> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: bech32Prefix,
  });

  return wallet;
}

/**
 * Derives an address for a given bech32 prefix from a mnemonic (offline)
 * @param bech32Prefix - The chain's bech32 prefix to derive the address for
 * @param mnemonic - The mnemonic to derive the address from
 * @returns The derived address
 */
async function deriveCosmosAddress(bech32Prefix: string, mnemonic: string): Promise<string> {
  const wallet = await getCosmosSigner(bech32Prefix, mnemonic);

  const [account] = await wallet.getAccounts();
  return account.address;
}
