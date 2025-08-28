import type { BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

let alreadyLogged = false;

export async function logExtensionsOnce(context: BrowserContext) {
  if (alreadyLogged) return;
  alreadyLogged = true;

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // A) What Chrome says is loaded (ground truth)
  const { targetInfos } = await cdp.send("Target.getTargets");
  const extTargets = targetInfos
    .filter(t => t.url.startsWith("chrome-extension://"))
    .map(t => ({ id: t.url.split("/")[2], type: t.type, title: t.title || "", url: t.url }));
  const versionInfo = await cdp.send("Browser.getVersion");
  const commandLine = (versionInfo as any).commandLine;

  console.log("[EXT] Chrome command line:", commandLine);
  console.log("[EXT] Active extension targets:");
  for (const e of extTargets) console.log("      •", e.id, e.title || "(no title)", e.type);

  // B) What’s in EXT_DIR (your unpacked mounts)
  const EXT_DIR = process.env.EXT_DIR || "/extensions";
  try {
    const entries = fs.readdirSync(EXT_DIR, { withFileTypes: true }).filter(d => d.isDirectory());
    console.log("[EXT] EXT_DIR:", EXT_DIR);
    for (const d of entries) {
      const manifestPath = path.join(EXT_DIR, d.name, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        console.log(`      • ${d.name}  name="${m.name}" version=${m.version}`);
      }
    }
  } catch (e: any) {
    console.log("[EXT] (could not read EXT_DIR)", e.message);
  }

  // C) What’s in the baked profile (installed extensions)
  try {
    const P = path.join(process.env.USER_DATA_DIR || "", "Default", "Preferences");
    const prefs = JSON.parse(fs.readFileSync(P, "utf8"));
    const settings = prefs?.extensions?.settings || {};
    console.log("[EXT] Profile extensions (Preferences):");
    for (const [id, s] of Object.entries<any>(settings)) {
      console.log(
        `      • ${id} enabled=${!!s.state || !!s.is_enabled} location=${s.location} manifestVersion=${s.manifest?.manifest_version}`
      );
    }
  } catch {
    // ok if not present
  }

  await page.close();
}
