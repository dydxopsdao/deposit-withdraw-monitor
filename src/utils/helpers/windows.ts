import { logger } from "../logger/logging-utils";

/**
 * Finds a page with a given URL pattern in the context
 * 
 * @param context - The context to search in
 * @param urlPattern - The URL pattern to search for
 * @param maxRetries - The maximum number of retries
 * @param retryDelay - The delay between retries
 * @returns The page if found, otherwise null
 */
export async function findPageWithUrl(
    context: any, 
    urlPattern: string | RegExp, 
    maxRetries: number = 10, 
    retryDelay: number = 1000
  ) {
    logger.debug(`Waiting for page with URL pattern: ${urlPattern}`);
  
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.debug(`Attempt ${attempt}/${maxRetries}`);
      
      const pages = await context.pages();
      const urls = context.pages().map(p => p.url());
      logger.debug(`context.pages(): ${urls.join(' | ')}`);
      const existingPopup = await pages.find(page => {
        const url = page.url();
        if (urlPattern instanceof RegExp) {
          return urlPattern.test(url);
        } else {
          return url.includes(urlPattern);
        }
      });
      
      if (existingPopup) {
        await existingPopup.waitForLoadState('domcontentloaded');
        logger.debug("Found existing popup");
        return existingPopup;
      }
  
      logger.debug(`No page found, waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  
    logger.error("No page found after all retries");
    return null;
  }