import { Route } from '../utils/route/routes';
import interop, { CHAIN_IDS } from './interop';

export { rebalanceNow };
export type { BalanceMap };

/**
 * The balance map is an array of objects with the following properties:
 * - token: The token symbol, e.g. "USDC", "ETH", "SOL"
 * - chain: The chain name as in the route, e.g. "base", "dydx", "solana"
 * - amount: The amount of the token, e.g. "42.1337"
 */
type BalanceMap = Array<{ token: string; chain: string; amount: string }>;

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

  // Get balances before concurrently
  const [sourceBalanceBefore, dydxBalanceBefore] = await Promise.all([
    interop.getUsdcBalance(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesBefore = [
    // on source chain:
    {
      token: 'USDC',
      chain: route.src_chain,
      amount: sourceBalanceBefore.formattedAmount,
    },
    // on dYdX:
    {
      token: 'USDC',
      chain: route.dst_chain,
      amount: dydxBalanceBefore.formattedAmount,
    },
  ];

  await interop.withdrawMaxUsdc(
    route.dydx_address,
    route.dydx_seed,
    route.src_chain,
    route.wallet_address,
    route.wallet_seed
  );

  // Get balances after concurrently
  const [sourceBalanceAfter, dydxBalanceAfter] = await Promise.all([
    interop.getUsdcBalance(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesAfter = [
    // on source chain:
    {
      token: 'USDC',
      chain: route.src_chain,
      amount: sourceBalanceAfter.formattedAmount,
    },
    // on dYdX:
    {
      token: 'USDC',
      chain: route.dst_chain,
      amount: dydxBalanceAfter.formattedAmount,
    },
  ];
  return { balancesBefore, balancesAfter };
}

async function rebalanceWithdrawRoute(
  route: Route
): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  // Get balances before concurrently
  const [dydxBalanceBefore, destBalanceBefore] = await Promise.all([
    interop.getFreeCollateral(route.dydx_address),
    interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address),
  ]);

  const balancesBefore = [
    // on dYdX:
    {
      token: 'USDC',
      chain: route.src_chain,
      amount: dydxBalanceBefore.formattedAmount,
    },
    // on destination chain:
    {
      token: 'USDC',
      chain: route.dst_chain,
      amount: destBalanceBefore.formattedAmount,
    },
  ];

  await interop.depositMaxUsdc(
    route.dst_chain,
    route.wallet_address,
    route.wallet_seed,
    route.dydx_address,
    route.dydx_seed
  );

  // Get balances after concurrently
  const [dydxBalanceAfter, destBalanceAfter] = await Promise.all([
    interop.getFreeCollateral(route.dydx_address),
    interop.getUsdcBalance(CHAIN_IDS[route.dst_chain], route.wallet_address),
  ]);

  const balancesAfter = [
    // on dYdX:
    {
      token: 'USDC',
      chain: route.src_chain,
      amount: dydxBalanceAfter.formattedAmount,
    },
    // on destination chain:
    {
      token: 'USDC',
      chain: route.dst_chain,
      amount: destBalanceAfter.formattedAmount,
    },
  ];
  return { balancesBefore, balancesAfter };
}
