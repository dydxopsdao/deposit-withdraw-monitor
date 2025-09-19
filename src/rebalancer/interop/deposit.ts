import { logger } from '../../logger';
import { deriveCosmosAddress, getCosmosSigner, getEvmSigner, getSvmSigner } from '../signers';

import {
  CHAIN_CONFIGS,
  CHAIN_IDS,
  DYDX_USDC_GAS_BUFFER,
  NOBLE_USDC_MIN_AUTOSWEEP_AMOUNT,
  NOBLE_USDC_GAS_BUFFER,
} from './constants';
import { getUsdcBalance, newUsdcAmount, depositToSubaccount } from './balances';
import { executeRoute, getUsdcRoutes, generateUserAddresses, sweepNobleBalance } from './skip';

export { depositMaxUsdc };

/**
 * Deposits all the USDC balance from the given route so that it's rebalanced.
 *
 * This function will:
 * - Get the USDC balance
 * - Get the Skip routes
 * - Generate the user addresses
 * - Execute the deposit
 *
 * @param srcChain - The chain to deposit from
 * @param walletAddress - The address to deposit from
 * @param walletSeed - The seed of the account on the source chain
 * @param dYdXAddress - The address to deposit to
 * @param dYdXSeed - The seed of the account on dYdX
 */
async function depositMaxUsdc(
  srcChain: string,
  walletAddress: string,
  walletSeed: string,
  dYdXAddress: string,
  dYdXSeed: string
) {
  logger.info(`Depositing all from ${walletAddress} on ${srcChain} to ${dYdXAddress} on dYdX`);

  const srcChainId = CHAIN_IDS[srcChain];
  const dYdXChainId = CHAIN_IDS['dydx'];

  const walletBalance = await getUsdcBalance(srcChainId, walletAddress);
  logger.debug(`wallet balance: ${walletBalance.formattedAmount} USDC`);

  if (walletBalance.amount === 0n) {
    logger.info(`No USDC balance found for ${walletAddress} on ${srcChain} - skipping deposit`);
    await sweepNobleBalanceIfNeeded(dYdXSeed);
    await depositToSubaccountIfNeeded(dYdXSeed);
    return;
  }

  const { slow, fast } = await getUsdcRoutes(srcChainId, dYdXChainId, walletBalance.amount);
  const skipRoute = fast ?? slow;
  logger.info(
    `Found skip route: ${skipRoute.requiredChainAddresses.map(c => `${CHAIN_CONFIGS[c].yamlKey}`).join(' -> ')}`
  );

  const userAddresses = await generateUserAddresses(skipRoute.requiredChainAddresses, walletSeed, dYdXSeed);
  logger.debug(`Addresses: ${userAddresses.map(a => `${a.address}`).join(' -> ')}`);

  await executeRoute({
    getCosmosSigner: async (chainId: string) => {
      return await getCosmosSigner(CHAIN_CONFIGS[chainId].bech32Prefix, dYdXSeed);
    },
    getEvmSigner: async (chainId: string) => {
      return await getEvmSigner(
        CHAIN_CONFIGS[chainId].getRpcEndpoint(),
        CHAIN_CONFIGS[chainId].derivationPath,
        walletSeed
      );
    },
    getSvmSigner: async () => {
      return await getSvmSigner(CHAIN_CONFIGS.solana.derivationPath, walletSeed);
    },
    route: skipRoute,
    userAddresses,
  });

  await sweepNobleBalanceIfNeeded(dYdXSeed);
  await depositToSubaccountIfNeeded(dYdXSeed);
}

// --------- HELPER FUNCTIONS ---------

/**
 * Sweeps the Noble balance if it's greater than the minimum amount
 * @param dYdXSeed - The seed of the account on dYdX
 */
async function sweepNobleBalanceIfNeeded(dYdXSeed: string) {
  const nobleChainId = CHAIN_IDS['noble'];
  const nobleChainConfig = CHAIN_CONFIGS[nobleChainId];
  const nobleAddress = await deriveCosmosAddress(nobleChainConfig.bech32Prefix, dYdXSeed);
  const nobleBalance = await getUsdcBalance(nobleChainId, nobleAddress);

  const gasBuffer = newUsdcAmount(NOBLE_USDC_GAS_BUFFER).amount;
  const minSweep = newUsdcAmount(NOBLE_USDC_MIN_AUTOSWEEP_AMOUNT).amount;
  const sweepThreshold = gasBuffer + minSweep;

  if (nobleBalance.amount < sweepThreshold) {
    logger.info(
      `USDC balance ${nobleBalance.formattedAmount} for ${nobleAddress} is less than ${NOBLE_USDC_MIN_AUTOSWEEP_AMOUNT + NOBLE_USDC_GAS_BUFFER} - skipping sweep from Noble`
    );
    return;
  }

  const amountToSweep = nobleBalance.amount - gasBuffer; // leave gas buffer
  logger.info(
    `USDC balance ${nobleBalance.formattedAmount} for ${nobleAddress} is >= ${NOBLE_USDC_MIN_AUTOSWEEP_AMOUNT + NOBLE_USDC_GAS_BUFFER} - sweeping ${amountToSweep} from Noble`
  );
  await sweepNobleBalance(dYdXSeed, amountToSweep);
}

/**
 * Deposits the USDC balance to the subaccount if it's greater than the minimum amount
 * @param dYdXSeed - The seed of the account on dYdX
 */
async function depositToSubaccountIfNeeded(dYdXSeed: string) {
  const dYdXChainId = CHAIN_IDS['dydx'];
  const dYdXChainConfig = CHAIN_CONFIGS[dYdXChainId];

  const address = await deriveCosmosAddress(dYdXChainConfig.bech32Prefix, dYdXSeed);
  const balance = await getUsdcBalance(dYdXChainId, address);

  const minGasBuffer = newUsdcAmount(DYDX_USDC_GAS_BUFFER).amount;

  if (balance.amount < minGasBuffer) {
    logger.info(
      `USDC balance ${balance.formattedAmount} for ${address} is less than ${DYDX_USDC_GAS_BUFFER} - skipping deposit to subaccount`
    );
    return;
  }

  logger.info(
    `USDC balance ${balance.formattedAmount} for ${address} is greater than ${DYDX_USDC_GAS_BUFFER} - depositing to subaccount`
  );

  const depositAmount = balance.amount - minGasBuffer;
  await depositToSubaccount(dYdXSeed, depositAmount);
}
