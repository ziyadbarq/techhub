# Prisma Guide

Complete guide for working with Prisma 7 in this project, including connection pool management, type-safe imports, repository patterns, and common pitfalls.

## Table of Contents

- [Prisma 7 Overview](#prisma-7-overview)
- [Multi-File Schema Organization](#multi-file-schema-organization)
- [Database Migrations](#database-migrations) ⚠️ **CRITICAL**
- [Connection Pool Management](#connection-pool-management)
- [Type-Safe Imports](#type-safe-imports)
- [Repository Implementation Patterns](#repository-implementation-patterns)
- [Type-Safe Helpers](#type-safe-helpers)
- [Logging and Debugging](#logging-and-debugging)
- [Common Errors and Solutions](#common-errors-and-solutions)
- [Best Practices](#best-practices)

## Prisma 7 Overview

### What's New in Prisma 7

This project uses **Prisma 7.0** with the new Rust-free client and PostgreSQL adapter:

- **Rust-free client**: Uses `@prisma/adapter-pg` for database connections
- **90% smaller bundle size**: Significantly reduced client size
- **3x faster queries**: Improved query performance
- **Explicit output path**: Requires `output` configuration in schema generator
- **PostgreSQL Pool adapter**: All PrismaClient instances use pg Pool adapter

### Configuration

**Schema Configuration** ([prisma.config.ts](../../prisma.config.ts)):

```typescript
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
  engineType = "client"
}
```

**Key Points**:

- `output` path is required in Prisma 7
- `engineType = "client"` enables the new Rust-free client (90% smaller bundle, 3x faster)
- All commands auto-detect schema location via `prisma.config.ts`
- Multi-file schemas supported: set `schema` to a folder path (see next section)

**Environment Variables** (`.env.local`):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PRISMA_VERBOSE_LOGS=true  # Optional: emit sanitized Prisma query/warn/error events
```

## Multi-File Schema Organization

This project uses Prisma 7's multi-file schema support to organize 59 models and 34 enums into domain-aligned files. This approach improves maintainability and aligns with Clean Architecture layers.

### Schema Structure

The schema is located at `src/infrastructure/database/prisma/schema/`:

```
schema/
├── schema.prisma          # Main config: generator + datasource only
├── shared-enums.prisma    # Cross-domain enums (TargetObjectTypeEnum)
├── auth.prisma            # Auth Layer: User, Account, Session, Verification
├── rbac.prisma            # RBAC: Role, Permission, RolePermission, UserRole, AuditLog, CodeSequence
├── foundation.prisma      # Layer 1: OrganizationUnit, Person, Location, Vendor, Lifecycle models
├── cmdb.prisma            # Layer 2: CIClass, ConfigurationItem, CIRelationship, RelationshipType
├── assets.prisma          # Layer 2: Asset, AssetCategory, AssetModel, AssetAssignment, Stock models
├── maintenance.prisma     # Layer 2: MaintenanceSchedule, MaintenanceRecord
├── contracts.prisma       # Layer 3: ContractType, Contract, ContractLinkedObject
├── licenses.prisma        # Layer 3: LicenseProduct, LicenseEntitlement, LicenseAllocation, LicenseAddon
├── disposal.prisma        # Layer 3: AssetDisposal, DisposalApproval, DisposalDocument
├── kits.prisma            # Layer 3: AssetKit, AssetKitItem, AssetKitCheckout
├── reservations.prisma    # Layer 3: AssetReservation, AssetReservationConflict
├── governance.prisma      # Layer 3: DataDomain, DataOwnership, VerificationCampaign, AuditLogEntry
├── attachments.prisma     # Layer 3: AttachmentType, Attachment
├── services.prisma        # Layer 3: Service, ServiceOwnership, BusinessProcess, ServiceInfrastructure
├── intune.prisma          # Integration: IntuneDevice, IntuneComplianceHistory, IntuneSyncLog
├── system.prisma          # System: Task, PromptBlock, FeatureFlag models
└── migrations/            # Migration files (next to datasource per Prisma convention)
```

### Configuration

**prisma.config.ts**:

```typescript
import { defineConfig } from "prisma/config";
import { env } from "node:process";

export default defineConfig({
  schema: "src/infrastructure/database/prisma/schema",  // Folder path for multi-file
  migrations: {
    path: "src/infrastructure/database/prisma/schema/migrations",
    seed: "tsx src/infrastructure/database/prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Key Rules

1. **`generator` and `datasource` blocks**: Must be in ONE file only (`schema.prisma`)
2. **Migrations folder**: Must be next to the file containing `datasource` block
3. **Models and enums**: Can be split across any `.prisma` files
4. **Cross-file references**: Prisma automatically resolves references across files
5. **Domain-specific enums**: Keep enums with their domain (e.g., `ServiceType` in `services.prisma`)
6. **Shared enums**: Cross-domain enums go in `shared-enums.prisma` (e.g., `TargetObjectTypeEnum`)

### Adding New Models

When adding new models:

1. **Identify the domain**: Which layer/module does this belong to?
2. **Choose the file**: Add to the appropriate domain file
3. **Domain-specific enums**: Define in the same file
4. **Cross-domain enums**: Add to `shared-enums.prisma`
5. **Validate**: Run `npx prisma validate`
6. **Generate**: Run `npm run db:generate`

### File Header Convention

Each domain file includes a header comment:

```prisma
// ============================================
// DOMAIN NAME
// ============================================
//
// Models: Model1, Model2, Model3
// Enums: Enum1, Enum2
// Layer: Layer X (Description)
// Related DI Module: domain.module.ts
// ============================================
```

## Database Migrations

### ⚠️ CRITICAL: Migration Rules

**ALWAYS let Prisma generate migrations. NEVER create migration files manually.**

Prisma uses a **shadow database** to validate migrations. When you run `prisma migrate dev`, Prisma:
1. Creates a temporary shadow database
2. Replays ALL migrations from scratch against it
3. Compares the result to your current schema
4. Generates a new migration if needed

**Why manual migrations fail**: Hand-written SQL in a migration file was never validated by the shadow database. When Prisma tries to replay it, the shadow database state won't match what the SQL expects, causing errors like:

```
Error: P3006 - Migration failed to apply cleanly to shadow database
The underlying table for model `table_name` does not exist.
```

### ❌ NEVER Do These

1. **NEVER create migration files manually**
   ```bash
   # ❌ WRONG - Creating migration folder and SQL by hand
   mkdir -p migrations/20251129_my_change
   echo "ALTER TABLE..." > migrations/20251129_my_change/migration.sql
   ```

2. **NEVER use `prisma migrate resolve --applied`**
   ```bash
   # ❌ WRONG - This only marks migration in live DB, NOT shadow DB
   npx prisma migrate resolve --applied "20251129_my_change"
   ```
   This command tells Prisma "trust me, this migration was applied" but the shadow database has no record of it. Next migration will fail.

3. **NEVER execute schema changes via `$executeRaw`**
   ```typescript
   // ❌ WRONG - Bypasses migration history completely
   await prisma.$executeRawUnsafe(`ALTER TABLE assets DROP COLUMN some_column`);
   ```
   The database changes but there's no migration record. Schema drift guaranteed.

4. **NEVER edit existing migration files**
   ```bash
   # ❌ WRONG - Modifying an already-applied migration
   vim migrations/20251101_existing/migration.sql
   ```
   If the migration was already applied, editing it causes shadow DB to differ from live DB.

### ✅ Correct Migration Workflow

#### Standard Workflow (Happy Path)

```bash
# 1. Edit your .prisma schema files
vim src/infrastructure/database/prisma/schema/assets.prisma

# 2. Let Prisma generate the migration
npx prisma migrate dev --name descriptive_name

# 3. Regenerate the client (creates browser-safe entry points)
npm run db:generate
```

**That's it.** Prisma handles everything automatically.

#### Adding a Field

```bash
# 1. Add field to schema
# In assets.prisma:
#   model Asset {
#     newField String?
#   }

# 2. Generate migration
npx prisma migrate dev --name add_new_field_to_asset

# 3. Regenerate client
npm run db:generate
```

#### Removing a Field

```bash
# 1. Remove field from schema
# In assets.prisma, delete the line

# 2. Generate migration (Prisma will create DROP COLUMN)
npx prisma migrate dev --name remove_field_from_asset

# 3. Regenerate client
npm run db:generate
```

#### Renaming a Field

```bash
# 1. Rename in schema (Prisma will ask if it's a rename)
# In assets.prisma, change field name

# 2. Generate migration
npx prisma migrate dev --name rename_old_field_to_new_field
# Prisma will prompt: "Did you rename X to Y?" - answer yes

# 3. Regenerate client
npm run db:generate
```

5. **NEVER use `prisma db push`**

   ⚠️ **THIS IS THE #1 CAUSE OF MIGRATION DRIFT IN THIS PROJECT**

   ```bash
   # ❌ WRONG - Bypasses migration system, causes drift
   npx prisma db push
   npm run db:push  # Intentionally disabled with educational error
   ```

   **Why this is dangerous**:
   - `db push` applies schema changes to the database ✅
   - No migration file created ❌
   - Migration history out of sync ❌
   - Next `migrate dev` fails with drift errors ❌
   - Database reset required ❌❌❌

   **What happens**:
   1. You run `npm run db:push` (or `npx prisma db push`)
   2. Schema changes apply to your database immediately
   3. No migration file is created in `migrations/` folder
   4. `_prisma_migrations` table is NOT updated
   5. Next developer runs `npx prisma migrate dev` and gets errors
   6. Team loses hours debugging drift issues

   **Correct workflow**:
   ```bash
   # 1. Edit schema files
   vim src/infrastructure/database/prisma/schema/assets.prisma

   # 2. Create migration (let Prisma generate SQL)
   npx prisma migrate dev --name describe_your_changes

   # 3. Regenerate client
   npm run db:generate

   # 4. Commit both schema files AND migration files
   git add .
   git commit -m "Add new field to Asset"
   ```

   **Protection**: `npm run db:push` is intentionally blocked and will show an educational error message directing you to use `migrate dev` instead.

### Fixing Migration Issues

#### Issue: Schema Drift (DB differs from migrations)

**Symptom**: `npx prisma migrate dev` fails with error like:
```
Drift detected: Your database schema is not in sync with your migration history.
```

**Two scenarios**:

**Scenario 1: Schema changes already applied (most common)**

If someone accidentally ran `db:push` and schema changes exist in database:

```bash
# 1. Verify drift (identifies what's missing)
npm run drift:check

# 2. Fix drift (registers existing migrations)
npm run drift:fix

# 3. Verify fix worked
npx prisma migrate status
# Should show: "Database schema is up to date"

# 4. Test with new migration
npx prisma migrate dev --name test_fix_worked
```

**Scenario 2: Schema changes missing (less common)**

If migrations exist but haven't been applied:

```bash
# Development: Reset and replay all migrations (DELETES ALL DATA)
npx prisma migrate reset

# Production: Apply pending migrations
npx prisma migrate deploy
```

**Prevention**:
- Pre-commit hook warns if drift detected
- Post-merge hook alerts if migrations changed
- `npm run db:push` is blocked with educational message

**Note**: Do NOT use `prisma db push` to fix drift. Always use the drift fix tools or `migrate reset` in development.

#### Issue: Failed Migration

If a migration fails partway through:

```bash
# 1. Check what failed
npx prisma migrate status

# 2. Fix the schema issue

# 3. Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back "20251129_failed_migration"

# 4. Generate a new correct migration
npx prisma migrate dev --name fix_previous_issue
```

#### Issue: Shadow Database Errors

If you see `P3006 - Migration failed to apply cleanly to shadow database`:

```bash
# 1. Check migration history
npx prisma migrate status

# 2. If you have manually created migrations, delete them
rm -rf src/infrastructure/database/prisma/schema/migrations/20251129_manual_migration

# 3. Reset migration history (DELETES ALL DATA - dev only!)
npx prisma migrate reset

# 4. Generate fresh migration from clean state
npx prisma migrate dev --name fresh_start
```

### Production Migrations

For production deployments:

```bash
# Apply pending migrations (no generation, no prompts)
npx prisma migrate deploy
```

**Never run `prisma migrate dev` in production** - it's interactive and may reset data.

### Migration File Naming

Prisma auto-generates timestamps. Use descriptive names:

```bash
# ✅ Good names
npx prisma migrate dev --name add_warranty_end_date_to_asset
npx prisma migrate dev --name remove_is_consumable_from_category
npx prisma migrate dev --name add_stock_movement_void_tracking

# ❌ Bad names
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name changes
```

### Quick Reference

| Task | Command |
|------|---------|
| Create migration | `npx prisma migrate dev --name name` |
| Apply migrations (prod) | `npx prisma migrate deploy` |
| Check status | `npx prisma migrate status` |
| Reset all (dev only) | `npx prisma migrate reset` |
| Generate client | `npm run db:generate` |

**Note**: Do NOT use `prisma db push` - always use migrations.

## Schema Naming Conventions

### Field Naming (DO NOT use @map)

Use camelCase field names in Prisma schema files. Prisma automatically converts camelCase to snake_case in PostgreSQL:

```prisma
// ✅ CORRECT - camelCase without @map (idiomatic Prisma)
model Asset {
  id                     String    @id @default(cuid())
  assetTag               String    @unique
  assetCategoryId        String
  purchaseDate           DateTime?
  purchaseCost           Decimal?  @db.Decimal(12, 2)
  currentStockLocationId String?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}

// ❌ WRONG - Redundant @map annotations
model Asset {
  assetTag               String    @unique @map("asset_tag")       // Unnecessary
  assetCategoryId        String    @map("asset_category_id")       // Unnecessary
  createdAt              DateTime  @default(now()) @map("created_at") // Unnecessary
}
```

**Why no @map?**
- Prisma automatically converts camelCase → snake_case in PostgreSQL
- Less verbose, easier to maintain
- Matches 80% of existing codebase
- No functional difference in database schema

### Table Naming (ALWAYS use @@map)

Always use `@@map("snake_case_plural")` for explicit table names:

```prisma
// ✅ CORRECT - Explicit snake_case table name
model AssetCategory {
  id   String @id @default(cuid())
  name String @unique
  // ...
  @@map("asset_categories")
}

model ConfigurationItem {
  id   String @id @default(cuid())
  name String
  // ...
  @@map("configuration_items")
}
```

### Raw SQL Queries

When writing raw SQL queries with `$queryRaw` or `$executeRaw`:

```typescript
// ✅ CORRECT - Quote camelCase column names
const result = await prisma.$queryRaw`
  SELECT COUNT(*) as count FROM assets
  WHERE attributes IS NOT NULL
  AND "deletedAt" IS NULL
`;

// ✅ CORRECT - Table names use snake_case (from @@map)
const items = await prisma.$queryRaw`
  SELECT * FROM configuration_items
  WHERE "isActive" = true
`;

// ❌ WRONG - Unquoted camelCase columns will fail
const result = await prisma.$queryRaw`
  SELECT * FROM assets WHERE deletedAt IS NULL
`;
// Error: column "deletedat" does not exist

// ❌ WRONG - Using snake_case for camelCase columns
const result = await prisma.$queryRaw`
  SELECT * FROM assets WHERE deleted_at IS NULL
`;
// Error: column "deleted_at" does not exist
```

**Key Rules**:
- **Table names**: Use snake_case (matches `@@map` values): `assets`, `configuration_items`
- **Column names**: Quote camelCase names: `"deletedAt"`, `"createdAt"`, `"isActive"`
- PostgreSQL is case-insensitive for unquoted identifiers, converting them to lowercase

## Connection Pool Management

### ⚠️ CRITICAL: Always Use the Singleton

**NEVER create new connection pools or PrismaClient instances.** Always import from the singleton:

```typescript
// ✅ CORRECT - Use singleton
import { prisma, pool } from "@/infrastructure/database/prisma/client";

// ❌ WRONG - NEVER create new instances
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // Creates duplicate pool!
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) }); // Creates duplicate client!
```

### Why Singleton Pattern?

**Problem**: Multiple connection pools exhaust database connections and cause performance issues.

**Solution**: The singleton in [src/infrastructure/database/prisma/client.ts](../../src/infrastructure/database/prisma/client.ts) is configured with:

- **Single `pg.Pool` instance**: Shared across entire application
- **Single `PrismaPg` adapter**: Uses Prisma 7 Rust-free client
- **`engineType = "client"`**: 90% smaller bundle, 3x faster queries
- **Global singleton pattern**: Prevents duplication during dev hot-reload

### Singleton Implementation

```typescript
// src/infrastructure/database/prisma/client.ts
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Create single connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create single PrismaClient with adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Export singleton
export { prisma, pool };
```

### Usage Patterns

#### 1. DI Container (Recommended)

The DI container imports and binds the singleton:

```typescript
// src/di/modules/database.module.ts
import { Container } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import { DI_TOKENS } from "../types";

export const databaseModule = (container: Container) => {
  container.bind(DI_TOKENS.PrismaClient).toConstantValue(prisma);
};
```

**Usage in repositories**:

```typescript
import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    return asset ? this.toDomain(asset) : null;
  }
}
```

#### 2. Better Auth Extension

Better Auth extends the singleton with `$extends()`:

```typescript
// src/lib/auth/better-auth.ts
import { prisma } from "@/infrastructure/database/prisma/client";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: prisma.$extends({
    // Custom extensions for Better Auth
  }),
});
```

**Why `$extends()`?** Better Auth needs custom Prisma extensions for its models. Using `$extends()` creates a new client instance that inherits from the singleton, ensuring the same connection pool is used.

#### 3. Seed Scripts (Standalone Processes)

Seed scripts can create their own pools since they run as standalone processes:

```typescript
// scripts/seed.ts
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Seed data...
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
```

**Why allowed?** Seed scripts are standalone processes that don't run concurrently with the application. They clean up resources on completion.

## Type-Safe Imports

### Import Entry Points

The generated Prisma code provides multiple entry points for different use cases:

| Entry Point                    | Environment   | Contains                              | Use For                                |
| ------------------------------ | ------------- | ------------------------------------- | -------------------------------------- |
| `@/generated/prisma`           | Both          | Types + enums (browser-safe)          | Client components, type annotations   |
| `@/generated/prisma/server`    | Server only   | PrismaClient + types + runtime        | Repositories, server actions, seeds   |
| `@/generated/prisma/enums`     | Both          | Enum constants only                   | Explicit enum imports                  |
| `@/generated/prisma/types`     | Both          | Same as index.ts (explicit browser-safe) | Type annotations                    |

### ⚠️ CRITICAL: Choose the Right Import Path

```typescript
// ✅ CLIENT COMPONENTS - Use default import (browser-safe)
"use client";
import type { Asset, Service } from "@/generated/prisma";
import { ServiceType, ServiceStatus } from "@/generated/prisma/enums";

// ✅ SERVER COMPONENTS / REPOSITORIES - Use /server for PrismaClient
import type { PrismaClient, Prisma } from "@/generated/prisma/server";
import { PrismaClient } from "@/generated/prisma/server";

// ❌ WRONG - Never import from @prisma/client (ESLint enforced)
import type { PrismaClient } from "@prisma/client"; // Will error!
```

### Why This Structure?

Prisma 7's `client.ts` imports Node.js modules (`node:process`, `node:path`, `node:url`) that break browser bundles. The entry point structure prevents this:

- **`index.ts`**: Re-exports from `browser.ts` - safe for client components
- **`server.ts`**: Guarded by `server-only` package - errors if imported in client code
- **`enums.ts`**: Pure JavaScript objects - safe everywhere

### Common Import Patterns

#### Repository Imports (Server-side)

```typescript
import { injectable, inject } from "inversify";
import type {
  PrismaClient, // For type annotation
  Prisma, // For WhereInput types
  Asset as PrismaAsset, // Rename to avoid conflict with domain entity
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import { Asset } from "@/core/domain/entities/asset.entity";

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
}
```

#### Client Component Imports

```typescript
"use client";
import type { Service } from "@/generated/prisma"; // Safe - browser.ts
import { ServiceType, ServiceStatus } from "@/generated/prisma/enums"; // Safe - pure JS
```

## Repository Implementation Patterns

### Complete Repository Example

```typescript
import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  Prisma,
  Asset as PrismaAsset,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import { Asset } from "@/core/domain/entities/asset.entity";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { withRepositoryLogging } from "../utils/repository-logger";

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.LoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async findById(id: string): Promise<Asset | null> {
    return withRepositoryLogging(
      this.logger,
      "Asset",
      "findById",
      { id },
      async () => {
        const asset = await this.prisma.asset.findUnique({
          where: { id },
          include: {
            assetModel: true,
            location: true,
            assignments: {
              where: { endDate: null },
              include: { person: true },
            },
          },
        });
        return asset ? this.toDomain(asset) : null;
      },
    );
  }

  async search(options: SearchOptions): Promise<Asset[]> {
    // Use Prisma.AssetWhereInput for type safety (NOT any!)
    const where: Prisma.AssetWhereInput = {};

    if (options.query) {
      where.OR = [
        { serialNumber: { contains: options.query, mode: "insensitive" } },
        { assetTag: { contains: options.query, mode: "insensitive" } },
      ];
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.modelId) {
      where.assetModelId = options.modelId;
    }

    const assets = await this.prisma.asset.findMany({
      where,
      include: {
        assetModel: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
      skip: options.offset || 0,
      take: options.limit || 50,
    });

    return assets.map((a) => this.toDomain(a));
  }

  async create(asset: Asset): Promise<Asset> {
    return withRepositoryLogging(
      this.logger,
      "Asset",
      "create",
      { assetId: asset.id },
      async () => {
        const created = await this.prisma.asset.create({
          data: {
            id: asset.id,
            serialNumber: asset.serialNumber,
            assetTag: asset.assetTag,
            status: asset.status,
            assetModelId: asset.assetModelId,
            locationId: asset.locationId,
            purchaseDate: asset.purchaseDate,
            warrantyEndDate: asset.warrantyEndDate,
            customFields: asset.customFields || {},
          },
          include: {
            assetModel: true,
            location: true,
          },
        });
        return this.toDomain(created);
      },
    );
  }

  async update(asset: Asset): Promise<Asset> {
    return withRepositoryLogging(
      this.logger,
      "Asset",
      "update",
      { assetId: asset.id },
      async () => {
        const updated = await this.prisma.asset.update({
          where: { id: asset.id },
          data: {
            serialNumber: asset.serialNumber,
            assetTag: asset.assetTag,
            status: asset.status,
            assetModelId: asset.assetModelId,
            locationId: asset.locationId,
            purchaseDate: asset.purchaseDate,
            warrantyEndDate: asset.warrantyEndDate,
            customFields: asset.customFields || {},
            updatedAt: new Date(),
          },
          include: {
            assetModel: true,
            location: true,
          },
        });
        return this.toDomain(updated);
      },
    );
  }

  async delete(id: string): Promise<void> {
    return withRepositoryLogging(
      this.logger,
      "Asset",
      "delete",
      { id },
      async () => {
        await this.prisma.asset.delete({ where: { id } });
      },
    );
  }

  // Private mapping method
  private toDomain(prismaAsset: PrismaAsset): Asset {
    return Asset.reconstitute({
      id: prismaAsset.id,
      serialNumber: prismaAsset.serialNumber,
      assetTag: prismaAsset.assetTag || undefined,
      status: prismaAsset.status,
      assetModelId: prismaAsset.assetModelId,
      locationId: prismaAsset.locationId || undefined,
      purchaseDate: prismaAsset.purchaseDate || undefined,
      warrantyEndDate: prismaAsset.warrantyEndDate || undefined,
      customFields: prismaAsset.customFields as Record<string, unknown>,
      createdAt: prismaAsset.createdAt,
      updatedAt: prismaAsset.updatedAt,
    });
  }
}
```

### Type-Safe Where Clauses

**Always use `Prisma.ModelWhereInput` types instead of `any`**:

```typescript
// ✅ CORRECT - Type-safe where clause
const where: Prisma.AssetWhereInput = {};

if (options.query) {
  where.OR = [
    { serialNumber: { contains: options.query, mode: "insensitive" } },
    { assetTag: { contains: options.query, mode: "insensitive" } },
  ];
}

// ❌ WRONG - Using any (no type safety)
const where: any = {};
```

**Benefits**:

- TypeScript autocomplete for all fields
- Type checking for field types and operators
- Compile-time error detection
- Better IDE support

## Type-Safe Helpers

### JSON Field Handling

Use the `prisma-helpers.ts` utility for type-safe JSON field operations:

```typescript
// src/infrastructure/database/prisma/prisma-helpers.ts
import type { Prisma } from "@/generated/prisma";

export function toJsonField<T>(value: T | null | undefined): Prisma.JsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.JsonValue;
}

export function fromJsonField<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null || value === Prisma.JsonNull) {
    return null;
  }
  return value as T;
}
```

**Usage in repositories**:

```typescript
import { toJsonField, fromJsonField } from "../database/prisma/prisma-helpers";

// Writing JSON fields
await this.prisma.asset.create({
  data: {
    customFields: toJsonField(asset.customFields),
  },
});

// Reading JSON fields
const customFields = fromJsonField<Record<string, unknown>>(
  prismaAsset.customFields,
);
```

## Logging and Debugging

### Repository Logging

Use `withRepositoryLogging` for consistent operation tracking:

```typescript
import { withRepositoryLogging } from "../utils/repository-logger";

async findById(id: string): Promise<Asset | null> {
  return withRepositoryLogging(
    this.logger,
    "Asset",           // Entity name
    "findById",        // Operation name
    { id },            // Context (sanitized automatically)
    async () => {
      // Repository operation
      const asset = await this.prisma.asset.findUnique({ where: { id } });
      return asset ? this.toDomain(asset) : null;
    }
  );
}
```

**Benefits**:

- Automatic timing instrumentation
- Consistent log format
- Automatic sensitive data redaction
- Error context preservation

### Prisma Query Logging

Enable verbose Prisma logs via environment variable:

```bash
# .env.local
PRISMA_VERBOSE_LOGS=true  # Emit sanitized Prisma query/warn/error events
```

**What gets logged**:

- All database queries (sanitized)
- Query parameters (redacted if sensitive)
- Execution time
- Warnings and errors

**See**: [LOGGING.md](LOGGING.md) for complete logging guide.

## Common Errors and Solutions

### Error: "Property 'asset' does not exist on type 'PrismaClient'"

**Cause**: Importing `PrismaClient` from `@prisma/client` instead of `@/generated/prisma`.

**Solution**:

```typescript
// ❌ Wrong
import type { PrismaClient } from "@prisma/client";

// ✅ Correct
import type { PrismaClient } from "@/generated/prisma";
```

### Error: "Cannot find module '@/generated/prisma'"

**Cause**: Prisma client not generated or incorrect output path.

**Solution**:

```bash
# Generate Prisma client (ALWAYS use this, not npx prisma generate)
npm run db:generate

# Or use setup command
npm run setup
```

**Verify**:

- Check `src/generated/prisma/` directory exists
- Check `prisma.config.ts` has correct `output` path

### Error: "Too many clients already"

**Cause**: Creating multiple PrismaClient instances (violating singleton pattern).

**Solution**:

```typescript
// ❌ Wrong - Creates new instance
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ✅ Correct - Use singleton
import { prisma } from "@/infrastructure/database/prisma/client";
```

### Error: "Database connection pool exhausted"

**Cause**: Creating multiple connection pools (violating singleton pattern).

**Solution**:

```typescript
// ❌ Wrong - Creates new pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ Correct - Use singleton
import { pool } from "@/infrastructure/database/prisma/client";
```

### TypeScript Error: "Type 'any' is not assignable to..."

**Cause**: Using `any` type for where clauses instead of `Prisma.ModelWhereInput`.

**Solution**:

```typescript
// ❌ Wrong
const where: any = {};

// ✅ Correct
const where: Prisma.AssetWhereInput = {};
```

## Best Practices

### ✅ DO

1. **Always import from `@/generated/prisma`**

   ```typescript
   import type { PrismaClient, Prisma } from "@/generated/prisma";
   ```

2. **Always use the singleton**

   ```typescript
   import { prisma } from "@/infrastructure/database/prisma/client";
   ```

3. **Use type-safe where clauses**

   ```typescript
   const where: Prisma.AssetWhereInput = {};
   ```

4. **Rename Prisma model types to avoid conflicts**

   ```typescript
   import type { Asset as PrismaAsset } from "@/generated/prisma";
   import { Asset } from "@/core/domain/entities/asset.entity";
   ```

5. **Use repository logging for all operations**

   ```typescript
   return withRepositoryLogging(
     this.logger,
     "Asset",
     "findById",
     { id },
     async () => {
       // Operation
     },
   );
   ```

6. **Handle JSON fields with type-safe helpers**

   ```typescript
   import {
     toJsonField,
     fromJsonField,
   } from "../database/prisma/prisma-helpers";
   ```

7. **Include related data strategically**
   ```typescript
   const asset = await this.prisma.asset.findUnique({
     where: { id },
     include: {
       assetModel: true,
       location: true,
       assignments: { where: { endDate: null } },
     },
   });
   ```

### ❌ DON'T

1. **Don't import from `@prisma/client`**

   ```typescript
   // ❌ Wrong
   import { PrismaClient } from "@prisma/client";
   ```

2. **Don't create new PrismaClient instances**

   ```typescript
   // ❌ Wrong
   const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
   ```

3. **Don't create new connection pools**

   ```typescript
   // ❌ Wrong
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   ```

4. **Don't use `any` for where clauses**

   ```typescript
   // ❌ Wrong
   const where: any = {};
   ```

5. **Don't skip logging in repositories**

   ```typescript
   // ❌ Wrong - No logging
   async findById(id: string) {
     return await this.prisma.asset.findUnique({ where: { id } });
   }
   ```

6. **Don't use auto-import suggestions without verification**
   - VSCode/IDEs often suggest `@prisma/client` first
   - Always verify imports are from `@/generated/prisma`

7. **Don't log sensitive data**
   - Repository logger automatically redacts sensitive fields
   - Never override redaction for passwords, tokens, API keys

## Related Documentation

- [Database Schema](../architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [Database Migrations](DATABASE_MIGRATIONS.md) - Migration workflow and deployment
- [Logging Guide](LOGGING.md) - Structured logging with Pino
- [Developer Guide](DEVELOPER_GUIDE.md) - Complete development guide
- [Architecture Guide](../architecture/ARCHITECTURE.md) - Clean Architecture patterns

## Quick Reference

### Import Checklist

```typescript
// Repository file imports
import { injectable, inject } from "inversify";
import type {
  PrismaClient, // ✅ From @/generated/prisma
  Prisma, // ✅ From @/generated/prisma
  Asset as PrismaAsset, // ✅ From @/generated/prisma, renamed
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import { Asset } from "@/core/domain/entities/asset.entity";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { withRepositoryLogging } from "../utils/repository-logger";
```

### Repository Method Template

```typescript
async findById(id: string): Promise<DomainEntity | null> {
  return withRepositoryLogging(
    this.logger,
    "EntityName",
    "findById",
    { id },
    async () => {
      const result = await this.prisma.entityName.findUnique({
        where: { id },
        include: {
          // Relations
        },
      });
      return result ? this.toDomain(result) : null;
    }
  );
}
```

### Where Clause Template

```typescript
async search(options: SearchOptions): Promise<DomainEntity[]> {
  const where: Prisma.EntityNameWhereInput = {};

  if (options.query) {
    where.OR = [
      { field1: { contains: options.query, mode: "insensitive" } },
      { field2: { contains: options.query, mode: "insensitive" } },
    ];
  }

  if (options.status) {
    where.status = options.status;
  }

  const results = await this.prisma.entityName.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: options.offset || 0,
    take: options.limit || 50,
  });

  return results.map((r) => this.toDomain(r));
}
```
