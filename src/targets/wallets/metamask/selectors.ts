import type { Page } from "@playwright/test";

// role type straight from Playwright
type Role = Parameters<Page["getByRole"]>[0];
export type RoleSel = { role: Role; name?: string | RegExp; exact?: boolean };

export const metamaskSelectors = {
  // URLs that MM uses
  urls: {
    onboarding: /chrome-extension:\/\/.*\/home\.html#onboarding\/welcome/,
    unlock: /chrome-extension:\/\/.*\/home\.html#unlock/,
    notification: /chrome-extension:\/\/.*\/notification\.html/,
  },

  // dApp-side buttons
  dapp: {
    connectBtn:      { role: "button", name: "Connect wallet" } as RoleSel,
    pickMetamaskBtn: { role: "button", name: "MetaMask MetaMask" } as RoleSel,
    sendRequestBtn:  { role: "button", name: "Send request" } as RoleSel,
  },

  // MetaMask popups
  popup: {
    confirmBtn:        '[data-testid="confirm-btn"]',
    confirmFooterBtn:  '[data-testid="confirm-footer-button"]',
  },

  // Onboarding page
  onboarding: {
    start:           '[data-testid="onboarding-get-started-button"]',
    termsScroll:     '[data-testid="terms-of-use-scroll-button"]',
    termsCheckbox:   '#terms-of-use__checkbox',
    termsAgree:      '[data-testid="terms-of-use-agree-button"]',
    importWallet:    '[data-testid="onboarding-import-wallet"]',
    importWithSrp:   '[data-testid="onboarding-import-with-srp-button"]',
    srpInput:        '[data-testid="srp-input-import__srp-note"]',
    confirmSrp:      '[data-testid="import-srp-confirm"]',
    pw:              '[data-testid="create-password-new-input"]',
    pwConfirm:       '[data-testid="create-password-confirm-input"]',
    pwTerms:         '[data-testid="create-password-terms"]',
    pwSubmit:        '[data-testid="create-password-submit"]',
    noThanks:        '[data-testid="metametrics-no-thanks"]',
    done:            '[data-testid="onboarding-complete-done"]',
    pinDone:         '[data-testid="pin-extension-done"]',
    notNow:          '[data-testid="not-now-button"]',
  },

  unlock: {
    pw:              '[data-testid="unlock-password"]',
    pwSubmit:        '[data-testid="unlock-submit"]',
  },
} as const;
