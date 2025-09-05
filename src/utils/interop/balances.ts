import { formatUnits, parseUnits } from 'viem';

import { CHAIN_CONFIGS } from '../../config/chains';
import { INDEXER_API_URL } from '../../config/constants';

import { getBalances } from './skip';

// The USDC balance for a given address on a given chain
export interface UsdcBalance {
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
export async function getUsdcBalance(walletAddress: string, chainId: string): Promise<UsdcBalance> {
  const usdcDenom = CHAIN_CONFIGS[chainId]?.usdcDenom;
  if (!usdcDenom) {
    throw new Error(`No USDC denom found for chain ${chainId}`);
  }

  const balances = await getBalances(walletAddress, [chainId]);

  return {
    amount: balances?.chains[chainId]?.denoms[usdcDenom]?.amount as unknown as bigint,
    amountStr: balances?.chains[chainId]?.denoms[usdcDenom]?.amount.toString(),
    formattedAmount: balances?.chains[chainId]?.denoms[usdcDenom]?.formattedAmount,
  } as UsdcBalance;
}

/**
 * Gets the free collateral of a dYdX account
 * @param dYdXAddress - The address of the dYdX account
 * @returns The free collateral of the dYdX account in USDC
 */
export async function getFreeCollateral(dYdXAddress: string): Promise<UsdcBalance> {
  const response = await fetch(`${INDEXER_API_URL}/v4/addresses/${dYdXAddress}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  const freeCollateral = parseUnits(data.subaccounts[0].freeCollateral, 6) as bigint;

  return {
    amount: freeCollateral,
    amountStr: freeCollateral.toString(),
    formattedAmount: formatUnits(freeCollateral, 6),
  } as UsdcBalance;
}
