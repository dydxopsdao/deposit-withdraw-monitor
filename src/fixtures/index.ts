// src/fixtures/index.ts
import { test as base } from "@playwright/test";

// no custom fixtures, no extensions, no auto-open.
// just re-export Playwright's test so your spec can `import { test, expect } from "../fixtures"`

export const test = base;
export const expect = test.expect;
