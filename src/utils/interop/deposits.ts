import { logger } from '../logger/logging-utils';
import { getCosmosSigner, getEvmSigner, getSvmSigner } from '../signers';

import { CHAIN_CONFIGS, CHAIN_IDS } from './constants';
import { getUsdcBalance } from './balances';
import { executeRoute, getUsdcRoutes, generateUserAddresses } from './skip';

export { depositMaxUsdc };

/**
 * Deposits all the USDC balance from the given route so that it's rebalanced.
 *
 * This function will:
 * - Get the USDC balance
 * - Get the Skip routes
 * - Generate the user addresses
 * - Execute the deposit
 *
 * @param srcChain - The chain to deposit from
 * @param walletAddress - The address to deposit from
 * @param walletSeed - The seed of the account on the source chain
 * @param dYdXAddress - The address to deposit to
 * @param dYdXSeed - The seed of the account on dYdX
 */
async function depositMaxUsdc(
  srcChain: string,
  walletAddress: string,
  walletSeed: string,
  dYdXAddress: string,
  dYdXSeed: string
) {
  logger.info(`Depositing all from ${walletAddress} on ${srcChain} to ${dYdXAddress} on dYdX`);

  const srcChainId = CHAIN_IDS[srcChain];
  const dYdXChainId = CHAIN_IDS['dydx'];

  const walletBalance = await getUsdcBalance(srcChainId, walletAddress);
  logger.debug(`wallet balance: ${walletBalance.formattedAmount} USDC`);

  if (walletBalance.amount === 0n) {
    logger.info(`No USDC balance found for ${walletAddress} on ${srcChain} - aborting deposit`);
    return;
  }

  const { slow, fast } = await getUsdcRoutes(srcChainId, dYdXChainId, walletBalance.amountStr);
  const skipRoute = fast ?? slow;
  logger.info(
    `Found skip route: ${skipRoute.requiredChainAddresses.map(c => `${CHAIN_CONFIGS[c].yamlKey}`).join(' -> ')}`
  );

  const userAddresses = await generateUserAddresses(skipRoute.requiredChainAddresses, walletSeed, dYdXSeed);
  logger.debug(`Addresses: ${userAddresses.map(a => `${a.address}`).join(' -> ')}`);

  await executeRoute({
    getCosmosSigner: async (chainId: string) => {
      return await getCosmosSigner(CHAIN_CONFIGS[chainId].bech32Prefix, dYdXSeed);
    },
    getEvmSigner: async (chainId: string) => {
      return await getEvmSigner(CHAIN_CONFIGS[chainId].getRpcEndpoint(), CHAIN_CONFIGS[chainId].derivationPath, walletSeed);
    },
    getSvmSigner: async () => {
      return await getSvmSigner(CHAIN_CONFIGS.solana.derivationPath, walletSeed);
    },
    route: skipRoute,
    userAddresses,
  });

  // TODO sweep Noble balance
}
