// Import all functions from individual modules
import { withdrawMaxUsdc } from './withdrawals';
import { depositMaxUsdc } from './deposits';
import { getUsdcBalance, getFreeCollateral } from './balances';
import { configureSkipClient, getBalances, getUsdcRoutes, executeRoute } from './skip';

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
