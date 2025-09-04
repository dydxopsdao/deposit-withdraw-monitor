import {
  UserAddress,
  executeRoute,
  setClientOptions,
  SkipClientOptions,
  balances,
  RouteRequest,
  route,
  Route,
} from '@skip-go/client';
import { MsgWithdrawFromSubaccount } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/transfer';

import { CHAIN_CONFIGS } from '../../config/chains';
import { SKIP_API_URL, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from '../../config/constants';

export type { UserAddress };
export { executeRoute };

/**
 * Configures the Skip client so that it knows hot to withdraw from dYdX.
 */
export const configureSkipClient = (): void => {
  const options: SkipClientOptions = {
    apiUrl: SKIP_API_URL, // Skip's main API endpoint
    endpointOptions: {
      getRpcEndpointForChain: async (chainId: string) => {
        const endpoint = CHAIN_CONFIGS[chainId].rpcEndpoint;
        if (!endpoint) {
          throw new Error(`No RPC endpoint found for chainId: ${chainId}`);
        }
        return endpoint;
      },
    },
    registryTypes: [[TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT, MsgWithdrawFromSubaccount]],
  };

  setClientOptions(options);
};

// Define the Skip API balance request structure
interface BalanceRequest {
  chains: {
    [chainId: string]: {
      address: string;
      denoms: string[];
    };
  };
}

// Define the Skip API balance response structure
interface BalanceResponse {
  chains: {
    [chainId: string]: {
      denoms: {
        [denom: string]: {
          amount: string;
          formattedAmount: string;
        };
      };
    };
  };
}

/**
 * Gets the balances for a given wallet on a given set of chains
 * @param walletAddress - The address of the wallet
 * @param chainIds - The IDs of the chains to get the balances for
 * @returns The balances for the wallet on the given chains
 */
export async function getBalances(walletAddress: string, chainIds: string[]): Promise<BalanceResponse | null> {
  // Build the balance request with chain-specific denoms
  const balanceRequest: BalanceRequest = {
    chains: chainIds.reduce((acc, chainId) => {
      const nativeDenom = CHAIN_CONFIGS[chainId].nativeDenom;
      const usdcDenom = CHAIN_CONFIGS[chainId].usdcDenom;

      if (!nativeDenom || !usdcDenom) {
        throw new Error(`Missing denom mapping for chain ${chainId}: ${nativeDenom} or ${usdcDenom}`);
      }

      acc[chainId] = {
        address: walletAddress,
        denoms: [nativeDenom, usdcDenom], // Each chain gets its native coin + USDC
      };
      return acc;
    }, {} as Record<string, { address: string; denoms: string[] }>),
  };

  // Call Skip's balance API
  const balanceResponse = await balances(balanceRequest);

  return balanceResponse as BalanceResponse;
}

/**
 * Gets the skip routes for a given source and destination chain and amount
 * @param sourceChainId - The source chain ID
 * @param destChainId - The destination chain ID
 * @param amount - The amount to route
 * @returns The skip routes
 */
export async function getRoutesForUsdc(
  sourceChainId: string,
  destChainId: string,
  amount: string
): Promise<{ slow: Route; fast: Route }> {
  const routeOptions: RouteRequest = {
    allowMultiTx: true,
    allowSwaps: true,
    sourceAssetDenom: CHAIN_CONFIGS[sourceChainId].usdcDenom,
    sourceAssetChainId: sourceChainId,
    destAssetDenom: CHAIN_CONFIGS[destChainId].usdcDenom,
    destAssetChainId: destChainId,
    amountIn: amount,
    smartRelay: true,
    smartSwapOptions: { evmSwaps: true, splitRoutes: true },
    allowUnsafe: false,
  };

  const [slow, fast] = await Promise.all([route(routeOptions), route({ ...routeOptions, goFast: true })]);

  return { slow: slow as Route, fast: fast as Route };
}
