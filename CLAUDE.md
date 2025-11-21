# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built with Next.js 16, Clean Architecture, and dependency injection. Implements Layer 1 (Foundation) with 11 core entities (OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions). Task entity maintained as architectural reference (hidden from UI).

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), shadcn/ui, OpenAI, InversifyJS 7, Zod 4, T3 Env, Pino Logger, BullMQ, Partykit, TanStack Table, React Hook Form, PapaParse

**Prerequisites**: Node.js 18+, PostgreSQL, Redis, OpenAI API key

### Major Stack Upgrades (November 2025)

- **Prisma 7.0**: New Rust-free client with PostgreSQL adapter
  - Uses `@prisma/adapter-pg` for database connections
  - 90% smaller bundle size, 3x faster queries
  - Requires explicit `output` path in schema generator
  - All PrismaClient instances use PostgreSQL Pool adapter
- **Zod 4.1**: Breaking API changes
  - `z.email()`, `z.uuid()`, `z.datetime()` moved to top-level functions
  - `z.coerce.date()` for date coercion (replaces `.datetime()`)
  - `error.issues` instead of `error.errors`
  - `z.record()` requires explicit key and value types
  - `z.date()` requires configuration object
- **Next.js 16.0**: Turbopack is now default
  - `--turbopack` flag removed from dev script (now default behavior)
  - React 19.2 integrated
  - **Async Request APIs fully enforced** (breaking change):
    - `params` and `searchParams` are now `Promise<T>` in pages/layouts
    - `cookies()`, `headers()`, and `draftMode()` must be awaited
    - Client components use `useParams()` and `useSearchParams()` hooks (unchanged)
  - **Proxy Convention** (replaces middleware.ts):
    - `middleware.ts` deprecated in favor of `proxy.ts` (runs on Node.js runtime)
    - Migration: rename file and function from `middleware()` to `proxy()`
    - Codemod available: `npx @next/codemod@latest middleware-to-proxy .`
    - middleware.ts still works but will be removed in future versions
- **React 19.2.0**: Built into Next.js 16
  - View Transitions support
  - New hooks: `useActionState`, `useFormStatus`, `useOptimistic`
  - Activity rendering improvements
  - **React Compiler**: ESLint plugin for automatic memoization and performance optimization
  - **JSX Namespace Augmentation**: Requires module wrapping (see [global.d.ts](global.d.ts))
  - ESLint flat config pattern for react-hooks plugin
- **InversifyJS 7.10**: Removed `interfaces` namespace, simplified container API
  - Use direct imports: `import { Container, injectable, inject } from "inversify"`
  - No more `interfaces.Context` or `interfaces.Provider` - now `ResolutionContext`, `Provider` (direct exports)
  - Async methods: `load`, `unload`, `rebind`, `unbind` are now async (with `*Sync` alternatives)
  - Merged get methods: `container.get(X, { name: "..." })` replaces `getNamed`
  - Child containers: `new Container({ parent })` replaces `createChild()`
- **@types/node 24.x**: Latest Node.js type definitions

### Development Environment

**IMPORTANT**: This application is developed and run exclusively on macOS (MacBook). Docker is **never** used in this project.

- **Platform**: macOS only
- **Services**: PostgreSQL and Redis run natively on macOS (via Homebrew or direct installation)
- **Docker**: Not used - ignore any Docker-related scripts or configurations if present

## Architecture

**Clean Architecture (5 Layers)**: Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure

**See**: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for complete architecture guide, dependency injection, layer patterns, and data flow

## Quick Start

```bash
npm run setup    # Install + push schema + seed data (one command setup)
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

# Development Commands
npm run dev:restart  # Restart dev server (kill existing + start fresh)
npm run dev:clean    # Clear all caches + restart dev server

# Build Commands
npm run build            # Production build with enhanced DX (timing, progress)
npm run build:fast       # Fast build (skips TypeScript - 70% faster)
npm run build:analyze    # Bundle size analysis (Turbopack-compatible)
npm run type-check:watch # Parallel type checking during development

# Cache Management
npm run cache:clear     # Clear all build/cache artifacts (.next, node_modules/.cache, etc.)
npm run cache:clear:all # Clear all caches + reset database + seed

# Database Commands
npm run reset # Reset database + seed (drops all data!)
```

**Environment**: Copy `.env.example` to `.env.local` and configure: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `LOG_LEVEL`. Optional debug toggles:

- `PRISMA_VERBOSE_LOGS=true` – emit sanitized Prisma query/warn/error events (default: enabled in dev)
- `AUTH_DEBUG_LOGS=true` – enable verbose Better Auth traces with automatic redaction

**Prisma Config**: Uses `prisma.config.ts` (Prisma v7) - all commands auto-detect schema location

**See**: [docs/guides/DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) for complete development guide

## Everyday Workflow (read this before coding)

1. **Understand the slice** – trace the path Presentation → Controllers → Use Cases → Repositories. Most refactors touched all layers; don’t short-circuit the architecture.
2. **Reuse the DI container** – resolve dependencies via `getContainer()`/`resolve()` and bindings in `src/di/modules/*`. Never `new` a repository/service directly.
3. **Access sessions via `getSession()`** – server routes/layouts must call `src/lib/auth/session.ts`. Do **not** import Better Auth “server” helpers directly; the session utility wraps `/api/auth/get-session` + cookie handling.
4. **Permission checks** – use `hasAnyPermission`/`checkPermissionUseCase` plus `permissionCache`. Ownership logic lives in `CheckPermissionUseCase`; keep new checks consistent.
5. **Logging** – prefer `ILoggerService` injection; structured logs already redact sensitive info. Use `logger.startTimer/endTimer` for DB + cache instrumentation.
6. **Before sending changes** – run `npm run lint`, `npm run type-check`, `npm run test`. The suite includes RBAC integration tests; expect console output from repository logging.

## Auth & Session Access

- Better Auth configuration lives in `src/lib/auth/better-auth.ts`. Use hooks there (e.g., first-user admin) instead of ad-hoc DB writes.
- Server components/routes should call `getSession()` and redirect/throw when unauthenticated. UI helpers (UserMenu, PermissionGuard, etc.) rely on that shape.
- API routes that need DI-resolved use cases should `const container = getContainer();` (it now lazily initializes) and avoid creating new services manually.
- When exposing new auth endpoints, proxy through `/api/auth/[...all]/route.ts` which already wraps the Better Auth handler with verbose logging.

## Rendering & Build Guardrails (Next.js 16)

- If a page/layout/template touches `cookies()`, `getSession()`, `requireAuth()`, or any permission helpers, set `export const dynamic = "force-dynamic";` in that file. Do this by default for new dashboard/auth pages and the root app layout to avoid `Dynamic server usage` build failures.
- Components using `useSearchParams()` must be wrapped in `Suspense` with a fallback to satisfy the CSR bailout rule.
- In React Hook Form components audited by React Compiler, prefer `useWatch` over `form.watch` to avoid “incompatible library” skips.

## Testing & Validation

- `npm run lint` – ESLint flat config (TypeScript + React Compiler rules).
- `npm run type-check` – TS 5.9 + path aliases (`@/*`). Fails fast if generated Prisma barrel missing.
- `npm run test` – Vitest (unit + integration). Some tests hit the database; ensure `.env.local` points at a disposable DB.
- `npm run validate` – convenience script: type-check → lint → test.
- Prefer adding focused Vitest specs for new use cases/controllers; use the DI test helpers + mock repositories. See `src/core/use-cases/rbac/__tests__`.

## Infrastructure

- **Database & Migrations**: [docs/guides/DATABASE_MIGRATIONS.md](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow, dev vs production, deployment best practices
- **Build System**: [docs/guides/BUILD_OPTIMIZATION.md](docs/guides/BUILD_OPTIMIZATION.md) - Turbopack, parallel type checking, bundle analysis
- **Logging**: [docs/guides/LOGGING.md](docs/guides/LOGGING.md) - Pino structured logging, request correlation, performance monitoring, Prisma query tracing, Better Auth debug flags
- **Background Jobs**: [docs/guides/BACKGROUND_JOBS.md](docs/guides/BACKGROUND_JOBS.md) - BullMQ + Redis job queue
- **Real-time**: [docs/guides/REALTIME.md](docs/guides/REALTIME.md) - SSE & Partykit WebSocket integration
- **UI Components**: [docs/guides/UI_COMPONENTS.md](docs/guides/UI_COMPONENTS.md) - TanStack Table, React Hook Form, CSV
- **Sidebar**: [docs/guides/SIDEBAR_FEATURES.md](docs/guides/SIDEBAR_FEATURES.md) - Collapsible groups, nesting, RBAC, animations
- **Theme System**: [docs/architecture/THEME_SYSTEM.md](docs/architecture/THEME_SYSTEM.md) - OKLCH colors, dark mode, Tailwind
- **Auth & RBAC**: [docs/architecture/RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Better Auth, permissions, roles, multi-layer enforcement
  - Developer Guide: [docs/guides/RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md)
  - Admin Guide: [docs/guides/RBAC_ADMIN_GUIDE.md](docs/guides/RBAC_ADMIN_GUIDE.md)
  - Testing: [docs/testing/RBAC_TEST_SUITE.md](docs/testing/RBAC_TEST_SUITE.md)

### Server-Only Packages

`next.config.ts` includes `serverExternalPackages` to prevent server-only dependencies from being bundled in client:

```typescript
[
  "@prisma/client",
  "bullmq",
  "ioredis",
  "pino",
  "pino-pretty",
  "inversify",
  "reflect-metadata",
];
```

**When to add**: New server-only dependencies (database drivers, job queues, etc.)

## Core Patterns

### Server Actions (Controllers)

- Located in `src/interface-adapters/controllers/`
- Start with `"use server"` directive
- Validate with Zod schemas (DTOs)
- Return `ActionResponse<T>` discriminated unions:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

- Use `handleControllerError()` for consistent error handling

### Domain Entities

- Located in `src/core/domain/entities/`
- Factory methods for creation (e.g., `Task.create()`)
- Validation and business rules in entity methods
- Immutable IDs, mutable business fields

### Repository Pattern

- Interfaces in `src/core/repositories/`
- Prisma implementations in `src/infrastructure/repositories/`
- Use `prisma-helpers.ts` for type-safe JSON fields
- Use `repository-logger.ts` for operation tracking

### Prisma Connection Pool (CRITICAL)

**Always use the singleton from `src/infrastructure/database/prisma/client.ts`**:

```typescript
// ✅ Correct - Use singleton
import { prisma, pool } from "@/infrastructure/database/prisma/client";

// ❌ NEVER create new instances
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // Creates duplicate pool!
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) }); // Creates duplicate client!
```

**Why**: Multiple connection pools exhaust database connections and cause performance issues. The singleton in [client.ts](src/infrastructure/database/prisma/client.ts) is configured with:

- Single `pg.Pool` instance (shared across app)
- Single `PrismaPg` adapter (uses Prisma 7 Rust-free client)
- `engineType = "client"` in schema (90% smaller bundle, 3x faster)
- Global singleton pattern (prevents duplication in dev hot-reload)

**Usage**:

- DI Container: Imports singleton (see [database.module.ts](src/di/modules/database.module.ts))
- Better Auth: Extends singleton with `$extends()` (see [better-auth.ts](src/lib/auth/better-auth.ts))
- Seed Scripts: Can create own pools (standalone processes)

### Prisma Imports (CRITICAL)

**ALWAYS import Prisma types from `@/generated/prisma`, NEVER from `@prisma/client`**:

```typescript
// ✅ Correct - Import from generated barrel export
import type {
  PrismaClient,
  Prisma,
  Asset as PrismaAsset,
  $Enums,
} from "@/generated/prisma";

// ❌ WRONG - Do NOT import from @prisma/client
import type { PrismaClient } from "@prisma/client"; // Will cause "Property 'asset' does not exist" errors!
```

**Repository Implementation Pattern**:

```typescript
import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  Prisma,
  Asset as PrismaAsset,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import { Asset } from "@/core/domain/entities/asset.entity";

@injectable()
export class PrismaAssetRepository implements IAssetRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  // Use Prisma.ModelWhereInput for where clauses (NOT any!)
  async search(options: SearchOptions): Promise<Asset[]> {
    const where: Prisma.AssetWhereInput = {};
    // ... build where clause
    const assets = await this.prisma.asset.findMany({ where });
    return assets.map((a) => this.toDomain(a));
  }

  // Use PrismaModel type for toDomain parameter
  private toDomain(prismaAsset: PrismaAsset): Asset {
    return Asset.reconstitute({
      id: prismaAsset.id,
      // ... map fields
    });
  }
}
```

**Why**:

- `@/generated/prisma` contains the complete Prisma client with all model delegates (`prisma.asset`, `prisma.assetAssignment`, etc.)
- `@prisma/client` is the base package that doesn't include your schema-specific types
- The barrel export at `src/generated/prisma/index.ts` re-exports all types: `PrismaClient`, `Prisma` namespace, `$Enums`, and all model types
- Using `Prisma.ModelWhereInput` instead of `any` provides type safety for complex queries

**Common Mistake**: When creating new repositories, developers often auto-import `PrismaClient` from `@prisma/client` because it's the first suggestion. This causes TypeScript errors like "Property 'asset' does not exist on type 'PrismaClient'". Always verify imports are from `@/generated/prisma`.

### AI Integration

Services in `src/infrastructure/services/ai/` with modular prompt system, 24-hour caching, type-safe structured outputs with Zod, debug tracing available.

## Adding Features

Follow layers inside-out:

1. Domain entity (`src/core/domain/entities/`)
2. Repository interface (`src/core/repositories/`)
3. Use cases (`src/core/use-cases/`)
4. Infrastructure repository (`src/infrastructure/repositories/`)
5. DI registration (`src/di/types.ts`, `src/di/container.ts`)
6. Controllers (`src/interface-adapters/controllers/`)
7. DTOs/Presenters (`src/interface-adapters/`)
8. UI components (`src/components/`)
9. Routes (`src/app/`)

### Foundation Layer (Layer 1) - Primary Implementation

Complete implementation of 11 core entities:

1. **OrganizationUnit, Person, Role** - Organizational hierarchy and people management
2. **Location, Vendor, VendorContact** - Geographical and supplier management
3. **LifecycleModel, LifecycleState, LifecycleTransition** - Reusable state machines
4. **PersonRoleAssignment** - Many-to-many Person↔Role with temporal data
5. **FieldDefinition** - Dynamic field meta-model for custom attributes

**Documentation**:

- [Foundation Layer Guide](docs/guides/FOUNDATION_LAYER.md) - Complete user guide
- [Entity Reference](docs/guides/ENTITY_REFERENCE.md) - Quick reference
- [Layer 1 Implementation](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Technical details

**Use Foundation entities as primary reference when implementing new features (Layer 2+).**

### Task Entity - Architectural Reference

**Status**: Maintained as reference implementation, hidden from UI navigation

Complete implementation demonstrating all architectural layers:

1. **Domain Entity**: [src/core/domain/entities/task.entity.ts](src/core/domain/entities/task.entity.ts)
2. **Repository Interface**: [src/core/repositories/task-repository.interface.ts](src/core/repositories/task-repository.interface.ts)
3. **Use Cases**: [src/core/use-cases/task/](src/core/use-cases/task/) (create, get, list, update, delete)
4. **Infrastructure Repository**: [src/infrastructure/repositories/prisma-task.repository.ts](src/infrastructure/repositories/prisma-task.repository.ts)
5. **DI Registration**: [src/di/container.ts](src/di/container.ts) (search for "Task")
6. **Controllers**: [src/interface-adapters/controllers/task.controller.ts](src/interface-adapters/controllers/task.controller.ts)
7. **DTOs**: [src/interface-adapters/dtos/task.dto.ts](src/interface-adapters/dtos/task.dto.ts)
8. **UI Components**: [src/components/tasks/](src/components/tasks/)
9. **Routes**: [src/app/tasks/](src/app/tasks/) - **Hidden from navigation** (visible: false in navigation.ts)

Use as secondary reference for understanding Clean Architecture patterns.

## Common Patterns

### Client vs Server Components

- **Server Components** (default): Can use server actions, faster initial load
- **Client Components** (`'use client'`): Required for interactivity, state, effects
- **Rule**: Never import use cases/repositories in client components - use server actions

### Async Request APIs (Next.js 16)

Next.js 16 fully enforces async request APIs. All dynamic request APIs must be awaited:

**Server Components with params/searchParams:**

```typescript
// ✅ Correct - Async params and searchParams
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const id = params.id;
  const query = searchParams.query;
  // ...
}

// ❌ Incorrect - Synchronous access
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Error in Next.js 16!
}
```

**Server Components with cookies/headers:**

```typescript
// ✅ Correct - Await cookies() and headers()
import { cookies, headers } from "next/headers";

export async function MyServerComponent() {
  const cookieStore = await cookies();
  const headersList = await headers();

  const token = cookieStore.get("token");
  const userAgent = headersList.get("user-agent");
  // ...
}

// ❌ Incorrect - Synchronous access
const cookieStore = cookies(); // Error in Next.js 16!
```

**Client Components use hooks (unchanged):**

```typescript
// ✅ Client components use hooks (not async)
"use client";

import { useParams, useSearchParams } from "next/navigation";

export function MyClientComponent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id; // No await needed in hooks
  // ...
}
```

**Migration**: Use codemod to automatically migrate:

```bash
npx @next/codemod@latest next-async-request-api .
```

### Type Safety & Validation

- **TypeScript**: Strict mode enabled, no `any` types
- **Zod**: Runtime validation in server actions and DTOs
- **Interfaces**: Use for all dependencies (repositories, services)
- **Import Types**: Always use `import type` for type-only imports (interfaces, types, type aliases)

  ```typescript
  // ✅ Correct - Type-only import
  import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
  import type { Task } from "@/core/domain/entities/task.entity";

  // ❌ Incorrect - Value import for types
  import { ITaskRepository } from "@/core/repositories/task.repository.interface";
  ```

  **Why**: Turbopack (Next.js 16) strictly enforces type-only imports. Using value imports for interfaces causes "module has no exports" errors. ESLint rule `@typescript-eslint/consistent-type-imports` enforces this pattern.

- **Next.js Image**: Use `<Image />` instead of `<img>` for optimization

### FormData Handling

Server actions accept FormData for file uploads and form submissions:

```typescript
export async function createTaskAction(
  formData: FormData,
): Promise<ActionResponse<TaskDTO>> {
  const dto = CreateTaskDTO.parse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  // ... process
}
```

### React 19 Patterns

**New Hooks for Forms and Optimistic Updates**:

```typescript
// useActionState for async form actions with error handling
import { useActionState } from 'react';

function MyForm() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateData(formData);
      if (error) return error;
      redirect("/success");
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <input name="field" />
      <button disabled={isPending}>Submit</button>
      {error && <p>{error}</p>}
    </form>
  );
}

// useFormStatus for accessing parent form status
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>Submit</button>;
}

// useOptimistic for optimistic UI updates
import { useOptimistic } from 'react';

function MyComponent({ currentValue, onUpdate }) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue);

  const handleUpdate = async (newValue) => {
    setOptimisticValue(newValue);
    await onUpdate(newValue);
  };
}
```

**JSX Namespace Augmentation**: React 19 requires JSX namespace augmentation to be wrapped in module declarations to prevent global type pollution. See [global.d.ts](global.d.ts) for the pattern.

**React Compiler**: The project includes `eslint-plugin-react-compiler` for automatic memoization and performance optimization. The compiler analyzes your code and suggests optimizations where React's Rules are followed.

### Code Quality & Linting

Prefix intentionally unused variables/parameters with underscore to pass linting:

```typescript
// Interface contract parameter not used yet
private async writePrompts(_presentationId: string): Promise<void> { }

// Callback parameter not needed
array.map((_item, index) => index);

// Error in catch block not used
try { } catch (_error) { }
```

**ESLint Rule**: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"`, `varsIgnorePattern: "^_"`, `caughtErrorsIgnorePattern: "^_"`

## Best Practices

✅ **DO**:

- Use DI container for all dependencies
- Validate at boundaries (DTOs, entities)
- Put business logic in entities
- Use discriminated unions for responses
- Use Next.js `<Image />` component
- Follow SOLID principles (Single Responsibility, Dependency Inversion)
- **Use `import type` for all type-only imports** (interfaces, types, type aliases)
- **Use DI logger with structured context in all services** (see [LOGGING.md](docs/guides/LOGGING.md))
- **Always check permissions at server action layer** (use `requirePermission()`)
- **Use PermissionGuard components for client-side UI protection**
- **Invalidate permission cache when modifying roles/permissions** (call `invalidatePermissionCache()`)
- **Always import Prisma types from `@/generated/prisma`** (NOT `@prisma/client` - see Prisma Imports section)
- **Always import Prisma singleton** (`import { prisma, pool } from '@/infrastructure/database/prisma/client'`)
- **Use `Prisma.ModelWhereInput` for type-safe where clauses** (NOT `any` type)
- **Await async request APIs** (`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`)
- **Use hooks in client components** (`useParams()`, `useSearchParams()` - not async)

❌ **DON'T**:

- Call repositories directly from controllers
- Import server code in client components
- Instantiate use cases/repositories with `new`
- Skip validation in DTOs or entities
- Use `<img>` tags (causes ESLint warnings)
- **Use value imports for type-only modules** (causes Turbopack errors)
- **Use `console.log`, `console.error`, or `console.warn` in server code** (use DI logger instead)
- **Log sensitive data** (passwords, tokens, API keys)
- Use Docker or suggest Docker-based solutions (macOS native tools only)
- **Skip permission checks in server actions** (every action must check permissions)
- **Rely only on client-side permission checks** (always enforce server-side)
- **Use magic strings for permissions** (use PERMISSIONS constants from permission-key.ts)
- **Import Prisma types from `@prisma/client`** (causes "Property does not exist" errors - ALWAYS use `@/generated/prisma`)
- **Use `any` type for Prisma where clauses** (use `Prisma.ModelWhereInput` instead)
- **Create new `Pool()` or `PrismaClient()` instances** (causes connection pool exhaustion - use singleton from client.ts)
- **Access `params`/`searchParams` synchronously in server components** (causes runtime errors - must await)
- **Call `cookies()`/`headers()` without await** (causes runtime errors in Next.js 16)

## Documentation

**See**: [docs/README.md](docs/README.md) for complete documentation index

**Architecture**:

- [Architecture Guide](docs/architecture/ARCHITECTURE.md) - Complete Clean Architecture implementation
- [Theme System](docs/architecture/THEME_SYSTEM.md) - Theme and styling guide
- [RBAC Architecture](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system

**Developer Guides**:

- [Developer Guide](docs/guides/DEVELOPER_GUIDE.md) - Comprehensive development guide
- [Database Migrations & Deployment](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow and production deployment
- [RBAC Developer Guide](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions and protecting features
- [RBAC Admin Guide](docs/guides/RBAC_ADMIN_GUIDE.md) - Managing roles, permissions, and users
- [Logging Guide](docs/guides/LOGGING.md) - Production-grade logging system
- [Real-time Features](docs/guides/REALTIME.md) - SSE and Partykit WebSocket integration
- [Background Jobs](docs/guides/BACKGROUND_JOBS.md) - BullMQ job queue system
- [UI Components](docs/guides/UI_COMPONENTS.md) - TanStack Table, React Hook Form, CSV handling
- [Sidebar Features](docs/guides/SIDEBAR_FEATURES.md) - Advanced navigation features
- [Build Optimization](docs/guides/BUILD_OPTIMIZATION.md) - Build performance and bundle analysis

**Testing**:

- [RBAC Test Suite](docs/testing/RBAC_TEST_SUITE.md) - Comprehensive RBAC testing guide

## Documentation Standards

✅ **DO Document**: Current application state, technical design decisions, developer guides, API interfaces, common workflows

❌ **DON'T Document**: Refactoring summaries, development phases, changelogs (use git), migration guides (unless needed), temporary notes

**Where to Document**:

- Architecture & Design: `docs/architecture/`
- Developer Guides: `docs/guides/`
- Code Documentation: `src/*/README.md`
- Always update `docs/README.md` when adding new docs

## Naming Conventions

- Controllers: `*.controller.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Repositories: `prisma-*.repository.ts`
- Services: `*.service.ts`
- Interfaces: `*.interface.ts`

## Future Features

### AI Services Module

**Status**: Infrastructure ready, not currently bound in DI container

**What's Implemented**: `AIDebugTraceService`, `AIPromptManagerService`, `FileStorageService`, full interfaces, complete Prisma schema

**What's Missing**: AI services module commented out in [src/di/container.ts](src/di/container.ts), no active use cases, OpenAI integration references presentation-specific concepts

**When to Enable**: When you need AI content generation, structured prompt management with caching, or debug tracing

**How to Enable**:

1. Review and update AI service interfaces for your use case
2. Uncomment AI service bindings in [src/di/container.ts](src/di/container.ts)
3. Create use cases for prompt composition management
4. Update OpenAI integration code for your domain
5. Set `AI_DEBUG_MODE=true` in `.env.local` if needed

**See**: [src/infrastructure/services/ai/](src/infrastructure/services/ai/)

### Prompt Composition System

**Status**: Repository layer complete, no use cases

**What's Implemented**: Interfaces, Prisma implementations with full CRUD, database schema, entities with validation

**What's Missing**: No use cases orchestrating repository operations

**When to Implement**: If you need AI features requiring dynamic prompt composition, prompt management via UI/API, or AI services module is enabled

**How to Implement**:

1. Create use cases in `src/core/use-cases/prompt/`
2. Implement controllers in `src/interface-adapters/controllers/`
3. Build UI for prompt management
4. Integrate with AI services module
