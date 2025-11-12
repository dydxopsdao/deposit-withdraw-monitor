import { formatUnits, parseUnits } from 'viem';
import Long from 'long';

import { LocalWallet, ValidatorClient, BroadcastMode, encodeJson, SubaccountInfo } from '@dydxprotocol/v4-client-js';

import {
  CHAIN_CONFIGS,
  CHAIN_IDS,
  DEFAULT_TRANSACTION_MEMO,
  INDEXER_API_URL,
  DYDX_NATIVE_DECIMALS,
  DYDX_USDC_ASSET_ID,
  DYDX_USDC_DECIMALS,
} from './constants';
import { getBalances } from './skip';

import { logger } from '../../logger';

export { parseUsdcAmount, getWalletBalances, getUsdcBalance, getFreeCollateral, depositToSubaccount };
export type { TokenAmount, WalletBalances };

// The TokenAmount is a type that represents a token amount with an amount and a formatted amount
interface TokenAmount {
  amount: bigint;
  formattedAmount: string;
}

// The WalletBalances is a type that represents the balances of a wallet with a native token and a USDC balance
interface WalletBalances {
  native: TokenAmount;
  usdc: TokenAmount;
}

/**
 * Creates a new TokenAmount with USDC decimals from a bigint, string, or number
 * @param amount - The amount to create the UsdcAmount from. Can be a bigint,
 *   a string with formatted amount (e.g., "0.5"), a string containing a bigint
 *   value (e.g., "500000"), or a number (e.g., 0.05).
 * @returns The new TokenAmount
 */
function parseUsdcAmount(amount: bigint | string | number): TokenAmount {
  if (typeof amount === 'bigint') {
    return {
      amount,
      formattedAmount: formatUnits(amount, DYDX_USDC_DECIMALS),
    };
  }
  if (typeof amount === 'number') {
    // Convert number to string and then parse as formatted amount
    const formattedAmount = amount.toString();
    const parsedAmount = parseUnits(formattedAmount, DYDX_USDC_DECIMALS);
    return {
      amount: parsedAmount,
      formattedAmount: formattedAmount,
    };
  }
  if (typeof amount === 'string') {
    // Treat as formatted amount (e.g., "0.5")
    const parsedAmount = parseUnits(amount, DYDX_USDC_DECIMALS);
    return {
      amount: parsedAmount,
      formattedAmount: amount,
    };
  }
  throw new Error('Invalid parameter type');
}

/**
 * Gets the balances for the native token and USDC for a given address on a given chain
 * @param chainId - The chain ID to get the balances for the native token and USDC
 * @param walletAddress - The address to get the balances for
 * @returns The balances for the native token and USDC for the given address on the given chain
 */
async function getWalletBalances(chainId: string, walletAddress: string): Promise<WalletBalances> {
  const nativeTokenDenom = CHAIN_CONFIGS[chainId]?.nativeDenom;
  if (!nativeTokenDenom) {
    throw new Error(`No native token denom found for chain ${chainId}`);
  }

  const usdcDenom = CHAIN_CONFIGS[chainId]?.usdcDenom;
  if (!usdcDenom) {
    throw new Error(`No USDC denom found for chain ${chainId}`);
  }

  const balances = await getBalances(walletAddress, [chainId]);

  const nativeBalance = {
    amount: BigInt(balances?.chains[chainId]?.denoms[nativeTokenDenom]?.amount ?? '0'),
    formattedAmount: balances?.chains[chainId]?.denoms[nativeTokenDenom]?.formattedAmount ?? '0',
  };

  const usdcBalance = {
    amount: BigInt(balances?.chains[chainId]?.denoms[usdcDenom]?.amount ?? '0'),
    formattedAmount: balances?.chains[chainId]?.denoms[usdcDenom]?.formattedAmount ?? '0',
  };

  return {
    native: nativeBalance,
    usdc: usdcBalance,
  };
}

/**
 * Gets the USDC balance for a given address on a given chain
 * @param chainId - The chain ID to get the balance for
 * @param walletAddress - The address to get the balance for
 * @returns The USDC balance for the address on the given chain in USDC
 */
async function getUsdcBalance(chainId: string, walletAddress: string): Promise<TokenAmount> {
  return await getWalletBalances(chainId, walletAddress).then(balances => balances.usdc);
}

/**
 * Gets the free collateral of a dYdX account
 * @param dYdXAddress - The address of the dYdX account
 * @returns The free collateral of the dYdX account in USDC
 */
async function getFreeCollateral(dYdXAddress: string): Promise<TokenAmount> {
  const response = await fetch(`${INDEXER_API_URL}/v4/addresses/${dYdXAddress}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  // The response is a formatted string, so we need to parse it into a bigint
  return parseUsdcAmount(data?.subaccounts?.[0]?.freeCollateral || '0');
}

/**
 * Deposits the given amount to the subaccount of the given address
 * @param dYdXSeed - The seed of the account on dYdX
 * @param amount - The amount to deposit to the subaccount
 */
async function depositToSubaccount(dYdXSeed: string, amount: bigint | string) {
  const dYdXChainId = CHAIN_IDS['dydx'];
  const dYdXChainConfig = CHAIN_CONFIGS[dYdXChainId];

  const dYdXWallet = await LocalWallet.fromMnemonic(dYdXSeed, dYdXChainConfig.bech32Prefix);

  const validatorClient = await ValidatorClient.connect({
    restEndpoint: dYdXChainConfig.getRpcEndpoint(),
    chainId: dYdXChainId,
    denoms: {
      USDC_DENOM: dYdXChainConfig.usdcDenom,
      USDC_DECIMALS: DYDX_USDC_DECIMALS,
      CHAINTOKEN_DENOM: dYdXChainConfig.nativeDenom,
      CHAINTOKEN_DECIMALS: DYDX_NATIVE_DECIMALS,
    },
  });

  const subaccount = SubaccountInfo.forLocalWallet(dYdXWallet, 0);

  const msg = validatorClient.post.composer.composeMsgDepositToSubaccount(
    subaccount.address,
    subaccount.subaccountNumber,
    DYDX_USDC_ASSET_ID,
    Long.fromValue(amount.toString())
  );

  if (msg == null) {
    throw new Error('invalid deposit to subaccount message generated');
  }

  try {
    const response = await validatorClient.post.send(
      subaccount,
      () => Promise.resolve([msg]),
      false,
      undefined,
      DEFAULT_TRANSACTION_MEMO,
      'broadcast_tx_sync' as BroadcastMode
    );

    if (!response?.hash) {
      throw new Error(`no hash found in response: ${encodeJson(response)}`);
    }

    const txBlockNumber = await waitForTxToBeIncludedInBlock(
      dYdXChainConfig.getRpcEndpoint(),
      typeof response.hash === 'string' ? response.hash : Buffer.from(response.hash).toString('hex')
    );
    // Add 5 blocks to the tx block number to account for potential indexer lag
    await waitForIndexerToCatchUp(txBlockNumber.add(5));
  } catch (error) {
    throw new Error(`error sending deposit to subaccount: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --------- HELPER FUNCTIONS ---------

async function waitForTxToBeIncludedInBlock(
  rpcEndpoint: string,
  txHash: string,
  pollMs = 500,
  maxPolls = 30
): Promise<Long> {
  for (let i = 0; i < maxPolls; i++) {
    const response = await fetch(`${rpcEndpoint}/tx?hash=0x${txHash}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();

    if (!responseData?.error && responseData?.result?.height) {
      logger.debug(`Tx ${txHash} found in block ${responseData?.result?.height}`);
      return Long.fromValue(responseData?.result?.height ?? '0');
    }

    logger.debug(`Tx ${txHash} not found in block, waiting for ${pollMs}ms`);
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  throw new Error(`Tx ${txHash} not found in block after ${maxPolls * pollMs}ms`);
}

async function waitForIndexerToCatchUp(targetBlock: Long, pollMs = 500, maxPolls = 30): Promise<void> {
  for (let i = 0; i < maxPolls; i++) {
    const indexerHeightResponse = await fetch(`${INDEXER_API_URL}/v4/height`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const indexerHeight = await indexerHeightResponse.json();
    const indexerHeightNumber = Long.fromValue(indexerHeight.height);

    if (indexerHeightNumber.greaterThanOrEqual(targetBlock)) {
      logger.debug(`Indexer is at ${indexerHeightNumber}, target block is ${targetBlock}, catching up complete`);
      return;
    }

    logger.debug(`Indexer is at ${indexerHeightNumber}, target block is ${targetBlock}, waiting for ${pollMs}ms`);
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  throw new Error(`Indexer has not caught up after ${maxPolls * pollMs}ms`);
}
