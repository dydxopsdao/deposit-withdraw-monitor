import { logger } from '../logger';
import { Route } from '../utils/routes';
import interop, { CHAIN_IDS } from './interop';

export { rebalanceNow };
export type { BalanceMap };

/**
 * The balance map is an array of objects with the following properties:
 * - asset: The token symbol, e.g. "USDC", "ETH", "SOL"
 * - chain: The chain name as in the route, e.g. "base", "dydx", "solana"
 * - amount: The amount of the token, e.g. "42.1337"
 */
type BalanceMap = Array<{ asset: string; chain: string; amount: string }>;

/**
 * Rebalances the given route
 * @param route - The route to rebalance
 * @returns The balances before and after the rebalance
 */
async function rebalanceNow(route: Route): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  interop.configureSkipClient();

  logger.info(`Rebalancing route: ${route.id}`);
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
      asset: 'USDC',
      chain: route.src_chain,
      amount: sourceBalanceBefore.formattedAmount,
    },
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: dydxBalanceBefore.formattedAmount,
    },
  ];
  logger.debug(`Balances before withdrawal`, { balancesBefore });

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
      asset: 'USDC',
      chain: route.src_chain,
      amount: sourceBalanceAfter.formattedAmount,
    },
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: dydxBalanceAfter.formattedAmount,
    },
  ];

  logger.debug(`Balances after withdrawal`, { balancesAfter });
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
      asset: 'USDC',
      chain: route.src_chain,
      amount: dydxBalanceBefore.formattedAmount,
    },
    // on destination chain:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: destBalanceBefore.formattedAmount,
    },
  ];
  logger.debug(`Balances before deposit`, { balancesBefore });

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
      asset: 'USDC',
      chain: route.src_chain,
      amount: dydxBalanceAfter.formattedAmount,
    },
    // on destination chain:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: destBalanceAfter.formattedAmount,
    },
  ];
  
  logger.debug(`Balances after deposit`, { balancesAfter });
  return { balancesBefore, balancesAfter };
}
