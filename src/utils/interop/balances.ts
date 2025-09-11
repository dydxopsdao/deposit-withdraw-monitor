import { formatUnits, parseUnits } from 'viem';

import { CHAIN_CONFIGS } from '../../config/chains';
import { INDEXER_API_URL, USDC_DECIMALS } from '../../config/constants';

import { getBalances } from './skip';

export { getUsdcBalance, getFreeCollateral };

// The USDC balance for a given address on a given chain
interface UsdcBalance {
  amount: bigint;
  amountStr: string;
  formattedAmount: string;
}

/**
 * Gets the USDC balance for a given address on a given chain
 * @param walletAddress - The address to get the balance for
 * @param chainId - The chain ID to get the balance for
 * @returns The USDC balance for the address on the given chain in USDC
 */
async function getUsdcBalance(walletAddress: string, chainId: string): Promise<UsdcBalance> {
  const usdcDenom = CHAIN_CONFIGS[chainId]?.usdcDenom;
  if (!usdcDenom) {
    throw new Error(`No USDC denom found for chain ${chainId}`);
  }

  const balances = await getBalances(walletAddress, [chainId]);
  // The response is a bigint
  const amount = BigInt(balances?.chains[chainId]?.denoms[usdcDenom]?.amount ?? '0');

  return {
    amount: amount,
    amountStr: amount.toString(),
    formattedAmount: formatUnits(amount, USDC_DECIMALS),
  } as UsdcBalance;
}

/**
 * Gets the free collateral of a dYdX account
 * @param dYdXAddress - The address of the dYdX account
 * @returns The free collateral of the dYdX account in USDC
 */
async function getFreeCollateral(dYdXAddress: string): Promise<UsdcBalance> {
  const response = await fetch(`${INDEXER_API_URL}/v4/addresses/${dYdXAddress}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  // The response is a formatted string, so we need to parse it into a bigint
  const freeCollateral = data?.subaccounts?.[0]?.freeCollateral
    ? (parseUnits(data.subaccounts[0].freeCollateral, USDC_DECIMALS) as bigint)
    : 0n;

  return {
    amount: freeCollateral,
    amountStr: freeCollateral.toString(),
    formattedAmount: formatUnits(freeCollateral, USDC_DECIMALS),
  } as UsdcBalance;
}
