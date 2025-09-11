import { CHAIN_CONFIGS, CHAIN_IDS } from '../../config/chains';
import { USDC_ASSET_ID, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '../../config/constants';

import { logger } from '../logger/logging-utils';

import { getCosmosSigner, getEvmSigner, getSvmSigner } from '../signers';

import { getFreeCollateral } from './balances';
import { getUsdcRoutes, executeRoute, generateUserAddresses } from './skip';

export { withdrawMaxUsdc };

/**
 * Withdraws all the dYdX free collateral from the given route so that it's rebalanced.
 *
 * This function will:
 * - Get the free collateral
 * - Get the Skip routes
 * - Generate the user addresses
 * - Execute the withdrawal
 *
 * @param dYdXAddress - The address of the dYdX account
 * @param dYdXSeed - The seed of the account on dYdX
 * @param dstChain - The chain to withdraw to
 * @param walletAddress - The address to withdraw to
 * @param walletSeed - The seed of the account on the destination chain
 */
async function withdrawMaxUsdc(
  dYdXAddress: string,
  dYdXSeed: string,
  dstChain: string,
  walletAddress: string,
  walletSeed: string
): Promise<void> {
  logger.info(`Withdrawing all from ${dYdXAddress} on dYdX to ${walletAddress} on ${dstChain}`);

  const dYdXChainId = CHAIN_IDS['dydx'];
  const dstChainId = CHAIN_IDS[dstChain];

  const dYdXBalance = await getFreeCollateral(dYdXAddress);
  logger.debug(`dYdX balance: ${dYdXBalance.formattedAmount} USDC`);

  if (dYdXBalance.amount === 0n) {
    logger.warn(`No free collateral found for ${dYdXAddress} on dYdX`);
    return;
  }

  const { slow, fast } = await getUsdcRoutes(dYdXChainId, dstChainId, dYdXBalance.amountStr);
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
    // In theory, a route can go through an EVM chain
    getEvmSigner: async (chainId: string) => {
      return await getEvmSigner(chainId, walletSeed);
    },
    // In theory, a route can go through Solana
    getSvmSigner: async () => {
      return await getSvmSigner(walletSeed);
    },
    route: skipRoute,
    userAddresses,
    appendCosmosMsgs: {
      [dYdXChainId]: [
        {
          msgTypeUrl: TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
          msg: JSON.stringify({
            sender: {
              owner: dYdXAddress,
              number: 0,
            },
            recipient: dYdXAddress,
            assetId: USDC_ASSET_ID,
            quantums: skipRoute?.amountIn ?? '0',
          }),
        },
      ],
    },
  });
}
