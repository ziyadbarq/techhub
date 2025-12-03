# Scripts Reorganization File Mapping

Generated: 2025-12-03

## Deploy Category (4 files)
- `git-auto-deploy.sh` → `deploy/git-auto-deploy.sh`
- `production-deploy.sh` → `deploy/production-deploy.sh`
- `db-backup.sh` → `deploy/db-backup.sh`
- `start-server.js` → `deploy/start-server.js`

## Database Category (4 files)
- `fix-migration-drift.ts` → `db/fix-migration-drift.ts`
- `verify-migration-drift.ts` → `db/verify-migration-drift.ts`
- `rollback-migration-fix.ts` → `db/rollback-migration-fix.ts`
- `migrate-sla-data.ts` → `db/migrate-sla-data.ts`

## Imports Category (9 files)
- `import-physical-assets.ts` → `imports/import-physical-assets.ts`
- `import-network-assets.ts` → `imports/import-network-assets.ts`
- `import-telephone-assets.ts` → `imports/import-telephone-assets.ts`
- `import-network-cis.ts` → `imports/import-network-cis.ts`
- `import-cloud-cis.ts` → `imports/import-cloud-cis.ts`
- `import-services.ts` → `imports/import-services.ts`
- `import-service-cis.ts` → `imports/import-service-cis.ts`
- `import-service-ownership.ts` → `imports/import-service-ownership.ts`
- `import-service-bia.ts` → `imports/import-service-bia.ts`

## Users Category (5 files)
- `manage-user-roles.ts` → `users/manage-user-roles.ts`
- `sync-users-from-graph.ts` → `users/sync-users-from-graph.ts`
- `backfill-azure-ad-ids.ts` → `users/backfill-azure-ad-ids.ts`
- `link-user-to-person.ts` → `users/link-user-to-person.ts`
- `ensure-system-admin-permissions.ts` → `users/ensure-system-admin-permissions.ts`

## Build Category (7 files)
- `build.js` → `build/build.js`
- `deploy.js` → `build/deploy.js`
- `analyze-bundle.js` → `build/analyze-bundle.js`
- `recreate-prisma-index.js` → `build/recreate-prisma-index.js`
- `generate-routes.ts` → `build/generate-routes.ts`
- `shim-server-only.js` → `build/shim-server-only.js`
- `silence-baseline-warning.cjs` → `build/silence-baseline-warning.cjs`

## Dev Category (9 files)
- `reset-dev-environment.ts` → `dev/reset-dev-environment.ts`
- `clear-cache.ts` → `dev/clear-cache.ts`
- `restart-dev.sh` → `dev/restart-dev.sh`
- `stop-services.sh` → `dev/stop-services.sh`
- `type-check-staged.sh` → `dev/type-check-staged.sh`
- `setup-backup-storage.sh` → `dev/setup-backup-storage.sh`
- `test-email.ts` → `dev/test-email.ts`
- `test-password-compatibility.ts` → `dev/test-password-compatibility.ts`
- `debug-intune-graph.ts` → `dev/debug-intune-graph.ts`

## Monitoring Category (2 files)
- `bull-board-server.ts` → `monitoring/bull-board-server.ts`
- `worker-health.ts` → `monitoring/worker-health.ts`

## One-Time Category (5 files)
- `fix-manifest-permissions.ts` → `one-time/fix-manifest-permissions.ts`
- `fix-prisma-imports.ts` → `one-time/fix-prisma-imports.ts`
- `fix-network-asset-tags.ts` → `one-time/fix-network-asset-tags.ts`
- `check-user-person-links.ts` → `one-time/check-user-person-links.ts`
- `extract-lookup-values.ts` → `one-time/extract-lookup-values.ts`

## Utils (Unchanged)
- `utils/prisma-json.ts` → `utils/prisma-json.ts` (no change)

## Documentation (Unchanged)
- `README.md` → `README.md` (will be rewritten)
- `MODERNIZATION_NOTES.md` → `MODERNIZATION_NOTES.md` (no change)
- `ROLE_MANAGER_TESTING.md` → `ROLE_MANAGER_TESTING.md` (no change)

---

**Total:** 45 scripts being reorganized (41 moving, 4 staying in place)
