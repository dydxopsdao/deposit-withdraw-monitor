// Import specific functions and constants from individual modules
import { CHAIN_IDS, CHAIN_CONFIGS } from './constants';
import { withdrawMaxUsdc } from './withdraw';
import { depositMaxUsdc } from './deposit';
import { getWalletBalances, getUsdcBalance, getFreeCollateral, WalletBalances, TokenAmount } from './balances';
import { configureSkipClient, getBalances, getUsdcRoutes, executeRoute } from './skip';
import { deriveCosmosAddress } from '../signers/cosmos';

// Export the constants
export { CHAIN_IDS, CHAIN_CONFIGS };

// Export the types
export type { WalletBalances, TokenAmount };

// Create and export the namespace object as default
export default {
  withdrawMaxUsdc,
  depositMaxUsdc,
  getWalletBalances,
  getUsdcBalance,
  getFreeCollateral,
  configureSkipClient,
  getBalances,
  getUsdcRoutes,
  executeRoute,
  deriveCosmosAddress,
} as const;
