import path from "path";
import type { Route } from "../route/routes";

// Base dir comes from env for Docker, falls back to repo user-data
const BASE = process.env.USER_DATA_DIR || path.resolve(process.cwd(), "user-data");

function slug(s: string) {
  return String(s).toLowerCase();
}

/**
 * Resolve the baked user-data directory for a given route
 * based on your current repo structure.
 */
export function getProfileDir(route: Route): string {
  const wallet = slug(route.wallet_type);      // metamask|phantom
  const op = slug(route.kind);                 // deposit|withdraw
  const src = slug(route.src_chain);
  const dst = slug(route.dst_chain);
  const kind = slug((route as any).route_kind || "regular"); // instant|regular

  if (wallet === "metamask") {
    if (op === "deposit") {
      // user-data/metamask/deposits/(instant|regular)/metamask-<src>-usdc-deposit-(instant|regular)
      const name = `metamask-${src}-usdc-deposit-${kind}`;
      return path.join(BASE, "metamask", "deposits", kind, name);
    } else {
      // user-data/metamask/withdraws/metamask-<dst>-usdc-withdrawal
      const name = `metamask-${dst}-usdc-withdrawal`;
      return path.join(BASE, "metamask", "withdraws", name);
    }
  } else {
    if (op === "deposit") {
      // user-data/phantom/deposits/phantom-<src>-usdc-deposit
      const name = `phantom-${src}-usdc-deposit`;
      return path.join(BASE, "phantom", "deposits", name);
    } else {
      // user-data/phantom/withdraws/phantom-<dst>-usdc-withdrawal
      const name = `phantom-${dst}-usdc-withdrawal`;
      return path.join(BASE, "phantom", "withdraws", name);
    }
  }
}

/** Optional: warn if the folder doesn't exist (helps catch typos early). */
export function assertProfileDirExists(dir: string, ctx?: Record<string, unknown>) {
  try {
    // eslint-disable-next-line n/no-sync
    const fs = require("fs");
    if (!fs.existsSync(dir)) {
      const extra = ctx ? ` ${JSON.stringify(ctx)}` : "";
      console.warn(`[profiles] user-data path not found: ${dir}${extra}`);
    }
  } catch {
    // ignore
  }
}
