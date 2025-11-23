# Warranty Management System

## Overview

The Warranty Management System provides comprehensive tracking and management of asset warranties, including automated expiration monitoring, multiple warranty support per asset, and third-party coverage tracking.

**Status**: ✅ **Backend Complete** - Production-ready API, business logic, and background jobs implemented.

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                  (UI Components - Pending)                   │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Interface Adapters                        │
│  • WarrantyController (8 server actions) ✅                  │
│  • WarrantyDTOs (Zod validation) ✅                          │
│  • WarrantyPresenter (Entity → DTO) ✅                       │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Cases Layer                         │
│  • CreateWarrantyUseCase ✅                                  │
│  • UpdateWarrantyUseCase ✅                                  │
│  • DeleteWarrantyUseCase ✅                                  │
│  • GetWarrantyUseCase ✅                                     │
│  • ListWarrantiesUseCase ✅                                  │
│  • ListWarrantiesByAssetUseCase ✅                           │
│  • GetActiveWarrantyForAssetUseCase ✅                       │
│  • ListExpiringWarrantiesUseCase ✅                          │
│  • CheckWarrantyExpirationUseCase ✅ (Background Job)        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  • Warranty Entity (business rules) ✅                       │
│  • IWarrantyRepository (interface) ✅                        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  • PrismaWarrantyRepository (PostgreSQL) ✅                  │
│  • Warranty Expiration Job Handler ✅                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Warranty Model

```prisma
model Warranty {
  id               String                 @id @default(cuid())
  assetId          String
  vendorId         String?                // Nullable for third-party warranties
  coverageType     WarrantyCoverageType   @default(STANDARD)
  coverageDetails  String?                @db.Text
  policyReference  String?                // Unique policy number
  slaDetails       Json?                  // SLA terms (response times, etc.)
  startDate        DateTime
  endDate          DateTime
  cost             Decimal?               @db.Decimal(12, 2)
  currency         String?
  note             String?                @db.Text
  metadata         Json?
  createdAt        DateTime               @default(now())
  updatedAt        DateTime               @updatedAt

  // Relations
  asset  Asset   @relation(fields: [assetId], references: [id], onDelete: Cascade)
  vendor Vendor? @relation(fields: [vendorId], references: [id], onDelete: SetNull)

  // Indexes for performance
  @@index([assetId])
  @@index([vendorId])
  @@index([startDate, endDate])
  @@index([endDate])           // Critical for expiration queries
  @@index([coverageType])
  @@map("warranties")
}
```

### Coverage Types

```typescript
enum WarrantyCoverageType {
  STANDARD           // Basic manufacturer warranty
  EXTENDED           // Extended warranty purchased
  ENHANCED           // Enhanced coverage
  PREMIUM            // Premium support package
  BASIC              // Basic coverage
  THIRD_PARTY        // Third-party warranty provider
  MANUFACTURER       // OEM warranty
  DEPOT              // Depot repair service
  ONSITE             // On-site service
  NEXT_BUSINESS_DAY  // Next business day response
}
```

---

## Domain Entity

### Warranty Business Rules

```typescript
class Warranty {
  // Status checks
  isActive(): boolean              // Currently valid?
  isExpired(): boolean             // Past end date?
  isExpiringSoon(days = 30): boolean  // Expiring within N days?

  // Calculations
  getDaysRemaining(): number       // Days until expiration (negative if expired)
  getDurationDays(): number        // Total warranty duration

  // Validation
  conflictsWith(other: Warranty): boolean  // Date overlap detection

  // Validation rules enforced
  - End date must be after start date
  - Maximum duration: 20 years
  - Policy reference max 200 chars
  - Cost >= 0, max 9999999999.99
  - Currency must be 3-letter ISO code (e.g., USD, EUR)
}
```

---

## API Reference

### Server Actions (Controllers)

All actions are permission-protected and support Next.js Server Actions pattern.

#### 1. Create Warranty

```typescript
import { createWarrantyAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await createWarrantyAction({
  assetId: "asset-123",
  vendorId: "vendor-456",           // Optional
  coverageType: "EXTENDED",
  startDate: new Date(),
  endDate: new Date("2025-12-31"),
  cost: 599.99,
  currency: "USD",
  policyReference: "WRN-2024-001",  // Optional but unique
  coverageDetails: "Full parts and labor",
  slaDetails: { responseTime: "4 hours", coverage: "24/7" },
  note: "Purchased with asset"
});

// Returns
{
  success: true,
  data: WarrantyDTO  // Includes computed fields
}
```

**Permission Required**: `WARRANTIES_CREATE`

#### 2. List Warranties

```typescript
import { listWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await listWarrantiesAction({
  status: "active",           // active | expired | future | expiring_soon
  assetId: "asset-123",      // Optional filter
  vendorId: "vendor-456",    // Optional filter
  coverageType: "EXTENDED",  // Optional filter
  searchTerm: "policy-ref",  // Search in policy, coverage, notes
  limit: 20,
  offset: 0
});

// Returns
{
  success: true,
  data: {
    warranties: WarrantyDTO[],
    total: number
  }
}
```

**Permission Required**: `WARRANTIES_VIEW`

#### 3. Get Warranty by ID

```typescript
const result = await getWarrantyAction("warranty-id");

// Returns full warranty details including:
{
  success: true,
  data: {
    ...warranty fields,
    // Computed fields
    isActive: boolean,
    isExpired: boolean,
    isExpiringSoon: boolean,
    daysRemaining: number,
    durationDays: number
  }
}
```

#### 4. Get Active Warranty for Asset

```typescript
import { getActiveWarrantyForAssetAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await getActiveWarrantyForAssetAction("asset-123");

// Returns the currently active warranty or null
{
  success: true,
  data: WarrantyDTO | null
}
```

#### 5. List Warranties by Asset

```typescript
import { listWarrantiesByAssetAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await listWarrantiesByAssetAction("asset-123");

// Returns ALL warranties for the asset (past, current, future)
{
  success: true,
  data: WarrantyDTO[]
}
```

#### 6. List Expiring Warranties

```typescript
import { listExpiringWarrantiesAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await listExpiringWarrantiesAction(30); // Days

// Returns warranties expiring in next 30 days
{
  success: true,
  data: WarrantyDTO[]
}
```

#### 7. Update Warranty

```typescript
import { updateWarrantyAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await updateWarrantyAction("warranty-id", {
  endDate: new Date("2026-12-31"), // Extend warranty
  cost: 799.99,
  note: "Warranty extended",
});
```

**Permission Required**: `WARRANTIES_UPDATE`

#### 8. Delete Warranty

```typescript
import { deleteWarrantyAction } from "@/interface-adapters/controllers/warranty.controller";

const result = await deleteWarrantyAction("warranty-id");
```

**Permission Required**: `WARRANTIES_DELETE`

---

## Background Jobs

### Warranty Expiration Check

**Job**: `MAINTENANCE_JOBS.WARRANTY_EXPIRATION_CHECK`
**Queue**: `MAINTENANCE`
**Schedule**: Daily (recommended: 9 AM)
**Handler**: `handleWarrantyExpirationCheck`

#### What It Does

1. Scans all warranties expiring in next 90 days
2. Categorizes by severity:
   - **Critical**: ≤ 7 days remaining
   - **Warning**: 8-30 days remaining
   - **Info**: 31-90 days remaining
3. Logs alert summary with detailed information
4. (Future) Sends email notifications to asset managers

#### Scheduling

Add to your task scheduler (e.g., cron, BullMQ scheduler):

```typescript
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IQueueService } from "@/core/services";
import { MAINTENANCE_JOBS } from "@/core/domain/jobs/job-names";

// Schedule daily at 9 AM
const queueService = container.get<IQueueService>(DI_TOKENS.IQueueService);

await queueService.scheduleJob(
  MAINTENANCE_JOBS.WARRANTY_EXPIRATION_CHECK,
  { triggeredAt: new Date().toISOString() },
  {
    repeat: {
      pattern: "0 9 * * *", // Every day at 9 AM
    },
  },
);
```

#### Log Output Example

```json
{
  "level": "warn",
  "context": "WarrantyExpirationCheck",
  "message": "Critical warranty expirations detected",
  "data": {
    "jobId": "job-123",
    "count": 3,
    "alerts": [
      {
        "assetId": "asset-456",
        "warrantyId": "warranty-789",
        "policyReference": "WRN-2024-001",
        "daysRemaining": 5,
        "endDate": "2024-11-26T00:00:00.000Z"
      }
    ]
  }
}
```

---

## RBAC Permissions

### Permission Keys

```typescript
PERMISSIONS.WARRANTIES_VIEW; // "warranties:view"
PERMISSIONS.WARRANTIES_CREATE; // "warranties:create"
PERMISSIONS.WARRANTIES_UPDATE; // "warranties:update"
PERMISSIONS.WARRANTIES_DELETE; // "warranties:delete"
PERMISSIONS.WARRANTIES_MANAGE; // "warranties:manage" (all actions)
```

### Default Role Assignments

- **Admin**: All warranty permissions
- **Manager**: View, Create, Update (configured in seed data)
- **Viewer**: View only

---

## Use Cases

### Example 1: Create Extended Warranty

```typescript
// When purchasing extended warranty for a laptop
await createWarrantyAction({
  assetId: laptop.id,
  vendorId: warrantyProvider.id,
  coverageType: "EXTENDED",
  startDate: laptop.purchaseDate,
  endDate: new Date(
    laptop.purchaseDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000,
  ), // 3 years
  cost: 299.99,
  currency: "USD",
  policyReference: "EXT-LAP-2024-0001",
  coverageDetails: "3-year on-site service, parts & labor",
  slaDetails: {
    responseTime: "Next business day",
    coverage: "Business hours",
    phone: "1-800-WARRANTY",
  },
});
```

### Example 2: Track Third-Party Warranty

```typescript
// Asset purchased from one vendor, warranty from another
await createWarrantyAction({
  assetId: server.id,
  vendorId: thirdPartyInsurer.id, // Different from asset vendor
  coverageType: "THIRD_PARTY",
  startDate: new Date(),
  endDate: new Date("2027-12-31"),
  cost: 1499.99,
  currency: "USD",
  coverageDetails: "Comprehensive coverage including accidental damage",
  slaDetails: {
    responseTime: "4 hours",
    coverage: "24/7/365",
    replacementPolicy: "Advanced exchange",
  },
});
```

### Example 3: Dashboard Widget - Expiring Warranties

```typescript
// Show expiring warranties on dashboard
const expiring = await listExpiringWarrantiesAction(30);

if (expiring.success) {
  const critical = expiring.data.filter((w) => w.daysRemaining <= 7);
  const warning = expiring.data.filter(
    (w) => w.daysRemaining > 7 && w.daysRemaining <= 30,
  );

  // Display in dashboard widget
  return {
    critical: critical.length,
    warning: warning.length,
    items: expiring.data,
  };
}
```

---

## File Structure

```
src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── warranty.entity.ts                    ✅ Entity with business rules
│   │   └── jobs/
│   │       └── job-names.ts                          ✅ WARRANTY_EXPIRATION_CHECK added
│   ├── repositories/
│   │   └── warranty.repository.interface.ts          ✅ 20+ repository methods
│   └── use-cases/
│       └── asset/
│           └── warranty/
│               ├── create-warranty.use-case.ts       ✅
│               ├── update-warranty.use-case.ts       ✅
│               ├── delete-warranty.use-case.ts       ✅
│               ├── get-warranty.use-case.ts          ✅
│               ├── list-warranties.use-case.ts       ✅
│               ├── list-warranties-by-asset.use-case.ts     ✅
│               ├── get-active-warranty-for-asset.use-case.ts ✅
│               ├── list-expiring-warranties.use-case.ts     ✅
│               ├── check-warranty-expiration.use-case.ts    ✅
│               └── index.ts                          ✅
│
├── infrastructure/
│   ├── database/prisma/
│   │   ├── schema.prisma                             ✅ Warranty model
│   │   └── seed-rbac.ts                              ✅ Warranty permissions
│   ├── repositories/
│   │   └── prisma-warranty.repository.ts             ✅ Full implementation
│   └── services/queue/
│       ├── handlers/
│       │   ├── warranty-expiration-check.handler.ts  ✅
│       │   └── index.ts                              ✅
│       └── worker.ts                                 ✅ Handler registered
│
├── interface-adapters/
│   ├── controllers/
│   │   └── warranty.controller.ts                    ✅ 8 server actions
│   ├── dtos/generated/
│   │   └── warranty.dto.ts                           ✅ Zod schemas
│   └── presenters/
│       └── warranty.presenter.ts                     ✅ Entity → DTO
│
├── di/
│   ├── types.ts                                      ✅ 9 DI tokens
│   └── modules/
│       └── asset.module.ts                           ✅ All bindings
│
└── config/
    └── navigation.ts                                 ✅ Warranties menu item
```

---

## Testing

### Manual Testing via Server Actions

```typescript
// In a Next.js page or API route
import {
  createWarrantyAction,
  listWarrantiesAction,
} from "@/interface-adapters/controllers/warranty.controller";

// Create
const created = await createWarrantyAction({
  assetId: "your-asset-id",
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  coverageType: "STANDARD",
});

console.log("Created:", created);

// List
const list = await listWarrantiesAction({ limit: 10 });
console.log("Warranties:", list.data);
```

### Testing Background Job

```bash
# Start worker process
npm run worker:dev

# In another terminal, trigger job manually via BullMQ API
# Or wait for scheduled execution
```

---

## UI Implementation Status

### Implemented ✅

1. **Warranties CRUD Page** (`/app/(dashboard)/warranties/page.tsx`)
   - Full table view with TanStack Table
   - Create/Edit warranty forms
   - Delete confirmation
   - Status indicators (active/expired/expiring)
   - Pagination and search

2. **Core Components**
   - WarrantiesTable component with sorting and filtering
   - WarrantyForm with date pickers and vendor selection
   - Status badges and indicators

### Future Enhancements (Pending)

1. **Asset Warranty Panel**
   - Integration on asset detail page
   - List all warranties for specific asset
   - Quick add warranty button
   - Active warranty highlight

2. **Dashboard Widget**
   - Expiring warranties alert dashboard
   - Count by severity levels
   - Quick links to warranty details

3. **Advanced Features**
   - Warranty renewal workflow
   - Automated expiration notifications
   - Warranty cost analytics

---

## Migration from Legacy System

If migrating from `Asset.warrantyEndDate` field:

```typescript
// Script to migrate existing warranty data
const assets = await prisma.asset.findMany({
  where: {
    warrantyEndDate: { not: null },
  },
});

for (const asset of assets) {
  await prisma.warranty.create({
    data: {
      assetId: asset.id,
      vendorId: asset.vendorId,
      coverageType: "STANDARD",
      startDate: asset.purchaseDate || asset.createdAt,
      endDate: asset.warrantyEndDate!,
      note: "Migrated from legacy Asset.warrantyEndDate field",
    },
  });
}
```

**Note**: Keep `Asset.warrantyEndDate` field for backward compatibility during transition.

---

## Performance Considerations

### Indexes

All critical query paths are indexed:

- `assetId` - Fast asset warranty lookups
- `vendorId` - Vendor warranty reports
- `endDate` - Expiration queries (critical for background job)
- `startDate, endDate` - Active warranty queries
- `coverageType` - Filtering by type

### Repository Optimizations

- Singleton scope for repository (shared connection pool)
- Transient scope for use cases (stateless operations)
- Efficient date-based queries using database indexes

### Background Job Performance

- Runs during off-peak hours (9 AM default)
- Processes warranties in batches
- Logs to structured logger (searchable, filterable)
- Future: Add pagination for very large datasets

---

## Support & Troubleshooting

### Common Issues

**Q: Warranty creation fails with "Policy reference already exists"**
A: Policy references must be unique across all warranties. Either:

- Use a different policy reference
- Update the existing warranty instead

**Q: Background job not running**
A: Ensure:

1. Worker process is running (`npm run worker:dev`)
2. Redis is running and accessible
3. Job is scheduled correctly
4. Check logs for errors

**Q: Permission denied errors**
A: Verify user has appropriate warranty permissions:

- Check user roles
- Verify role has warranty permissions
- Re-seed RBAC if needed: `npm run seed:rbac`

---

## Changelog

### Version 1.0.0 (Current - Backend Complete)

**Added**:

- ✅ Complete warranty entity with business rules
- ✅ 9 use cases (CRUD + queries + expiration check)
- ✅ Prisma repository with 20+ methods
- ✅ 8 server action controllers
- ✅ RBAC with 5 permission levels
- ✅ Background job for expiration monitoring
- ✅ Zod validation schemas
- ✅ Entity presenter for DTOs
- ✅ Navigation menu integration
- ✅ DI container bindings

**Pending**:

- ⏳ UI components (forms, tables, cards)
- ⏳ Warranties CRUD pages
- ⏳ Asset warranty integration panels
- ⏳ Dashboard expiration widget
- ⏳ Email notification system

---

## License & Credits

Part of the Barq Assets CMDB/ITAM system.
Built with Clean Architecture principles.
Technology: Next.js 16, Prisma 7, PostgreSQL, BullMQ, InversifyJS.
