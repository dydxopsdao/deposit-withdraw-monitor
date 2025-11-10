// Run with:
// npx tsx src/scripts/get-route-balances.ts <route_id>

import dotenv from 'dotenv';
const envFile = process.env.CI ? '.env' : '.env.local';
dotenv.config({ path: envFile });
console.log(`> Loaded environment from ${envFile}`);

import { getRoutesSync } from '../utils/routes';
import interop, { CHAIN_IDS, CHAIN_CONFIGS } from '../rebalancer/interop';
import { BalanceResponse } from '@skip-go/client';

type Balance = {
  chain: string;
  wallet: string;
  asset: string;
  amount: string;
};

function parseBalanceResponse(address: string, balanceResponse: BalanceResponse): Balance[] {
  const balances: Balance[] = [];
  for (const [chainId, walletBalance] of Object.entries(balanceResponse.chains ?? {})) {
    for (const [denom, denomBalance] of Object.entries(walletBalance.denoms ?? {})) {
      const chainNativeDenom = CHAIN_CONFIGS[chainId].nativeDenom;
      const chainUsdcDenom = CHAIN_CONFIGS[chainId].usdcDenom;
      balances.push({
        chain: CHAIN_CONFIGS[chainId].yamlKey,
        wallet: address,
        asset: denom === chainUsdcDenom ? 'USDC' : chainNativeDenom,
        amount: denomBalance.formattedAmount,
      });
    }
  }
  return balances;
}

async function main(): Promise<void> {
  const routes = getRoutesSync();

  const routeId = process.argv[2];
  if (!routeId) {
    throw new Error('Route id is required as an argument');
  }
  let route = routes.find(r => r.id === routeId);
  if (!route) {
    throw new Error(`Route ${routeId} not found`);
  }

  const nobleAddress = await interop.deriveCosmosAddress(CHAIN_CONFIGS[CHAIN_IDS.noble].bech32Prefix, route.dydx_seed);
  const osmosisAddress = await interop.deriveCosmosAddress(CHAIN_CONFIGS[CHAIN_IDS.osmosis].bech32Prefix, route.dydx_seed);
  const neutronAddress = await interop.deriveCosmosAddress(CHAIN_CONFIGS[CHAIN_IDS.neutron].bech32Prefix, route.dydx_seed);

  const [walletBalances, osmosisBalances, neutronBalances, nobleBalances, dydxBalances, freeCollateral] = await Promise.all([
    interop.getBalances(route.wallet_address, [CHAIN_IDS[route.src_chain], CHAIN_IDS[route.dst_chain]]),
    interop.getBalances(
      osmosisAddress,
      [CHAIN_IDS.osmosis]
    ),
    interop.getBalances(
      neutronAddress,
      [CHAIN_IDS.neutron]
    ),
    interop.getBalances(
      nobleAddress,
      [CHAIN_IDS.noble]
    ),
    interop.getBalances(
      route.dydx_address,
      [CHAIN_IDS.dydx]
    ),
    interop.getFreeCollateral(route.dydx_address),
  ]);

  const balances: Balance[] = [];
  balances.push(...parseBalanceResponse(route.wallet_address, walletBalances));
  balances.push(...parseBalanceResponse(osmosisAddress, osmosisBalances));
  balances.push(...parseBalanceResponse(neutronAddress, neutronBalances));
  balances.push(...parseBalanceResponse(nobleAddress, nobleBalances));
  balances.push(...parseBalanceResponse(route.dydx_address, dydxBalances));
  balances.push({
    chain: CHAIN_CONFIGS[CHAIN_IDS.dydx].yamlKey,
    wallet: route.dydx_address,
    asset: 'Free Collateral',
    amount: freeCollateral.formattedAmount,
  });

  console.table(balances, ['chain', 'wallet', 'asset', 'amount']);
}

main().catch(console.error);
