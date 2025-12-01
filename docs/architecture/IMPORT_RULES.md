# Import Rules & Layer Boundaries

This document defines the import rules matrix for maintaining Clean Architecture layer boundaries in the codebase.

## Core Principles

1. **Dependency Rule**: Dependencies flow inward only (outer layers depend on inner layers, never the reverse)
2. **Layer Independence**: Inner layers have no knowledge of outer layers
3. **Single Responsibility**: Each layer has a specific purpose and constraint

## Layer Hierarchy

```
┌─────────────────────────────────────────┐
│ Presentation Layer (app/)               │  ← User-facing pages, API routes
├─────────────────────────────────────────┤
│ Interface Adapters                      │  ← Controllers, DTOs, Presenters, Queries
│ (interface-adapters/)                   │
├─────────────────────────────────────────┤
│ Use Cases (core/use-cases/)             │  ← Business logic orchestration
├─────────────────────────────────────────┤
│ Domain (core/domain/)                   │  ← Pure business rules, entities
├─────────────────────────────────────────┤
│ Infrastructure (infrastructure/)        │  ← External services, DB, APIs
└─────────────────────────────────────────┘

Cross-cutting: config/, lib/, generated/
```

## Import Matrix

| From Layer | Can Import | Cannot Import | Notes |
|-----------|-----------|---------------|-------|
| **app/** (Presentation) | `interface-adapters/*`, `lib/*`, `config/*`, `generated/*`, `contexts/*`, `components/*`, `hooks/*` | Direct imports from `core/*` or `infrastructure/*` | Use controllers as the boundary |
| **interface-adapters/** | `core/domain/*`, `core/use-cases/*`, `lib/utils/*` (limited), `config/*`, `generated/*` | `infrastructure/*`, `app/*`, `lib/rbac/*`, `lib/auth/*` | DTOs, Controllers, Presenters, Queries |
| **core/use-cases/** | `core/domain/*`, `core/services/*` (interfaces only), `generated/prisma` (types/enums only), `config/di-tokens.ts` | `infrastructure/*`, `interface-adapters/*`, `app/*`, `lib/*` | Pure business logic, no framework code |
| **core/domain/** | `core/shared/*`, `generated/prisma` (enums only) | Everything else | Entities and business rules only |
| **core/services/** | None (interface definitions only) | Everything | Define contracts only |
| **infrastructure/** | `core/domain/*`, `core/services/*` (implement interfaces), `generated/prisma/server`, `lib/*`, `config/*` | `interface-adapters/*`, `app/*` | Implement adapters for external concerns |
| **lib/** | `config/*`, `generated/*`, other `lib/*` modules | `core/*`, `interface-adapters/*`, `infrastructure/*`, `app/*` | Shared utilities, can't depend on business layers |
| **config/** | None | Everything | Configuration only, no dependencies |

## Special Cases & Exceptions

### Generated Types (`generated/prisma`)

**Allowed everywhere:**
- `@/generated/prisma` - Browser-safe types and enums (default export)
- `@/generated/prisma/enums` - Prisma enums only

**Server-only:**
- `@/generated/prisma/server` - Full PrismaClient (only in infrastructure layer)

**Rule**: Core can import Prisma types/enums for type safety, but never `PrismaClient` or database operations.

### DI Tokens (`config/di-tokens.ts`)

**Allowed in:**
- `core/use-cases/*` - To declare dependency injection needs
- `infrastructure/*` - To provide implementations
- `interface-adapters/*` - To resolve dependencies

**Purpose**: Enable dependency inversion without coupling to concrete implementations.

### Lib Utilities

**Strict separation:**
- Pure utilities (date formatting, string manipulation) → Can move to `core/shared/` if needed by domain
- Framework/runtime utilities (auth, caching, Redis) → Stay in `lib/`, never imported by `core/`

**Current violations to fix:**
- `lib/rbac/permission-cache.ts` imported by use cases → Create interface in `core/services/`, implement in `infrastructure/`
- `lib/utils/password.ts` imported by use cases → Move to `infrastructure/` as adapter
- `lib/config/currency.ts` imported by domain → Move pure logic to `core/shared/`, keep runtime in `lib/`

### Contexts & Hooks (`contexts/`, `hooks/`)

**Usage:**
- App layer (`app/`) can import these freely
- These are presentation-layer concerns, not business logic

**Rule**: Never import contexts/hooks into `core/` or `infrastructure/`

## Enforcement Strategy

**Current staged enforcement (ESLint warn)**:
- App layer blocks direct imports from core use cases/entities/services and infrastructure (value objects remain allowed temporarily).
- Lib blocks imports from interface-adapters, infrastructure, and app (core imports are tolerated temporarily until refactors land).
- Core use cases and domain still block lib/infrastructure/app.

### 1. ESLint Rules

Use `@typescript-eslint/no-restricted-imports` or `eslint-plugin-boundaries`:

```typescript
// eslint.config.mjs (simplified example)
{
  files: ['src/core/domain/**/*', 'src/core/use-cases/**/*'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        'src/lib/*',           // No lib imports in core
        'src/infrastructure/*', // No infrastructure in core
        'src/app/*',            // No app in core
        'src/interface-adapters/*', // No adapters in core
      ]
    }]
  }
}
```

### 2. Import Graph Smoke Test

CI test that parses the import graph and fails on violations:

```typescript
// tests/architecture/import-boundaries.test.ts
import { checkImportBoundaries } from './import-graph-checker';

describe('Import Boundaries', () => {
  it('core/domain has no lib dependencies', async () => {
    const violations = await checkImportBoundaries('src/core/domain', {
      disallowed: ['src/lib']
    });
    expect(violations).toEqual([]);
  });

  it('core/use-cases has no infrastructure dependencies', async () => {
    const violations = await checkImportBoundaries('src/core/use-cases', {
      disallowed: ['src/infrastructure', 'src/lib']
    });
    expect(violations).toEqual([]);
  });

  // More boundary checks...
});
```

### 3. Pre-commit Hook

Lightweight check that fails fast:

```bash
# .husky/pre-commit
npm run lint:boundaries
```

## Migration Path

### Phase 1: Document & Warn
1. ✅ Document rules in this file
2. Add ESLint rules with "warn" severity
3. Catalog existing violations

### Phase 2: Fix Violations
1. Move pure utilities from `lib/` to `core/shared/`
2. Create interfaces in `core/services/` for runtime concerns
3. Implement adapters in `infrastructure/` for interfaces
4. Update DI bindings to wire interfaces to implementations

### Phase 3: Enforce
1. Switch ESLint rules to "error" severity
2. Add CI import graph smoke test
3. Add pre-commit hook for fast feedback

## Common Patterns

### Pattern: Use Case Needs External Service

**❌ Wrong:**
```typescript
// core/use-cases/user/create-user.use-case.ts
import { hashPassword } from '@/lib/utils/password'; // Direct lib import

export class CreateUserUseCase {
  async execute(dto: CreateUserDTO) {
    const hashedPassword = await hashPassword(dto.password);
    // ...
  }
}
```

**✅ Right:**
```typescript
// core/services/password-hasher.interface.ts
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

// core/use-cases/user/create-user.use-case.ts
import { inject, injectable } from 'inversify';
import { DI_TOKENS } from '@/config/di-tokens';
import type { IPasswordHasher } from '@/core/services/password-hasher.interface';

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.IPasswordHasher) private passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: CreateUserDTO) {
    const hashedPassword = await this.passwordHasher.hash(dto.password);
    // ...
  }
}

// infrastructure/adapters/bcrypt-password-hasher.adapter.ts
import { injectable } from 'inversify';
import { hash, compare } from 'bcryptjs';
import type { IPasswordHasher } from '@/core/services/password-hasher.interface';

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, 10);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}

// config/di-container.ts
container.bind<IPasswordHasher>(DI_TOKENS.IPasswordHasher).to(BcryptPasswordHasher);
```

### Pattern: Query Layer Composition

**✅ Right:**
```typescript
// interface-adapters/queries/stock-movements-query.ts
import { inject, injectable } from 'inversify';
import { DI_TOKENS } from '@/config/di-tokens';
import type { IStockMovementService } from '@/core/use-cases/stock-movements';
import type { IAssetService } from '@/core/use-cases/assets';

@injectable()
export class StockMovementsQuery {
  constructor(
    @inject(DI_TOKENS.IStockMovementService) private stockMovementService: IStockMovementService,
    @inject(DI_TOKENS.IAssetService) private assetService: IAssetService
  ) {}

  async listTableView(filters: StockMovementFilters) {
    // Get movements from use case
    const movements = await this.stockMovementService.findAll(filters);

    // Batch load related assets (avoid N+1)
    const assetIds = [...new Set(movements.map(m => m.assetId))];
    const assets = await this.assetService.findByIds(assetIds);
    const assetMap = new Map(assets.map(a => [a.id, a]));

    // Compose view model
    return movements.map(movement => ({
      ...movement,
      asset: assetMap.get(movement.assetId),
      // ... more enrichment
    }));
  }
}
```

**❌ Wrong:**
```typescript
// interface-adapters/queries/stock-movements-query.ts (ANTI-PATTERN)
import { prisma } from '@/infrastructure/database/prisma/client';

export class StockMovementsQuery {
  async listTableView(filters: StockMovementFilters) {
    // ❌ Direct database access, bypasses use cases
    return prisma.stockMovement.findMany({
      include: { asset: true, location: true }
    });
  }
}
```

## FAQ

**Q: Why can't `core/use-cases` import from `lib/utils`?**
A: Core layer must remain pure and testable without external dependencies. If you need a utility in core, either:
- Move it to `core/shared/` if it's pure (no framework/runtime dependencies)
- Create an interface in `core/services/` and implement in `infrastructure/`

**Q: Can I import Prisma types in use cases?**
A: Yes, but only types and enums from `@/generated/prisma`. Never import `PrismaClient` or database operations.

**Q: Why have a query layer if it just calls use cases?**
A: Query layer handles view composition (joins, batching, formatting) without duplicating business logic. Use cases stay focused on single-entity operations; queries compose them for UI needs.

**Q: What if I need to join data across modules in the app layer?**
A: Create a query in `interface-adapters/queries/` that composes multiple use cases. Never orchestrate use cases directly in page components.

## Tools

- **ESLint**: `eslint-plugin-boundaries` or `@typescript-eslint/no-restricted-imports`
- **Import Graph Analysis**: `dependency-cruiser`, `madge`, or custom script
- **Type Checking**: TypeScript's `--noEmit` catches most violations at compile time

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Step-by-step feature development
