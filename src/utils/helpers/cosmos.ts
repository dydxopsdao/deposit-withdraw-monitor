import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import { CHAIN_CONFIGS } from '../../config/chains';

/**
 * Gets an offline Cosmos signer for a given chain and mnemonic
 * @param chainId - The chain ID to get the signer for - must be a Cosmos chain
 * @param mnemonic - The mnemonic to get the signer for
 * @returns The Cosmos signer
 */
export async function getCosmosSigner(chainId: string, mnemonic: string): Promise<DirectSecp256k1HdWallet> {
    if (!CHAIN_CONFIGS[chainId]?.bech32Prefix) {
        throw new Error(`No bech32 prefix found for chain ID: ${chainId} - is it a Cosmos chain?`);
    }

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: CHAIN_CONFIGS[chainId].bech32Prefix,
    });

    return wallet;
}

/**
 * Derives an address for a given chain from a mnemonic (offline)
 * @param chainId - The chain ID to derive the address for - must be a Cosmos chain
 * @param mnemonic - The mnemonic to derive the address from
 * @returns The derived address
 */
export async function deriveCosmosAddress(chainId: string, mnemonic: string): Promise<string> {
    const wallet = await getCosmosSigner(chainId, mnemonic);

    const [account] = await wallet.getAccounts();
    return account.address;
}
