This file provides high-level guidance when working with this repository.

## IMPORTANT: Maintaining This File

**CLAUDE.md is a lean orchestrator, NOT a reference manual.** When updating this file, strictly adhere to these principles:

1. **Lean & Focused**: Keep content high-level with references to detailed docs - target ~250 lines maximum
2. **Better Organization**: Group related patterns by category (Framework, Security, Architecture, Feature-Specific)
3. **No Redundancy**: Each piece of information appears ONCE with references to detailed documentation
4. **No Outdated Info**: NEVER add progress tracking, completion dates, metrics, status indicators (✅, ⏳, 🚧), or percentage improvements
5. **Easy Navigation**: Maintain clear hierarchy with proper cross-references to detailed docs
6. **Maintainable**: Changes to detailed docs should NOT require CLAUDE.md updates

**What to do when adding new features**:
- Add 1-2 line summary with reference to detailed doc
- Do NOT add code examples, implementation details, or step-by-step guides
- Do NOT add "Status:", "Impact:", "Phase X (COMPLETED)", or similar tracking

**What belongs in CLAUDE.md**:
- Essential patterns and critical rules
- Quick command reference
- Links to detailed documentation
- Architecture overview (high-level only)

**What belongs in separate docs**:
- Code examples and implementation details
- Feature descriptions and workflows
- Progress tracking and metrics
- Historical information and changelogs

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **System Setup**: Status page (`/setup`) for system health monitoring and admin dashboard (`/admin/system-setup`) for database operations; first admin is created via the `/register` UI and promoted to system-administrator via Prisma Studio/SQL (see docs/features/SYSTEM_SETUP.md)
- **Layer 1 (Foundation)**: 12 core entities - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions, **ExchangeRate** (multi-currency support)
- **Layer 2 (Asset/Inventory)**: 9 entities - Asset, AssetCategory, AssetModel, AssetAssignment, StockLocation, StockMovement, Warranty, MaintenanceSchedule, MaintenanceRecord
- **Layer 3 (Advanced ITAM & Extensions)**: 9 modules (~33 entities)
  - **Asset Disposals**: AssetDisposal, DisposalApproval, DisposalDocument (3 entities, 11 use cases)
  - **Asset Kits**: AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem (4 entities, 19 use cases)
  - **Asset Reservations**: AssetReservation, AssetReservationConflict (2 entities, 17 use cases)
  - **CMDB**: ConfigurationItem, CIRelationship, RelationshipType, CIClass, CIClassField, RelationshipTypeScope (6 entities, 28 use cases)
  - **Contract Management**: ContractType, Contract, ContractLinkedObject (3 entities, 17 use cases)
  - **License Management**: LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation, LicenseAddon, LicenseEntitlementAddon (6 entities, 33 use cases) - includes cost tracking with multi-currency support
  - **Governance**: DataDomain, DataOwnership, VerificationCampaign, VerificationItem (4 entities, 24 use cases)
  - **Attachments**: AttachmentType, Attachment (2 entities, 11 use cases)
  - **Service Management**: Service, ServiceOwnership, BusinessProcess, ServiceInfrastructure, ServiceAsset (5 entities, 25 use cases)
- **Reference**: Task entity (complete implementation, hidden from UI)
- **Marketing**: Public landing page showcasing system capabilities

## Quick Commands

```bash
# Initial Setup
npm run db:seed      # Seed database (RBAC + Foundation + test data)
# Create first admin via /register, then assign system-administrator role via Prisma Studio or SQL

# Development
npm run dev      # Start dev server with Turbopack
npm run validate # Type-check + lint + test

# Build & Deploy
npm run build         # Production build (type-check + lint + build)
npm run build:fast    # Fast build (skips TypeScript)
npm run start         # Start server only (requires existing build)
npm run deploy        # Full deployment: build → migrate → seed (if empty) → cache clear → PM2 start
npm run deploy:full   # Full deployment with npm install and force rebuild

# Database
npm run db:reset # Reset database + seed (drops all data!)

# Admin Tools
npm run roles:manage            # Interactive user role manager
npm run roles:manage -- --dry-run  # Preview role changes without applying
npm run roles:manage -- --help     # Show role manager help

# Ad-hoc Prisma scripts (with env + correct client import)
npx dotenv -e .env.local -- npx tsx -e "import { prisma } from './src/infrastructure/database/prisma/client.ts'; (async()=>{ /* your queries */ await prisma.$disconnect();})();"
```

## Documentation

### Essential Reading (Start Here)

- **[DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md)** - Complete development guide, adding features, troubleshooting
- **[PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)** - Critical: Connection pool, imports, type-safe patterns
- **[NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)** - Critical: Async APIs, rendering, breaking changes
- **[STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)** - Breaking changes reference (Prisma 7, Next 16, Zod 4, etc.)
- **[DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md)** - Comprehensive seed system guide: architecture, factories, configuration

### Complete Documentation Index

For organized documentation by category, see **[docs/README.md](docs/README.md)**:
- Architecture & Design (4 docs)
- Development Guides (15+ docs)
- Layer 2 & 3 Features (15+ docs)
- Infrastructure & Systems (12+ docs)
- In-App Documentation (MDX)
- Roadmap & Future Features

## Critical Patterns (AI Must Know)

### Framework Patterns (ALWAYS Follow)

**Prisma**:
- Default `@/generated/prisma` is browser-safe (types + enums), use anywhere
- Server code needing `PrismaClient`: `import from "@/generated/prisma/server"`
- Client components: `import from "@/generated/prisma"` or `@/generated/prisma/enums`
- Use singleton from `@/infrastructure/database/prisma/client` (NOT new instances)
- NEVER import from `@prisma/client` (ESLint enforced)
- See [PRISMA_GUIDE.md](docs/guides/PRISMA_GUIDE.md)

**Next.js 16 Async APIs**:
- ALWAYS await: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- Server: `const params = await props.params;` | Client: `useParams()` (no await)
- Set `dynamic = "force-dynamic"` for pages using auth/session
- Use `proxy.ts` at project root (NOT `middleware.ts`)
- See [NEXTJS_16_GUIDE.md](docs/guides/NEXTJS_16_GUIDE.md)

**Type Safety & UI**:
- Use `import type` for type-only imports (ESLint enforced)
- Use Sonner toast: `toast.success("Message")` (NOT shadcn useToast)
- Add `"use no memo";` directive to TanStack Table components (React Compiler incompatibility)
- See [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md)

**Client-Side Session**:
- In dashboard: use `useSessionContext()` from `@/contexts/session-context` (NOT direct `useSession()`)
- Outside dashboard (marketing): use `authClient.getSession()` in useEffect
- Rate limiting: 2000 req/min for `/get-session`, auth endpoints more restrictive
- See [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "3b. Client-Side Session Access"

**Client-Side Permissions & Feature Flags**:
- Use `usePermissions()` hook - delegates to `PermissionsProvider` context (single API call)
- Use `useIsFeatureEnabled("FLAG")` hook - delegates to `FeatureFlagsProvider` context (single API call)
- Provider hierarchy: `SessionProvider` → `PermissionsProvider` → `FeatureFlagsProvider`
- See [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "3c. Client-Side Permissions"

### Security Patterns (ALWAYS Enforce)

**Route Protection** (CRITICAL):
- ALL protected routes MUST have server-side `requirePermission()` - client checks can be bypassed
- Pattern: Server component checks permissions → returns client component
- Add `export const dynamic = "force-dynamic"` to protected pages
- Defense in depth: (1) Server component, (2) Server actions, (3) Client hooks (UX only)

**Permission Checking**:
- Check permissions at server action layer: `await requirePermission(PERMISSIONS.ENTITY_VIEW);`
- Use `handlePermissionRedirect(error, "/route")` in try/catch for proper error handling
- 269 permissions organized into 14 groups (see `src/lib/rbac/permission-groups.ts`)
- See [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md)

**Feature Flags**:
- Check feature flag FIRST: `await requireFeature("MODULE")`
- Then permission check SECOND: `await requirePermission(PERMISSIONS.X_VIEW)`
- Client: `useIsFeatureEnabled("MODULE")`
- See [FEATURE_FLAGS.md](docs/features/FEATURE_FLAGS.md)

### Architecture Patterns (ALWAYS Follow)

**Logging**:
- NEVER use `console.log` - inject DI logger: `@inject(DI_TOKENS.ILoggerService)`
- See [LOGGING.md](docs/guides/LOGGING.md)

**Database Seeding**:
- Layered seeders (RBAC → Foundation → Assets → Layer 3)
- All config in `seed-config.ts`, factories in `seed-factories.ts`, utils in `seed-utils.ts`
- Cleanup only in `seed.ts` orchestrator (proper dependency order)
- Use `ioredis` package (NOT `redis`)
- See [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md)

**Barrel Exports**:
- CRITICAL: Create `index.ts` in use case modules (pre-commit fails without them)
- See [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature"

**Better Auth**:
- Use repository layer for user creation (NOT Better Auth API)
- Account type: All providers use `type: "oauth"` (intentional design)
- See [SYSTEM_SETUP.md](docs/features/SYSTEM_SETUP.md#refactoring-lessons-learned)

**Dependency Injection**:
- Resolve via `getContainer()`/`resolve()`, never use `new`
- Validate at boundaries (DTOs with Zod)

### Feature-Specific Patterns

**Multi-Currency**:
- SAR as base currency for all aggregations
- Dual display: `$100.00 (ر.س 375.00)` using `<CurrencyDisplay>`
- Utilities: `formatCurrency()`, `formatSAR()`, `formatDualCurrency()`
- See [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md)

**Universal Data Importer**:
- Route: `/data-import` | Permission: `DATA_IMPORT_MANAGE`
- 7-step wizard with auto-mapping, fuzzy matching, sanitization
- **Universal Assets Importer**: Single-file import with prefixed columns (`vendor.name`, `asset.serial_number`, `custom.cpu_cores`)
  - Auto-creates: Vendor, Category, Model, Location, StockLocation, FieldDefinition
  - No auto-create: Person (must exist), LifecycleState (lookup only)
  - Module: `src/lib/data-import/universal-assets/`
- See [roadmap/UNIVERSAL_DATA_IMPORTER.md](roadmap/UNIVERSAL_DATA_IMPORTER.md) and [docs/features/UNIVERSAL_ASSETS_IMPORTER.md](docs/features/UNIVERSAL_ASSETS_IMPORTER.md)

**Custom Fields**:
- Dynamic fields attached to Asset Categories via FieldDefinition + AssetCategoryField
- Use `useCategoryFields(categoryId)` hook to fetch fields for a category
- Components: `CustomFieldsSection` (form), `CustomFieldsDisplay` (read-only), `CustomFieldInput` (14 data types)
- Asset.attributes JSON stores custom field values
- See [roadmap/CUSTOM_FIELDS_COMPLETION.md](roadmap/CUSTOM_FIELDS_COMPLETION.md)

**Entity Registry**:
- Centralized registry of 20 business entities supporting custom fields across 7 categories
- Use `getCustomFieldsEnabledEntities()` for entity list, `useEntityTypeOptions()` hook for form selects
- See [docs/features/ENTITY_REGISTRY.md](docs/features/ENTITY_REGISTRY.md)

**Refactoring**:
- When files exceed 300-500 lines: Extract hooks, create sub-components, use builders
- See [REFACTORING_PATTERNS.md](docs/guides/REFACTORING_PATTERNS.md)

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
- Use Sonner toast: `import { toast } from "sonner";`
- **ALWAYS** add server-side permission checks to protected routes (`await requirePermission()` in page.tsx)
- Add `export const dynamic = "force-dynamic"` to all protected pages
- Check permissions in server actions (defense in depth)
- Extract client logic to `*-page-client.tsx` when page needs server-side checks
- Register new routes in `protected-routes.ts` configuration
- Test new protected routes with viewer account to verify access denial
- Create barrel exports (`index.ts`) for new use case modules
- Use DI logger (not `console.log`)
- Validate at boundaries
- Follow Clean Architecture layers
- Configure MDX plugins in components (runtime), not next.config.ts (build-time)
- Add new seed data to `seed-config.ts` (centralized configuration)
- Use seed factories for complex entity creation
- Only perform cleanup in `seed.ts` orchestrator

### ❌ DON'T

- **NEVER** start the dev server (`npm run dev`) or kill a running dev server (user manages this)
- Import from `@prisma/client` (causes TypeScript errors)
- **NEVER** use `npx prisma generate` directly (use `npm run db:generate` - creates browser-safe entry points)
- Create new `Pool()` or `PrismaClient()` instances (exhausts connections)
- Access `params`/`searchParams` synchronously (runtime errors in Next.js 16)
- Use shadcn useToast hook (use Sonner toast instead)
- Create `middleware.ts` (use existing `proxy.ts` instead - Next.js 16 convention)
- Use `withMDX` wrapper in next.config.ts (breaks Turbopack serialization)
- **NEVER** rely solely on client-side permission checks (`usePermissions()`, `PermissionGuard` alone)
- **NEVER** create protected routes without server-side `requirePermission()` checks
- Skip permission checks in server actions
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
