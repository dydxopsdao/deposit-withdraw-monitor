import type { BrowserContext, Page } from "@playwright/test";
import { DAPP_URL } from "../../config/constants";


//Just to fix the import error
export async function open(context: BrowserContext, url = DAPP_URL): Promise<Page> {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return page;
  }