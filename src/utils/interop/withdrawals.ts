import { CHAIN_IDS } from '../../config/chains';
import { USDC_ASSET_ID, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '../../config/constants';

import { logger } from '../logger/logging-utils';

import { getCosmosSigner } from '../signers';

import { getFreeCollateral, UsdcBalance } from './balances';
import { getUsdcRoutes, executeRoute, generateUserAddresses } from './skip';

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
 * @param dYdXSeed - The seed of the dYdX account
 * @param dstChain - The chain to withdraw to
 * @param dstAddress - The address to withdraw to
 */
export async function withdrawMaxUsdc(
  dYdXAddress: string,
  dYdXSeed: string,
  dstChain: string,
  dstAddress: string
): Promise<void> {
  logger.info(`Withdrawing all from ${dYdXAddress} on dYdX to ${dstAddress} on ${dstChain}`);

  const dYdXChainId = CHAIN_IDS['dydx'];
  const dstChainId = CHAIN_IDS[dstChain];

  const dYdXBalance: UsdcBalance = await getFreeCollateral(dYdXAddress);
  logger.debug(`dYdX balance: ${dYdXBalance.formattedAmount} USDC`);

  if (dYdXBalance.amount === BigInt(0)) {
    logger.warn(`No free collateral found for ${dYdXAddress} on dYdX`);
    return;
  }

  const { slow, fast } = await getUsdcRoutes(dYdXChainId, dstChainId, dYdXBalance.amountStr);
  const skipRoute = fast ?? slow;

  const userAddresses = await generateUserAddresses(
    skipRoute.requiredChainAddresses,
    dstAddress,
    dYdXSeed
  );

  await executeRoute({
    getCosmosSigner: async (chainId: string) => {
      return await getCosmosSigner(chainId, dYdXSeed);
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
