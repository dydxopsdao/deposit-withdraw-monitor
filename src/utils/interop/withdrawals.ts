import { CHAIN_IDS } from '../../config/chains';
import { USDC_ASSET_ID, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '../../config/constants';

import { logger } from '../logger/logging-utils';

import { deriveCosmosAddress, getCosmosSigner } from '../helpers/cosmos';

import { getFreeCollateral, UsdcBalance } from './balances';
import { getUsdcRoutes, UserAddress, executeRoute } from './skip';

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
 * @param toAddress - The address to withdraw to
 * @param toChain - The chain to withdraw to
 */
export async function withdrawMaxUsdc(
  dYdXAddress: string,
  dYdXSeed: string,
  toAddress: string,
  toChain: string
): Promise<void> {
  logger.info(`Withdrawing all from ${dYdXAddress} on dYdX to ${toAddress} on ${toChain}`);

  const dYdXChainId = CHAIN_IDS['dydx'];
  const toChainId = CHAIN_IDS[toChain];

  const dYdXBalance: UsdcBalance = await getFreeCollateral(dYdXAddress);
  logger.debug(`dYdX balance: ${dYdXBalance.formattedAmount} USDC`);

  if (dYdXBalance.amount === BigInt(0)) {
    logger.warn(`No free collateral found for ${dYdXAddress} on dYdX`);
    return;
  }

  const { slow, fast } = await getUsdcRoutes(dYdXChainId, toChainId, dYdXBalance.amountStr);
  const skipRoute = fast ?? slow;

  // These are also present in the Skip Route.
  // While we can generate dynamically, for the sake of safety, we'll force the withdrawal to happen via Noble.
  const userAddresses: UserAddress[] = [
    {
      address: dYdXAddress,
      chainId: dYdXChainId,
    },
    {
      address: await deriveCosmosAddress(CHAIN_IDS.noble, dYdXSeed),
      chainId: CHAIN_IDS.noble,
    },
    {
      address: toAddress,
      chainId: toChainId,
    },
  ];

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
