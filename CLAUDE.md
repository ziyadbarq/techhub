This file provides high-level guidance when working with this repository.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **Layer 1 (Foundation)**: 12 core entities - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions, **ExchangeRate** (multi-currency support)
- **Layer 2 (Asset/Inventory)**: 9 entities - Asset, AssetCategory, AssetModel, AssetAssignment, StockLocation, StockMovement, Warranty, MaintenanceSchedule, MaintenanceRecord
- **Layer 3 (Advanced ITAM)**: 8 modules, 32 entities
  - **Asset Disposals**: AssetDisposal, DisposalApproval, DisposalDocument (3 entities, 11 use cases)
  - **Asset Kits**: AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem (4 entities, 19 use cases)
  - **Asset Reservations**: AssetReservation, AssetReservationConflict (2 entities, 17 use cases)
  - **CMDB**: ConfigurationItem, CIRelationship, RelationshipType, CIClass, CIClassField, RelationshipTypeScope (6 entities, 28 use cases)
  - **Contract Management**: ContractType, Contract, ContractLinkedObject (3 entities, 17 use cases)
  - **License Management**: LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation (4 entities, 23 use cases)
  - **Governance**: DataDomain, DataOwnership, VerificationCampaign, VerificationItem (4 entities, 24 use cases)
  - **Attachments**: AttachmentType, Attachment (2 entities, 11 use cases)
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

### Architecture & Design

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation, layer diagrams
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [LAYER_1_IMPLEMENTATION.md](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Foundation Layer technical details

### Development Guides

- [ENTITY_REFERENCE.md](docs/guides/ENTITY_REFERENCE.md) - Entity quick reference, validation standards
- [CODE_GENERATION.md](docs/guides/CODE_GENERATION.md) - Auto-generation of codes/tags for entities with manual override
- [FOUNDATION_LAYER.md](docs/guides/FOUNDATION_LAYER.md) - Foundation entities user guide
- [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) - Implementing permissions
- [DATABASE_MIGRATIONS.md](docs/guides/DATABASE_MIGRATIONS.md) - Prisma migrations workflow
- [LOGGING.md](docs/guides/LOGGING.md) - Structured logging with Pino
- [BUILD_OPTIMIZATION.md](docs/guides/BUILD_OPTIMIZATION.md) - Turbopack, bundle analysis
- [UI_UX_IMPROVEMENTS.md](docs/guides/UI_UX_IMPROVEMENTS.md) - UI/UX enhancements and navigation improvements
- [GLOBAL_SEARCH.md](docs/features/GLOBAL_SEARCH.md) - Command palette global search with keyboard shortcuts (⌘K)

### Asset Layer (Layer 2)

- [WARRANTY_SYSTEM.md](docs/features/WARRANTY_SYSTEM.md) - Complete warranty management implementation (reference for Asset layer features)
- [MAINTENANCE_SYSTEM.md](docs/features/MAINTENANCE_SYSTEM.md) - Preventive maintenance schedules and records with workflow state management
- [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md) - Multi-currency support with SAR base, dual display, and exchange rate management

### Advanced ITAM Layer (Layer 3)

- [ITAM_FEATURES.md](docs/features/ITAM_FEATURES.md) - Complete guide to all 4 advanced ITAM modules
- [ASSET_DISPOSALS.md](docs/features/ASSET_DISPOSALS.md) - Multi-step disposal workflow with approval chain and certificate generation
- [ASSET_KITS.md](docs/features/ASSET_KITS.md) - Predefined asset bundles with checkout tracking and partial returns
- [ASSET_RESERVATIONS.md](docs/features/ASSET_RESERVATIONS.md) - Future asset reservations with conflict detection and calendar view
- [CMDB_GUIDE.md](docs/features/CMDB_GUIDE.md) - Configuration Management Database with dependency tracking
- [GOVERNANCE_SYSTEM.md](docs/features/GOVERNANCE_SYSTEM.md) - Data governance, ownership tracking, and verification campaigns for SAMA compliance
- [ATTACHMENTS_SYSTEM.md](docs/features/ATTACHMENTS_SYSTEM.md) - Polymorphic file attachments for compliance documentation and audit trails

### In-App Documentation (MDX)

- Built-in documentation system at `/docs` for end-users
- MDX files in `src/content/docs/` with custom components (Card, Callout, CodeBlock)
- **IMPORTANT**: MDX plugins configured in component (NOT `next.config.ts`) for Turbopack compatibility

### Roadmap (Future Features)

- [Roadmap Index](roadmap/README.md) - Complete list of planned features by layer
- **RBAC Enhancements**:
  - [RBAC_ENHANCEMENT_PHASE_1.md](roadmap/RBAC_ENHANCEMENT_PHASE_1.md) - **COMPLETED** - Navigation fixes, permission grouping, enhanced UI, clone role
  - [RBAC_ENHANCEMENT_PHASE_2.md](roadmap/RBAC_ENHANCEMENT_PHASE_2.md) - **PLANNED** - Audit log UI, bulk operations, analytics, expiration, dependencies, conflicts, hierarchy
- **Layer 2 (Foundation)**: **COMPLETED** - Multi-Currency Support (15 currencies, SAR base, dual display, FX rate management at `/fx-rates`)
- **Layer 2 (Future)**: Service Management, Security Patch Workflow
- **Layer 3**: Schema-API Alignment completion

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

### TanStack Table & React Compiler

- **IMPORTANT**: TanStack Table v8 is incompatible with React Compiler
- **ALWAYS** add `"use no memo";` directive to table components using `useReactTable()`
- Pattern:

  ```typescript
  "use client";
  "use no memo";

  import { useReactTable } from "@tanstack/react-table";
  ```

- **Affected Components**: 9 table components (see [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md#5-tanstack-table-v8-incompatibility))
- **Why**: Prevents React Compiler warnings and ensures tables render correctly
- **Temporary**: Will be removed when upgrading to TanStack Table v9 (Q2-Q3 2025)
- **See**: [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md) section "TanStack Table v8 Incompatibility"

### Permissions

- **ALWAYS** check permissions at server action layer: `await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);`
- **Permission Organization**: 159+ permissions organized into 10 logical groups (see `src/lib/rbac/permission-groups.ts`)
  - System & Administration, Foundation Layer, Asset Management, Maintenance, Inventory
  - Asset Operations, CMDB, Contract Management, License Management, Development & Testing
  - **Exchange Rates**: `FX_RATES_VIEW`, `FX_RATES_CREATE`, `FX_RATES_UPDATE`, `FX_RATES_DELETE`, `FX_RATES_MANAGE`, `FX_RATES_CONVERT`
- **Feature-Specific Permissions**: Each Layer 3 feature has its own permission set:
  - `ASSET_DISPOSALS_*` (VIEW, CREATE, UPDATE, DELETE, APPROVE, REJECT, START, COMPLETE, CANCEL, MANAGE)
  - `ASSET_KITS_*` (VIEW, CREATE, UPDATE, DELETE, CHECKOUT, RETURN, MANAGE)
  - `ASSET_RESERVATIONS_*` (VIEW, CREATE, UPDATE, DELETE, CANCEL, CONFIRM, MANAGE)
  - `CONFIGURATION_ITEMS_*`, `CI_RELATIONSHIPS_*`, `RELATIONSHIP_TYPES_*`, `CI_CLASSES_*`, `CI_CLASS_FIELDS_*`, `RELATIONSHIP_TYPE_SCOPES_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `CONTRACT_TYPES_*`, `CONTRACTS_*`, `CONTRACT_LINKED_OBJECTS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `LICENSE_PRODUCTS_*`, `LICENSE_PRODUCT_FIELDS_*`, `LICENSE_ENTITLEMENTS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `LICENSE_ALLOCATIONS_*` (VIEW, CREATE, UPDATE, DELETE, DEALLOCATE, REACTIVATE, MANAGE)
- **Navigation**: Automatically filtered based on user permissions (see `navigation.ts`)
- **Role Management**: Clone roles with one click at `/admin/roles` (automatic permission copying)
- **Permission Assignment**: Enhanced UI with search, collapsible groups, "Select All in Group" at `/admin/roles/[name]/permissions`
- **See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) and [roadmap/RBAC_ENHANCEMENT_PHASE_1.md](roadmap/RBAC_ENHANCEMENT_PHASE_1.md)

### Logging

- **NEVER** use `console.log` - use DI logger: `@inject(DI_TOKENS.ILoggerService) private logger: ILoggerService`
- **See**: [LOGGING.md](docs/guides/LOGGING.md)

### Database Seeding

- **Architecture**: Layered seeders (RBAC → Foundation → Assets → Layer 3), centralized cleanup
- **Configuration**: All test data in `seed-config.ts` (single source of truth)
- **Factories**: Type-safe builders in `seed-factories.ts` (WarrantyFactory, MaintenanceScheduleFactory, etc.)
- **Utilities**: Shared helpers in `seed-utils.ts` (date utils, code generation, Prisma relation helpers)
- **IMPORTANT**: Cleanup only in `seed.ts` main orchestrator (proper dependency order)
- **See**: [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md) for complete guide

### Barrel Exports

- **CRITICAL**: Create `index.ts` in use case modules to export all use cases
- Pre-commit type-checking **fails** without barrel exports
- **All Layer 3 features have barrel exports**: `src/core/use-cases/{disposal,asset-kits,reservations,cmdb,contract,license-*,governance,attachments}/*/index.ts`
- **See**: [DEVELOPER_GUIDE.md](docs/guides/DEVELOPER_GUIDE.md) section "Adding a New Feature"

### Multi-Currency Support

- **SAR as Base**: All financial aggregations use SAR (Saudi Riyal) as the base currency
- **Dual Currency Display**: Show original amount with SAR equivalent: `$100.00 (ر.س 375.00)`
- **Currency Component**: Use `<CurrencyDisplay>` from `@/components/ui/currency-display` for consistent formatting
- **Currency Utilities**: Use `formatCurrency()`, `formatSAR()`, `formatDualCurrency()` from `@/lib/utils`
- **Supported Currencies**: 15 currencies configured in `src/lib/currencies.config.ts` (SAR, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, AED, KWD, BHD, OMR, QAR)
- **Exchange Rates**: Managed at `/fx-rates` route, stored as "to SAR" rates (e.g., 1 USD = 3.75 SAR)
- **Currency Fields**: All entities with monetary values include `currency` field (defaults to "SAR")
- **Currency Forms**: Use Select dropdown with `SUPPORTED_CURRENCIES`, not text input
- **Aggregation**: Always convert to SAR before summing (dashboard, reports)
- **Permissions**: `FX_RATES_VIEW`, `FX_RATES_CREATE`, `FX_RATES_UPDATE`, `FX_RATES_DELETE`, `FX_RATES_MANAGE`, `FX_RATES_CONVERT`
- **See**: [MULTI_CURRENCY_GUIDE.md](docs/features/MULTI_CURRENCY_GUIDE.md) for complete implementation guide

## Layer 3 ITAM Features

**8 Advanced Modules** - Fully implemented with Clean Architecture patterns:

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

5. **Contract Management** (`/contract-types`, `/contracts`)
   - Contract Types with customizable fields
   - Contracts with vendor linkage and lifecycle dates
   - Polymorphic linking to Assets, CIs, License Products
   - Financial tracking with renewal dates
   - Permissions: `CONTRACT_TYPES_VIEW`, `CONTRACTS_VIEW`, `CONTRACT_LINKED_OBJECTS_VIEW`

6. **License Management** (`/license-products`, `/license-entitlements`, `/license-allocations`)
   - License Products with metric types (per_device, per_user, per_core, per_vm, per_cluster)
   - Entitlements with purchased quantities and date ranges
   - Polymorphic allocations to Persons, CIs, or Assets
   - Available quantity tracking (purchased - allocated)
   - Soft deactivation (deallocate/reactivate) support
   - Permissions: `LICENSE_PRODUCTS_VIEW`, `LICENSE_ENTITLEMENTS_VIEW`, `LICENSE_ALLOCATIONS_VIEW`

7. **Governance** (`/data-domains`, `/data-ownerships`, `/verification-campaigns`)
   - Data Domains for data classification (PII, Financial Data, etc.)
   - Data Ownerships with polymorphic mapping (CIClass OR AssetCategory, Person OR OrgUnit)
   - Verification Campaigns for scheduled compliance audits
   - Verification Items with status tracking (PENDING → IN_PROGRESS → VERIFIED/EXCEPTION)
   - SAMA compliance support with audit trails
   - Permissions: `DATA_DOMAINS_VIEW`, `DATA_OWNERSHIPS_VIEW`, `VERIFICATION_CAMPAIGNS_VIEW`, `VERIFICATION_ITEMS_VIEW`

8. **Attachments** (`/attachment-types`, `/attachments`)
   - Attachment Types with file validation rules (extensions, size limits)
   - Polymorphic attachments to any entity (23 target types: Asset, CI, Contract, Warranty, Disposal, etc.)
   - File metadata tracking (fileName, mimeType, sizeBytes, storagePath)
   - Business methods for file operations (isImage, isPDF, getFormattedFileSize)
   - Ready for compliance documentation, invoices, certificates, audit reports
   - Permissions: `ATTACHMENT_TYPES_VIEW`, `ATTACHMENTS_VIEW`

**Database**: 23 new tables (CMDB: 6, Contracts: 3, Licenses: 4, Governance: 4, Attachments: 2, plus config entities: 4)

**DI Modules**: All registered in `src/di/container.ts`:

- `bindCMDBDependencies()` - CMDB entities
- `bindContractsDependencies()` - Contract management
- `bindLicensesDependencies()` - License management
- `bindGovernanceDependencies()` - Governance features (data domains, ownerships, verification)
- `bindAttachmentsDependencies()` - Attachment system
- `loadDisposalModule()` - Asset disposals
- `loadAssetKitsModule()` - Asset kits
- `loadReservationsModule()` - Asset reservations

**Navigation**: New "CMDB", "Contracts", "Licenses", "Governance", and "Attachments" groups added with permission-based filtering

## RBAC Admin Enhancements (Layer 1)

**Phase 1 (COMPLETED 2025-11-22)**:

- **Permission Grouping**: 153+ permissions organized into 10 logical categories (`src/lib/rbac/permission-groups.ts`)
- **Enhanced UI**: Search/filter, collapsible groups, "Select All in Group" at `/admin/roles/[name]/permissions`
- **Clone Role**: One-click role duplication with automatic permission copying
- **Navigation Fixes**: Fixed critical 404 bug (role/permission pages now use `name` instead of `id`)
- **Impact**: 100% navigation success, 93% reduction in permission assignment complexity, 90% time savings for role cloning

**Phase 2 (PARTIALLY COMPLETED 2025-11-22)**:

- ✅ **Permission Dependencies** (`src/lib/rbac/permission-dependencies.ts`):
  - 153+ permissions mapped with dependency rules (DELETE requires VIEW, MANAGE requires CRUD, etc.)
  - Validation with `validatePermissionDependencies()` function
  - UI warnings in PermissionsManager showing missing dependencies
  - Auto-fix button to add required permissions
  - Tooltips on individual permissions showing requirements

- ✅ **Role Conflict Detection** (`src/lib/rbac/role-conflicts.ts`):
  - Segregation of duties enforcement (auditor vs admin, finance vs procurement, etc.)
  - 3 severity levels: warning, error, critical
  - `detectRoleConflicts()` and `validateRoleAddition()` logic
  - RoleAssignment component shows conflicts with severity badges
  - Critical conflicts block assignment, warnings allow override
  - Existing conflicts highlighted in user role list

- ✅ **Bulk Operations - Permission Assignment**:
  - Bulk mode toggle in PermissionsManager
  - Multi-select permissions for bulk add/remove
  - Bulk actions bar with "Add Selected", "Remove Selected", "Clear" buttons
  - Visual feedback with highlighted selections
  - ~50% time savings for bulk permission operations

**Phase 2 Roadmap** (Remaining Features):

- **Phase 2 (IN PROGRESS)**: See [roadmap/RBAC_ENHANCEMENT_PHASE_2.md](roadmap/RBAC_ENHANCEMENT_PHASE_2.md)
  - Remaining: Enhanced audit log UI, bulk user role assignment, advanced user management, role analytics, time-based expiration background jobs, role hierarchy/inheritance

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
