
// Helper function to handle Phantom extension popups
export async function phantomPopupConfirmation(
  context: any, 
  action: () => any, 
  description: string
) {
  const pagePromise = context.waitForEvent('page', {
    predicate: page => page.url().startsWith('chrome-extension://'),
    timeout: 10000
  });
  
  await action(); // Execute the triggering action
  
  try {
    const extensionPage = await pagePromise;
    await extensionPage.getByTestId('primary-button').click();
    await extensionPage.close();
    console.log(`✅ Handled ${description} popup`);
  } catch (error) {
    console.log(`⚠️ ${description} popup not found`);
  }
}
  
