export async function findPageWithUrl(
    context: any, 
    urlPattern: string, 
    maxRetries: number = 10, 
    retryDelay: number = 1000
  ) {
    console.log(`⏳ Waiting for page with URL pattern: ${urlPattern}`);
  
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      
      const pages = await context.pages();
      const existingPopup = await pages.find(page => page.url().match(new RegExp(urlPattern)));
      
      if (existingPopup) {
        await existingPopup.waitForLoadState('domcontentloaded');
        console.log("✅ Found existing popup");
        return existingPopup;
      }
  
      console.log(`⏳ No page found, waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  
    console.log("❌ No page found after all retries");
    return null;
  }