# ID Generation Architecture

## Overview

TechHub uses a **centralized, dependency-injected ID generation system** based on CUID2 (Collision-resistant Unique Identifiers). This approach ensures consistency, testability, and adherence to Clean Architecture principles.

## Why CUID2?

**CUID2** was chosen over UUIDs for several reasons:

- ✅ **Sortable**: IDs are time-ordered, improving database index performance
- ✅ **URL-safe**: No special characters, safe for URLs and filenames (24-25 lowercase alphanumeric chars)
- ✅ **Collision-resistant**: Cryptographically strong randomness with 32-bit counter
- ✅ **Compact**: Shorter than UUIDs (24-25 chars vs 36 chars)
- ✅ **No hyphens**: Cleaner format for APIs and logs

**Format**: `clx7abc123xyz456def789ghi` (24-25 characters, starts with letter)

## Architecture

### Service Interface

```typescript
// src/core/services/id-generator.service.interface.ts
export interface IIdGenerator {
  generateId(): string;
}
```

### Implementation

```typescript
// src/infrastructure/services/id/cuid-id-generator.service.ts
import { createId } from "@paralleldrive/cuid2";
import { injectable } from "inversify";

@injectable()
export class CuidIdGeneratorService implements IIdGenerator {
  generateId(): string {
    return createId(); // Returns 24-25 char CUID2
  }
}
```

### Dependency Injection

```typescript
// src/di/modules/foundation.module.ts
container
  .bind<IIdGenerator>(DI_TOKENS.IIdGenerator)
  .to(CuidIdGeneratorService)
  .inSingletonScope();
```

## Usage Patterns

### 1. Domain Entities

Entities that generate IDs in code accept `IIdGenerator` as a parameter to their `create()` method:

```typescript
// src/core/domain/entities/asset.entity.ts
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export class Asset {
  static create(
    props: CreateAssetProps,
    idGenerator: IIdGenerator
  ): Asset {
    return new Asset({
      id: idGenerator.generateId(), // Generate CUID2
      // ... other props
    });
  }
}
```

### 2. Use Cases

Use cases inject `IIdGenerator` via DI and pass it to entity creation:

```typescript
// src/core/use-cases/asset/asset/create-asset.use-case.ts
@injectable()
export class CreateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private assetRepo: IAssetRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private idGenerator: IIdGenerator,
  ) {}

  async execute(input: CreateAssetInput): Promise<Asset> {
    const asset = Asset.create(input, this.idGenerator);
    return await this.assetRepo.create(asset);
  }
}
```

### 3. Test Mocking

Tests use mock `IIdGenerator` for deterministic IDs:

```typescript
// Entity tests
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { vi } from "vitest";

let idCounter = 0;
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => `test-cuid-${idCounter++}`),
};

beforeEach(() => {
  idCounter = 0;
});

const asset = Asset.create(props, mockIdGenerator);
expect(asset.id).toBe("test-cuid-0");
```

## Database-Generated vs Code-Generated IDs

### Code-Generated IDs (38 entities)

Entities that **generate IDs in code** (e.g., Asset, Person, Warranty):
- ✅ Use `IIdGenerator` in `Entity.create(props, idGenerator)`
- ✅ Set ID before persistence
- ✅ Benefit from dependency injection and testability

### Database-Generated IDs (remaining entities)

Entities with **database-generated IDs** (e.g., StockLocation, LicenseAddon):
- ❌ Do NOT use `IIdGenerator`
- ❌ Set `id: ""` in entity (ID omitted from Prisma CreateInput)
- ✅ Rely on Prisma `@default(cuid())` in schema

```prisma
model StockLocation {
  id   String @id @default(cuid())  // DB generates CUID
  // ...
}
```

## Validation

### DTOs (Zod Schemas)

**Internal Application IDs** validate CUID2 format (24-25 characters):

```typescript
import { z } from "zod";

export const CreateAssetDTO = z.object({
  id: z.string().min(24).max(25), // CUID2 validation for internal entities
  // ...
});
```

**External System IDs** (e.g., Azure AD) validate as UUIDs:

```typescript
// src/lib/schemas/graph-user.schema.ts
export const GraphUserSchema = z.object({
  id: z.string().uuid(), // Azure AD Object ID is a GUID
  // ...
});
```

### ID Format Decision Matrix

| ID Type | Format | Validation | Example |
|---------|--------|------------|---------|
| Internal app entities | CUID2 | `z.string().min(24).max(25)` | `clx7abc123xyz456def789ghi` |
| Azure AD Object IDs | UUID v4 | `z.string().uuid()` | `550e8400-e29b-41d4-a716-446655440000` |
| External system IDs | Varies | Match source system | Per integration spec |

### Why Not `.cuid()`?

Zod doesn't have a built-in `.cuid()` validator. We use `.min(24).max(25)` which:
- ✅ Validates length (CUID2 spec)
- ✅ Simple and explicit
- ✅ No additional dependencies

## Migration from UUID

The codebase was migrated from UUID v4 to CUID2 in a comprehensive refactoring:

1. ✅ Created `IIdGenerator` interface and `CuidIdGeneratorService`
2. ✅ Updated 38 entities to accept `idGenerator` parameter
3. ✅ Updated ~71 use cases to inject and pass `IIdGenerator`
4. ✅ Updated 11 infrastructure services
5. ✅ Updated 40+ test files with mock `IIdGenerator`
6. ✅ Changed Prisma schema: `@default(uuid())` → `@default(cuid())` for all internal entities
7. ✅ Updated 21 DTOs for internal entities: `z.string().uuid()` → `z.string().min(24).max(25)`
8. ✅ **Preserved** `z.string().uuid()` for external system IDs (Azure AD, Microsoft Graph)
9. ✅ Removed `uuid` package dependency
10. ✅ Updated ESLint rules to allow service interface imports across layers

## Benefits Achieved

### Clean Architecture
- ✅ Domain layer independent of infrastructure (`crypto` module)
- ✅ Infrastructure concern injected via DI

### Testability
- ✅ Deterministic IDs in tests
- ✅ Easy to mock and verify

### Consistency
- ✅ Single source of truth for ID generation
- ✅ All IDs use same format (CUID2)

### Maintainability
- ✅ Easy to swap implementation (e.g., add prefixes, change algorithm)
- ✅ Type-safe interface

## Package Used

- **`@paralleldrive/cuid2`** (v2.2.2+)
  - Modern, maintained CUID2 implementation
  - Zero dependencies
  - Fast and secure

## Examples

### Creating an Entity with ID

```typescript
import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { Asset } from "@/core/domain/entities/asset.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

@injectable()
export class CreateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private assetRepo: IAssetRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private idGenerator: IIdGenerator,
  ) {}

  async execute(input: CreateAssetInput): Promise<Asset> {
    // Entity generates ID using injected service
    const asset = Asset.create({
      name: input.name,
      assetCategoryId: input.assetCategoryId,
      // ...
    }, this.idGenerator);

    // Repository receives entity with ID already set
    return await this.assetRepo.create(asset);
  }
}
```

### Testing with Mock IDs

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { Asset } from "@/core/domain/entities/asset.entity";

let idCounter = 0;
const mockIdGenerator: IIdGenerator = {
  generateId: vi.fn(() => `test-cuid-${idCounter++}`),
};

beforeEach(() => {
  idCounter = 0;
});

describe("Asset Entity", () => {
  it("should create asset with generated ID", () => {
    const asset = Asset.create({
      name: "Laptop",
      assetCategoryId: "cat-123",
    }, mockIdGenerator);

    expect(asset.id).toBe("test-cuid-0");
    expect(mockIdGenerator.generateId).toHaveBeenCalledTimes(1);
  });
});
```

## See Also

- [CUID2 Specification](https://github.com/paralleldrive/cuid2)
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Adding new features
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [DI_MODULARIZATION.md](./DI_MODULARIZATION.md) - Dependency injection patterns
