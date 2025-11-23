# Database Seeding Guide

Comprehensive guide to the database seeding system in Barq Assets ITAM application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Running Seeds](#running-seeds)
4. [Seed Modules](#seed-modules)
5. [Utilities & Factories](#utilities--factories)
6. [Configuration](#configuration)
7. [Adding New Seed Data](#adding-new-seed-data)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The seed system populates the database with comprehensive, realistic test data following enterprise ITAM best practices. The system is designed with DRY (Don't Repeat Yourself) and SOLID principles using:

- **Domain-Split Configuration**: Test data organized by domain in 5 config modules
- **Factory Pattern**: Type-safe entity builders in `seed-factories.ts` and `seed-foundation-factories.ts`
- **Shared Utilities**: Common helpers in `seed-utils.ts`
- **Layered Architecture**: Seeds respect domain layer dependencies
- **Idempotent Design**: Cleanup handled centrally for safe re-seeding

### What Gets Seeded

**Layer 0: RBAC System**

- 162+ permissions across all features
- 4 roles: Administrator, Manager, Editor, Viewer
- Role-permission assignments

**Layer 1: Foundation (11 entities)**

- 3 Lifecycle Models, 9 States, 6 Transitions
- 8 Vendors with contacts
- 8 Organization Units (hierarchical)
- 5 Locations (HQ, branches, data centers)
- 8+ Persons with role assignments
- 14+ Field Definitions

**Layer 2: Asset Management (9 entities)**

- 8 Asset Categories (Laptop, Desktop, Server, etc.)
- 15+ Asset Models across vendors
- 50+ Assets with realistic data
- 5 Stock Locations
- Stock Movements and tracking
- Asset Assignments (70% assigned)
- Warranties (80% of assets)
- Maintenance Schedules and Records

**Layer 3: Advanced ITAM (12 entities)**

- **Asset Disposals**: Multi-step approval workflow
- **Asset Kits**: Predefined bundles with checkout tracking
- **Asset Reservations**: Future bookings with conflict detection
- **CMDB**: Configuration Items, Relationship Types, CI Relationships

**Support Systems**

- AI Prompt Templates
- Example Tasks

---

## Architecture

### File Structure

```
src/infrastructure/database/prisma/
├── seed.ts                          # Main orchestrator
│
├── Configuration (Domain-Split)
│   ├── seed-config.ts               # Barrel export + SEED_QUANTITIES
│   ├── seed-config-foundation.ts    # Foundation layer data
│   ├── seed-config-assets.ts        # Asset layer data
│   ├── seed-config-layer3.ts        # Layer 3 ITAM data
│   ├── seed-config-governance.ts    # Governance data
│   └── seed-config-system.ts        # System/services data
│
├── Utilities & Factories
│   ├── seed-utils.ts                # Shared utilities
│   ├── seed-factories.ts            # Asset/maintenance factories
│   └── seed-foundation-factories.ts # Foundation layer factories
│
├── Seeders (by Domain)
│   ├── seed-rbac.ts                 # RBAC permissions & roles
│   ├── seed-rbac-permissions.ts     # Permission definitions
│   ├── seed-rbac-roles.ts           # Role definitions
│   ├── seed-foundation.ts           # Foundation layer
│   ├── seed-assets.ts               # Asset layer
│   ├── seed-warranties-maintenance.ts # Warranties & maintenance
│   ├── seed-cmdb.ts                 # CMDB relationships
│   ├── seed-layer3-itam.ts          # Advanced ITAM features
│   ├── seed-governance.ts           # Governance features
│   ├── seed-services.ts             # Service catalog
│   ├── seed-attachments.ts          # Attachment types
│   └── seed-prompts.ts              # AI prompt templates
```

### Design Principles

1. **Single Responsibility**: Each seed module handles one domain layer
2. **Dependency Inversion**: Uses abstractions (configs, factories) not concrete data
3. **DRY**: No duplicate code - shared utilities and factories
4. **Centralized Cleanup**: Only `seed.ts` performs deletions (proper dependency order)
5. **Type Safety**: Full TypeScript with generated Prisma types
6. **Realistic Data**: Enterprise-grade sample data matching Saudi Arabian context

---

## Running Seeds

### Quick Commands

```bash
# Full setup (install + schema + seed)
npm run setup

# Seed only
npm run db:seed

# Reset database and re-seed (DESTRUCTIVE - drops all data!)
npm run reset

# Manual seeding (development)
npx tsx src/infrastructure/database/prisma/seed.ts
```

### Expected Output

```
============================================================
🌱 COMPREHENSIVE DATABASE SEED
============================================================

🌱 RBAC System
   📋 Creating permissions...
   ✓ Created 162 permissions
   👥 Creating roles and assigning permissions...
   ✓ Role "Administrator" created with 162 permissions
   ✓ RBAC seed completed successfully!

🏗️  Foundation Layer (Layer 1)
   📊 Seeding lifecycle models...
   ✓ Created 3 lifecycle models
   📦 Seeding vendors...
   ✓ Created 8 vendors
   [... more output ...]

💻 Asset Layer (Layer 2)
   [... asset seeding ...]

✅ COMPREHENSIVE DATABASE SEED COMPLETED SUCCESSFULLY!
⏱️  Total execution time: 12.34s
```

### Execution Time

- **Development**: ~10-15 seconds (local PostgreSQL)
- **First Run**: May take longer due to relationship creation
- **Subsequent Runs**: Faster due to database optimizations

---

## Seed Modules

### 1. seed-rbac.ts

Seeds Role-Based Access Control system.

```typescript
await seedRBAC();
```

**Creates**:

- Permissions (all CRUD + feature-specific)
- Roles (System Administrator, IT Help Desk, Auditor, Finance Manager, Security Officer, Service Owner, Inventory Manager, Maintenance Technician, Data Steward, Asset Coordinator, Viewer)
- Role-Permission assignments

**Key Features**:

- Automatic permission discovery from codebase
- Granular permissions per feature
- Layer 3 feature permissions (Asset Disposals, Kits, Reservations, CMDB)

### 2. seed-foundation.ts

Seeds Foundation layer (Layer 1) entities.

```typescript
await seedFoundation(prisma);
```

**Creates**:

- Lifecycle Models, States, Transitions
- Vendors and Vendor Contacts
- Organization Units (hierarchical)
- Locations
- Persons with role assignments
- Field Definitions

**Dependencies**: Requires RBAC seeded first (for role assignments)

### 3. seed-assets.ts

Seeds Asset layer (Layer 2) entities.

```typescript
await seedAssets(prisma);
```

**Creates**:

- Asset Categories
- Asset Models (linked to vendors)
- Assets (50+, realistic data)
- Stock Locations
- Stock Movements
- Asset Assignments

**Dependencies**: Requires Foundation layer seeded first

**Configuration**:

```typescript
// seed-config.ts
QUANTITIES: {
  ASSETS_PER_CATEGORY: {
    LAPTOP: 15,
    DESKTOP: 8,
    SERVER: 5,
    // ...
  },
  ASSET_ASSIGNMENTS_PERCENTAGE: 0.7, // 70% assigned
}
```

### 4. seed-warranties-maintenance.ts

Seeds Warranty and Maintenance entities.

```typescript
await seedWarrantiesMaintenance(prisma);
```

**Creates**:

- Warranties (various coverage types)
- Maintenance Schedules (recurring)
- Maintenance Records (historical, scheduled, in-progress)

**Uses Factories**:

- `WarrantyFactory.fromAsset()` - Creates warranty from asset purchase date
- `MaintenanceScheduleFactory.createRecurring()` - Creates recurring schedules
- `MaintenanceRecordFactory.createCompleted()` - Historical records

**Dependencies**: Requires Assets and Persons seeded first

### 5. seed-cmdb.ts

Seeds CMDB Relationship Types.

```typescript
await seedCMDB(prisma);
```

**Creates**:

- Relationship Types (DEPENDS_ON, RUNS_ON, CONNECTS_TO, etc.)
- Bidirectional relationship support
- Impact analysis flags

**Note**: Configuration Items and CI Relationships created in Layer 3 ITAM seeder

### 6. seed-layer3-itam.ts

Seeds Advanced ITAM features (Layer 3).

```typescript
await seedLayer3ITAM(prisma);
```

**Creates**:

- Asset Disposals (various statuses)
- Disposal Approvals (approval chain)
- Disposal Documents
- Asset Kits (predefined bundles)
- Asset Kit Items
- Asset Kit Checkouts
- Asset Reservations (future bookings)
- Reservation Conflicts
- Configuration Items
- CI Relationships

**Dependencies**: Requires Assets, Persons, and CMDB Relationship Types

### 7. seed-prompts.ts

Seeds AI Prompt Templates.

```typescript
await seedPrompts(prisma);
```

**Creates**: AI prompt templates for various tasks (documentation, analysis, etc.)

---

## Utilities & Factories

### seed-utils.ts

Shared utility functions to eliminate code duplication.

#### Date Utilities

```typescript
// Get date relative to today
const futureDate = getRelativeDate(30); // 30 days from now
const pastDate = getRelativeDate(-60); // 60 days ago

// Get date relative by years
const purchaseDate = getRelativeDateByYears(-2); // 2 years ago
```

#### Code Generation

```typescript
// Generate sequential codes
const code = generateSequentialCode("INV", 42, 6); // "INV-000042"

// Generate asset tags
const tag = generateAssetTag("LAPTOP", 15); // "LAP-000015"

// Generate serial numbers
const serial = generateSerialNumber("DELL", 2024, 123);
// "DELL-2024-000123"
```

#### Prisma Relation Helpers

```typescript
// Optional relation (may be undefined)
const data = {
  ...optionalConnect(modelId, "assetModel"),
  // Expands to: assetModel: modelId ? { connect: { id: modelId } } : undefined
};

// Required relation (throws if undefined)
const data = {
  ...requireConnect(vendorId, "vendor"),
  // Expands to: vendor: { connect: { id: vendorId } }
  // Throws error if vendorId is undefined
};
```

#### Logging Utilities

```typescript
// Structured console output
logSection("Asset Layer"); // ===== Asset Layer =====
logStep("💻", "Creating assets..."); // 💻 Creating assets...
logSuccess("Created 50 assets"); // ✓ Created 50 assets
logWarning("Skipping optional data"); // ⚠️  Skipping optional data
```

#### Validation

```typescript
// Ensure entities exist before proceeding
requireEntities(assets, "assets");
// Throws error if assets array is empty
```

#### Random Helpers

```typescript
// Pick random item from array
const person = pickRandom(persons);

// Random integer (inclusive)
const cost = randomInt(500, 5000);
```

### seed-factories.ts

Type-safe entity builders using Factory pattern.

#### WarrantyFactory

```typescript
// Create warranty from asset
const warranty = WarrantyFactory.fromAsset(
  asset, // Asset object with id, purchaseDate
  36, // Warranty months
  "Dell ProSupport", // Provider
  WarrantyCoverageType.EXTENDED, // Coverage type
  1, // Sequence number
);

await warranty.create(prisma);
```

**Generated Fields**:

- `policyReference`: Auto-generated code
- `startDate`: From asset purchase date
- `endDate`: Calculated from warranty months
- `coverageDetails`: Formatted description

#### MaintenanceScheduleFactory

```typescript
// Create recurring maintenance schedule
const schedule = MaintenanceScheduleFactory.createRecurring(
  asset.id,
  asset.name,
  "PREVENTIVE", // Type
  "MONTHLY", // Frequency
  120, // Duration (minutes)
  technicianId, // Assigned person
  {
    customIntervalDays: 30,
    priority: MaintenancePriority.HIGH,
  },
);

await schedule.create(prisma);
```

#### MaintenanceRecordFactory

```typescript
// Completed maintenance
const completed = MaintenanceRecordFactory.createCompleted(
  asset.id,
  asset.name,
  "PREVENTIVE",
  technicianId,
  30, // Days ago
);

// Scheduled maintenance
const scheduled = MaintenanceRecordFactory.createScheduled(
  asset.id,
  asset.name,
  "INSPECTION",
  technicianId,
  7, // Days from now
);
```

---

## Configuration

### Overview: Domain-Split Configuration

**Refactored (Nov 2025)**: Configuration data has been split into **domain-specific modules** for better maintainability:

- **seed-config.ts**: Main barrel export + `SEED_QUANTITIES`
- **seed-config-foundation.ts**: Foundation layer data (vendors, locations, persons, etc.)
- **seed-config-assets.ts**: Asset layer data (categories, models, warranties, etc.)
- **seed-config-layer3.ts**: Layer 3 ITAM data (kits, disposals, CIs, etc.)
- **seed-config-governance.ts**: Governance data (domains, ownerships, campaigns)
- **seed-config-system.ts**: System data (services, attachments, exchange rates)

**Benefits**:
- **95% reduction** in main config file (3,056 → 154 lines)
- Easy to find specific data by domain
- Import only what you need
- Better Git diffs (changes isolated to domains)

### seed-config.ts (Main Barrel Export)

Main configuration file that re-exports all domain modules and provides backward compatibility.

#### Quantities

```typescript
export const SEED_QUANTITIES = {
  // Foundation Layer
  VENDORS: 8,
  LOCATIONS: 10,
  PERSONS: 15,

  // Asset Layer
  ASSETS_PER_CATEGORY: {
    LAPTOP: 15,
    DESKTOP: 8,
    MONITOR: 10,
    SERVER: 5,
    // ...
  },
  ASSET_ASSIGNMENTS_PERCENTAGE: 0.7, // 70% assigned
  WARRANTIES_PERCENTAGE: 0.8, // 80% have warranties

  // Layer 3 ITAM
  ASSET_DISPOSALS: 8,
  ASSET_KITS: 5,
  ASSET_RESERVATIONS: 10,
  CONFIGURATION_ITEMS: 20,
};
```

#### Sample Data

```typescript
// Vendors
export const VENDOR_DATA = [
  { name: "Dell Technologies", code: "DELL", type: "MANUFACTURER" },
  { name: "HP Inc.", code: "HP", type: "MANUFACTURER" },
  // ...
];

// Asset Models
export const ASSET_MODEL_DATA = {
  LAPTOP: [
    {
      vendor: "DELL",
      name: "Dell Latitude 7490",
      code: "LAT7490",
      description: "14-inch business laptop",
    },
    // ...
  ],
  SERVER: [
    {
      vendor: "DELL",
      name: "Dell PowerEdge R750",
      code: "R750",
      description: "2U rack server",
    },
    // ...
  ],
};

// Warranty Config
export const WARRANTY_CONFIG = {
  STANDARD_LAPTOP: {
    months: 36,
    type: WarrantyCoverageType.STANDARD,
    provider: "Manufacturer",
  },
  EXTENDED_SERVER: {
    months: 60,
    type: WarrantyCoverageType.EXTENDED,
    provider: "ProSupport Plus",
  },
};
```

#### Structure

```typescript
// seed-config.ts (Main File)
export const SEED_QUANTITIES = { /* ... */ };

// Re-export all domain modules
export * from "./seed-config-foundation.js";
export * from "./seed-config-assets.js";
export * from "./seed-config-layer3.js";
export * from "./seed-config-governance.js";
export * from "./seed-config-system.js";

// Aggregate configuration (backward compatibility)
export const SEED_CONFIG = {
  QUANTITIES: SEED_QUANTITIES,
  VENDORS: VENDOR_DATA,
  LOCATIONS: LOCATION_DATA,
  ORG_UNITS: ORG_UNIT_DATA,
  PERSONS: PERSON_DATA,
  ASSET_CATEGORIES: ASSET_CATEGORY_DATA,
  ASSET_MODELS: ASSET_MODEL_DATA,
  WARRANTY_CONFIG,
  MAINTENANCE_TEMPLATES,
  ASSET_KIT_TEMPLATES,
  CI_CLASSES: CI_CLASS_DATA,
  RELATIONSHIP_TYPES: RELATIONSHIP_TYPE_DATA,
  DISPOSAL_REASONS,
  RESERVATION_PURPOSES,
  DATA_DOMAINS,
  DATA_OWNERSHIPS,
  VERIFICATION_CAMPAIGNS,
  SERVICES: SERVICE_DATA,
  BUSINESS_PROCESSES: BUSINESS_PROCESS_DATA,
  EXCHANGE_RATES: EXCHANGE_RATE_DATA,
  ATTACHMENT_TYPES,
} as const;
```

### Domain-Specific Config Files

#### seed-config-foundation.ts (289 lines)

Foundation layer configuration data.

**Exports**:
- `VENDOR_DATA`: 9 vendors (manufacturers & resellers)
- `LOCATION_DATA`: 10 locations (offices, data centers, warehouses)
- `ORG_UNIT_DATA`: 5 organization units (hierarchical structure)
- `PERSON_DATA`: 15 persons with Saudi Arabian names
- `LIFECYCLE_STATUS_DATA`: 6 lifecycle statuses

```typescript
import { VENDOR_DATA, LOCATION_DATA } from "./seed-config-foundation.js";
```

#### seed-config-assets.ts (257 lines)

Asset layer configuration data.

**Exports**:
- `ASSET_CATEGORY_DATA`: 8 categories (Laptop, Desktop, Server, etc.)
- `ASSET_MODEL_DATA`: 15+ models across vendors
- `WARRANTY_CONFIG`: Warranty templates by asset type
- `MAINTENANCE_TEMPLATES`: Recurring maintenance templates

```typescript
import { ASSET_MODEL_DATA, WARRANTY_CONFIG } from "./seed-config-assets.js";
```

#### seed-config-layer3.ts (206 lines)

Layer 3 ITAM configuration data.

**Exports**:
- `ASSET_KIT_TEMPLATES`: Predefined asset bundles
- `CI_CLASS_DATA`: CI class definitions
- `RELATIONSHIP_TYPE_DATA`: CMDB relationship types
- `DISPOSAL_TYPES`, `DISPOSAL_STATUSES`, `DISPOSAL_REASONS`
- `KIT_TYPES`: Asset kit type definitions
- `RESERVATION_PURPOSES`: Reservation purpose options

```typescript
import { CI_CLASS_DATA, ASSET_KIT_TEMPLATES } from "./seed-config-layer3.js";
```

#### seed-config-governance.ts (135 lines)

Governance configuration data.

**Exports**:
- `DATA_DOMAINS`: Data classification domains
- `DATA_OWNERSHIPS`: Ownership mapping templates
- `VERIFICATION_CAMPAIGNS`: Compliance verification campaigns

```typescript
import { DATA_DOMAINS } from "./seed-config-governance.js";
```

#### seed-config-system.ts (2,080 lines)

System and service configuration data.

**Exports**:
- `SERVICE_DATA`: Service catalog entries
- `BUSINESS_PROCESS_DATA`: Business process definitions
- `ATTACHMENT_TYPES`: File attachment type definitions
- `EXCHANGE_RATE_DATA`: Multi-currency exchange rates (14 currencies)

```typescript
import { EXCHANGE_RATE_DATA, SERVICE_DATA } from "./seed-config-system.js";
```

---

## Adding New Seed Data

### 1. Add Configuration to Appropriate Domain File

Choose the correct domain-specific config file based on the entity type:

**Foundation Layer** (`seed-config-foundation.ts`):
```typescript
// Add to seed-config-foundation.ts
export const NEW_ENTITY_DATA = [
  { name: "Sample 1", code: "SAMP1", ... },
  { name: "Sample 2", code: "SAMP2", ... },
] as const;
```

**Asset Layer** (`seed-config-assets.ts`):
```typescript
// Add to seed-config-assets.ts for asset-related data
export const ASSET_RELATED_DATA = [...] as const;
```

**Layer 3 ITAM** (`seed-config-layer3.ts`):
```typescript
// Add to seed-config-layer3.ts for advanced ITAM features
export const ADVANCED_ITAM_DATA = [...] as const;
```

**Governance** (`seed-config-governance.ts`):
```typescript
// Add to seed-config-governance.ts for governance data
export const GOVERNANCE_DATA = [...] as const;
```

**System/Services** (`seed-config-system.ts`):
```typescript
// Add to seed-config-system.ts for services, business processes, etc.
export const SERVICE_DATA = [...] as const;
```

Then add to the main barrel export in `seed-config.ts`:
```typescript
// seed-config.ts
import { NEW_ENTITY_DATA } from "./seed-config-foundation.js";

export const SEED_CONFIG = {
  // ...
  NEW_ENTITIES: NEW_ENTITY_DATA,
} as const;
```

### 2. Create Factory (Optional)

For **complex entities**, create class-based factories in `seed-factories.ts`:

```typescript
// seed-factories.ts
export interface NewEntityFactoryOptions {
  name: string;
  code: string;
  // ...
}

export class NewEntityFactory {
  constructor(private options: NewEntityFactoryOptions) {}

  static fromTemplate(
    template: TemplateType,
    sequence: number,
  ): NewEntityFactory {
    return new NewEntityFactory({
      name: template.name,
      code: generateSequentialCode(template.prefix, sequence),
      // ...
    });
  }

  async create(prisma: PrismaClient): Promise<NewEntity> {
    return await prisma.newEntity.create({
      data: this.options,
    });
  }
}
```

For **foundation entities**, create batch functions in `seed-foundation-factories.ts`:

```typescript
// seed-foundation-factories.ts
export interface NewEntityData {
  name: string;
  code: string;
  // ...
}

/**
 * Create multiple new entities in batch
 */
export async function createNewEntities(
  prisma: PrismaClient,
  entities: readonly NewEntityData[] | NewEntityData[],
) {
  return prisma.newEntity.createMany({
    data: entities.map((e) => ({
      name: e.name,
      code: e.code,
      isActive: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
  });
}
```

### 3. Add Seeding Logic

```typescript
// Existing seed file or new seed-new-entities.ts
import { NEW_ENTITY_DATA } from "./seed-config-foundation.js"; // or appropriate domain file
import { createNewEntities } from "./seed-foundation-factories.js"; // or NewEntityFactory from seed-factories.ts
import { logStep, logSuccess } from "./seed-utils.js";

export async function seedNewEntities(prisma: PrismaClient) {
  logStep("🆕", "Creating new entities...");

  // Option A: Using batch factory (recommended for foundation entities)
  await createNewEntities(prisma, NEW_ENTITY_DATA);
  logSuccess(`Created ${NEW_ENTITY_DATA.length} new entities`);

  // Option B: Using class factory (for complex entities with business logic)
  let count = 0;
  for (const template of NEW_ENTITY_DATA) {
    await NewEntityFactory.fromTemplate(template, count).create(prisma);
    count++;
  }
  logSuccess(`Created ${count} new entities`);
}
```

### 4. Add to Main Orchestrator

```typescript
// seed.ts
import { seedNewEntities } from "./seed-new-entities.js";

async function main() {
  // ... existing cleanup ...

  // Add after appropriate layer
  await seedNewEntities(prisma);

  // ... rest of seeders ...
}
```

### 5. Add Cleanup (if needed)

```typescript
// seed.ts - main() function
async function main() {
  // Add to cleanup section (proper dependency order)
  await prisma.newEntity.deleteMany({});

  // ... other cleanup ...
}
```

---

## Common Patterns

### Pattern 1: Configuration-Driven Seeding

```typescript
// ✅ GOOD - Uses domain-split configuration
import { VENDOR_DATA } from "./seed-config-foundation.js";

for (const vendorData of VENDOR_DATA) {
  await prisma.vendor.create({
    data: {
      name: vendorData.name,
      code: vendorData.code,
      vendorType: vendorData.type,
      // ...
    },
  });
}

// ✅ ALSO GOOD - Using aggregate config (backward compatibility)
import { SEED_CONFIG } from "./seed-config.js";

for (const vendorData of SEED_CONFIG.VENDORS) {
  await prisma.vendor.create({
    data: {
      name: vendorData.name,
      code: vendorData.code,
      vendorType: vendorData.type,
      // ...
    },
  });
}

// ❌ BAD - Hardcoded data
await prisma.vendor.create({
  data: { name: "Dell", code: "DELL", vendorType: "MANUFACTURER" },
});
```

### Pattern 2: Batch Factory Functions (Foundation Layer)

```typescript
// ✅ GOOD - Batch creation with factory function
import { createVendors } from "./seed-foundation-factories.js";
import { VENDOR_DATA } from "./seed-config-foundation.js";

await createVendors(prisma, VENDOR_DATA);
// Creates all vendors in batch with proper type safety

// ✅ GOOD - Batch creation with parent relationships
import { createOrganizationUnits } from "./seed-foundation-factories.js";
import { ORG_UNIT_DATA } from "./seed-config-foundation.js";

const orgUnitMap = await createOrganizationUnits(prisma, ORG_UNIT_DATA);
// Returns Map<code, id> for linking child entities

// ❌ BAD - Individual creates in loop
for (const vendorData of VENDOR_DATA) {
  await prisma.vendor.create({
    data: {
      name: vendorData.name,
      code: vendorData.code,
      type: vendorData.type,
      isActive: true,
    },
  });
}
```

### Pattern 3: Class-Based Factories (Complex Entities)

```typescript
// ✅ GOOD - Uses factory for complex logic
const warranty = WarrantyFactory.fromAsset(
  asset,
  36,
  provider,
  WarrantyCoverageType.STANDARD,
  sequence,
);
await warranty.create(prisma);

// ❌ BAD - Manual field calculation
const startDate = asset.purchaseDate ?? new Date();
const endDate = new Date(startDate);
endDate.setMonth(endDate.getMonth() + 36);
await prisma.warranty.create({
  data: {
    assetId: asset.id,
    startDate,
    endDate,
    // ... repeated logic
  },
});
```

### Pattern 4: Safe Relation Handling

```typescript
// ✅ GOOD - Uses helper with validation
const data = {
  ...requireConnect(vendorId, "vendor"),
  ...optionalConnect(modelId, "assetModel"),
};

// ❌ BAD - Manual null checks
const data = {
  vendor: vendorId ? { connect: { id: vendorId } } : undefined,
  assetModel: modelId ? { connect: { id: modelId } } : undefined,
};
```

### Pattern 5: Centralized Cleanup

```typescript
// ✅ GOOD - Cleanup in seed.ts only
// seed.ts
await prisma.asset.deleteMany({});
await prisma.vendor.deleteMany({});

// seed-assets.ts - No cleanup
export async function seedAssets(prisma: PrismaClient) {
  // Just create data
}

// ❌ BAD - Cleanup in individual seeders
export async function seedAssets(prisma: PrismaClient) {
  await prisma.asset.deleteMany({}); // Don't do this!
}
```

### Pattern 6: Realistic Data Generation

```typescript
// ✅ GOOD - Realistic dates, costs, relationships
const asset = await prisma.asset.create({
  data: {
    assetTag: generateAssetTag(categoryCode, sequence),
    serialNumber: generateSerialNumber(vendor, year, sequence),
    purchaseDate: getRelativeDateByYears(-randomInt(1, 3)),
    purchaseCost: randomInt(500, 5000),
    currency: "SAR",
    condition: pickRandom(["NEW", "GOOD", "FAIR"]),
  },
});

// ❌ BAD - Fake or unrealistic data
const asset = await prisma.asset.create({
  data: {
    assetTag: "ASSET1",
    serialNumber: "12345",
    purchaseDate: new Date(),
    purchaseCost: 1000,
  },
});
```

---

## Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Violations

**Symptom**: `Foreign key constraint violated on the constraint: 'X_Y_fkey'`

**Causes**:

- Wrong cleanup order in `seed.ts`
- Attempting to delete parent entities before children
- Individual seeders performing cleanup (should only be in `seed.ts`)

**Solution**:

```typescript
// seed.ts - Correct cleanup order (Layer 3 → Layer 2 → Layer 1)
await prisma.assetKitCheckoutItem.deleteMany({}); // Most dependent
await prisma.assetKitCheckout.deleteMany({});
await prisma.assetKitItem.deleteMany({});
await prisma.assetKit.deleteMany({});
// ... continue in dependency order
await prisma.asset.deleteMany({});
await prisma.vendor.deleteMany({}); // Least dependent
```

#### 2. Schema Mismatches

**Symptom**: `Unknown argument 'fieldName'` or `Argument 'fieldName' is missing`

**Cause**: Seed code doesn't match current Prisma schema

**Solution**:

1. Run `npm run db:generate` to regenerate Prisma client
2. Check schema for correct field names and required fields
3. Update seed code to match schema

```typescript
// Check your schema.prisma
model Asset {
  purchaseCost Float?  // ← Use purchaseCost, not purchasePrice
  currency     String?
  condition    String?  // ← Use condition, not status
}
```

#### 3. TypeScript Errors in Factories

**Symptom**: Type errors in factory files

**Cause**: Factory interfaces out of sync with generated Prisma types

**Solution**:

1. Run `npm run db:generate`
2. Update factory interfaces to match generated types
3. Import enums from `@/generated/prisma/enums`

```typescript
import { WarrantyCoverageType } from "@/generated/prisma/enums";

export interface WarrantyFactoryOptions {
  coverageType: WarrantyCoverageType; // Use enum, not string literal
  // ...
}
```

#### 4. Missing Prerequisites

**Symptom**: `Required entities not found` or `Cannot read properties of undefined`

**Cause**: Seeders run in wrong order, dependencies not met

**Solution**: Ensure correct seeding order in `seed.ts`:

```typescript
1. seedRBAC()                       // No dependencies
2. seedFoundation(prisma)           // Requires RBAC (for roles)
3. seedAssets(prisma)               // Requires Foundation (vendors, persons, lifecycle)
4. seedWarrantiesMaintenance(prisma)// Requires Assets
5. seedCMDB(prisma)                 // No dependencies (just relationship types)
6. seedLayer3ITAM(prisma)           // Requires Assets, Persons, CMDB types
7. seedPrompts(prisma)              // No dependencies
```

#### 5. Cached tsx Process

**Symptom**: Old error messages after fixing code

**Cause**: tsx watch mode caches outdated file versions

**Solution**:

```bash
# Kill tsx process
pkill -f tsx

# Clear cache and reset
npm run cache:clear:all

# Or just reset database
npm run reset
```

#### 6. Duplicate Key Errors

**Symptom**: `Unique constraint failed on the fields: X`

**Cause**: Seed not properly cleaned before re-running

**Solution**:

```bash
# Use reset instead of seed for full cleanup
npm run reset

# Or manually clear database
npm run db:push -- --force-reset
npm run db:seed
```

### Debugging Tips

1. **Add Logging**: Use `logStep()` and `logSuccess()` liberally

   ```typescript
   logStep("🔍", "Checking prerequisites...");
   console.log(`Found ${assets.length} assets`);
   ```

2. **Check Entity Counts**: Verify data was created

   ```typescript
   const count = await prisma.asset.count();
   logSuccess(`Verified ${count} assets exist`);
   ```

3. **Prisma Studio**: Inspect database visually

   ```bash
   npm run db:studio
   ```

4. **Verbose Logs**: Enable Prisma query logging

   ```bash
   # .env.local
   PRISMA_VERBOSE_LOGS=true
   ```

5. **Test Individual Seeders**: Comment out other seeders in `seed.ts`
   ```typescript
   // await seedAssets(prisma);        // Skip
   await seedWarrantiesMaintenance(prisma); // Test this one
   // await seedLayer3ITAM(prisma);    // Skip
   ```

### Performance Tips

1. **Use `createMany()` for bulk inserts**:

   ```typescript
   // ✅ GOOD - Single query
   await prisma.lifecycleState.createMany({ data: states });

   // ❌ BAD - Multiple queries
   for (const state of states) {
     await prisma.lifecycleState.create({ data: state });
   }
   ```

2. **Batch related operations**:

   ```typescript
   // Create all vendors first, then contacts
   await seedVendors();
   await seedVendorContacts();
   ```

3. **Avoid N+1 queries**: Fetch related data once

   ```typescript
   // ✅ GOOD
   const assets = await prisma.asset.findMany({
     include: { assetModel: { include: { vendor: true } } },
   });

   // ❌ BAD - Fetches vendor for each asset
   for (const asset of assets) {
     const model = await prisma.assetModel.findUnique({
       where: { id: asset.assetModelId },
       include: { vendor: true },
     });
   }
   ```

---

## Advanced Topics

### Custom Seed Data for Environments

```typescript
// seed-config-assets.ts (or appropriate domain file)
const isDevelopment = process.env.NODE_ENV === "development";

export const ASSET_MODEL_DATA = [
  {
    name: isDevelopment ? "Dell Latitude 7440" : "Test Laptop",
    code: "DELL-LAT-7440",
    // ... more development-specific details
  },
  // ...
];

// seed-config.ts
export const SEED_QUANTITIES = {
  ASSETS_PER_CATEGORY: {
    LAPTOP: isDevelopment ? 15 : 3, // Fewer in test env
    DESKTOP: isDevelopment ? 8 : 2,
    // ...
  },
};
```

### Conditional Seeding

```typescript
// seed.ts
const seedMode = process.env.SEED_MODE || "full";

if (seedMode === "rbac-only") {
  await seedRBAC();
} else if (seedMode === "minimal") {
  await seedRBAC();
  await seedFoundation(prisma);
} else {
  // Full seed
  await seedRBAC();
  await seedFoundation(prisma);
  await seedAssets(prisma);
  // ...
}
```

### Seed Data Versioning

```typescript
// seed-config.ts
export const SEED_VERSION = "2.0.0";

// seed.ts
console.log(`Seeding version: ${SEED_VERSION}`);
```

---

## Related Documentation

- [PRISMA_GUIDE.md](./PRISMA_GUIDE.md) - Prisma usage patterns, connection pooling
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - Schema migrations workflow
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - General development guide
- [RBAC_ARCHITECTURE.md](../architecture/RBAC_ARCHITECTURE.md) - RBAC system design

---

## Summary

The Barq Assets seed system provides:

✅ **DRY & SOLID**: No code duplication, clear separation of concerns
✅ **Type-Safe**: Full TypeScript with Prisma generated types
✅ **Domain-Split Configuration**: Data organized by business domain for better maintainability
✅ **Batch Factory Functions**: High-performance batch operations for foundation entities
✅ **Maintainable**: Modular configuration, shared utilities, reusable factories
✅ **Realistic**: Enterprise-grade sample data
✅ **Layered**: Respects domain architecture and dependencies
✅ **Idempotent**: Safe to re-run, centralized cleanup
✅ **Extensible**: Easy to add new entities and data

**Total seed data**: 200+ entities across 32+ tables in ~15 seconds.
