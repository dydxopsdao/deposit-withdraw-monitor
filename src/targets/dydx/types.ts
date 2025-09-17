import type { Locator, Page } from "@playwright/test";

export type Selector<Args extends unknown[] = []> = (page: Page, ...args: Args) => Locator;

export type WaitTarget = string | ((page: Page) => Locator);
