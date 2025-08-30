import { Page } from '@playwright/test';
import { logger } from '../logger/logging-utils';

// Click the first visible button matching any of the provided regexes.
export async function clickAnyButton(page: Page, names: RegExp[], contextLabel: string) {
  for (const re of names) {
    const btn = page.getByRole('button', { name: re });
    if (await btn.first().isVisible()) {
      logger.debug(`${contextLabel}: clicking "${re.source}"`);
      await btn.first().click();
      // Some flows show two steps (e.g. Next → Connect). Keep trying others for a short time.
      await page.waitForTimeout(250).catch(() => {
        /* pop-ups get closed by the time we get here - ignore*/
      });
    }
  }
}
