# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built with Next.js 16, Clean Architecture, and dependency injection. Implements Layer 1 (Foundation) with 11 core entities (OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions). Task entity maintained as architectural reference (hidden from UI).

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), shadcn/ui, OpenAI, InversifyJS 7, Zod 4, T3 Env, Pino Logger, BullMQ, Partykit, TanStack Table, React Hook Form, PapaParse

**Prerequisites**: Node.js 18+, PostgreSQL, Redis, OpenAI API key

### Development Environment

**IMPORTANT**: This application is developed and run exclusively on macOS (MacBook). Docker is **never** used in this project.

- **Platform**: macOS only
- **Services**: PostgreSQL and Redis run natively on macOS (via Homebrew or direct installation)
- **Docker**: Not used - ignore any Docker-related scripts or configurations if present

## Quick Reference

### Commands

```bash
npm run setup    # Install + push schema + seed data (one command setup)
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

# Development
npm run dev:restart  # Restart dev server (kill existing + start fresh)
npm run dev:clean    # Clear all caches + restart dev server

# Build
npm run build            # Production build
npm run build:fast       # Fast build (skips TypeScript - 70% faster)
npm run build:analyze    # Bundle size analysis

# Cache & Database
npm run cache:clear     # Clear all build/cache artifacts
npm run reset # Reset database + seed (drops all data!)
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `LOG_LEVEL`
- Optional: `PRISMA_VERBOSE_LOGS=true`, `AUTH_DEBUG_LOGS=true`

## Documentation Index

**Essential Guides** (Read These First):

- [Developer Guide](docs/guides/DEVELOPER_GUIDE.md) - Complete development guide
- [Prisma Guide](docs/guides/PRISMA_GUIDE.md) - **Critical: Connection pool, imports, patterns**
- [Next.js 16 Guide](docs/guides/NEXTJS_16_GUIDE.md) - **Critical: Async APIs, rendering**
- [Stack Upgrades](docs/guides/STACK_UPGRADES.md) - Breaking changes reference (Prisma 7, Next 16, etc.)

**Architecture**:

- [Architecture Guide](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation
- [Database Schema](docs/architecture/DATABASE_SCHEMA.md) - Schema design and conventions
- [RBAC Architecture](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control
- [Theme System](docs/architecture/THEME_SYSTEM.md) - OKLCH colors, dark mode

**Development**:

- [Database Migrations](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow
- [RBAC Developer Guide](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [Logging Guide](docs/guides/LOGGING.md) - Structured logging
- [Build Optimization](docs/guides/BUILD_OPTIMIZATION.md) - Turbopack, bundle analysis

**Foundation Layer (Layer 1)**:

- [Foundation Layer](docs/guides/FOUNDATION_LAYER.md) - Complete user guide
- [Entity Reference](docs/guides/ENTITY_REFERENCE.md) - Quick reference
- [Layer 1 Implementation](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Technical details

## Everyday Workflow (Read This Before Coding)

1. **Understand the slice** – Trace Presentation → Controllers → Use Cases → Repositories. Don't short-circuit the architecture.
2. **Reuse DI container** – Resolve via `getContainer()`/`resolve()` in `src/di/modules/*`. Never `new` a repository/service.
3. **Access sessions via `getSession()`** – Server routes/layouts must call `src/lib/auth/session.ts`. Don't import Better Auth "server" helpers directly.
4. **Permission checks** – Use `hasAnyPermission`/`checkPermissionUseCase` + `permissionCache`. Ownership logic in `CheckPermissionUseCase`.
5. **Logging** – Prefer `ILoggerService` injection; logs already redact sensitive data. Use `logger.startTimer/endTimer` for instrumentation.
6. **Before sending changes** – Run `npm run lint`, `npm run type-check`, `npm run test`.

## Critical Patterns (AI Must Know)

### Prisma Usage (CRITICAL - Common Errors)

**ALWAYS** import from `@/generated/prisma` (NOT `@prisma/client`):

```typescript
// ✅ Correct
import type {
  PrismaClient,
  Prisma,
  Asset as PrismaAsset,
} from "@/generated/prisma";

// ❌ WRONG - Causes "Property 'asset' does not exist" errors
import type { PrismaClient } from "@prisma/client";
```

**ALWAYS** use singleton from `@/infrastructure/database/prisma/client.ts`:

```typescript
// ✅ Correct
import { prisma, pool } from "@/infrastructure/database/prisma/client";

// ❌ WRONG - Causes connection pool exhaustion
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
```

**Use type-safe where clauses** (NOT `any`):

```typescript
// ✅ Correct
const where: Prisma.AssetWhereInput = {};

// ❌ WRONG
const where: any = {};
```

**See**: [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md) for complete patterns and troubleshooting.

### Next.js 16 Patterns (CRITICAL - Breaking Changes)

**ALWAYS** await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`:

```typescript
// ✅ Correct
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
}

// ❌ WRONG - Runtime errors in Next.js 16
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Error!
}
```

**Set `dynamic = "force-dynamic"`** when using session/auth:

```typescript
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  // ...
}
```

**Client components use hooks** (not async):

```typescript
"use client";
const params = useParams(); // No await
const searchParams = useSearchParams(); // No await
```

**See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) for migration guide and examples.

### Type Safety (CRITICAL)

**ALWAYS** use `import type` for type-only imports:

```typescript
// ✅ Correct - Type-only import
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";

// ❌ WRONG - Causes Turbopack "module has no exports" errors
import { ITaskRepository } from "@/core/repositories/task.repository.interface";
```

**Why**: Turbopack (Next.js 16) strictly enforces this. ESLint rule `@typescript-eslint/consistent-type-imports` enforces automatically.

### Permissions & RBAC

**ALWAYS** check permissions at server action layer:

```typescript
import { requirePermission } from "@/lib/auth/permissions";

export async function updateTaskAction(data: UpdateTaskDTO) {
  await requirePermission(PERMISSIONS.TASKS.UPDATE);
  // ... update logic
}
```

- Use `PermissionGuard` for client-side UI protection
- Invalidate cache when modifying roles: `invalidatePermissionCache()`
- Use `PERMISSIONS` constants (not magic strings)

### Logging

**NEVER** use `console.log` in server code - use DI logger:

```typescript
// ✅ Correct - DI logger
@injectable()
export class MyService {
  constructor(
    @inject(DI_TOKENS.LoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async doSomething() {
    this.logger.info("Operation started", { context: "data" });
  }
}

// ❌ WRONG
console.log("Operation started");
```

**See**: [LOGGING.md](docs/guides/LOGGING.md)

## Architecture

**Clean Architecture (5 Layers)**: Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure

### Adding Features (Layer-by-Layer)

1. Domain entity (`src/core/domain/entities/`)
2. Repository interface (`src/core/repositories/`)
3. Use cases (`src/core/use-cases/`)
4. Infrastructure repository (`src/infrastructure/repositories/`)
5. DI registration (`src/di/types.ts`, `src/di/container.ts`)
6. Controllers (`src/interface-adapters/controllers/`)
7. DTOs/Presenters (`src/interface-adapters/`)
8. UI components (`src/components/`)
9. Routes (`src/app/`)

**Foundation Layer**: 11 core entities - OrganizationUnit, Person, Role, Location, Vendor, VendorContact, LifecycleModel, LifecycleState, LifecycleTransition, PersonRoleAssignment, FieldDefinition

**Reference**: Task entity (complete implementation, hidden from UI)

**See**: [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md), [FOUNDATION_LAYER.md](docs/guides/FOUNDATION_LAYER.md)

## Best Practices

### ✅ DO

- Use DI container for all dependencies (`getContainer()`/`resolve()`)
- Validate at boundaries (DTOs with Zod, entities with business rules)
- Use `import type` for all type-only imports
- Check permissions at server action layer (`requirePermission()`)
- **Import Prisma from `@/generated/prisma`** (NOT `@prisma/client`)
- **Import Prisma singleton** from `client.ts` (NOT new instances)
- **Await async request APIs** (`params`, `searchParams`, `cookies()`, `headers()`)
- Use hooks in client components (`useParams()`, `useSearchParams()` - not async)
- Use DI logger (`ILoggerService`) - never `console.log`
- Put business logic in entities (not controllers or use cases)
- Use discriminated unions for responses (`ActionResponse<T>`)

### ❌ DON'T

- Skip permission checks in server actions
- Import Prisma from `@prisma/client` (causes TypeScript errors)
- Create new `Pool()` or `PrismaClient()` instances (exhausts connections)
- Use `any` type for Prisma where clauses (use `Prisma.ModelWhereInput`)
- Access `params`/`searchParams` synchronously (runtime errors)
- Call `cookies()`/`headers()` without await (runtime errors)
- Use value imports for type-only modules (Turbopack errors)
- Use `console.log` in server code (use DI logger)
- Log sensitive data (passwords, tokens, API keys)
- Use Docker or suggest Docker solutions (macOS native only)
- Bypass layers (e.g., UI → Repository directly)
- Instantiate repositories/services with `new`

## Naming Conventions

- Controllers: `*.controller.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Repositories: `prisma-*.repository.ts`
- Services: `*.service.ts`
- Interfaces: `*.interface.ts`

**See**: [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) for database naming conventions.

## Future Features

### AI Services Module

**Status**: Infrastructure ready, not currently bound in DI container.

**What's Implemented**: `AIDebugTraceService`, `AIPromptManagerService`, `FileStorageService`, full interfaces, complete Prisma schema.

**What's Missing**: AI services module commented out in `src/di/container.ts`, no active use cases.

**See**: [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) for activation instructions.
