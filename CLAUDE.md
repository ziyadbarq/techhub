This file provides high-level guidance when working with this repository.

## Project Overview

**About Barq**: [Barq](https://barq.com) is a financial services company in Saudi Arabia providing payment, transfer, and digital banking solutions. Governed by SAMA (Saudi Central Bank, formerly Saudi Arabia Monetary Agency).

**This Application**: In-house enterprise CMDB (Configuration Management Database) and IT Asset Management (ITAM) system built **by Barq for Barq employees**. Deployed **on-premises only** for internal Technology operations.

**Tech Stack**: Next.js 16 (Turbopack), React 19.2, TypeScript 5.9, Prisma 7 (PostgreSQL), InversifyJS 7, Zod 4, shadcn/ui

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

**Current Implementation**:

- **System Setup**: Status page (`/setup`) for system health monitoring and admin dashboard (`/admin/system-setup`) for database operations; first admin is created via the `/register` UI and promoted to system-administrator via Prisma Studio/SQL (see docs/features/SYSTEM_SETUP.md)
- **Layer 1 (Foundation)**: 12 core entities - OrganizationUnit, Person, Role, Location, Vendor, Lifecycle models, Field definitions, **ExchangeRate** (multi-currency support)
- **Layer 2 (Asset/Inventory)**: 9 entities - Asset, AssetCategory, AssetModel, AssetAssignment, StockLocation, StockMovement, Warranty, MaintenanceSchedule, MaintenanceRecord
- **Layer 3 (Advanced ITAM & Extensions)**: 9 modules (~31 entities)
  - **Asset Disposals**: AssetDisposal, DisposalApproval, DisposalDocument (3 entities, 11 use cases)
  - **Asset Kits**: AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem (4 entities, 19 use cases)
  - **Asset Reservations**: AssetReservation, AssetReservationConflict (2 entities, 17 use cases)
  - **CMDB**: ConfigurationItem, CIRelationship, RelationshipType, CIClass, CIClassField, RelationshipTypeScope (6 entities, 28 use cases)
  - **Contract Management**: ContractType, Contract, ContractLinkedObject (3 entities, 17 use cases)
  - **License Management**: LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation (4 entities, 23 use cases)
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

# Build
npm run build       # Production build
npm run build:fast  # Fast build (skips TypeScript)

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

### Architecture & Design

- [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - Clean Architecture implementation, layer diagrams
- [DATABASE_SCHEMA.md](docs/architecture/DATABASE_SCHEMA.md) - Schema design and naming conventions
- [RBAC_ARCHITECTURE.md](docs/architecture/RBAC_ARCHITECTURE.md) - Role-based access control system
- [LAYER_1_IMPLEMENTATION.md](docs/architecture/LAYER_1_IMPLEMENTATION.md) - Foundation Layer technical details

### Development Guides

- [SYSTEM_SETUP.md](docs/features/SYSTEM_SETUP.md) - First-time installation wizard and admin dashboard for system health monitoring
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

- [ITAM_FEATURES.md](docs/features/ITAM_FEATURES.md) - Overview of core advanced ITAM modules (disposals, kits, reservations, CMDB)
- [ASSET_DISPOSALS.md](docs/features/ASSET_DISPOSALS.md) - Multi-step disposal workflow with approval chain and certificate generation
- [ASSET_KITS.md](docs/features/ASSET_KITS.md) - Predefined asset bundles with checkout tracking and partial returns
- [ASSET_RESERVATIONS.md](docs/features/ASSET_RESERVATIONS.md) - Future asset reservations with conflict detection and calendar view
- [CMDB_GUIDE.md](docs/features/CMDB_GUIDE.md) - Configuration Management Database with dependency tracking
- [GOVERNANCE_SYSTEM.md](docs/features/GOVERNANCE_SYSTEM.md) - Data governance, ownership tracking, and verification campaigns for SAMA compliance
- [ATTACHMENTS_SYSTEM.md](docs/features/ATTACHMENTS_SYSTEM.md) - Polymorphic file attachments for compliance documentation and audit trails
- [SERVICE_MANAGEMENT.md](docs/features/SERVICE_MANAGEMENT.md) - IT service catalog with ownership, infrastructure, and business alignment (complete with user guide at `/docs/service-management`)

### In-App Documentation (MDX)

- Built-in documentation system at `/docs` for end-users
- MDX files in `src/content/docs/` with custom components (Card, Callout, CodeBlock)
- **IMPORTANT**: MDX plugins configured in component (NOT `next.config.ts`) for Turbopack compatibility

### Admin & Data Management

- **Universal Data Importer** (`/data-import`) - CSV/Excel import wizard for all entities
  - 7-step workflow: Entity selection → Settings → Upload → Field mapping → Validation → Import → Results
  - Smart features: Auto-mapping, fuzzy matching (Levenshtein distance), sanitization, duplicate handling
  - Batch processing with real-time progress tracking
  - Downloadable templates and error reports
  - **Status**: Core complete (functional for Assets and Persons), extensions pending
  - **See**: [roadmap/UNIVERSAL_DATA_IMPORTER.md](roadmap/UNIVERSAL_DATA_IMPORTER.md) for remaining work

### Roadmap (Future Features)

- [Roadmap Index](roadmap/README.md) - Complete list of planned features by layer
- **Universal Data Importer**: Core complete, 64 entity configurations + import history pending (see `roadmap/UNIVERSAL_DATA_IMPORTER.md`)
- **RBAC Phase 2 (Partially Complete)**: Permission dependencies, role conflict detection, and bulk permission assignment shipped; remaining work (advanced user management, role analytics, role hierarchy/expiration, enhanced audit UI, bulk user role assignment) tracked in `roadmap/RBAC_PHASE2_CORRECTIONS.md` and `roadmap/README.md`
- **Security Patch Workflow**: See `roadmap/SECURITY_PATCH_WORKFLOW.md` (planned)

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

### Toast Notifications

- **ALWAYS** use Sonner toast: `import { toast } from "sonner";`
- **NEVER** use shadcn useToast hook: ~~`import { useToast } from "@/hooks/use-toast";`~~
- Pattern:

  ```typescript
  import { toast } from "sonner";

  // Success
  toast.success("Asset created successfully");

  // Error
  toast.error("Failed to create asset");

  // Info/Warning
  toast.info("Processing...");
  toast.warning("Are you sure?");
  ```

- **Why**: Sonner provides better UX with stacking, auto-dismiss, and cleaner API
- **Location**: Sonner's `<Toaster />` is already configured in root layout

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

### Permission Redirects

- When a server page calls `requirePermission`, wrap it with try/catch and call `handlePermissionRedirect(error, "/route")` before rethrowing so denied users are sent to `/unauthorized` with the required permission noted.

### Permissions

- **ALWAYS** check permissions at server action layer: `await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);`
- **Permission Organization**: 269 permissions organized into 14 logical groups (see `src/lib/rbac/permission-groups.ts`)
  - System & Administration (19), Foundation Layer (50), Asset Management (30), Maintenance Management (11)
  - Inventory Management (9), Asset Operations (27), CMDB (27), Contract Management (15)
  - License Management (22), Service Management (11), Governance & Compliance (23)
  - Attachments & Documents (10), Exchange Rates (6), Development & Testing (6)
- **Feature-Specific Permissions**: Each Layer 3 feature has its own permission set:
  - `ASSET_DISPOSALS_*` (VIEW, CREATE, UPDATE, DELETE, APPROVE, REJECT, START, COMPLETE, CANCEL, MANAGE)
  - `ASSET_KITS_*` (VIEW, CREATE, UPDATE, DELETE, CHECKOUT, RETURN, MANAGE)
  - `ASSET_RESERVATIONS_*` (VIEW, CREATE, UPDATE, DELETE, CANCEL, CONFIRM, MANAGE)
  - `CONFIGURATION_ITEMS_*`, `CI_RELATIONSHIPS_*`, `RELATIONSHIP_TYPES_*`, `CI_CLASSES_*`, `CI_CLASS_FIELDS_*`, `RELATIONSHIP_TYPE_SCOPES_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `CONTRACT_TYPES_*`, `CONTRACTS_*`, `CONTRACT_LINKED_OBJECTS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `LICENSE_PRODUCTS_*`, `LICENSE_PRODUCT_FIELDS_*`, `LICENSE_ENTITLEMENTS_*` (VIEW, CREATE, UPDATE, DELETE, MANAGE)
  - `LICENSE_ALLOCATIONS_*` (VIEW, CREATE, UPDATE, DELETE, DEALLOCATE, REACTIVATE, MANAGE)
  - `DATA_DOMAINS_*`, `DATA_OWNERSHIPS_*`, `VERIFICATION_CAMPAIGNS_*`, `VERIFICATION_ITEMS_*` (Governance)
  - `ATTACHMENT_TYPES_*`, `ATTACHMENTS_*`
  - `SERVICES_*`, `BUSINESS_PROCESSES_*`
- **Navigation**: Automatically filtered based on user permissions (see `navigation.ts`)
- **Role Management**: Clone roles with one click at `/admin/roles` (automatic permission copying)
- **Permission Assignment**: Enhanced UI with search, collapsible groups, "Select All in Group" at `/admin/roles/[name]/permissions`
- **See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) and `roadmap/README.md` (RBAC section)

### Route Protection & Security

**CRITICAL**: All protected routes **MUST** have server-side permission checks. Client-side checks (hooks, guards) can be bypassed.

**Required pattern**:
```typescript
// page.tsx (server component)
export const dynamic = "force-dynamic";

export default async function EntityPage() {
  await requirePermission(PERMISSIONS.ENTITY_VIEW); // Server-side (security)
  return <EntityPageClient />; // Client component (UX only)
}
```

**Defense in depth**: (1) Server component `requirePermission()`, (2) Server actions `requirePermission()`, (3) Client hooks/guards (UX only)

**See**: [RBAC_DEVELOPER_GUIDE.md](docs/guides/RBAC_DEVELOPER_GUIDE.md) for complete patterns, examples, and security details

### Better Auth Integration

- **Use repository layer** for user creation in use cases (NOT Better Auth API)
- **Better Auth API** requires Next.js request context - only use in API routes
- **Let hooks handle** cross-cutting concerns (e.g., Person entity creation via `ensurePersonLinkedToUser`)
- **Account type field**: Better Auth uses `type: "oauth"` for ALL authentication providers, including email/password
  - **Why "oauth" for email/password?** Better Auth uses a unified account model where `type` indicates the authentication mechanism (OAuth flow), while `provider` specifies the actual identity source
  - **Email/Password**: `type: "oauth"`, `provider: "credential"`
  - **Microsoft OAuth**: `type: "oauth"`, `provider: "microsoft"`
  - **Google OAuth**: `type: "oauth"`, `provider: "google"`
  - **IMPORTANT**: This is intentional design, not a bug - do not change the type field
- **Password storage**: Store hash in Account table via repository method
- **See**: [SYSTEM_SETUP.md](docs/features/SYSTEM_SETUP.md#refactoring-lessons-learned) for detailed patterns

### Logging

- **NEVER** use `console.log` - use DI logger: `@inject(DI_TOKENS.ILoggerService) private logger: ILoggerService`
- **See**: [LOGGING.md](docs/guides/LOGGING.md)

### Database Seeding

- **Architecture**: Layered seeders (RBAC → Foundation → Assets → Layer 3), centralized cleanup
- **Configuration**: All test data in `seed-config.ts` (single source of truth)
- **Factories**: Type-safe builders in `seed-factories.ts` (WarrantyFactory, MaintenanceScheduleFactory, etc.)
- **Utilities**: Shared helpers in `seed-utils.ts` (date utils, code generation, Prisma relation helpers)
- **IMPORTANT**: Cleanup only in `seed.ts` main orchestrator (proper dependency order)
- **Redis**: Use `ioredis` package (NOT `redis`) - simpler lifecycle with `quit()` instead of `disconnect()`
- **See**: [DATABASE_SEEDING.md](docs/guides/DATABASE_SEEDING.md) for complete guide, [STACK_UPGRADES.md](docs/guides/STACK_UPGRADES.md#additional-notes) for Redis migration

### Barrel Exports

- **CRITICAL**: Create `index.ts` in use case modules to export all use cases
- Pre-commit type-checking **fails** without barrel exports
- **All Layer 3 features have barrel exports**: `src/core/use-cases/{disposal,asset-kits,reservations,cmdb,contract,license-*,governance,attachments,service*}/*/index.ts`
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

### Universal Data Importer

**Route**: `/data-import`
**Permission**: `DATA_IMPORT_MANAGE`

**Architecture**: 7-step wizard with client-side validation and server-side bulk actions

**Core Utilities** (in `src/lib/data-import/`):
- `entity-config.types.ts` - TypeScript type system for all import configurations
- `csv-sanitizer.ts` - Universal data cleaning (whitespace, encoding, normalization)
- `field-validators.ts` - Validation engine with fuzzy matching suggestions
- `lookup-resolver.ts` - Reference resolution with Levenshtein distance (85%+ = high confidence)
- `template-generator.ts` - Dynamic CSV/Excel template generation with examples
- `import-processor.ts` - File parsing, batch processing, progress tracking

**Entity Configuration Pattern**:
```typescript
// In src/lib/data-import/entity-configs.ts
export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  ASSET: {
    key: "ASSET",
    name: "Assets",
    tableName: "Asset",
    category: "ASSET_MANAGEMENT",
    permission: PERMISSIONS.ASSETS_CREATE,
    uniqueFields: ["assetTag"],
    requiredFields: ["assetTag", "assetCategoryId"],
    lookupFields: ["assetCategoryId", "assetModelId", "vendorId", ...],
    bulkCreateAction: bulkCreateAssetsAction,
    maxBatchSize: 100,
    fields: [
      {
        name: "assetTag",
        label: "Asset Tag",
        type: "string",
        required: true,
        unique: true,
        sanitization: [{ operation: "trim" }, { operation: "uppercase" }],
        autoMap: ["asset_tag", "tag", "asset_id"],
        examples: ["LAP-001", "SRV-042"],
      },
      // ... more fields
    ],
  },
};
```

**Bulk Create Action Pattern**:
```typescript
// In src/interface-adapters/controllers/[entity].controller.ts
export async function bulkCreate[Entity]Action(
  itemsData: Create[Entity]DTO[]
): Promise<ActionResponse<{
  successCount: number;
  failureCount: number;
  failures: Array<{ index: number; [uniqueField]: string; error: string }>;
}>> {
  await requirePermission(PERMISSIONS.[ENTITY]_CREATE);

  const results = { successCount: 0, failureCount: 0, failures: [] };

  for (let i = 0; i < itemsData.length; i++) {
    try {
      const validated = Create[Entity]Schema.parse(itemsData[i]);
      await useCase.execute(validated);
      results.successCount++;
    } catch (error) {
      results.failureCount++;
      results.failures.push({ index: i, error: error.message });
    }
  }

  revalidatePath("/[entity-route]");
  return { success: true, data: results };
}
```

**Lookup Maps** (server action in `data-import-lookup.controller.ts`):
```typescript
// Fetches lookup maps for reference fields (e.g., category codes → IDs)
const result = await getLookupMapsAction([
  { name: "assetCategoryId", lookupTarget: "AssetCategory", lookupField: "code", lookupDisplayField: "name" }
]);
```

**Key Features**:
- Auto-mapping: Fuzzy match CSV columns to entity fields
- Sanitization: Trim, normalize case, remove invisible characters, fix common errors
- Validation: Type checking, pattern matching, lookup resolution with suggestions
- Duplicate Handling: Skip, Overwrite, Fail, or Append suffix
- Batch Processing: Configurable batch sizes (up to 100), parallel batches (up to 4)
- Progress Tracking: Real-time updates with estimated time remaining
- Error Reports: Downloadable CSV/Excel with detailed error messages

**Currently Configured**:
- ✅ Assets (12 fields)
- ✅ Persons (12 fields)
- ⏳ 64 entities pending configuration (see `roadmap/UNIVERSAL_DATA_IMPORTER.md`)

**Adding New Entity**:
1. Add entity config to `entity-configs.ts` (field definitions, validations, lookup mappings)
2. Create or verify bulk create action in entity controller
3. Register lookup entities in `data-import-lookup.controller.ts` if needed
4. Test with sample CSV

## Layer 3 ITAM Features

**9 Advanced Modules** - Fully implemented with Clean Architecture patterns:

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

5. **Service Management** (`/services`, `/business-processes`)
   - Service catalog with 80+ seeded services (applications, databases, APIs, infrastructure)
   - Multiple ownership types (Technical, Product, Business) with primary owner designation
   - NDMO framework classification (data confidentiality, business impact, criticality)
   - Business processes linked to services for business-IT alignment
   - Service infrastructure tracking (location, cloud provider, region, IP, backup)
   - Asset linking with relationship types (HOSTS, SUPPORTS, DEPENDS_ON, MONITORS, BACKS_UP)
   - Essential service tracking for SAMA compliance
   - Lifecycle management (deployment, patches, decommission planning)
   - Permissions: `SERVICES_VIEW`, `SERVICES_CREATE`, `SERVICES_UPDATE`, `SERVICES_DELETE`, `SERVICES_MANAGE`, `BUSINESS_PROCESSES_VIEW`, `BUSINESS_PROCESSES_MANAGE`

6. **Contract Management** (`/contract-types`, `/contracts`)
   - Contract Types with customizable fields
   - Contracts with vendor linkage and lifecycle dates
   - Polymorphic linking to Assets, CIs, License Products
   - Financial tracking with renewal dates
   - Permissions: `CONTRACT_TYPES_VIEW`, `CONTRACTS_VIEW`, `CONTRACT_LINKED_OBJECTS_VIEW`

7. **License Management** (`/license-products`, `/license-entitlements`, `/license-allocations`)
   - License Products with metric types (per_device, per_user, per_core, per_vm, per_cluster)
   - Entitlements with purchased quantities and date ranges
   - Polymorphic allocations to Persons, CIs, or Assets
   - Available quantity tracking (purchased - allocated)
   - Soft deactivation (deallocate/reactivate) support
   - Permissions: `LICENSE_PRODUCTS_VIEW`, `LICENSE_ENTITLEMENTS_VIEW`, `LICENSE_ALLOCATIONS_VIEW`

8. **Governance** (`/data-domains`, `/data-ownerships`, `/verification-campaigns`)
   - Data Domains for data classification (PII, Financial Data, etc.)
   - Data Ownerships with polymorphic mapping (CIClass OR AssetCategory, Person OR OrgUnit)
   - Verification Campaigns for scheduled compliance audits
   - Verification Items with status tracking (PENDING → IN_PROGRESS → VERIFIED/EXCEPTION)
   - SAMA compliance support with audit trails
   - Permissions: `DATA_DOMAINS_VIEW`, `DATA_OWNERSHIPS_VIEW`, `VERIFICATION_CAMPAIGNS_VIEW`, `VERIFICATION_ITEMS_VIEW`

9. **Attachments** (`/attachment-types`, `/attachments`)
   - Attachment Types with file validation rules (extensions, size limits)
   - Polymorphic attachments to any entity (23 target types: Asset, CI, Contract, Warranty, Disposal, etc.)
   - File metadata tracking (fileName, mimeType, sizeBytes, storagePath)
   - Business methods for file operations (isImage, isPDF, getFormattedFileSize)
   - Ready for compliance documentation, invoices, certificates, audit reports
   - Permissions: `ATTACHMENT_TYPES_VIEW`, `ATTACHMENTS_VIEW`

**Database**: 27+ new tables (CMDB: 6, Contracts: 3, Licenses: 4, Governance: 4, Attachments: 2, Service Management: 5, plus config entities)

**DI Modules**: All registered in `src/di/container.ts`:

- `bindCMDBDependencies()` - CMDB entities
- `bindContractsDependencies()` - Contract management
- `bindLicensesDependencies()` - License management
- `bindGovernanceDependencies()` - Governance features (data domains, ownerships, verification)
- `bindAttachmentsDependencies()` - Attachment system
- `bindServiceDependencies()` - Service catalog, business processes, infrastructure, asset linking
- `loadDisposalModule()` - Asset disposals
- `loadAssetKitsModule()` - Asset kits
- `loadReservationsModule()` - Asset reservations

**Navigation**: New "CMDB", "Contracts", "Licenses", "Services", "Governance", and "Attachments" groups added with permission-based filtering

## RBAC Admin Enhancements (Layer 1)

**Phase 1 (COMPLETED 2025-11-22)**:

- **Permission Grouping**: 269 permissions organized into 14 logical categories (`src/lib/rbac/permission-groups.ts`)
- **Enhanced UI**: Search/filter, collapsible groups, "Select All in Group" at `/admin/roles/[name]/permissions`
- **Clone Role**: One-click role duplication with automatic permission copying
- **Navigation Fixes**: Fixed critical 404 bug (role/permission pages now use `name` instead of `id`)
- **Impact**: 100% navigation success, 93% reduction in permission assignment complexity, 90% time savings for role cloning

**Phase 2 (COMPLETED 2025-11-23)**:

- ✅ **Permission Dependencies** (`src/lib/rbac/permission-dependencies.ts`):
  - 269 permissions mapped with dependency rules
  - Client-side validation with `validatePermissionDependencies()` function
  - **Server-side enforcement** in `assignPermissionsToRoleAction` controller
  - UI warnings in PermissionsManager showing missing dependencies
  - Auto-fix button to add required permissions
  - Tooltips on individual permissions showing requirements
  - Defense-in-depth: Both client (UX) and server (security) validation

- ✅ **Role Conflict Detection** (`src/lib/rbac/role-conflicts.ts`):
  - Segregation of duties enforcement
  - 3 severity levels: warning, error, critical
  - **Bidirectional conflict detection** with `rolesConflict()` function (checks both directions)
  - **Server-side enforcement** in `AssignRoleToUserUseCase` with audit logging
  - RoleAssignment component shows conflicts with severity badges (uses role names, not IDs)
  - Critical conflicts block assignment, warnings allow override
  - Pre-flight validation in BulkRoleAssignmentModal

- ✅ **Bulk Operations**:
  - Bulk permission assignment (PermissionsManager)
  - Bulk role assignment with **pre-flight conflict detection**
  - Multi-select with conflict detection and detailed summary
  - Per-user/per-role conflict breakdown
  - Server-side enforcement catches any bypasses
  - ~50% time savings for bulk operations

- ✅ **Date Validation**:
  - Calendar date pickers allow same-day expiration (correct validation logic)
  - Proper comparison: `date < startOfToday` instead of `date <= today`

- 🚧 **Remaining**: Advanced user management, role analytics dashboard, role hierarchy/inheritance UI + server enforcement, time-based role expiration jobs, enhanced audit log UI (see `roadmap/README.md`)

**Impact**: 100% permission integrity (server-enforced), 100% segregation of duties compliance, zero bypass vulnerabilities

**CLI Role Manager** (`scripts/manage-user-roles.ts`):

- **Modern Stack**: Built with @inquirer/prompts v8 (ESM API), chalk v5, Prisma v7
- **Interactive CLI**: Search users, view current roles, add/remove roles with multi-select
- **Conflict Detection**: Real-time validation with severity levels (warning/error/critical)
  - Critical conflicts block assignment (e.g., system-administrator ↔ auditor for SAMA compliance)
  - Error conflicts block assignment (e.g., finance-manager ↔ inventory-manager for SOD)
  - Warning conflicts allow override with confirmation
- **Temporary Assignments**: Optional expiration dates for time-limited roles
- **Dry-Run Mode**: Preview changes without applying (`--dry-run` flag)
- **Audit Trail**: All changes logged to AuditLog table with metadata
- **Safety Features**: Transaction-based operations, duplicate detection, user confirmations
- **macOS/zsh Compatible**: Fully tested with macOS Terminal.app, iTerm2, and VS Code terminal
- **Usage**:
  ```bash
  npm run roles:manage              # Interactive mode
  npm run roles:manage -- --dry-run # Preview changes
  npm run roles:manage -- --help    # Show help
  ```
- **Use Cases**: Bulk role assignment, troubleshooting access issues, temporary access grants, role audits

**Documentation**: See [RBAC Admin Guide](docs/features/RBAC_ADMIN_GUIDE.md) for complete usage guide

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

- Import from `@prisma/client` (causes TypeScript errors)
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
