// src/fixtures/index.ts
import { test as base, BrowserContext, Page } from "@playwright/test";
import * as dydx from "../targets/dydx";
import * as phantom from "../targets/wallets/phantom";
import * as metamask from "../targets/wallets/metamask";

export type Wallet = "phantom" | "metamask";

/**
 * Resolve wallet preference from env → project name → default.
 */
function resolveWallet(projectName?: string): Wallet {
  const envWallet = process.env.WALLET?.toLowerCase();
  if (envWallet === "phantom" || envWallet === "metamask") return envWallet;
  if (projectName === "phantom" || projectName === "metamask") return projectName;
  return "phantom";
}

async function launchCtx(wallet: Wallet): Promise<BrowserContext> {
  if (wallet === "phantom") {
    const ctx = await phantom.flows.launchContextWithExtension();
    await phantom.flows.setupWallet(ctx);
    return ctx;
  } else {
    const ctx = await metamask.flows.launchContextWithExtension();
    await metamask.flows.setupWallet(ctx);
    return ctx;
  }
}

export const test = base.extend<{
  wallet: Wallet;
  context: BrowserContext;
  dappPage: Page;
  connectWallet: (page: Page, wallet?: Wallet) => Promise<void>;
}>({
  // Choose wallet per env/project name; default to phantom.
  wallet: [
    async ({}, use, info) => {
      await use(resolveWallet(info.project?.name));
    },
    { option: true },
  ],

  // Launch a persistent context with the selected wallet's extension loaded.
  context: async ({ wallet }, use) => {
    const ctx = await launchCtx(wallet);
    try {
      await use(ctx);
    } finally {
      // Always close even if the test failed.
      await ctx.close().catch(() => {});
    }
  },

  // Open the dYdX app once and expose it as dappPage.
  dappPage: async ({ context }, use) => {
    const page = await dydx.flows.open(context); // uses DAPP_URL from config/constants
    await use(page);
  },

  // Helper to connect whichever wallet is requested (or the default one).
  connectWallet: async ({ context, wallet }, use) => {
    await use(async (page: Page, w?: Wallet) => {
      const chosen = w ?? wallet;
      if (chosen === "phantom") {
        return phantom.flows.connect(page, context);
      }
      return metamask.flows.connect(page, context);
    });
  },
});

export const expect = test.expect;
