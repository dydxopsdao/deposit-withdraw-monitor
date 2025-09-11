import { CHAIN_CONFIGS, CHAIN_IDS } from '../../config/chains';
import { logger } from '../logger/logging-utils';
import { getUsdcBalance } from './balances';
import { executeRoute, getUsdcRoutes, generateUserAddresses } from './skip';
import { getCosmosSigner, getEvmSigner, getSvmSigner } from '../signers';

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
    logger.warn(`No USDC balance found for ${walletAddress} on ${srcChain}`);
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
      return await getCosmosSigner(chainId, dYdXSeed);
    },
    getEvmSigner: async (chainId: string) => {
      return await getEvmSigner(chainId, walletSeed);
    },
    getSvmSigner: async () => {
      return await getSvmSigner(walletSeed);
    },
    route: skipRoute,
    userAddresses,
  });

  // TODO sweep Noble balance
}
