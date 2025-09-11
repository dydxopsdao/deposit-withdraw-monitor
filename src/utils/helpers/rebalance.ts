import { CHAIN_IDS, assertAlchemySecrets } from '../../config/chains';

import { Route } from '../route/routes';
import interop from '../interop';
import { BalanceMap } from '../datadog/datadog-utils';

export { rebalanceNow };

/**
 * Rebalances the given route
 * @param _route - The route to rebalance
 * @param _opts - The options for the rebalance
 * @returns The balances before and after the rebalance
 */
async function rebalanceNow(
  _route: Route,
  _opts: { reason: string; last_tx?: string; passed: boolean }
): Promise<{ balancesBefore: BalanceMap; balancesAfter: BalanceMap }> {
  assertAlchemySecrets();
  interop.configureSkipClient();

  let balancesBefore: BalanceMap = [];
  let balancesAfter: BalanceMap = [];

  switch (_route.kind) {
    case 'deposit':
      balancesBefore = [
        // on source chain:
        {
          token: 'USDC',
          chain: _route.src_chain,
          amount: (await interop.getUsdcBalance(_route.wallet_address, CHAIN_IDS[_route.src_chain])).formattedAmount,
        },
        // on dYdX:
        {
          token: 'USDC',
          chain: _route.dst_chain,
          amount: (await interop.getFreeCollateral(_route.dydx_address)).formattedAmount,
        },
      ];

      await interop.withdrawMaxUsdc(
        _route.dydx_address,
        _route.dydx_seed,
        _route.src_chain,
        _route.wallet_address,
        _route.wallet_seed
      );

      balancesAfter = [
        // on source chain:
        {
          token: 'USDC',
          chain: _route.src_chain,
          amount: (await interop.getUsdcBalance(_route.wallet_address, CHAIN_IDS[_route.src_chain])).formattedAmount,
        },
        // on dYdX:
        {
          token: 'USDC',
          chain: _route.dst_chain,
          amount: (await interop.getFreeCollateral(_route.dydx_address)).formattedAmount,
        },
      ];

      break;
    case 'withdraw':
      balancesBefore = [
        // on dYdX:
        {
          token: 'USDC',
          chain: _route.src_chain,
          amount: (await interop.getFreeCollateral(_route.dydx_address)).formattedAmount,
        },
        // on destination chain:
        {
          token: 'USDC',
          chain: _route.dst_chain,
          amount: (await interop.getUsdcBalance(_route.wallet_address, CHAIN_IDS[_route.dst_chain])).formattedAmount,
        },
      ];

      await interop.depositMaxUsdc(
        _route.dst_chain,
        _route.wallet_address,
        _route.wallet_seed,
        _route.dydx_address,
        _route.dydx_seed
      );

      balancesAfter = [
        // on dYdX:
        {
          token: 'USDC',
          chain: _route.src_chain,
          amount: (await interop.getFreeCollateral(_route.dydx_address)).formattedAmount,
        },
        // on destination chain:
        {
          token: 'USDC',
          chain: _route.dst_chain,
          amount: (await interop.getUsdcBalance(_route.wallet_address, CHAIN_IDS[_route.dst_chain])).formattedAmount,
        },
      ];

      break;
    default:
      throw new Error(`Invalid route kind: ${_route.kind}`);
  }

  return { balancesBefore, balancesAfter };
}
