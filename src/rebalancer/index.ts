import { logger } from '../logger';
import { Route } from '../utils/routes';
import interop, { CHAIN_IDS } from './interop';

export { rebalanceNow };
export type { BalanceMap };

/**
 * The balance map is an array of objects with the following properties:
 * - asset: e.g. "USDC", "NativeToken"
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
  const [walletBalancesBefore, freeCollateralBefore] = await Promise.all([
    interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesBefore = [
    // on source chain:
    {
      asset: 'USDC',
      chain: route.src_chain,
      amount: walletBalancesBefore.usdc.formattedAmount,
    },
    {
      asset: 'NativeToken',
      chain: route.src_chain,
      amount: walletBalancesBefore.native.formattedAmount,
    },
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: freeCollateralBefore.formattedAmount,
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
  const [walletBalancesAfter, freeCollateralAfter] = await Promise.all([
    interop.getWalletBalances(CHAIN_IDS[route.src_chain], route.wallet_address),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balancesAfter = [
    // on source chain:
    {
      asset: 'USDC',
      chain: route.src_chain,
      amount: walletBalancesAfter.usdc.formattedAmount,
    },
    {
      asset: 'NativeToken',
      chain: route.src_chain,
      amount: walletBalancesAfter.native.formattedAmount,
    },
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: freeCollateralAfter.formattedAmount,
    },
  ];

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

  const balancesBefore = [
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.src_chain,
      amount: freeCollateralBefore.formattedAmount,
    },
    // on destination chain:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: walletBalancesBefore.usdc.formattedAmount,
    },
    {
      asset: 'NativeToken',
      chain: route.dst_chain,
      amount: walletBalancesBefore.native.formattedAmount,
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
  const [freeCollateralAfter, walletBalancesAfter] = await Promise.all([
    interop.getFreeCollateral(route.dydx_address),
    interop.getWalletBalances(CHAIN_IDS[route.dst_chain], route.wallet_address),
  ]);

  const balancesAfter = [
    // on dYdX:
    {
      asset: 'USDC',
      chain: route.src_chain,
      amount: freeCollateralAfter.formattedAmount,
    },
    // on destination chain:
    {
      asset: 'USDC',
      chain: route.dst_chain,
      amount: walletBalancesAfter.usdc.formattedAmount,
    },
    {
      asset: 'NativeToken',
      chain: route.dst_chain,
      amount: walletBalancesAfter.native.formattedAmount,
    },
  ];
  
  logger.debug(`Balances after deposit`, { balancesAfter });
  return { balancesBefore, balancesAfter };
}
