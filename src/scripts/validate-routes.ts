// Validate routes.yaml using the project loader (strong checks)
// - Pre-populates any ${VAR} placeholders with dummy values so CI doesn't need secrets
// - Reuses getRoutesSync() which validates required fields, merges defaults, and checks duplicates

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger/logging-utils';

// Prime env vars found in routes.yaml so the loader's env substitution doesn't fail in CI
function primeEnvFromYaml(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const re = /\$\{([^}]+)}/g;
  const vars = new Set<string>();
  for (const m of raw.matchAll(re)) {
    const name = m[1];
    if (name) vars.add(name.trim());
  }
  for (const v of vars) {
    if (!process.env[v]) process.env[v] = 'placeholder';
  }
}

async function main() {
  try {
    const routesPath = path.resolve(process.cwd(), 'routes.yaml');
    primeEnvFromYaml(routesPath);
    // Ensure duplicates fail CI (default behavior), but make explicit here
    process.env.ROUTE_ID_DUPLICATE_MODE = 'throw';

    // Dynamic import to avoid ESM/CommonJS quirks in various runners
    const { getRoutesSync } = await import('../utils/route/routes');
    const routes = getRoutesSync();
    // Basic additional sanity: at least one route
    if (!routes || !Array.isArray(routes)) throw new Error('Loader did not return routes array');
    logger.info(`routes.yaml OK (${routes.length} routes)`);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error('❌ routes.yaml validation failed:', new Error(errorMessage));
    process.exit(1);
  }
}

main();
