// Import all functions from individual modules
import { withdrawMax } from './withdrawals';
import { getUsdcBalance, getFreeCollateral } from './balances';
import { configureSkipClient, getBalances, getUsdcRoutes, executeRoute } from './skip';

// Create and export the namespace object as default
export default {
  withdrawMax,
  getUsdcBalance,
  getFreeCollateral,
  configureSkipClient,
  getBalances,
  getUsdcRoutes,
  executeRoute
} as const;