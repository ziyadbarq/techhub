This file provides high-level guidance when working with this repository.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **Layer 1 (Foundation)**: 12 core entities including RBAC, organizational structure, locations, vendors, lifecycles, field definitions, and multi-currency support
- **Layer 2 (Asset/Inventory)**: 9 entities covering assets, categories, models, assignments, stock management, warranties, and maintenance
- **Layer 3 (Advanced ITAM)**: 8 modules (32 entities) - Asset Disposals, Asset Kits, Asset Reservations, CMDB, Contract Management, License Management, Governance, Attachments

**See**: [ITAM_FEATURES.md](docs/features/ITAM_FEATURES.md) for complete feature overview

## Quick Commands

```bash
npm run setup    # One-command setup (install + schema + seed)
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

npm run build       # Production build
npm run build:fast  # Fast build (skips TypeScript)

npm run reset # Reset database + seed (drops all data!)

# Ad-hoc Prisma scripts (with env + correct client import)
npx dotenv -e .env.local -- npx tsx -e "import { prisma } from './src/infrastructure/database/prisma/client.ts'; (async()=>{ /* your queries */ await prisma.$disconnect();})();"
```

## Documentation

### Start Here (Critical Reading)

- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide, adding features, troubleshooting
- **[PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)** - Critical: Connection pool, imports, type-safe patterns
- **[NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)** - Critical: Async APIs, rendering, breaking changes
- **[STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)** - Breaking changes reference (Prisma 7, Next 16, Zod 4, etc.)

### Architecture & Design

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation, layer diagrams, data flow
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system

### Feature Documentation

- [ITAM_FEATURES.md](docs/features/ITAM_FEATURES.md) - Complete guide to all advanced ITAM modules
- [RBAC_ADMIN_GUIDE.md](docs/features/RBAC_ADMIN_GUIDE.md) - RBAC administration features
- [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md) - Multi-currency support implementation
- See [docs/README.md](docs/README.md) for complete documentation index

### Future Enhancements

- [Roadmap Index](roadmap/README.md) - Planned features and enhancements

## Architecture Overview

5-layer Clean Architecture:

**Presentation** → **Interface Adapters** (Controllers, DTOs, Presenters) → **Use Cases** → **Domain** (Entities, business rules) ← **Infrastructure** (Repositories, external services)

**See**: [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for complete diagrams and [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) for step-by-step feature implementation.

## Critical Patterns (AI Must Know)

### Prisma Usage

- **ALWAYS** import from `@/generated/prisma` (NOT `@prisma/client`)
- **ALWAYS** use singleton from `@/infrastructure/database/prisma/client` (NOT new instances)
- **See**: [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)

### Next.js 16 Async APIs

- **ALWAYS** await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- Server components: `const params = await props.params;`
- Client components: `const params = useParams();` (no await - use hooks)
- **Set `dynamic = "force-dynamic"`** for pages using auth/session
- **See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)

### Next.js 16 Proxy Convention

- **IMPORTANT**: Next.js 16 uses `proxy.ts` at project root (NOT `middleware.ts`)
- Export function named `proxy()` (NOT `middleware()`)
- **See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) section "Proxy Convention"

### Type Safety

- **ALWAYS** use `import type` for type-only imports (ESLint enforces this)

### TanStack Table & React Compiler

- **IMPORTANT**: TanStack Table v8 is incompatible with React Compiler
- **ALWAYS** add `"use no memo";` directive to table components using `useReactTable()`
- Pattern:
  ```typescript
  "use client";
  "use no memo";
  import { useReactTable } from "@tanstack/react-table";
  ```
- **See**: [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md#5-tanstack-table-v8-incompatibility)

### Permissions & RBAC

- **ALWAYS** check permissions at server action layer: `await requirePermission(PERMISSIONS.ENTITY_VIEW);`
- 159+ permissions organized into 10 logical groups
- Navigation automatically filtered based on user permissions
- **See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) and [RBAC_ADMIN_GUIDE.md](docs/features/RBAC_ADMIN_GUIDE.md)

### Logging

- **NEVER** use `console.log` - use DI logger: `@inject(DI_TOKENS.ILoggerService) private logger: ILoggerService`
- **See**: [LOGGING.md](docs/guides/LOGGING.md)

### Database Seeding

- All test data in `seed-config.ts` (single source of truth)
- Type-safe factories in `seed-factories.ts`
- **IMPORTANT**: Cleanup only in `seed.ts` main orchestrator (proper dependency order)
- **See**: [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md)

### Barrel Exports

- **CRITICAL**: Create `index.ts` in use case modules to export all use cases
- Pre-commit type-checking **fails** without barrel exports
- **See**: [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature"

### Multi-Currency Support

- **SAR as Base**: All financial aggregations use SAR (Saudi Riyal)
- **Dual Currency Display**: Show original + SAR equivalent: `$100.00 (ر.س 375.00)`
- Use `<CurrencyDisplay>` component and `formatCurrency()` utilities
- 15 supported currencies, exchange rates managed at `/fx-rates`
- **See**: [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md)

## Development Workflow

1. **Understand the slice** - Trace Presentation → Controllers → Use Cases → Repositories
2. **Use DI container** - Resolve via `getContainer()`/`resolve()`, never `new`
3. **Check permissions** - Use `requirePermission()` in server actions
4. **Validate early** - DTOs (Zod) at boundaries, entities for business rules
5. **Use structured logging** - Inject `ILoggerService`, never `console.log`
6. **Before committing** - Run `npm run validate` (type-check + lint + test)

## Critical Checklist

### ✅ DO

- Import Prisma from `@/generated/prisma`
- Use Prisma singleton from `client.ts`
- Await async request APIs (`params`, `cookies()`, etc.)
- Use `import type` for type-only imports
- Check permissions in server actions
- Create barrel exports (`index.ts`) for new use case modules
- Use DI logger (not `console.log`)
- Validate at boundaries
- Follow Clean Architecture layers
- Configure MDX plugins in components (runtime), not next.config.ts (build-time)
- Add new seed data to `seed-config.ts` (centralized configuration)
- Use seed factories for complex entity creation
- Only perform cleanup in `seed.ts` orchestrator

### ❌ DON'T

- Import from `@prisma/client` (causes TypeScript errors)
- Create new `Pool()` or `PrismaClient()` instances (exhausts connections)
- Access `params`/`searchParams` synchronously (runtime errors in Next.js 16)
- Create `middleware.ts` (use existing `proxy.ts` instead - Next.js 16 convention)
- Use `withMDX` wrapper in next.config.ts (breaks Turbopack serialization)
- Skip permission checks
- Forget barrel exports for use case modules (breaks pre-commit)
- Use `console.log` in server code
- Bypass architecture layers
- Use Docker (macOS native only)
- Hardcode seed data in seeder files (use `seed-config.ts`)
- Perform cleanup in individual seeders (only in `seed.ts`)
- Duplicate logic across seeders (use utilities and factories)

## Environment

**Platform**: macOS only (PostgreSQL and Redis run natively via Homebrew)
**Docker**: NOT used in this project

**Environment Variables**: Copy `.env.example` to `.env.local`

- Required: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`
- Optional: `PRISMA_VERBOSE_LOGS=true`, `AUTH_DEBUG_LOGS=true`, `LOG_LEVEL=debug`

## Naming Conventions

- Controllers: `*.controller.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Repositories: `prisma-*.repository.ts`
- Interfaces: `*.interface.ts`
- Seeders: `seed-*.ts` (in `src/infrastructure/database/prisma/`)
- MDX Content: `*.mdx` (in `src/content/docs/`)
- MDX Components: `*.tsx` (in `src/components/mdx/`)

**See**: [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) for database naming conventions.
