import path from 'path';

export const USER_DATA_DIR = path.resolve(process.cwd(), 'user-data');
export const DAPP_URL = 'https://dydx.trade/portfolio/overview';

export const PHANTOM_EXT_PATH = path.resolve(process.cwd(), 'extensions/phantom');
export const PHANTOM_EXT_ID = 'bfnaelmomeimhlpmgjnjophhpkkoljpa';

export const METAMASK_EXT_PATH = path.resolve(process.cwd(), 'extensions/metamask');
export const METAMASK_EXT_ID = 'nkbihfbeogaeaoehlefnkodbefgpgknn';

export const SKIP_API_URL = 'https://api.skip.money';
export const INDEXER_API_URL = 'https://indexer.dydx.trade';

// USDC has a assetId of 0 on the dYdX Chain
export const USDC_ASSET_ID = 0;
// Type URL for the MsgWithdrawFromSubaccount message
export const TYPE_URL_MSG_WITHDRAW_FROM_SUBACCOUNT = '/dydxprotocol.sending.MsgWithdrawFromSubaccount';
