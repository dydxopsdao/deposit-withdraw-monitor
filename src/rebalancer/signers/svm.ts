import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import { Adapter } from '@solana/wallet-adapter-base';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

export { getSvmSigner, deriveSvmAddress };

/**
 * Gets a Solana signer for Skip API's executeRoute
 * @param derivationPath - The derivation path - default for Solana: m/44'/501'/0'/0'
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns A Solana Adapter compatible with Skip API
 */
function getSvmSigner(derivationPath: `m/44'/501'/${string}`, mnemonic: string): Adapter {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const keypair = keypairFromMnemonic(derivationPath, mnemonic);

  const adapter = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if ('partialSign' in tx) {
        // Transaction type
        tx.partialSign(keypair);
      } else {
        // VersionedTransaction type
        tx.sign([keypair]);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      return txs.map(tx => {
        if ('partialSign' in tx) {
          tx.partialSign(keypair);
        } else {
          tx.sign([keypair]);
        }
        return tx;
      });
    },
  } as Adapter;

  return adapter;
}

/**
 * Derives a Solana address from a mnemonic (for debugging/consistency)
 * @param derivationPath - The derivation path - default for Solana: m/44'/501'/0'/0'
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns The derived address in base58 format
 */
function deriveSvmAddress(derivationPath: `m/44'/501'/${string}`, mnemonic: string): string {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const keypair = keypairFromMnemonic(derivationPath, mnemonic);
  return keypair.publicKey.toBase58();
}

// --------- HELPER FUNCTIONS ---------

/**
 * Derives a Solana keypair from a mnemonic
 * @param derivationPath - The derivation path - default for Solana: m/44'/501'/0'/0'
 * @param mnemonic - The BIP39 mnemonic phrase
 * @returns The derived keypair
 */
function keypairFromMnemonic(derivationPath: `m/44'/501'/${string}`, mnemonic: string): Keypair {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derived = derivePath(derivationPath, seed.toString('hex'));
  return Keypair.fromSeed(derived.key);
}
