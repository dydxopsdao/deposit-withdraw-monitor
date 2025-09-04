
import { CHAIN_IDS } from "../../config/chains";
import { USDC_ASSET_ID, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from "../../config/constants";

import { logger } from '../logger/logging-utils';

import { deriveCosmosAddress, getCosmosSigner } from "../helpers/cosmos";

import { getdYdXFreeCollateral } from "./balances";
import { getRoutesForUsdc, UserAddress, executeRoute } from "./skip";

/**
 * Withdraws all the dYdX balance from the given route so that it's rebalanced.
 * 
 * This function will:
 * - Get the dYdX balance
 * - Get the Skip routes
 * - Generate the user addresses
 * - Execute the withdrawal
 * 
 * @param route - The route to withrraw on so that it's rebalanced.
 */
export async function withdrawAll(dYDXAddress: string, dYdXSeed: string, toAddress: string, toChain: string): Promise<void> {
    logger.info(
      `Withdrawing all from ${dYDXAddress} on dYdX to ${toAddress} on ${toChain}`
    );

    const dYdXChainId = CHAIN_IDS["dydx"];
    const toChainId = CHAIN_IDS[toChain];
  
    const dYdXBalance = await getdYdXFreeCollateral(dYDXAddress);
    logger.debug(`dYdX balance: ${dYdXBalance.formattedAmount} USDC`);
  
    const { slow, fast } = await getRoutesForUsdc(dYdXChainId, toChainId, dYdXBalance.toString());
    
    // These are also present in the Skip Route.
    // While we can generate dynamically, for the sake of safety, we'll force the withdrawal to happen via Noble.
    const userAddresses: UserAddress[] = [
      {
        address: dYDXAddress,
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
      route: fast,
      userAddresses,
      appendCosmosMsgs: {
        [dYdXChainId]: [{
          msgTypeUrl: TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
          msg: JSON.stringify({
            sender: {
              owner: dYDXAddress,
              number: 0,
            },
            recipient: dYDXAddress,
            assetId: USDC_ASSET_ID,
            quantums: fast?.amountIn ?? '0',
          })
        }]
      }
    });
  }