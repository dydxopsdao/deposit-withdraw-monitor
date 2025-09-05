// Requires ALCHEMY_API_KEY to be set in the environment variables

export const CHAIN_CONFIGS = {
  '1': {
    yamlKey: 'ethereum',
    rpcEndpoint: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'ethereum-native',
    usdcDenom: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  '8453': {
    yamlKey: 'base',
    rpcEndpoint: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'base-native',
    usdcDenom: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  '42161': {
    yamlKey: 'arbitrum',
    rpcEndpoint: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'arbitrum-native',
    usdcDenom: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  '137': {
    yamlKey: 'polygon',
    rpcEndpoint: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'polygon-native',
    usdcDenom: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  },
  solana: {
    yamlKey: 'solana',
    rpcEndpoint: `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    nativeDenom: 'solana-native',
    usdcDenom: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  },
  'dydx-mainnet-1': {
    yamlKey: 'dydx',
    rpcEndpoint: 'https://dydx-ops-rpc.kingnodes.com',
    nativeDenom: 'adydx',
    usdcDenom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
    bech32Prefix: 'dydx',
  },
  'noble-1': {
    yamlKey: 'noble',
    rpcEndpoint: 'https://noble-yx-rpc.polkachu.com/',
    nativeDenom: 'uusdc',
    usdcDenom: 'uusdc',
    bech32Prefix: 'noble',
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
};
