// src/utils/routes.ts
//
// Sync loader for routes.yaml so tests can be generated at import time.
// - Reads ./routes.yaml from project root (process.cwd())
// - Merges top-level `defaults` into each route (route values override defaults)
// - Normalises a few fields (wallet_type → lower-case; amount → string)
// - Expands environment variables in the format ${VAR_NAME}
//
// Install dependency: npm i js-yaml @types/js-yaml
//
// Usage:
//   import { getRoutesSync } from "../utils/routes";
//   const all = getRoutesSync();

import fs from "fs";
import path from "path";
import jsYaml from "js-yaml";

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
  route_kind?: DepositRouteKind;
  amount: string;
  token: string;
  src_chain: string;
  dst_chain: string;
  cadence_min?: number;
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

    return m;
  });

  return merged;
}
