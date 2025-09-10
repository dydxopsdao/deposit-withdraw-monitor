import { ethers } from 'ethers';

/**
 * Gets an offline EVM signer for a given mnemonic
 * @param mnemonic - The BIP39 mnemonic phrase
 * @param derivationPath - Optional HD derivation path (default: Ethereum's m/44'/60'/0'/0/0)
 * @returns An ethers.js Wallet instance (offline)
 */
export function getEvmSigner(mnemonic: string, derivationPath = 'm/44\'/60\'/0\'/0/0'): ethers.Wallet {
  const hdNode = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic), derivationPath);

  return new ethers.Wallet(hdNode.privateKey);
}

/**
 * Derives an EVM address from a mnemonic
 */
export function deriveEvmAddress(mnemonic: string, derivationPath?: string): string {
  const wallet = getEvmSigner(mnemonic, derivationPath);
  return wallet.address;
}
