// Import all functions from individual modules
import {
  assertInteropSecrets,
  CHAIN_CONFIGS,
  CHAIN_IDS,
  INDEXER_API_URL,
  USDC_ASSET_ID,
  USDC_DECIMALS,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
} from './constants';
import { withdrawMaxUsdc } from './withdraw';
import { depositMaxUsdc } from './deposit';
import { getUsdcBalance, getFreeCollateral } from './balances';
import { configureSkipClient, getBalances, getUsdcRoutes, executeRoute } from './skip';

export {
  CHAIN_CONFIGS,
  CHAIN_IDS,
  INDEXER_API_URL,
  USDC_ASSET_ID,
  USDC_DECIMALS,
  TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT,
};

// Create and export the namespace object as default
export default {
  withdrawMaxUsdc,
  depositMaxUsdc,
  getUsdcBalance,
  getFreeCollateral,
  configureSkipClient,
  getBalances,
  getUsdcRoutes,
  assertInteropSecrets,
  executeRoute,
} as const;
