// src/utils/routes.ts
//
// Sync loader for routes.yaml so tests can be generated at import time. Reads
// ./routes.yaml from the project root, merges top-level `defaults` into each
// route, normalises selected fields (wallet_type → lower-case, amount → string),
// and expands environment variables in the format ${VAR_NAME}. Install
// dependency: npm i js-yaml @types/js-yaml
//
// Usage:
//   import { getRoutesSync } from "../utils/routes";
//   const all = getRoutesSync();

import fs from "fs";
import path from "path";
import jsYaml from "js-yaml";
import { logger } from "../logger";

export type WalletType = "metamask" | "phantom";
export type RouteKind = "deposit" | "withdraw";
export type DepositRouteKind = "regular" | "instant";

export interface Route {
  id: string;
  kind: RouteKind;
  description?: string;
  wallet_type: WalletType;
  wallet_alias?: string;
  wallet_address: string;
  wallet_seed: string;
  dydx_address: string;
  dydx_seed: string;
  route_kind?: DepositRouteKind;
  amount: string;
  token: string;
  src_chain: string;
  dst_chain: string;
  cadence_min?: number;
  rebalance_threshold?: string;
  enabled?: boolean;
  paused?: boolean;
}

interface RoutesYaml {
  version?: number;
  defaults?: Partial<Route>;
  routes: Array<Partial<Route> & { id: string; kind: RouteKind }>;
}

const ROUTES_FILE = path.resolve(process.cwd(), "routes.yaml");

// Custom implicit type for environment variable substitution with `js-yaml`
const envVarType = new jsYaml.Type('!env-var', {
  kind: 'scalar',
  resolve: (data: any) => typeof data === 'string' && data.includes('${'),
  construct: (data: string) => {
    return data.replace(/\${([^}]+)}/g, (_, varName) => {
      const value = process.env[varName];
      if (!value) throw new Error(`Missing environment variable: ${varName}`);
      return value;
    });
  },
});

// Custom schema with our implicit type
const envVarSchema = jsYaml.DEFAULT_SCHEMA.extend({
  implicit: [envVarType]
});

/**
 * Loads `routes.yaml`, merges defaults, and normalises key fields.
 * Also validates required fields and warns or throws on duplicate ids.
 * @returns Fully merged list of runnable routes.
 */
export function getRoutesSync(): Route[] {
  const raw = fs.readFileSync(ROUTES_FILE, "utf8");
  const doc = jsYaml.load(raw, { schema: envVarSchema }) as RoutesYaml;

  if (!doc || !Array.isArray(doc.routes)) {
    throw new Error(`Invalid routes.yaml: missing 'routes' array`);
  }

  const defaults: Partial<Route> = doc.defaults ?? {};

  const merged: Route[] = doc.routes.map((r) => {
    // merge defaults → route overrides defaults
    const m = { ...defaults, ...r } as Route;

    // normalise wallet_type and amount
    if (m.wallet_type) m.wallet_type = String(m.wallet_type).toLowerCase() as WalletType;
    if (m.amount !== undefined) m.amount = String(m.amount);

    // enabled/paused defaulting (if not provided at either level)
    if (typeof m.enabled === "undefined") m.enabled = true;
    if (typeof m.paused === "undefined") m.paused = false;

    // Validate required fields by kind (deposit vs withdraw) and surface a friendly error early.
    const requiredCommon: Array<keyof Route> = [
      "wallet_type",
      "wallet_alias",
      "wallet_address",
      "wallet_seed",
      "dydx_address",
      "dydx_seed",
      "amount",
      "src_chain",
      "dst_chain",
    ];
    const requiredByKind: Record<RouteKind, Array<keyof Route>> = {
      deposit: ["token", "route_kind"],
      withdraw: [],
    };

    const missing = [...requiredCommon, ...requiredByKind[m.kind]].filter((k) => {
      const v = (m as any)[k];
      return v === undefined || v === null || String(v).trim() === "";
    });
    if (missing.length > 0) {
      const list = missing.join(", ");
      throw new Error(
        `Invalid route '${m.id}' (${m.kind}): missing required field(s): ${list}`
      );
    }
    return m;
  });

  // Detect duplicate route IDs and warn or throw (config via ROUTE_ID_DUPLICATE_MODE=warn)
  {
    const counts = new Map<string, number>();
    for (const r of merged) counts.set(r.id, (counts.get(r.id) || 0) + 1);
    const dups = Array.from(counts.entries()).filter(([, c]) => c > 1);
    if (dups.length) {
      const mode = String(process.env.ROUTE_ID_DUPLICATE_MODE || "").toLowerCase();
      const msg = `Duplicate route id(s) in routes.yaml: ${dups
        .map(([id, c]) => `${id} (x${c})`)
        .join(", ")}`;
      if (mode === "warn" || mode === "warning" || mode === "ignore") {
        logger.warning(msg);
      } else {
        throw new Error(msg);
      }
    }
  }
  return merged;
}
