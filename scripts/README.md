# Scripts Directory

Reorganized scripts folder with clean categorical organization. All scripts are organized by function for better discoverability and maintainability.

## Quick Reference

### Most Common Commands

```bash
# Development
npm run dev:restart          # Clear cache + restart dev server
npm run cache:clear          # Clear all caches (.next, Turbo, etc.)
npm run reset                # Reset environment: drop DB + reseed

# Database
npm run drift:check          # Check for schema drift
npm run drift:fix            # Auto-fix migration drift
npm run db:generate          # Generate Prisma client
bash scripts/deploy/db-backup.sh backup --force    # Manual backup
bash scripts/deploy/db-backup.sh restore           # Interactive restore

# Production
npm run deploy               # Deploy with migrations + seed
npm run build                # Production build with validation
bash scripts/deploy/production-deploy.sh           # Manual 8-stage pipeline

# User Management
npm run roles:manage         # Interactive role manager
npm run sync:users           # Sync from Microsoft Graph
```

## Directory Structure

```
scripts/
├── deploy/          # Production deployment pipeline (4 scripts)
├── db/              # Database operations (4 scripts)
├── imports/         # Data import tools (9 scripts)
├── users/           # User & admin management (5 scripts)
├── build/           # Build & bundling tools (7 scripts)
├── dev/             # Development utilities (9 scripts)
├── monitoring/      # Infrastructure monitoring (2 scripts)
├── one-time/        # Historical fixes (5 scripts)
└── utils/           # Shared utilities (1 script)
```

## Scripts by Category

### Deploy (Production-Critical)

| Script | Purpose | Usage |
|--------|---------|-------|
| **git-auto-deploy.sh** | Auto-deploy from Git | Cron: `*/2 * * * *` (production only) |
| **production-deploy.sh** | 8-stage deployment pipeline | `bash scripts/deploy/production-deploy.sh` |
| **db-backup.sh** | Database backup/restore | `bash scripts/deploy/db-backup.sh backup` |
| **start-server.js** | Production server startup | `node scripts/deploy/start-server.js` |

### Database Operations

| Script | Purpose | Usage |
|--------|---------|-------|
| **fix-migration-drift.ts** | Auto-fix schema drift | `npm run drift:fix` |
| **verify-migration-drift.ts** | Detect schema drift | `npm run drift:check` |
| **rollback-migration-fix.ts** | Rollback drift fix | `npm run drift:rollback` |
| **migrate-sla-data.ts** | One-time SLA migration | `npx tsx scripts/db/migrate-sla-data.ts` |

### Data Imports

| Script | Purpose | Usage |
|--------|---------|-------|
| **import-physical-assets.ts** | Import laptops + monitors | `npx tsx scripts/imports/import-physical-assets.ts` |
| **import-network-assets.ts** | Import network infrastructure | `npx tsx scripts/imports/import-network-assets.ts` |
| **import-telephone-assets.ts** | Import telephone systems | `npx tsx scripts/imports/import-telephone-assets.ts` |
| **import-network-cis.ts** | Import network CIs | `npx tsx scripts/imports/import-network-cis.ts` |
| **import-cloud-cis.ts** | Import cloud infrastructure CIs | `npx tsx scripts/imports/import-cloud-cis.ts` |
| **import-services.ts** | Import service definitions | `npx tsx scripts/imports/import-services.ts` |
| **import-service-cis.ts** | Import service-to-CI relationships | `npx tsx scripts/imports/import-service-cis.ts` |
| **import-service-ownership.ts** | Import service ownership | `npx tsx scripts/imports/import-service-ownership.ts` |
| **import-service-bia.ts** | Import business impact analysis | `npx tsx scripts/imports/import-service-bia.ts` |

**Note:** All import scripts support `--dry-run` mode and source from `local/barq-data/`.

### User Management

| Script | Purpose | Usage |
|--------|---------|-------|
| **manage-user-roles.ts** | Interactive role manager | `npm run roles:manage` |
| **sync-users-from-graph.ts** | Sync from Microsoft Graph | `npm run sync:users` |
| **backfill-azure-ad-ids.ts** | Match existing users with Azure AD | `npm run backfill:azure-ids` |
| **link-user-to-person.ts** | Link orphaned users to persons | `npx tsx scripts/users/link-user-to-person.ts` |
| **ensure-system-admin-permissions.ts** | Fix system-administrator role | `npx tsx scripts/users/ensure-system-admin-permissions.ts` |

### Build Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| **build.js** | Enhanced build with progress | `npm run build` (via package.json) |
| **deploy.js** | Deployment orchestrator | `npm run deploy` |
| **analyze-bundle.js** | Bundle size analysis | `npm run build:analyze` |
| **recreate-prisma-index.js** | Prisma client barrel exports | `npm run db:generate` (postgenerate hook) |
| **generate-routes.ts** | Auto-generate route config | `npm run generate:routes` |
| **shim-server-only.js** | Server-only shim for workers | Used in worker processes |
| **silence-baseline-warning.cjs** | Suppress Browserslist warnings | Used in build scripts |

### Development Utilities

| Script | Purpose | Usage |
|--------|---------|-------|
| **reset-dev-environment.ts** | Full reset: DB + cache | `npm run reset` |
| **clear-cache.ts** | Clear all caches | `npm run cache:clear` |
| **restart-dev.sh** | Restart dev server | `npm run dev:restart` |
| **stop-services.sh** | Stop all services | `npm run stop` or `npm run stop:force` |
| **type-check-staged.sh** | Fast staged file type-check | `npm run type-check:staged` (pre-commit hook) |
| **setup-backup-storage.sh** | Setup backup directories | Manual (one-time) |
| **test-email.ts** | Test Microsoft Graph email | `npx tsx scripts/dev/test-email.ts` |
| **test-password-compatibility.ts** | Test password handling | `npx tsx scripts/dev/test-password-compatibility.ts` |
| **debug-intune-graph.ts** | Debug Intune device sync | `npx tsx scripts/dev/debug-intune-graph.ts` |

### Monitoring

| Script | Purpose | Usage |
|--------|---------|-------|
| **bull-board-server.ts** | BullMQ queue monitoring UI | `npm run queues:board` |
| **worker-health.ts** | Background worker diagnostics | `npm run worker:health` |

### One-Time Fixes (Archive)

| Script | Purpose | Status |
|--------|---------|--------|
| **fix-manifest-permissions.ts** | Fix route manifest permissions | Completed |
| **fix-prisma-imports.ts** | Fix Prisma import paths | Completed |
| **fix-network-asset-tags.ts** | Fix asset tag formatting | Completed |
| **check-user-person-links.ts** | Diagnostic for user-person links | Utility |
| **extract-lookup-values.ts** | Extract lookup values for debugging | Utility |

## Common Workflows

### Production Deployment

**Automatic (Production Server):**
```bash
# Runs every 2 minutes via cron
tail -f local/logs/auto-deploy-$(date +%Y%m).log
```

**Manual Deployment:**
```bash
npm run deploy                           # Standard deployment
bash scripts/deploy/production-deploy.sh # Manual 8-stage pipeline
```

**Rollback:**
```bash
bash scripts/deploy/db-backup.sh restore  # Interactive backup selection
```

### Database Management

**Schema Changes:**
```bash
# 1. Edit .prisma files
# 2. Create migration
npx prisma migrate dev --name describe_changes
# 3. Regenerate client
npm run db:generate
```

**Drift Detection & Fix:**
```bash
npm run drift:check    # Detect drift
npm run drift:fix      # Auto-fix with backup
npm run drift:rollback # Rollback if needed
```

**Backup & Restore:**
```bash
bash scripts/deploy/db-backup.sh backup --force   # Create backup
bash scripts/deploy/db-backup.sh restore          # Interactive restore
```

### Development Reset

```bash
npm run reset          # Nuclear reset: drop DB + reseed
npm run cache:clear    # Clear caches only
npm run dev:restart    # Clear cache + restart dev server
```

## Best Practices

### Technology Standards

- **Inquirer Prompts:** Use `@inquirer/prompts` v8+ (NOT legacy `inquirer`)
- **Prisma Client:** Import from `@/infrastructure/database/prisma/client` singleton
- **Environment:** Use `dotenv -e .env.local` wrapper for `.env.local` loading
- **DI Container:** Initialize with `await initContainer()`, resolve via `getContainer()`
- **Error Handling:** Always use try-catch with descriptive errors
- **Logging:** Use structured logging with context (userId, requestId, etc.)

### Security Checklist

- [ ] No hardcoded credentials or secrets
- [ ] Environment variables validated before use
- [ ] Database connections properly closed (`await prisma.$disconnect()`)
- [ ] Destructive operations require confirmation (unless `--force` flag)
- [ ] Sensitive data redacted in logs
- [ ] Backup created before destructive operations

### DO's

- ✅ Use `bash scripts/category/script-name.sh` for shell scripts
- ✅ Use `npx tsx scripts/category/script-name.ts` for TypeScript scripts
- ✅ Use `npm run command` when available (preferred)
- ✅ Add `--help` flag for usage instructions
- ✅ Support `--dry-run` for preview mode
- ✅ Create backups before destructive operations
- ✅ Use descriptive exit codes (0=success, 1-99=specific errors)
- ✅ Log to files for production scripts (`local/logs/`)

### DON'Ts

- ❌ Never use `prisma db push` (bypasses migrations)
- ❌ Never create migration files manually (use `prisma migrate dev`)
- ❌ Never commit `.env.local` or credentials
- ❌ Never skip confirmations without `--force` flag
- ❌ Never use `console.log` in production (use structured logging)
- ❌ Never hardcode paths (use `__dirname` or env variables)

## Troubleshooting

### Common Errors

**"BASH_SOURCE[0]: parameter not set"**
- **Cause:** Script executed without bash
- **Fix:** Use `bash scripts/deploy/db-backup.sh` (not `sh`)

**"Migration drift detected"**
- **Cause:** Database schema doesn't match migration history
- **Fix:** Run `npm run drift:fix` (creates automatic backup)

**"Prisma Client generation failed"**
- **Cause:** Invalid schema or missing `@prisma/client`
- **Fix:** Check schema syntax, run `npm install`

**"Port 3000 already in use"**
- **Cause:** Dev server or PM2 process running
- **Fix:** Run `npm run stop:force` to kill all processes

## Production Cron Job

**Location:** Production server only (`/home/opc/node-projects/barq-assets/`)

**Cron Entry:**
```bash
*/2 * * * * /home/opc/node-projects/barq-assets/scripts/deploy/git-auto-deploy.sh
```

**Monitoring:**
```bash
tail -f local/logs/auto-deploy-$(date +%Y%m).log
tail -f local/logs/cron.log
```

**Health Checks:**
- Auto-deploy runs every 2 minutes
- Performs 8-stage deployment (backup, dependencies, build, migrations, etc.)
- Sends Pushover notifications on failure/recovery
- Zero-downtime PM2 graceful reload

## Related Documentation

- **[MODERNIZATION_NOTES.md](MODERNIZATION_NOTES.md)** - Modern patterns applied to scripts
- **[ROLE_MANAGER_TESTING.md](ROLE_MANAGER_TESTING.md)** - Role manager testing procedures
- **[FILE_MAPPING.md](FILE_MAPPING.md)** - Complete old → new path mapping
- **[../CLAUDE.md](../CLAUDE.md)** - Project-wide quick reference
- **[../docs/operations/AUTOMATED_DEPLOYMENT.md](../docs/operations/AUTOMATED_DEPLOYMENT.md)** - Production deployment guide
- **[../docs/guides/DEVELOPER_GUIDE.md](../docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide

## Maintenance

**When adding new scripts:**
1. Place in appropriate category folder
2. Add entry to this README (category table)
3. Add npm script to `package.json` if frequently used
4. Document usage with `--help` flag
5. Follow technology standards above

**Archive criteria:**
- One-time migrations → `one-time/`
- Completed fixes → `one-time/`
- No longer used but keep for reference → `one-time/`

**Folder structure last updated:** 2025-12-03
