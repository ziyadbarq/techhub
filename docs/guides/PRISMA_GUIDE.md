# Prisma Guide

Complete guide for working with Prisma 7 in this project, including connection pool management, type-safe imports, repository patterns, and common pitfalls.

## Table of Contents

- [Prisma 7 Overview](#prisma-7-overview)
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

**Environment Variables** (`.env.local`):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PRISMA_VERBOSE_LOGS=true  # Optional: emit sanitized Prisma query/warn/error events
```

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
