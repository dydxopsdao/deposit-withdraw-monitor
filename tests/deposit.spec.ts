import { testWithPhantom, expect } from "../fixtures";

testWithPhantom("Regular deposit flow with Phantom Wallet", async ({ dappPage, context }) => {
  
  // This pause is to be removed and replaced by tests that use dappPage 
  // which has the dYdX App loaded with Phantom Wallet connected
  await dappPage.pause();
});
