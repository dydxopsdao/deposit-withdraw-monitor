import { phantomTest, metamaskTest, expect } from "../fixtures";

phantomTest.describe("Phantom Wallet Tests", () => {
  phantomTest("Regular deposit flow with Phantom Wallet", async ({ dappPage, context }) => {
    // This pause is to be removed and replaced by tests that use dappPage 
    // which has the dYdX App loaded with Phantom Wallet connected
    await dappPage.pause();
  });
});

metamaskTest.describe("Metamask Wallet Tests", () => {
  metamaskTest("Regular deposit flow with Metamask Wallet", async ({ dappPage, context }) => {
    // This pause is to be removed and replaced by tests that use dappPage 
    // which has the dYdX App loaded with Metamask Wallet connected 
    await dappPage.pause();
  });
});
