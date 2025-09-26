// Import specific functions and constants from individual modules
import { CHAIN_IDS, CHAIN_CONFIGS } from './constants';
import { withdrawMaxUsdc } from './withdraw';
import { depositMaxUsdc } from './deposit';
import { getUsdcBalance, getFreeCollateral } from './balances';
import { configureSkipClient, getBalances, getUsdcRoutes, executeRoute } from './skip';

// Export the constants
export { CHAIN_IDS, CHAIN_CONFIGS };

// Create and export the namespace object as default
export default {
  withdrawMaxUsdc,
  depositMaxUsdc,
  getUsdcBalance,
  getFreeCollateral,
  configureSkipClient,
  getBalances,
  getUsdcRoutes,
  executeRoute,
} as const;
