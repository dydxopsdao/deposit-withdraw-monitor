import { Route } from '../route/routes';
import interop, { CHAIN_IDS } from '../interop';
import { BalanceMap } from '../datadog/datadog-utils';

export { rebalanceNow };

/**
 * Rebalances the given route
 * @param route - The route to rebalance
 * @returns The balances before and after the rebalance
 */
async function rebalanceNow(route: Route): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  interop.configureSkipClient();

  let balancesBefore: BalanceMap = [];
  let balancesAfter: BalanceMap = [];

  switch (route.kind) {
    case 'deposit':
      balancesBefore = [
        // on source chain:
        {
          token: 'USDC',
          chain: route.src_chain,
          amount: (await interop.getUsdcBalance(CHAIN_IDS[route.src_chain], route.wallet_address)).formattedAmount,
        },
        // on dYdX:
        {
          token: 'USDC',
          chain: route.dst_chain,
          amount: (await interop.getFreeCollateral(route.dydx_address)).formattedAmount,
        },
      ];

      await interop.withdrawMaxUsdc(
        route.dydx_address,
        route.dydx_seed,
        route.src_chain,
        route.wallet_address,
        route.wallet_seed
      );

      balancesAfter = [
        // on source chain:
        {
          token: 'USDC',
          chain: route.src_chain,
          amount: (await interop.getUsdcBalance(CHAIN_IDS[route.src_chain], route.wallet_address)).formattedAmount,
        },
        // on dYdX:
        {
          token: 'USDC',
          chain: route.dst_chain,
          amount: (await interop.getFreeCollateral(route.dydx_address)).formattedAmount,
        },
      ];

      break;
    case 'withdraw':
      balancesBefore = [
        // on dYdX:
        {
          token: 'USDC',
          chain: route.src_chain,
          amount: (await interop.getFreeCollateral(route.dydx_address)).formattedAmount,
        },
        // on destination chain:
        {
          token: 'USDC',
          chain: route.dst_chain,
          amount: (await interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address)).formattedAmount,
        },
      ];

      await interop.depositMaxUsdc(
        route.dst_chain,
        route.wallet_address,
        route.wallet_seed,
        route.dydx_address,
        route.dydx_seed
      );

      balancesAfter = [
        // on dYdX:
        {
          token: 'USDC',
          chain: route.src_chain,
          amount: (await interop.getFreeCollateral(route.dydx_address)).formattedAmount,
        },
        // on destination chain:
        {
          token: 'USDC',
          chain: route.dst_chain,
          amount: (await interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address)).formattedAmount,
        },
      ];

      break;
    default:
      throw new Error(`Invalid route kind: ${route.kind}`);
  }

  return { balancesBefore, balancesAfter };
}
