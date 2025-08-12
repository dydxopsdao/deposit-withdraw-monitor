// tests/fixtures.ts
import { chromium as _chromium, test as _test } from '@playwright/test';
import path from 'path';

const EXT_PATH      = path.resolve(__dirname, 'extensions/phantom');
const USER_DATA_DIR = path.resolve(__dirname, 'user-data');
const EXT_ID        = 'bfnaelmomeimhlpmgjnjophhpkkoljpa';

export const test = _test.extend<{
  context: import('@playwright/test').BrowserContext,
  page: import('@playwright/test').Page,
}>({
  context: async ({ }, use) => {
    console.log('➜ Loading Phantom extension from:', EXT_PATH);

    const context = await _chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        `--disable-extensions-except=${EXT_PATH}`,
        `--load-extension=${EXT_PATH}`,
      ],
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await use(context);
    await context.close();
  },

  page: async ({ context }, use) => {
    const [page] = context.pages();
    await use(page);
  },
});

export { expect } from '@playwright/test';
