// src/fixtures/wallet-context.ts
import { test } from '@playwright/test';
import fs from 'fs';
import { USER_DATA_DIR } from '../config/constants';
import { type Route } from '../utils/route/routes';
import {
  launchContextWithExtension as launchMetamaskContext,
  setupWallet as setupMetamaskWallet,
  unlockMetamaskWallet as unlockMetamaskWallet,
} from '../targets/wallets/metamask/flows';
import {
  launchContextWithExtension as launchPhantomContext,
  setupWallet as setupPhantomWallet,
  unlockPhantomWallet as unlockPhantomWallet,
} from '../targets/wallets/phantom/flows';
import { logger } from '../utils/logger/logging-utils';
import path from 'path';

export const walletContextTest = test.extend<{
  route: Route;
  context: any;
  page: any;
}>({
  route: [null as any, { option: true }],

  context: async ({ route }, use) => {
    if (!route) {
      throw new Error('Route option must be set before running test');
    }

    let context: any;

    logger.info(`Launching ${route.wallet_type} context with wallet alias ${route.wallet_alias}`);

    const userDataDir = `${USER_DATA_DIR}/${route.wallet_alias}`;
    //Sanitize the userDataDir
    const resolved = path.resolve(userDataDir);
    const base = path.resolve(USER_DATA_DIR);
    if (!resolved.startsWith(base)) throw new Error('Refusing to delete outside USER_DATA_DIR');
    fs.rmSync(resolved, { recursive: true, force: true });
    // TODO: The existence check below will always be false after rmSync; clarify intended unlock/setup path.

    const userDataDirExists = fs.existsSync(userDataDir);

    // Use wallet-specific context creation based on route
    switch (route.wallet_type) {
      case 'metamask':
        context = await launchMetamaskContext(userDataDir);
        if (userDataDirExists) {
          await unlockMetamaskWallet(context);
        } else {
          await setupMetamaskWallet(context, route.wallet_seed);
        }
        break;
      case 'phantom':
        context = await launchPhantomContext(userDataDir);
        if (userDataDirExists) {
          await unlockPhantomWallet(context);
        } else {
          await setupPhantomWallet(context, route.wallet_seed);
        }
        break;
      default:
        throw new Error(`Unsupported wallet type: ${route.wallet_type}`);
    }

    await use(context);
  },

  page: async ({ context }, use) => {
    // Reuse the first tab if present; otherwise open a new one.
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});
