import {
  UserAddress,
  executeRoute,
  setClientOptions,
  SkipClientOptions,
  balances,
  RouteRequest,
  route,
  Route,
  messagesDirect,
  Tx,
  CosmosTx,
} from '@skip-go/client';

import { NobleClient, LocalWallet } from '@dydxprotocol/v4-client-js';
//import { MsgWithdrawFromSubaccount } from '@dydxprotocol/v4-client-js';
import { MsgWithdrawFromSubaccount } from '@dydxprotocol/v4-proto/src/codegen/dydxprotocol/sending/transfer.js';

import { deriveCosmosAddress, deriveEvmAddress, deriveSvmAddress } from '../signers';

import {
  assertInteropSecrets,
  CHAIN_CONFIGS,
  CHAIN_IDS,
  DEFAULT_TRANSACTION_MEMO,
  SKIP_API_URL,
  NOBLE_GAS_MULTIPLIER,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from './constants';

export { configureSkipClient, executeRoute, getBalances, getUsdcRoutes, generateUserAddresses, sweepNobleBalance };

/**
 * Configures the Skip client so that it knows how to withdraw from dYdX.
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
  amount: bigint | string
): Promise<{ slow: Route; fast: Route }> {
  const routeOptions: RouteRequest = {
    allowMultiTx: true,
    allowSwaps: true,
    sourceAssetDenom: CHAIN_CONFIGS[sourceChainId].usdcDenom,
    sourceAssetChainId: sourceChainId,
    destAssetDenom: CHAIN_CONFIGS[destChainId].usdcDenom,
    destAssetChainId: destChainId,
    amountIn: amount.toString(),
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
async function generateUserAddresses(chainIds: string[], walletSeed: string, dYdXSeed: string): Promise<UserAddress[]> {
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

/**
 * Sweeps the noble balance to the dYdX account. 
 *
 * This function will:
 * - Get the message direct transaction for the noble -> dYdX transfer
 * - Parse the message direct transaction to get the IBC message
 * - Simulate the transaction to get the fee and adjust the amount for the fee
 * - Send the transaction
 *
 * @param dYdXSeed - The seed of the account on dYdX
 * @param amount - The amount to sweep
 */
async function sweepNobleBalance(dYdXSeed: string, amount: bigint | string) {
  const dYdXChainId = CHAIN_IDS['dydx'];
  const dYdXChainConfig = CHAIN_CONFIGS[dYdXChainId];
  const nobleChainId = CHAIN_IDS['noble'];
  const nobleChainConfig = CHAIN_CONFIGS[nobleChainId];

  const dYdXAddress = await deriveCosmosAddress(dYdXChainConfig.bech32Prefix, dYdXSeed);
  const nobleWallet = await LocalWallet.fromMnemonic(dYdXSeed, nobleChainConfig.bech32Prefix);
  const nobleAddress = nobleWallet.address ?? (await deriveCosmosAddress(nobleChainConfig.bech32Prefix, dYdXSeed));

  // Get the Skip route for the noble -> dYdX transfer
  const msgDirectResponse = await messagesDirect({
    sourceAssetDenom: nobleChainConfig.usdcDenom,
    sourceAssetChainId: nobleChainId,
    destAssetDenom: dYdXChainConfig.usdcDenom,
    destAssetChainId: dYdXChainId,
    chainIdsToAddresses: {
      [dYdXChainId]: dYdXAddress,
      [nobleChainId]: nobleAddress,
    },
    amountIn: amount.toString(),
    slippageTolerancePercent: '1',
  });

  // Get the Cosmos message from the Skip route
  const msgDirectTx = msgDirectResponse?.txs?.at(0);
  const cosmosTx = msgDirectTx && isCosmosTx(msgDirectTx) ? msgDirectTx.cosmosTx : null;
  const msg = cosmosTx?.msgs?.at(0);

  if (msg == null || msg.msgTypeUrl == null) {
    throw new Error(`No msg found in msgDirectResponse: ${JSON.stringify(msgDirectTx)}`);
  }

  // Parse the Cosmos message
  type NobleIbcMsg = {
    source_port: string;
    source_channel: string;
    token: {
      denom: string;
      amount: string;
    };
    sender: string;
    receiver: string;
    timeout_height: any; // This is usually an empty object but Skip may return something here.
    timeout_timestamp: number;
  };
  const parsedMsg = JSON.parse(msg.msg ?? '') as NobleIbcMsg;

  // Create the IBC message from the parsed cosmos message
  const ibcMsg = {
    typeUrl: msg.msgTypeUrl, // '/ibc.applications.transfer.v1.MsgTransfer'
    value: {
      ...parsedMsg,
      sourceChannel: parsedMsg.source_channel,
      sourcePort: parsedMsg.source_port,
      timeoutHeight: parsedMsg.timeout_height,
      timeoutTimestamp: parsedMsg.timeout_timestamp,
    },
  };

  // Simulate the transaction to get the fee and adjust the amount for the fee
  const nobleClient = new NobleClient(nobleChainConfig.getRpcEndpoint());
  await nobleClient.connect(nobleWallet);

  const fee = await nobleClient.simulateTransaction([ibcMsg]);

  const feeAdjustedAmount =
    parseInt(ibcMsg.value.token.amount, 10) - Math.floor(parseInt(fee.amount[0]!.amount, 10) * NOBLE_GAS_MULTIPLIER);

  ibcMsg.value.token.amount = feeAdjustedAmount.toString();

  if (feeAdjustedAmount <= 0) {
    throw new Error(
      `fee to ibc send is greater than amount to be transferred. amount: ${
        parsedMsg.token.amount
      } fee: ${JSON.stringify(fee)}, feeAdjustedAmount: ${feeAdjustedAmount}`
    );
  }

  // Send the transaction
  await nobleClient.send([ibcMsg], undefined, `${DEFAULT_TRANSACTION_MEMO} | ${nobleAddress}`);
}

// --------- HELPER FUNCTIONS ---------

function isCosmosTx(tx: Tx): tx is { cosmosTx: CosmosTx; operationsIndices: number[] } {
  return 'cosmosTx' in tx;
}
