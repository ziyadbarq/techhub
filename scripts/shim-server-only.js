/**
 * Shim for server-only package in CLI scripts
 *
 * This module mocks the `server-only` package to allow running scripts
 * that use the DI container outside of a Next.js server context.
 *
 * Usage:
 *   tsx --import ./scripts/shim-server-only.js scripts/my-script.ts
 *
 * Scripts using this shim (via package.json):
 *   - sync:users        (scripts/sync-users-from-graph.ts)
 *   - backfill:azure-ids (scripts/backfill-azure-ad-ids.ts)
 *   - worker:dev        (src/infrastructure/services/queue/worker.ts)
 *   - worker:start      (src/infrastructure/services/queue/worker.ts)
 *
 * Why needed:
 * - Infrastructure/repository files import from `@/generated/prisma/server`
 * - `server.ts` imports `server-only` which throws outside Next.js context
 * - CLI scripts (via tsx) are not recognized as Next.js server context
 * - Any script using `initContainer()` triggers these imports
 *
 * This shim uses Node.js module hooks to intercept `server-only` imports
 * and return an empty module instead of throwing.
 */

import { register } from "node:module";

// Register a loader hook that intercepts server-only imports
register(
  "data:text/javascript," +
    encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === 'server-only') {
        return {
          url: 'data:text/javascript,export default {}',
          shortCircuit: true
        };
      }
      return nextResolve(specifier, context);
    }
  `),
);
