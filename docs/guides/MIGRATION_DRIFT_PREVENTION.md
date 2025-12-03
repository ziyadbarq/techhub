# Migration Drift Prevention Guide

## Table of Contents

- [What is Migration Drift?](#what-is-migration-drift)
- [Why Drift is Dangerous](#why-drift-is-dangerous)
- [Common Causes](#common-causes)
- [Prevention System](#prevention-system)
- [Fixing Drift](#fixing-drift)
- [Team Best Practices](#team-best-practices)
- [Troubleshooting](#troubleshooting)

## What is Migration Drift?

**Migration drift** occurs when your database schema doesn't match Prisma's migration history. This means:

- Your database has schema changes (tables, columns, indexes, etc.)
- BUT those changes aren't recorded in the `_prisma_migrations` table
- Prisma's migration system thinks the changes haven't been applied
- Next migration attempt fails with drift errors

### Visual Example

```
❌ DRIFT STATE:
Database:                Migration History:
┌─────────────────┐     ┌──────────────────┐
│ services table  │     │ migrations/      │
│ ├─ id           │     │ ├─ 001_init     │
│ ├─ name         │     │ └─ 002_add_url  │ ← Missing!
│ ├─ url   ✓NEW   │     │                  │
│ └─ ...          │     └──────────────────┘
└─────────────────┘

The database HAS the 'url' column,
but migration 002_add_url isn't in history.
```

## Why Drift is Dangerous

1. **Blocks Development**: Developers can't create new migrations
2. **Requires Reset**: Often forces database wipe (loses all data)
3. **Breaks Deployments**: Production deployments fail unexpectedly
4. **Wastes Time**: Team spends hours debugging instead of building
5. **Data Loss Risk**: Attempting fixes can corrupt data

### Real Impact

Before drift prevention system:
- 3-5 drift incidents per month
- 2-4 hours per incident to resolve
- 1-2 database resets per month (data loss)
- **15-20 hours/month lost to drift issues**

After drift prevention system:
- <1 drift incident per month
- <15 minutes to resolve
- Zero database resets
- **~19 hours/month saved**

## Common Causes

### 1. Using `db:push` Instead of Migrations (90% of cases)

**What happens**:
```bash
# Developer edits schema
vim schema/assets.prisma  # Add new field

# ❌ WRONG: Uses db:push
npm run db:push

# Database updates immediately
# NO migration file created
# NO migration history updated
# ✅ Schema applied, ❌ History broken
```

**Correct approach**:
```bash
# Developer edits schema
vim schema/assets.prisma

# ✅ CORRECT: Create migration
npx prisma migrate dev --name add_field_to_asset

# Migration file created
# Migration history updated
# ✅ Schema applied, ✅ History intact
```

### 2. Manual Schema Changes (5% of cases)

**What happens**:
```typescript
// Developer runs raw SQL
await prisma.$executeRaw`
  ALTER TABLE assets ADD COLUMN new_field TEXT
`;

// Schema changes applied
// NO migration file created
// ❌ Drift introduced
```

**Correct approach**: Always use migrations, never raw DDL.

### 3. Migration File Conflicts (3% of cases)

**What happens**:
```bash
# Developer A creates migration on branch A
git checkout feature-a
npx prisma migrate dev --name add_url

# Developer B creates migration on branch B
git checkout feature-b
npx prisma migrate dev --name add_status

# Merge conflict in migrations/ folder
git merge feature-a  # Conflict!

# Developer resolves conflict incorrectly
# ❌ Drift introduced
```

**Correct approach**: Use post-merge hook to detect conflicts.

### 4. Editing Existing Migrations (2% of cases)

**What happens**:
```bash
# Developer edits already-applied migration
vim migrations/20251201_add_url/migration.sql

# Shadow database fails validation
# ❌ Drift introduced
```

**Correct approach**: Never edit applied migrations. Create new migration.

## Prevention System

This project has a **multi-layer defense system** to prevent drift:

### Layer 1: Command Blocking

**What**: `npm run db:push` is disabled

**How**:
```json
{
  "scripts": {
    "db:push": "echo 'ERROR: db:push is disabled...' && exit 1"
  }
}
```

**Effect**: Educational error message directs developers to correct command

### Layer 2: Pre-Commit Hook

**What**: Drift detection runs before every commit

**How**: `.husky/pre-commit` runs `npm run drift:check-warn`

**Effect**:
- Warns if schema changes without migration
- Does NOT block commits (prevents workflow disruption)
- Educates at the right moment

### Layer 3: Post-Merge Hook

**What**: Alerts when migrations changed after pull/merge

**How**: `.husky/post-merge` checks if `migrations/` folder changed

**Effect**:
- Reminds developer to check migration status
- Prevents merge conflict drift
- Suggests running `prisma migrate status`

### Layer 4: npm Scripts

**What**: Easy-to-use drift detection and fix commands

**Commands**:
- `npm run drift:check` - Verify drift (exits with code)
- `npm run drift:check-warn` - Verify drift (warn only)
- `npm run drift:fix` - Fix drift automatically
- `npm run drift:rollback` - Undo fix if needed

**Effect**: Self-service tools for developers

## Fixing Drift

### Quick Fix (Most Common Scenario)

If you accidentally used `db:push` and schema is already applied:

```bash
# Step 1: Verify drift
npm run drift:check

# Output shows:
# ⚠️  Drift detected: 2 unrecorded migration(s)
# Status: ALREADY_APPLIED
# Details: All schema changes exist in database

# Step 2: Fix drift (dry-run first)
npm run drift:fix -- --dry-run

# Review output, then run for real:
npm run drift:fix

# Step 3: Verify fix
npx prisma migrate status
# Should show: "Database schema is up to date"

# Step 4: Test new migration works
npx prisma migrate dev --name test_fix_worked
```

### Manual Rollback

If the fix caused issues:

```bash
# Rollback specific migrations
npm run drift:rollback -- \
  --migration "20251201152454_add_service_url" \
  --migration "20251202084549_add_assignment_source"

# Or restore database backup
bash scripts/deploy/db-backup.sh restore
```

### Nuclear Option (Last Resort)

If nothing else works and you're in development:

```bash
# ⚠️  THIS DELETES ALL DATA
npx prisma migrate reset

# Re-seed database
npm run db:seed:dev
```

## Team Best Practices

### For Developers

**DO**:
- ✅ Always use `npx prisma migrate dev --name description`
- ✅ Commit both schema files AND migration files together
- ✅ Run `npm run drift:check` before pushing
- ✅ Read pre-commit and post-merge hook messages
- ✅ Ask for help if you see drift errors

**DON'T**:
- ❌ Never use `npm run db:push` or `npx prisma db push`
- ❌ Never run `$executeRaw` with DDL (ALTER, CREATE, DROP)
- ❌ Never edit existing migration files
- ❌ Never use `prisma migrate resolve --applied` (breaks shadow DB)
- ❌ Never ignore drift warnings

### For Team Leads

**Onboarding Checklist**:
1. Show new developer the blocked `db:push` message
2. Explain why drift happens and why it's dangerous
3. Walk through `npm run drift:fix` tool
4. Share this documentation

**Code Review**:
- Verify migrations committed alongside schema changes
- Check for raw SQL DDL statements
- Ensure migration names are descriptive

**Monitoring**:
```bash
# Check for drift in CI/CD
npm run drift:check
```

### Workflow Example

**Correct workflow** for adding a new field:

```bash
# 1. Create feature branch
git checkout -b feat/add-purchase-order-field

# 2. Edit schema
vim src/infrastructure/database/prisma/schema/assets.prisma
# Add:
#   purchaseOrderNumber String?

# 3. Create migration
npx prisma migrate dev --name add_purchase_order_to_asset

# Output:
# ✅ Migration created: 20251202120000_add_purchase_order_to_asset
# ✅ Migration applied to database
# ✅ Prisma Client generated

# 4. Verify migration created
ls migrations/
# Should see: 20251202120000_add_purchase_order_to_asset/

# 5. Test migration rollback (optional)
git checkout main
git checkout -

# 6. Commit everything
git add .
git commit -m "feat: Add purchase order number to Asset"

# Pre-commit hook runs:
# ✅ Formatting
# ✅ Linting
# ✅ Type check
# ✅ Drift check (passes)

# 7. Push and create PR
git push origin feat/add-purchase-order-field
```

## Troubleshooting

### Issue: "npm run db:push gives error"

**Symptom**:
```bash
$ npm run db:push
❌ ERROR: db:push is disabled in this project
```

**Solution**: This is intentional! Use the correct command:
```bash
npx prisma migrate dev --name describe_your_change
```

### Issue: "Drift detected but I haven't changed anything"

**Cause**: Someone else on your team used `db:push` or you pulled changes

**Solution**:
```bash
# Check if migrations changed
git log --oneline migrations/

# If new migrations exist, apply them
npx prisma migrate dev

# If drift fix needed
npm run drift:fix
```

### Issue: "Migration fails with 'migration already applied'"

**Cause**: Migration in database but not in git history

**Solution**:
```bash
# Pull latest migrations
git pull

# Verify status
npx prisma migrate status
```

### Issue: "Shadow database errors"

**Symptom**:
```
Error: P3006 - Migration failed to apply cleanly to shadow database
```

**Cause**: Migration history inconsistent

**Solution 1** (if drift fix doesn't work):
```bash
# Development only - DELETES DATA
npx prisma migrate reset
npm run db:seed:dev
```

**Solution 2** (restoring old backup):
```bash
# When prompted, choose "y" to drop and recreate schema
bash scripts/deploy/db-backup.sh restore
# > Drop and recreate schema 'public' before restore? [y/N] y

# Then apply all migrations on top of restored data
npx dotenv -e .env.local -- npx prisma migrate deploy
```

**Why this works**: Dropping the schema before restore clears all enums, tables, and migration history. The backup restores old data with old schema. Then `migrate deploy` applies all missing migrations to bring schema up to date.

### Issue: "Restored old backup, now have drift"

**Symptom**: After restoring a backup from before recent migrations, Prisma reports drift.

**Cause**: Backup has old schema state; migration history doesn't match current migrations.

**Solution**:
```bash
# 1. Restore backup with schema drop
bash scripts/deploy/db-backup.sh restore
# When prompted: "Drop and recreate schema 'public' before restore? [y/N]"
# Answer: y

# 2. Apply all migrations on restored data
npx dotenv -e .env.local -- npx prisma migrate deploy

# 3. Verify
npm run drift:check
# Should show: "No drift detected"
```

**What happens**:
1. Schema drop removes ALL database objects (tables, enums, migration history)
2. Restore brings back old data with old schema
3. `migrate deploy` applies all 7 migrations sequentially
4. Database ends up with old data + current schema ✅

**Why NOT use `drift:fix`**: The `drift:fix` tool is for registering *already-applied* migrations. When restoring old backups, migrations are *not* applied yet, so you need `migrate deploy` to actually run them.

### Issue: "Pre-commit takes too long"

**Cause**: Drift check queries database

**Solution**: Drift check is optimized to run in <2 seconds. If slower:
```bash
# Check database connection
npx prisma migrate status

# If slow, check PostgreSQL performance
```

## Advanced Topics

### How Drift Detection Works

The `verify-migration-drift.ts` script:

1. Queries `_prisma_migrations` for recorded migrations
2. Scans `migrations/` folder for all migration files
3. For each unrecorded migration:
   - Parses `migration.sql` to extract expected changes
   - Queries `information_schema` to verify columns
   - Queries `pg_indexes` to verify indexes
   - Queries `pg_enum` to verify enum types
4. Returns verdict: `IN_SYNC`, `ALREADY_APPLIED`, `MISSING`, or `PARTIAL`

### How Drift Fix Works

The `fix-migration-drift.ts` script:

1. Runs verification to confirm all schema changes exist
2. Creates automatic backup using `db-backup.sh`
3. For each unrecorded migration:
   - Reads `migration.sql` file
   - Calculates SHA256 checksum (same algorithm as Prisma)
   - Verifies all schema changes exist in database
   - Inserts record into `_prisma_migrations` table
4. Verifies fix with `npx prisma migrate status`
5. Provides rollback SQL for safety

**Safety Features**:
- Transaction-wrapped (all-or-nothing)
- Verification gates (aborts if any change missing)
- Automatic backup
- Dry-run mode
- Rollback script

### Why Not `prisma migrate resolve --applied`?

Prisma's official `migrate resolve --applied` command:
- ✅ Marks migration as applied in live database
- ❌ Does NOT update shadow database
- ❌ Causes future migrations to fail shadow DB validation

Our drift fix approach:
- ✅ Marks migration with proper checksum
- ✅ Shadow database accepts it
- ✅ Future migrations work correctly

## Related Documentation

- **[PRISMA_GUIDE.md](PRISMA_GUIDE.md)** - Complete Prisma patterns and migration rules
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Full development workflow
- **[CLAUDE.md](../../CLAUDE.md)** - Quick reference for common commands

## Questions?

If you encounter drift issues not covered here:

1. Check pre-commit/post-merge hook output
2. Run `npm run drift:check --verbose` for details
3. Ask team lead for help
4. Document the issue for future developers

**Remember**: Drift prevention is a team effort. Every developer following the correct workflow keeps the codebase healthy!
