export function assertChainConfigSecrets() {
  if (!process.env.ALCHEMY_API_KEY) {
    throw new Error('ALCHEMY_API_KEY is not set');
  }
}

export const CHAIN_CONFIGS = {
  '1': {
    yamlKey: 'ethereum',
    rpcEndpoint: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'ethereum-native',
    usdcDenom: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  '8453': {
    yamlKey: 'base',
    rpcEndpoint: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'base-native',
    usdcDenom: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  '42161': {
    yamlKey: 'arbitrum',
    rpcEndpoint: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'arbitrum-native',
    usdcDenom: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  '137': {
    yamlKey: 'polygon',
    rpcEndpoint: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'polygon-native',
    usdcDenom: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    derivationPath: "m/44'/60'/0'/0/0",
  },
  solana: {
    yamlKey: 'solana',
    rpcEndpoint: `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'solana-native',
    usdcDenom: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    derivationPath: "m/44'/501'/0'/0'",
  },
  'dydx-mainnet-1': {
    yamlKey: 'dydx',
    rpcEndpoint: 'https://dydx-ops-rpc.kingnodes.com',
    nativeDenom: 'adydx',
    usdcDenom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
    bech32Prefix: 'dydx',
  },
  'noble-1': {
    yamlKey: 'noble', // Not used for now
    rpcEndpoint: 'https://noble-yx-rpc.polkachu.com/',
    nativeDenom: 'uusdc',
    usdcDenom: 'uusdc',
    bech32Prefix: 'noble',
  },
  'osmosis-1': {
    yamlKey: 'osmosis', // Not used for now
    rpcEndpoint: 'https://rpc.osmosis.zone',
    nativeDenom: 'uosmo',
    usdcDenom: 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4', // Noble USDC
    // Note: Axelar USDC is ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858
    bech32Prefix: 'osmo',
  },
  'neutron-1': {
    yamlKey: 'neutron', // Not used for now
    rpcEndpoint: 'https://neutron-rpc.publicnode.com',
    nativeDenom: 'untrn',
    usdcDenom: 'ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81', // Noble USDC
    // Note: Axelar USDC is ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349
    bech32Prefix: 'neutron',
  },
};

// routes.yaml keys to chain IDs
export const CHAIN_IDS = {
  ethereum: '1',
  base: '8453',
  arbitrum: '42161',
  polygon: '137',
  solana: 'solana',
  dydx: 'dydx-mainnet-1',
  noble: 'noble-1',
  osmosis: 'osmosis-1',
  neutron: 'neutron-1',
};
