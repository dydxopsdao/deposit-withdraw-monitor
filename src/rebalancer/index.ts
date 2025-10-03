import { logger } from '../logger';
import { Route } from '../utils/routes';
import interop, { CHAIN_CONFIGS, CHAIN_IDS, TokenAmount, WalletBalances } from './interop';

export { buildBalanceMap, rebalanceNow };
export type { BalanceMap };

/**
 * The balance map is an array of objects with the following properties:
 * - asset: e.g. "USDC", "NativeToken"
 * - chain: The chain name as in the route, e.g. "base", "dydx", "solana"
 * - amount: The amount of the token, e.g. "42.1337"
 */
type BalanceMap = Array<{ asset: string; chain: string; amount: string }>;

function buildBalanceMap(route: Route, walletBalances: WalletBalances, freeCollateral: TokenAmount): BalanceMap {
  const [other, dydx] =
    route.kind === 'deposit' ? [route.src_chain, route.dst_chain] : [route.dst_chain, route.src_chain];

  const nativeSymbol = CHAIN_CONFIGS[CHAIN_IDS[other]]?.nativeSymbol || 'NativeToken';

  return [
    { asset: 'USDC', chain: other, amount: walletBalances.usdc.formattedAmount },
    { asset: nativeSymbol, chain: other, amount: walletBalances.native.formattedAmount },
    { asset: 'USDC', chain: dydx, amount: freeCollateral.formattedAmount },
  ];
}

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
  const [walletBalancesBefore, freeCollateralBefore] = await Promise.all([
    interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesBefore = buildBalanceMap(route, walletBalancesBefore, freeCollateralBefore);
  logger.debug(`Balances before withdrawal`, { balancesBefore });

  if (
    route.rebalance_threshold &&
    parseFloat(walletBalancesBefore.usdc.formattedAmount) > parseFloat(route.rebalance_threshold)
  ) {
    logger.info(`Skipping withdrawal because threshold is not met`, {
      route_id: route.id,
      rebalance_threshold: route.rebalance_threshold,
      wallet_balance: walletBalancesBefore.usdc.formattedAmount,
    });
    return { balancesBefore, balancesAfter: balancesBefore };
  }

  await interop.withdrawMaxUsdc(
    route.dydx_address,
    route.dydx_seed,
    route.src_chain,
    route.wallet_address,
    route.wallet_seed
  );

  // Get balances after concurrently
  const [walletBalancesAfter, freeCollateralAfter] = await Promise.all([
    interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesAfter = buildBalanceMap(route, walletBalancesAfter, freeCollateralAfter);

  logger.debug(`Balances after withdrawal`, { balancesAfter });
  return { balancesBefore, balancesAfter };
}

async function rebalanceWithdrawRoute(
  route: Route
): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  // Get balances before concurrently
  const [freeCollateralBefore, walletBalancesBefore] = await Promise.all([
    interop.getFreeCollateral(route.dydx_address),
    interop.getWalletBalances(CHAIN_IDS[route.dst_chain], route.wallet_address),
  ]);

  const balancesBefore = buildBalanceMap(route, walletBalancesBefore, freeCollateralBefore);
  logger.debug(`Balances before deposit`, { balancesBefore });

  if (
    route.rebalance_threshold &&
    parseFloat(freeCollateralBefore.formattedAmount) > parseFloat(route.rebalance_threshold)
  ) {
    logger.info(`Skipping deposit because threshold is not met`, {
      route_id: route.id,
      rebalance_threshold: route.rebalance_threshold,
      free_collateral: freeCollateralBefore.formattedAmount,
    });
    return { balancesBefore, balancesAfter: balancesBefore };
  }

  await interop.depositMaxUsdc(
    route.dst_chain,
    route.wallet_address,
    route.wallet_seed,
    route.dydx_address,
    route.dydx_seed
  );

  // Get balances after concurrently
  const [freeCollateralAfter, walletBalancesAfter] = await Promise.all([
    interop.getFreeCollateral(route.dydx_address),
    interop.getWalletBalances(CHAIN_IDS[route.dst_chain], route.wallet_address),
  ]);

  const balancesAfter = buildBalanceMap(route, walletBalancesAfter, freeCollateralAfter);

  logger.debug(`Balances after deposit`, { balancesAfter });
  return { balancesBefore, balancesAfter };
}
