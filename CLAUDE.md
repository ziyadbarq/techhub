# CLAUDE.md

This file provides high-level guidance to Claude Code when working with this repository.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **Layer 1 (Foundation)**: 11 core entities - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions
- **Layer 2 (Asset/Inventory)**: 9 entities - Asset, AssetCategory, AssetModel, AssetAssignment, StockLocation, StockMovement, Warranty, MaintenanceSchedule, MaintenanceRecord
- **Layer 3 (Advanced ITAM)**: 4 modules, 12 entities
  - **Asset Disposals**: AssetDisposal, DisposalApproval, DisposalDocument (3 entities, 11 use cases)
  - **Asset Kits**: AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem (4 entities, 19 use cases)
  - **Asset Reservations**: AssetReservation, AssetReservationConflict (2 entities, 17 use cases)
  - **CMDB**: ConfigurationItem, CIRelationship, RelationshipType (3 entities, 15 use cases)
- **Reference**: Task entity (complete implementation, hidden from UI)
- **Marketing**: Public landing page showcasing system capabilities

## Quick Commands

```bash
npm run setup    # One-command setup (install + schema + seed)
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

npm run build       # Production build
npm run build:fast  # Fast build (skips TypeScript)

npm run reset # Reset database + seed (drops all data!)
```

## Documentation

### Essential Reading (Start Here)

- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide, adding features, troubleshooting
- **[PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)** - Critical: Connection pool, imports, type-safe patterns
- **[NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)** - Critical: Async APIs, rendering, breaking changes
- **[STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)** - Breaking changes reference (Prisma 7, Next 16, Zod 4, etc.)

### Architecture & Design

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation, layer diagrams
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [LAYER_1_IMPLEMENTATION.md](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Foundation Layer technical details

### Development Guides

- [ENTITY_REFERENCE.md](docs/guides/ENTITY_REFERENCE.md) - Entity quick reference, validation standards
- [FOUNDATION_LAYER.md](docs/guides/FOUNDATION_LAYER.md) - Foundation entities user guide
- [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [DATABASE_MIGRATIONS.md](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow
- [LOGGING.md](docs/guides/LOGGING.md) - Structured logging with Pino
- [BUILD_OPTIMIZATION.md](docs/guides/BUILD_OPTIMIZATION.md) - Turbopack, bundle analysis

### Asset Layer (Layer 2)

- [WARRANTY_SYSTEM.md](docs/WARRANTY_SYSTEM.md) - Complete warranty management implementation (reference for Asset layer features)
- [MAINTENANCE_SYSTEM.md](docs/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules and records with workflow state management

### Advanced ITAM Layer (Layer 3)

- [ITAM_FEATURES.md](docs/ITAM_FEATURES.md) - Complete guide to all 4 advanced ITAM modules
- [ASSET_DISPOSALS.md](docs/ASSET_DISPOSALS.md) - Multi-step disposal workflow with approval chain and certificate generation
- [ASSET_KITS.md](docs/ASSET_KITS.md) - Predefined asset bundles with checkout tracking and partial returns
- [ASSET_RESERVATIONS.md](docs/ASSET_RESERVATIONS.md) - Future asset reservations with conflict detection and calendar view
- [CMDB_GUIDE.md](docs/CMDB_GUIDE.md) - Configuration Management Database with dependency tracking

### In-App Documentation (MDX)

- Built-in documentation system at `/docs` for end-users
- MDX files in `src/content/docs/` with custom components (Card, Callout, CodeBlock)
- **IMPORTANT**: MDX plugins configured in component (NOT `next.config.ts`) for Turbopack compatibility

### All Documentation

See [docs/README.md](docs/README.md) for complete documentation index.

## Critical Patterns (AI Must Know)

### Prisma Usage

- **ALWAYS** import from `@/generated/prisma` (NOT `@prisma/client`)
- **ALWAYS** use singleton from `@/infrastructure/database/prisma/client` (NOT new instances)
- **See**: [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md) for complete patterns

### Next.js 16 Async APIs

- **ALWAYS** await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- Server components: `const params = await props.params;`
- Client components: `const params = useParams();` (no await - use hooks)
- **Set `dynamic = "force-dynamic"`** for pages using auth/session
- **See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) for migration guide

### Next.js 16 Proxy Convention

- **IMPORTANT**: Next.js 16 uses `proxy.ts` (NOT `middleware.ts`)
- File location: `proxy.ts` at **project root** (NOT in src/)
- Export function named `proxy()` (NOT `middleware()`)
- Existing proxy handles auth redirect + landing page routing
- **See**: [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md) section "Proxy Convention"

### Type Safety

- **ALWAYS** use `import type` for type-only imports (ESLint enforces this)

### Permissions

- **ALWAYS** check permissions at server action layer: `await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);`
- **Feature-Specific Permissions**: Each Layer 3 feature has its own permission set:
  - `ASSET_DISPOSALS_*` (VIEW, CREATE, UPDATE, DELETE, APPROVE, REJECT, START, COMPLETE, CANCEL, MANAGE)
  - `ASSET_KITS_*` (VIEW, CREATE, UPDATE, DELETE, CHECKOUT, RETURN, MANAGE)
  - `ASSET_RESERVATIONS_*` (VIEW, CREATE, UPDATE, DELETE, CANCEL, CONFIRM, MANAGE)
  - `CONFIGURATION_ITEMS_*`, `CI_RELATIONSHIPS_*`, `RELATIONSHIP_TYPES_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
- **Navigation**: Automatically filtered based on user permissions (see `navigation.ts`)
- **See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md)

### Logging

- **NEVER** use `console.log` - use DI logger: `@inject(DI_TOKENS.ILoggerService) private logger: ILoggerService`
- **See**: [LOGGING.md](docs/guides/LOGGING.md)

### Barrel Exports

- **CRITICAL**: Create `index.ts` in use case modules to export all use cases
- Pre-commit type-checking **fails** without barrel exports
- **All Layer 3 features have barrel exports**: `src/core/use-cases/{disposal,asset-kits,reservations,cmdb}/*/index.ts`
- **See**: [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature"

## Layer 3 ITAM Features (NEW)

**4 Advanced Modules** - Fully implemented with Clean Architecture patterns:

1. **Asset Disposals** (`/asset-disposals`)
   - Multi-step approval workflow (PENDING_APPROVAL → APPROVED → IN_PROGRESS → SANITIZED → COMPLETED)
   - Approval chain with multiple approvers
   - Data sanitization checklist
   - PDF certificate generation (ready for integration)
   - Route: `/asset-disposals`, Permission: `ASSET_DISPOSALS_VIEW`

2. **Asset Kits** (`/asset-kits`)
   - Predefined bundles (e.g., "New Hire Kit" = laptop + mouse + keyboard)
   - Kit builder with item quantity tracking
   - Checkout workflow with partial returns support
   - Individual item tracking (damaged, lost, returned)
   - Routes: `/asset-kits`, Permission: `ASSET_KITS_VIEW`

3. **Asset Reservations** (`/asset-reservations`)
   - Future date reservations with start/end time
   - Conflict detection (prevents double-booking)
   - Availability checker
   - Calendar view (ready for `react-big-calendar` integration)
   - Background jobs ready (activation, reminders, overdue checks)
   - Route: `/asset-reservations`, Permission: `ASSET_RESERVATIONS_VIEW`

4. **CMDB** (`/configuration-items`, `/ci-relationships`, `/relationship-types`)
   - Configuration Items with CI classes and lifecycle tracking
   - Relationship Types (DEPENDS_ON, RUNS_ON, etc.) with bidirectional support
   - CI Relationships with validity periods and active/inactive state
   - Dependency graph foundation (ready for visualization)
   - Impact analysis support (isImpacting flag)
   - Routes: `/configuration-items`, `/ci-relationships`, `/relationship-types`
   - Permissions: `CONFIGURATION_ITEMS_VIEW`, `CI_RELATIONSHIPS_VIEW`, `RELATIONSHIP_TYPES_VIEW`

**Database**: 9 new tables across 4 migrations (see `prisma/migrations/20251121*`)

**DI Modules**: All registered in `src/di/container.ts`:

- `loadDisposalModule()` - Line 112
- `loadAssetKitsModule()` - Line 115
- `loadReservationsModule()` - Line 118
- `bindCMDBDependencies()` - Line 103

**Navigation**: New "CMDB" group added, Asset features updated with granular permissions

**Known Issues**:

- TypeScript errors in 3 form components (CI Relationship, Configuration Item, Relationship Type forms) due to create/update schema differences
- Forms are functional but need type refinement
- Workaround: Use `npm run build:fast` to skip type-check

## Architecture Overview

5-layer Clean Architecture: **Presentation** → **Interface Adapters** (Controllers, DTOs, Presenters) → **Use Cases** → **Domain** (Entities, business rules) ← **Infrastructure** (Repositories, external services)

**See**: [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for complete diagrams, data flow, and [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature" for step-by-step implementation guide.

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
- MDX Content: `*.mdx` (in `src/content/docs/`)
- MDX Components: `*.tsx` (in `src/components/mdx/`)

**See**: [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) for database naming conventions.
