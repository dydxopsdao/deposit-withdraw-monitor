import type { Page } from '@playwright/test';

// Derive the exact role type from Playwright:
type Role = Parameters<Page['getByRole']>[0];
type RoleSel = { role: Role; name?: string | RegExp; exact?: boolean };

export const phantomSelectors = {
  onboarding: {
    alreadyHaveWallet: 'text=I already have a wallet',
    importRecovery: 'text=Import Recovery Phrase',
    seedInput: (i: number) => `[data-testid="secret-recovery-phrase-word-input-${i}"]`,
    submit: '[data-testid="onboarding-form-submit-button"]',
    password: '[data-testid="onboarding-form-password-input"]',
    confirmPassword: '[data-testid="onboarding-form-confirm-password-input"]',
    tosCheckbox: '[data-testid="onboarding-form-terms-of-service-checkbox"]',
  },
  popup: {
    primaryBtn: '[data-testid="primary-button"]',
  },
  dapp: {
    connectBtn: { role: 'button', name: 'Connect wallet' } as RoleSel,
    phantomSolanaBtn: { role: 'button', name: 'Phantom (Solana)' } as RoleSel,
    sendRequestBtn: { role: 'button', name: 'Send request' } as RoleSel,
  },
} as const;
