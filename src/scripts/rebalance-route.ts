// Run with:
// npx tsx src/scripts/rebalance-route.ts <route_id>

import dotenv from 'dotenv';
const envFile = process.env.CI ? '.env' : '.env.local';
dotenv.config({ path: envFile });
console.log(`> Loaded environment from ${envFile}`);

import { getRoutesSync } from '../utils/routes';
import interop, { CHAIN_IDS } from '../rebalancer/interop';

async function main(): Promise<void> {
  interop.configureSkipClient();

  const routes = getRoutesSync();

  // e.g 
  // 'metamask-base-usdc-deposit-instant'
  // 'metamask-base-usdc-withdrawal'
  // 'phantom-solana-usdc-withdrawal'
  // 'phantom-solana-usdc-deposit'
  const routeId = process.argv[2];
  if (!routeId) {
    throw new Error('Route id is required as an argument');
  }
  let route = routes.find(r => r.id === routeId);
  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }

  switch (route.kind) {
    case 'deposit':
      const [walletBalancesBeforeDeposit, freeCollateralBeforeDeposit] = await Promise.all([
        interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
        interop.getFreeCollateral(route.dydx_address),
      ]);

      const balancesBeforeDeposit = {
        native: walletBalancesBeforeDeposit.native.formattedAmount,
        usdc: walletBalancesBeforeDeposit.usdc.formattedAmount,
        freeCollateral: freeCollateralBeforeDeposit.formattedAmount,
      };
      console.log(`Balances before withdraw: ${JSON.stringify(balancesBeforeDeposit, null, 2)}`);

      await interop.withdrawMaxUsdc(
        route.dydx_address,
        route.dydx_seed,
        route.src_chain,
        route.wallet_address,
        route.wallet_seed
      );

      const [walletBalancesAfterDeposit, freeCollateralAfterDeposit] = await Promise.all([
        interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
        interop.getFreeCollateral(route.dydx_address),
      ]);
      const balancesAfterWithdraw = {
        native: walletBalancesAfterDeposit.native.formattedAmount,
        usdc: walletBalancesAfterDeposit.usdc.formattedAmount,
        freeCollateral: freeCollateralAfterDeposit.formattedAmount,
      };
      console.log(`Balances after withdraw: ${JSON.stringify(balancesAfterWithdraw, null, 2)}`);
      break;

    case 'withdraw':
      const [walletBalancesBeforeWithdraw, freeCollateralBeforeWithdraw] = await Promise.all([
        interop.getWalletBalances(CHAIN_IDS[route.dst_chain], route.wallet_address),
        interop.getFreeCollateral(route.dydx_address),
      ]);
      const balancesBeforeWithdraw = {
        native: walletBalancesBeforeWithdraw.native.formattedAmount,
        usdc: walletBalancesBeforeWithdraw.usdc.formattedAmount,
        freeCollateral: freeCollateralBeforeWithdraw.formattedAmount,
      };
      console.log(`Balances before deposit: ${JSON.stringify(balancesBeforeWithdraw, null, 2)}`);

      await interop.depositMaxUsdc(
        route.dst_chain,
        route.wallet_address,
        route.wallet_seed,
        route.dydx_address,
        route.dydx_seed
      );

      const [walletBalancesAfterWithdraw, freeCollateralAfterWithdraw] = await Promise.all([
        interop.getWalletBalances(CHAIN_IDS[route.dst_chain], route.wallet_address),
        interop.getFreeCollateral(route.dydx_address),
      ]);
      const balancesAfterDeposit = {
        native: walletBalancesAfterWithdraw.native.formattedAmount,
        usdc: walletBalancesAfterWithdraw.usdc.formattedAmount,
        freeCollateral: freeCollateralAfterWithdraw.formattedAmount,
      };
      console.log(`Balances after deposit: ${JSON.stringify(balancesAfterDeposit, null, 2)}`);
      break;

    default:
      throw new Error(`Invalid route kind: ${route.kind}`);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Error running script:', error);
  process.exit(1);
});
