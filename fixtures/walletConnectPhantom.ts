import { phantomPopupConfirmation } from "./phantomPopupConfirmation";

// Fixture to handle complete Phantom wallet connection flow
export async function walletConnectPhantom(dappPage: any, context: any) {
  console.log("🚀 Starting Phantom wallet connection flow...");
  
  // Click Connect wallet button
  await dappPage.getByRole('banner').getByRole('button', { name: 'Connect wallet' }).click();
  
  // Select Phantom wallet
  await dappPage.getByRole('button', { name: 'Phantom (Solana)' }).click();
  
  // Send request and handle popup
  await phantomPopupConfirmation(context, () => dappPage.getByRole('button', { name: 'Send request' }).click(), "wallet connection");
  
  console.log("✅ Phantom wallet connected successfully");
}