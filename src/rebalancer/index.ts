import { Route } from '../utils/route/routes';
import interop, { CHAIN_IDS } from './interop';
import { BalanceMap } from '../utils/datadog/datadog-utils';

export { rebalanceNow };

/**
 * Rebalances the given route
 * @param route - The route to rebalance
 * @returns The balances before and after the rebalance
 */
async function rebalanceNow(route: Route): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  interop.configureSkipClient();

  switch (route.kind) {
    case 'deposit':
      return await rebalanceDepositRoute(route);
    case 'withdraw':
      return await rebalanceWithdrawRoute(route);
    default:
      throw new Error(`Invalid route kind: ${route.kind}`);
  }
}

async function rebalanceDepositRoute(route: Route): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  interop.configureSkipClient();
  const balancesBefore = [
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

  const balancesAfter = [
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
  return { balancesBefore, balancesAfter };
}

async function rebalanceWithdrawRoute(
  route: Route
): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  const balancesBefore = [
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

  const balancesAfter = [
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
  return { balancesBefore, balancesAfter };
}
