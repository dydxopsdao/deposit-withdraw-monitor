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

//import { MsgWithdrawFromSubaccount } from '@dydxprotocol/v4-client-js';
import { MsgWithdrawFromSubaccount } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/transfer.js';

import { deriveCosmosAddress, deriveEvmAddress, deriveSvmAddress } from '../signers';

import { assertInteropSecrets, CHAIN_CONFIGS, CHAIN_IDS, SKIP_API_URL, TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT } from './constants';

export { configureSkipClient, executeRoute, getBalances, getUsdcRoutes, generateUserAddresses };

/**
 * Configures the Skip client so that it knows hot to withdraw from dYdX.
 */
const configureSkipClient = (): void => {
  assertInteropSecrets();

  const options: SkipClientOptions = {
    apiUrl: SKIP_API_URL, // Skip's main API endpoint
    endpointOptions: {
      getRpcEndpointForChain: async (chainId: string) => {
        const endpoint = CHAIN_CONFIGS[chainId].getRpcEndpoint();
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
async function getBalances(walletAddress: string, chainIds: string[]): Promise<BalanceResponse> {
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
 * Gets the skip routes for a given source and destination chain and USDC amount
 * @param sourceChainId - The source chain ID
 * @param destChainId - The destination chain ID
 * @param amount - The amount to route
 * @returns The skip routes
 */
async function getUsdcRoutes(
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

/**
 * Generates the user addresses for a given set of chain IDs, wallet address, and dYdX seed for the Cosmos chains
 * @param chainIds - The chain IDs to generate the user addresses for
 * @param walletSeed - The wallet seed to generate the user addresses for
 * @param dYdXSeed - The dYdX seed to generate the user addresses for the Cosmos chains
 * @returns The user addresses
 */
async function generateUserAddresses(
  chainIds: string[],
  walletSeed: string,
  dYdXSeed: string
): Promise<UserAddress[]> {
  const userAddresses: UserAddress[] = [];

  for (const chainId of chainIds) {
    switch (chainId) {
      case CHAIN_IDS.dydx:
      case CHAIN_IDS.noble:
      case CHAIN_IDS.osmosis:
      case CHAIN_IDS.neutron:
        // For Cosmos chains: derive the address from the dYdX seed
        userAddresses.push({
          chainId: chainId,
          address: await deriveCosmosAddress(CHAIN_CONFIGS[chainId].bech32Prefix, dYdXSeed),
        });
        break;
      case CHAIN_IDS.ethereum:
      case CHAIN_IDS.base:
      case CHAIN_IDS.arbitrum:
      case CHAIN_IDS.polygon:
        // For EVM chains: derive the address from the wallet seed
        userAddresses.push({
          chainId: chainId,
          address: deriveEvmAddress(CHAIN_CONFIGS[chainId].derivationPath, walletSeed),
        });
        break;
      case CHAIN_IDS.solana:
        // For Solana: derive the address from the wallet seed
        userAddresses.push({
          chainId: chainId,
          address: deriveSvmAddress(CHAIN_CONFIGS.solana.derivationPath, walletSeed),
        });
        break;
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  return userAddresses;
}
