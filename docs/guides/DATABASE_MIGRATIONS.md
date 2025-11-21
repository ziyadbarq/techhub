# Database Migrations & Deployment Guide

Complete guide to managing database schema changes with Prisma migrations in development and production environments.

## Table of Contents

- [Overview](#overview)
- [Prisma Configuration](#prisma-configuration)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Migration Commands Reference](#migration-commands-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Prisma 7** with PostgreSQL for database management. Prisma provides two approaches for managing schema changes:

| Approach             | Use Case                       | Creates SQL Files | Tracks History |
| -------------------- | ------------------------------ | ----------------- | -------------- |
| `prisma db push`     | Development, rapid prototyping | ❌ No             | ❌ No          |
| `prisma migrate dev` | Production-ready changes       | ✅ Yes            | ✅ Yes         |

### Key Differences

**`prisma db push`**:

- Directly syncs schema with database
- Fast for rapid iteration and experimentation
- No migration history or rollback capability
- Used by default in `npm run setup`

**`prisma migrate dev`**:

- Creates timestamped SQL migration files
- Maintains migration history in `_prisma_migrations` table
- Enables code review of database changes
- Required for production deployments

## Prisma Configuration

### Schema Location

Schema file: [src/infrastructure/database/prisma/schema.prisma](../../src/infrastructure/database/prisma/schema.prisma)

Prisma config: [prisma.config.ts](../../prisma.config.ts)

```typescript
export default defineConfig({
  schema: "src/infrastructure/database/prisma/schema.prisma",
  migrations: {
    path: "src/infrastructure/database/prisma/migrations",
    seed: "tsx src/infrastructure/database/prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Connection Pool (Critical)

**Always use the singleton Prisma client from [src/infrastructure/database/prisma/client.ts](../../src/infrastructure/database/prisma/client.ts)**:

```typescript
import { prisma, pool } from "@/infrastructure/database/prisma/client";
```

❌ **NEVER** create new `Pool()` or `PrismaClient()` instances - causes connection pool exhaustion.

**See**: [PRISMA_GUIDE.md - Connection Pool Management](PRISMA_GUIDE.md#connection-pool-management) for complete patterns and antipatterns.

## Development Workflow

### Quick Start (Fresh Setup)

```bash
# One-command setup (uses db:push)
npm run setup
```

This runs: `npm install` → `db:push` → `db:seed`

### Recommended Hybrid Approach

Use `db:push` for rapid iteration, `migrate dev` when features are stable:

```bash
# 1. During active development - fast iteration
npm run db:push

# 2. Edit schema as needed
# src/infrastructure/database/prisma/schema.prisma

# 3. Apply changes quickly
npm run db:push

# 4. When feature is complete - create migration
npm run db:migrate
# Or with descriptive name:
npx prisma migrate dev --name add_user_roles
```

### Daily Development Workflow

```bash
# Fast iteration cycle
npm run db:push           # Push schema changes
npm run db:seed           # Refresh seed data
npm run dev               # Start dev server

# When feature is done
npx prisma migrate dev --name feature_name
git add src/infrastructure/database/prisma/migrations/
git commit -m "Add migration: feature_name"
```

### Resetting Development Database

```bash
# Option 1: Fast reset (uses db:push)
npm run reset

# Option 2: Reset with migrations (replays all migrations)
npx prisma migrate reset

# Option 3: Clear everything including caches
npm run cache:clear:all
```

### Creating Your First Migration

If you've been using `db:push` and want to create a baseline migration:

```bash
# Create initial migration from current schema
npx prisma migrate dev --name init

# This creates:
# src/infrastructure/database/prisma/migrations/
#   └─ 20251120203805_init/
#     └─ migration.sql
```

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure:

1. ✅ All schema changes are captured in migration files
2. ✅ Migrations are committed to git
3. ✅ Database backup is available
4. ✅ Migrations tested on staging environment
5. ✅ Production `DATABASE_URL` is configured

### Check Migration Status

```bash
# Verify schema is in sync with migrations
npx prisma migrate status

# If there are pending changes, create migration
npx prisma migrate dev --name describe_changes

# Commit to git
git add src/infrastructure/database/prisma/migrations/
git commit -m "Add migration: describe_changes"
```

### Production Deployment Steps

**On production server (or CI/CD pipeline):**

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (use 'ci' for production)
npm ci

# 3. Generate Prisma Client (REQUIRED before migrations)
npm run db:generate

# 4. Apply migrations (safe, tracks history)
npx prisma migrate deploy

# 5. Build application
npm run build

# 6. Restart application
npm start
```

### Safe Migration Practices

#### 1. Always Use Staging First

```bash
# On staging server - test migrations here first!
npx prisma migrate deploy

# Verify application works correctly
# Run tests, check logs, validate data

# If successful, deploy to production
```

#### 2. Backup Before Migrating

```bash
# Create backup before production migration
pg_dump barq_assets_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Then apply migration
npx prisma migrate deploy
```

#### 3. Monitor Migration Execution

```bash
# Watch migration progress
npx prisma migrate deploy --skip-seed

# Check migration history
npx prisma migrate status
```

### Production Environment Variables

Ensure `.env` (production) has correct values:

```bash
# Production database (NOT the dev database!)
DATABASE_URL="postgresql://user:password@prod-host:5432/barq_assets_prod"

# Node environment
NODE_ENV="production"

# Other required services
REDIS_URL="redis://prod-redis:6379"
OPENAI_API_KEY="sk-..."

# Logging (optional)
LOG_LEVEL="info"
PRISMA_VERBOSE_LOGS="false"
```

### CI/CD Pipeline Example

Example GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Backup database
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} > backup.sql
        continue-on-error: true

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build application
        run: npm run build

      - name: Deploy to hosting
        # Your deployment step (Vercel, Railway, etc.)
        run: echo "Deploy here"
```

## Migration Commands Reference

### Development Commands

```bash
# Generate Prisma Client (auto-runs after schema changes)
npm run db:generate
npx prisma generate

# Push schema directly (no migration files)
npm run db:push
npx prisma db push

# Create migration from schema changes
npm run db:migrate
npx prisma migrate dev
npx prisma migrate dev --name descriptive_name

# Reset database and replay all migrations
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Seed database
npm run db:seed
```

### Production Commands

```bash
# Apply pending migrations (PRODUCTION ONLY)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Check migration status
npx prisma migrate status
```

### Database Management

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio

# Reset dev environment
npm run reset

# Clear all caches + reset database
npm run cache:clear:all

# Assign admin role to first user
npm run db:assign-admin
```

## Best Practices

### Development Best Practices

✅ **DO**:

- Use `db:push` for rapid prototyping and experimentation
- Create migrations when features are complete and tested
- Name migrations descriptively: `add_user_roles`, `create_tasks_table`
- Review generated SQL in migration files before committing
- Commit migrations to git with descriptive commit messages
- Run `prisma migrate status` before creating new migrations

❌ **DON'T**:

- Use `db:push` in production - always use `migrate deploy`
- Edit migration files after they're applied
- Delete or rename applied migrations
- Skip migration testing on staging
- Commit migrations without reviewing the SQL

### Production Best Practices

✅ **DO**:

- Always test migrations on staging first
- Backup database before applying migrations
- Use `prisma migrate deploy` exclusively in production
- Monitor migration execution and application logs
- Keep migrations small and focused
- Document breaking changes in migration comments
- Use transactions for multi-step data migrations

❌ **DON'T**:

- Use `migrate dev` or `db:push` in production
- Apply untested migrations directly to production
- Skip backups before migrations
- Make destructive changes without rollback plan
- Modify data and schema in same migration (split them)

### Migration Naming Conventions

Use clear, descriptive names:

```bash
# Good examples
npx prisma migrate dev --name init
npx prisma migrate dev --name add_user_roles
npx prisma migrate dev --name create_tasks_table
npx prisma migrate dev --name add_user_email_index
npx prisma migrate dev --name make_email_required

# Avoid vague names
npx prisma migrate dev --name update
npx prisma migrate dev --name changes
npx prisma migrate dev --name fix
```

## Troubleshooting

### Migration Conflicts

**Problem**: Schema and database are out of sync

```bash
# Check status
npx prisma migrate status

# Option 1: Create new migration for differences
npx prisma migrate dev --name sync_schema

# Option 2: Reset dev database (WARNING: deletes data)
npx prisma migrate reset
```

### Failed Migrations

**Problem**: Migration fails partway through

```bash
# Development: Reset and retry
npx prisma migrate reset
npx prisma migrate dev

# Production: Restore from backup and investigate
psql barq_assets_prod < backup_YYYYMMDD_HHMMSS.sql

# Fix migration, test on staging, then redeploy
```

### Connection Pool Exhaustion

**Problem**: "Too many connections" error

**Solution**: Verify you're using the singleton Prisma client:

```typescript
// ✅ Correct
import { prisma } from "@/infrastructure/database/prisma/client";

// ❌ Wrong - creates duplicate pool
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
```

See [CLAUDE.md - Prisma Connection Pool](../../CLAUDE.md#prisma-connection-pool-critical).

### Migration History Corruption

**Problem**: `_prisma_migrations` table is out of sync

```bash
# Check migration history
npx prisma migrate status

# Option 1: Mark failed migration as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Option 2: Mark pending migration as applied (if manually applied)
npx prisma migrate resolve --applied MIGRATION_NAME

# Option 3: Reset and replay all (dev only)
npx prisma migrate reset
```

### Prisma Client Out of Sync

**Problem**: Type errors after schema changes

```bash
# Regenerate Prisma Client
npm run db:generate

# If that doesn't work, clear cache and regenerate
npm run cache:clear
npm run db:generate

# Restart TypeScript server in your IDE
```

### Slow Migrations

**Problem**: Migrations taking too long

**Solutions**:

- Split large data migrations into smaller batches
- Create indexes in separate migrations
- Use `CONCURRENTLY` for index creation (custom SQL)
- Run data migrations during low-traffic periods
- Consider using background jobs for large data changes

### Common Errors

#### "Database schema is not in sync"

```bash
# Fix: Create migration for differences
npx prisma migrate dev --name sync_differences
```

#### "Relation violates foreign key constraint"

```bash
# Fix: Handle data migration before schema change
# Example: Remove dependent records first, then apply migration
```

#### "Column does not exist"

```bash
# Fix: Generate Prisma Client after schema changes
npm run db:generate
```

## Workflow Decision Tree

```
┌─────────────────────────────────┐
│  Need to change database schema?│
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Development or  │
    │  Production?    │
    └───┬────────┬───┘
        │        │
        ▼        ▼
   Development  Production
        │        │
        ▼        │
   ┌──────────┐ │
   │Prototyping│ │
   │    or     │ │
   │  Stable?  │ │
   └─┬──────┬─┘ │
     │      │   │
     ▼      ▼   ▼
  Prototype  Stable  Production
     │        │       │
     ▼        ▼       ▼
  db:push  migrate  migrate
            dev     deploy
```

## Additional Resources

- [Prisma Guide](./PRISMA_GUIDE.md) - **Complete Prisma 7 patterns, connection pool, and imports** (recommended)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Stack Upgrades](./STACK_UPGRADES.md) - Prisma 7 breaking changes reference
- [Developer Guide](./DEVELOPER_GUIDE.md) - General development workflows
- [Architecture Guide](../architecture/ARCHITECTURE.md) - System architecture overview

---

**Last Updated**: 2025-11-20
