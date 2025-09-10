import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import * as bip39 from 'bip39';

/**
 * Gets an offline SVM signer for a given mnemonic
 * @param mnemonic - The BIP39 mnemonic
 * @param derivationPath - Optional derivation path (default: m/44'/501'/0'/0')
 * @returns Solana Keypair
 */
export async function getSvmSigner(mnemonic: string, derivationPath = 'm/44\'/501\'/0\'/0\''): Promise<Keypair> {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const derived = derivePath(derivationPath, seed.toString('hex'));
  return Keypair.fromSeed(derived.key);
}

/**
 * Derives a Solana address from a mnemonic
 */
export async function deriveSvmAddress(mnemonic: string, derivationPath?: string): Promise<string> {
  const keypair = await getSvmSigner(mnemonic, derivationPath);
  return keypair.publicKey.toBase58();
}
