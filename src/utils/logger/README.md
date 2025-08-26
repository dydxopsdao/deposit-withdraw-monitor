# Logger

Small console logger with timestamped, human-readable output and optional metadata/error details.

* File: `utils/logger/logging-utils.ts`
* Formatter: `utils/logger/formatters.ts`
* Types: `utils/logger/types.ts`

---

## Features

* **Pretty output**: `[ISO_TIMESTAMP] [LEVEL] Message`
* **Safe metadata serialisation**: BigInt → string; ArrayBuffer/TypedArrays/Set/Map handled; circular refs safe
* **Error aware**: Serialises `{ name, message, stack, code?, cause? }`
* **Secret redaction**: Keys like `password`, `seed`, `privateKey`, `apiKey`, `authorization`, `token`, etc. are redacted
  *(exact, case-sensitive by default — see “Optional improvement” below)*

---

## Install / Import

```ts
import { logger } from "../utils/logger/logging-utils"; // adjust path
```

---

## Quick start

```ts
logger.debug("Fetching balances");
logger.info("Starting test run");
logger.step("Connect wallet");
logger.success("Wallet connected");
logger.warning("Balance is low", { balance: 0.01 });

logger.error("Failed to connect", new Error("Timeout"), { retries: 3 });
```

### Example output

```
[2025-01-01T12:00:00.000Z] [INFO] Starting test run
[2025-01-01T12:00:00.100Z] [STEP] Connect wallet
[2025-01-01T12:00:02.350Z] [ERROR] Failed to connect
Error: Timeout
Stack: Error: Timeout
  at ...
Metadata: {
  "retries": 3
}
```

---

## Metadata & redaction

`formatters.pretty` uses `safeStringify` which:

* **BigInt** → string
* **ArrayBuffer** → hex string
* **TypedArrays** → plain arrays
* **Set/Map** → arrays / objects
* **Error in metadata** → serialised error object
* **Circular references** → `"[Circular]"`
* **Secrets** → redacted as `"[REDACTED]"` when a metadata key matches the redaction set *(exact, case-sensitive)*

Extend the redaction list when needed:

```ts
import { safeStringify } from "../utils/logger/formatters";

const EXTRA_REDACTIONS = new Set(["sessionId", "csrf", "x-api-token"]);
const json = safeStringify(obj, EXTRA_REDACTIONS, 2);
```

### Concrete serialisation example

```ts
logger.info("Serialized metadata", {
  amount: 123n,
  raw: new Uint8Array([1, 2, 3]),
});
```

Produces:

```
Metadata: {
  "amount": "123",
  "raw": [1,2,3]
}
```

---

## Using in Playwright tests

```ts
import { test, expect } from "@playwright/test";
import { logger } from "../utils/logger/logging-utils";

test("Connect MetaMask", async ({ page }) => {
  logger.step("Opening app", { url: "https://example.test" });
  await page.goto("https://example.test");

  logger.info("Click connect button", { selector: "[data-testid=connect]" });
  await page.getByTestId("connect").click();

  logger.success("Connected");
});
```

---

## Best practices

* **Use `step`** for high-level milestones in E2E flows.
* **Attach metadata** for context (ids, amounts, selectors). Keep it small.
* **Pass real `Error` objects** to `logger.error` to include message + stack.
* Avoid logging whole pages/responses; log the essentials.

---

## Notes

* **Alias**: `logger.warn` calls `logger.warning`.
* **Output**: Pretty console format by default; there’s no JSON log mode or level filtering yet (kept simple on purpose).
* **Zero deps**: Uses the platform console.

---

## API

```ts
logger.debug(message: string, metadata?: LogMetadata): void;
logger.info(message: string, metadata?: LogMetadata): void;
logger.step(message: string, metadata?: LogMetadata): void;
logger.success(message: string, metadata?: LogMetadata): void;
logger.warning(message: string, metadata?: LogMetadata): void;
logger.warn(message: string, metadata?: LogMetadata): void; // alias of warning
logger.error(message: string, error?: Error, metadata?: LogMetadata): void;
```

**Types**

```ts
export type LogLevel = "debug" | "info" | "step" | "success" | "warning" | "error";

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: Error;
}
```

---

## Troubleshooting

* Seeing `"[Circular]"`? You passed a cyclic object; that’s expected.
* Secret not redacted? Ensure your key name exactly matches the default set or pass your own extended set to `safeStringify`.

---