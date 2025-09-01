import type { Page } from '@playwright/test';
import { PHANTOM_EXT_ID } from '../../../config/constants';

// Derive the exact role type from Playwright:
type Role = Parameters<Page['getByRole']>[0];
type RoleSel = { role: Role; name?: string | RegExp; exact?: boolean };

export const phantomSelectors = {
  // URLs that Phantom uses
  urls: {
    onboarding: `chrome-extension://${PHANTOM_EXT_ID}/onboarding.html`,
    notification: `chrome-extension://${PHANTOM_EXT_ID}/notification.html`,
    unlock: `chrome-extension://${PHANTOM_EXT_ID}/popup.html`,
  },

  // Phantom onboarding page
  onboarding: {
    alreadyHaveWallet: 'text=I already have a wallet',
    importRecovery: 'text=Import Recovery Phrase',
    seedInput: (i: number) => `[data-testid="secret-recovery-phrase-word-input-${i}"]`,
    submit: '[data-testid="onboarding-form-submit-button"]',
    password: '[data-testid="onboarding-form-password-input"]',
    confirmPassword: '[data-testid="onboarding-form-confirm-password-input"]',
    tosCheckbox: '[data-testid="onboarding-form-terms-of-service-checkbox"]',
  },

  // Phantom popup
  popup: {
    primaryBtn: '[data-testid="primary-button"]',
  },

  // dApp-side buttons
  dapp: {
    connectBtn: { role: 'button', name: 'Connect wallet' } as RoleSel,
    phantomSolanaBtn: { role: 'button', name: 'Phantom (Solana)' } as RoleSel,
    sendRequestBtn: { role: 'button', name: 'Send request' } as RoleSel,
  },

  unlock: {
    pw: '[data-testid="unlock-form-password-input"]',
    pwSubmit: '[data-testid="unlock-form-submit-button"]',
  },
} as const;
