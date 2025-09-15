// src/fixtures/wallet-context.ts
import { test, type BrowserContext, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { USER_DATA_DIR } from '../config/constants';
import { type Route } from '../utils/route/routes';
import {
  launchContextWithExtension as launchMetamaskContext,
  setupWallet as setupMetamaskWallet,
  unlockMetamaskWallet,
} from '../targets/wallets/metamask/flows';
import {
  launchContextWithExtension as launchPhantomContext,
  setupWallet as setupPhantomWallet,
  unlockPhantomWallet,
} from '../targets/wallets/phantom/flows';
import { logger } from '../utils/logger/logging-utils';

export const walletContextTest = test.extend<{
  route?: Route;
  context: BrowserContext;
  page: Page;
}>({
  // default value for option fixture is undefined
  route: [undefined, { option: true }],

  context: async ({ route }, use) => {
    if (!route) throw new Error('Route option must be set before running test');

    logger.info(`Launching ${route.wallet_type} context with wallet alias ${route.wallet_alias}`);

    const userDataDir = `${USER_DATA_DIR}/${route.wallet_alias}`;
    const resolved = path.resolve(userDataDir);
    const base = path.resolve(USER_DATA_DIR);
    if (!resolved.startsWith(base)) throw new Error('Refusing to delete outside USER_DATA_DIR');

    fs.rmSync(resolved, { recursive: true, force: true }); // fresh profile each run
    const userDataDirExists = fs.existsSync(userDataDir); // NOTE: will be false right after rmSync

    let ctx: BrowserContext;

    switch (route.wallet_type) {
      case 'metamask':
        ctx = await launchMetamaskContext(userDataDir);
        if (userDataDirExists) {
          await unlockMetamaskWallet(ctx);
        } else {
          await setupMetamaskWallet(ctx, route.wallet_seed);
        }
        break;

      case 'phantom':
        ctx = await launchPhantomContext(userDataDir);
        if (userDataDirExists) {
          await unlockPhantomWallet(ctx);
        } else {
          await setupPhantomWallet(ctx, route.wallet_seed);
        }
        break;

      default:
        throw new Error(`Unsupported wallet type: ${route.wallet_type}`);
    }

    await use(ctx);
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});
