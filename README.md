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

## 🧪 Running Tests

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


