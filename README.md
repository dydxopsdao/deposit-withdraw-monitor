> **⚠️ WARNING – NOT PRODUCTION READY**

>
> **Planned changes:**  
> - Download and load Phantom extension at runtime.  
> - Import wallet using a test seed from environment variables.  
> - Ensure secrets are injected securely in CI.



## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

## 📦 Downloading Chrome Extensions

Download and extract Chrome extensions for testing:

```bash
# Download Phantom wallet extension
npm run download-phantom

# Download any extension (requires name and ID)
node scripts/download-extension.js <extension-name> <extension-id>
```

Extensions are downloaded to `extensions/<extension-name>/` with CRX/ZIP files automatically cleaned up.

## 🧪 Running Tests

### ⚠️ Run with clean user data
While this repo is a work in progress, it's recommended to start each run with a clean slate to avoid any leftover data from previous Phantom wallet connections.
```bash
rm -rf user-data test-results playwright-report && ENV_PATH=.env.local npx playwright test
```

### Run all tests:
```bash
ENV_PATH=.env.local npx playwright test
```

### Run a specific test:
```bash
ENV_PATH=.env.local npx playwright test --grep "Connect MetaMask Wallet"
```

### Skipping Tests

You can skip a test by appending `.skip` to the `test` function. This is useful when a test is failing due to a known issue that you don't want to fix immediately.

**Skip a single test:**
```typescript
test.skip('test name', async ({ page }) => {
  // test code
});
```


