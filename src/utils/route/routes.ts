// src/utils/routes.ts
//
// Sync loader for routes.yaml so tests can be generated at import time.
// - Reads ./routes.yaml from project root (process.cwd())
// - Merges top-level `defaults` into each route (route values override defaults)
// - Normalises a few fields (wallet_type → lower-case; amount → string)
//
// Install dependency: npm i yaml
//
// Usage:
//   import { getRoutesSync } from "../utils/routes";
//   const all = getRoutesSync();

import fs from "fs";
import path from "path";
import YAML from "yaml";

export type WalletType = "metamask" | "phantom";
export type RouteKind = "deposit" | "withdraw";
export type DepositRouteKind = "regular" | "instant";

export interface Route {
  id: string;
  kind: RouteKind;
  description?: string;
  wallet_type: WalletType;
  wallet_alias?: string;
  route_kind?: DepositRouteKind;
  amount: string;
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

export function getRoutesSync(): Route[] {
  const raw = fs.readFileSync(ROUTES_FILE, "utf8");
  const doc = YAML.parse(raw) as RoutesYaml;

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
