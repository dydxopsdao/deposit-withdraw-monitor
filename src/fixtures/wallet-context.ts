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
import { uploadTraceToS3 } from '../utils/helpers/tracing';

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

    logger.info(`Launching ${route.wallet_type} context with wallet alias ${route.wallet_alias}`);

    let context: any;
    const timestamp = new Date().toISOString();
    const userDataDir = `${USER_DATA_DIR}/${route.wallet_alias}`;

    //Sanitize the userDataDir
    const resolved = path.resolve(userDataDir);
    const base = path.resolve(USER_DATA_DIR);
    if (!resolved.startsWith(base)) throw new Error("Refusing to delete outside USER_DATA_DIR");
    fs.rmSync(resolved, { recursive: true, force: true });
      
    const userDataDirExists = fs.existsSync(userDataDir);

    // Use wallet-specific context creation based on route
    switch (route.wallet_type) {
      case 'metamask':
        context = await launchMetamaskContext(userDataDir);
        logger.debug("launchMetamaskContext exited", { context});
        if(userDataDirExists) {
          logger.debug("calling unlockMetamaskWallet");
          await unlockMetamaskWallet(context);
        } else {
          logger.debug("calling setupMetamaskWallet");
          await setupMetamaskWallet(context, route.wallet_seed);
        }
        logger.debug("unlockMetamaskWallet/setupMetamaskWallet exited");
        break;
      case 'phantom':
        context = await launchPhantomContext(userDataDir);
        if(userDataDirExists) {
          await unlockPhantomWallet(context);
        } else {
          await setupPhantomWallet(context, route.wallet_seed);
        }
        break;
      default:
        throw new Error(`Unsupported wallet type: ${route.wallet_type}`);
    }

    await use(context);

    // Stop tracing and process the trace file
    try {
      logger.info("Stopping tracing", { route_id: route.id });
      const traceDir = `${userDataDir}/trace`;
      fs.mkdirSync(traceDir, { recursive: true });
      const tracePath = path.join(traceDir, `trace-${route.id}-${timestamp}/trace.zip`);
      await context.tracing.stop({ path: tracePath });
      await uploadTraceToS3(tracePath, route.id, timestamp);
    } catch (e: any) {
      logger.error("Trace file processing failed", e?.message, { route_id: route.id });
    }    
  },

  page: async ({ context }, use) => {
    // Reuse the first tab if present; otherwise open a new one.
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});
