# Data Governance & Verification System

**Complete guide to data governance, ownership tracking, and verification campaigns for SAMA compliance**

## Overview

The Governance System provides comprehensive data classification, ownership tracking, and verification workflows to ensure compliance with Saudi Central Bank (SAMA) regulations and support regulatory audits. This module enables Barq to maintain proper data governance, track data ownership, and conduct regular verification campaigns for both Configuration Items (CIs) and physical Assets.

**Key Capabilities**:

- Define data domains for classification (e.g., "Customer PII", "Financial Records", "Transaction Data")
- Assign ownership of data domains to CI classes or asset categories
- Track data stewards (Person or Organization Unit)
- Schedule and manage verification campaigns for compliance audits
- Track verification status of individual items (PENDING → IN_PROGRESS → VERIFIED/EXCEPTION)
- Support regulatory requirements (SAMA, GDPR, PCI-DSS compliance)

**Status**: ✅ **Backend Complete** - Production-ready API, business logic, and domain models implemented.

---

## Why Barq Needs This

As a Saudi financial services company regulated by SAMA (Saudi Central Bank), Barq must:

1. **Regulatory Compliance**: Meet SAMA's data governance and classification requirements
2. **Audit Readiness**: Maintain clear ownership and verification trails for regulatory audits
3. **Data Protection**: Classify and protect sensitive customer data (PII, financial records)
4. **Risk Management**: Identify and track critical data assets and their custodians
5. **Operational Transparency**: Know who owns what data and where it resides
6. **Periodic Verification**: Conduct regular verification campaigns to ensure data accuracy

### Saudi Financial Services Context

**Example Data Domains for Barq**:

- `CUSTOMER_PII` - Personal identifiable information (national ID, contact details)
- `FINANCIAL_TRANSACTIONS` - Payment and transfer records
- `KYC_DATA` - Know Your Customer documentation
- `SAMA_REPORTING` - Data used for SAMA regulatory reports
- `AUDIT_LOGS` - System access and transaction logs
- `INTERNAL_OPERATIONS` - Non-regulated business data

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
│  • DataDomainController (5 actions) ✅                       │
│  • DataOwnershipController (5 actions) ✅                    │
│  • VerificationCampaignController (7 actions) ✅             │
│  • VerificationItemController (7 actions) ✅                 │
│  • Zod validation schemas ✅                                 │
│  • DTOs & Presenters ✅                                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Cases Layer                         │
│  DataDomain: Create, Get, List, Update, Delete (5) ✅        │
│  DataOwnership: Create, Get, List, Update, Delete (5) ✅     │
│  VerificationCampaign: CRUD + Start + Complete (7) ✅        │
│  VerificationItem: CRUD + Verify + FlagException (7) ✅      │
│  Total: 24 use cases ✅                                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  • DataDomain Entity (business rules) ✅                     │
│  • DataOwnership Entity (polymorphic constraints) ✅         │
│  • VerificationCampaign Entity (workflow logic) ✅           │
│  • VerificationItem Entity (status transitions) ✅           │
│  • Repository Interfaces ✅                                  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  • PrismaDataDomainRepository ✅                             │
│  • PrismaDataOwnershipRepository ✅                          │
│  • PrismaVerificationCampaignRepository ✅                   │
│  • PrismaVerificationItemRepository ✅                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. DataDomain Model

```prisma
model DataDomain {
  id          String   @id @default(cuid())
  name        String   @unique              // "Customer PII"
  code        String   @unique              // "CUSTOMER_PII"
  description String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  dataOwnerships DataOwnership[]

  // Indexes
  @@index([code])
  @@index([isActive])
  @@map("data_domains")
}
```

**Purpose**: Defines logical data classifications for governance and compliance.

**Validations**:
- Name: Required, max 255 characters, unique
- Code: Optional (auto-generated if empty), max 50 characters, uppercase, alphanumeric + hyphens/underscores, unique
- Description: Optional, max 2000 characters

### 2. DataOwnership Model

```prisma
model DataOwnership {
  id              String   @id @default(cuid())
  dataDomainId    String

  // Polymorphic target: EITHER CI class OR asset category
  ciClassId       String?
  assetCategoryId String?

  // Polymorphic owner: EITHER person OR org unit (optional)
  ownerPersonId   String?
  ownerOrgUnitId  String?

  note            String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  dataDomain    DataDomain        @relation(fields: [dataDomainId], references: [id], onDelete: Cascade)
  ciClass       CIClass?          @relation(fields: [ciClassId], references: [id], onDelete: Cascade)
  assetCategory AssetCategory?    @relation(fields: [assetCategoryId], references: [id], onDelete: Cascade)
  ownerPerson   Person?           @relation("DataOwnershipPerson", fields: [ownerPersonId], references: [id], onDelete: SetNull)
  ownerOrgUnit  OrganizationUnit? @relation("DataOwnershipOrgUnit", fields: [ownerOrgUnitId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([dataDomainId])
  @@index([ciClassId])
  @@index([assetCategoryId])
  @@index([ownerPersonId])
  @@index([ownerOrgUnitId])
  @@map("data_ownerships")
}
```

**Purpose**: Maps data domains to CI classes or asset categories, with optional ownership assignment.

**Polymorphic Constraints**:
1. **Target**: Exactly one of `ciClassId` OR `assetCategoryId` (not both, not neither)
2. **Owner**: At most one of `ownerPersonId` OR `ownerOrgUnitId` (owner is optional)

**Example**:
```
DataDomain "Customer PII" → CIClass "Database Server" → Owner: Person "Database Administrator"
DataDomain "Financial Data" → AssetCategory "Server" → Owner: OrgUnit "Finance Department"
```

### 3. VerificationCampaign Model

```prisma
model VerificationCampaign {
  id               String               @id @default(cuid())
  name             String
  description      String?              @db.Text
  targetType       TargetObjectTypeEnum // CI or ASSET
  filterDefinition Json?                // Selection rules (by class, category, location, etc.)
  scheduledStart   DateTime
  scheduledEnd     DateTime?
  createdById      String
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  // Relations
  createdBy Person             @relation(fields: [createdById], references: [id], onDelete: Restrict)
  items     VerificationItem[]

  // Indexes
  @@index([targetType])
  @@index([createdById])
  @@index([scheduledStart, scheduledEnd])
  @@map("verification_campaigns")
}
```

**Purpose**: Schedules and manages verification activities across multiple CIs or Assets.

**Fields**:
- `targetType`: CI (Configuration Items) or ASSET (Physical Assets)
- `filterDefinition`: JSON rules for selecting targets (e.g., `{ "ciClassId": "db-servers", "environment": "PROD" }`)
- `scheduledStart`/`scheduledEnd`: Campaign timeframe

### 4. VerificationItem Model

```prisma
model VerificationItem {
  id                     String                 @id @default(cuid())
  verificationCampaignId String
  targetType             TargetObjectTypeEnum   // CI or ASSET
  targetId               String                 // ID of CI or Asset
  verifierPersonId       String?                // Person performing verification
  status                 VerificationStatusEnum
  verifiedAt             DateTime?
  comment                String?                @db.Text
  createdAt              DateTime               @default(now())
  updatedAt              DateTime               @updatedAt

  // Relations
  verificationCampaign VerificationCampaign @relation(fields: [verificationCampaignId], references: [id], onDelete: Cascade)
  verifierPerson       Person?              @relation(fields: [verifierPersonId], references: [id], onDelete: SetNull)

  // Indexes
  @@index([verificationCampaignId])
  @@index([targetType, targetId])
  @@index([verifierPersonId])
  @@index([status])
  @@index([verifiedAt])
  @@map("verification_items")
}
```

**Purpose**: Tracks verification status of individual CIs or Assets within a campaign.

### Enums

```typescript
enum TargetObjectTypeEnum {
  CI    // Configuration Item
  ASSET // Physical Asset
}

enum VerificationStatusEnum {
  PENDING      // Not yet started
  IN_PROGRESS  // Verification in progress
  VERIFIED     // Successfully verified
  EXCEPTION    // Issue found, needs attention
}
```

---

## Domain Entities

### 1. DataDomain Entity

**Business Rules**:

```typescript
class DataDomain {
  // Validations
  - Name: Required, max 255 chars
  - Code: Optional (auto-generated if empty), max 50 chars, uppercase, alphanumeric + hyphens/underscores
  - Code is automatically converted to uppercase

  // Methods
  activate(): void           // Set isActive = true
  deactivate(): void         // Set isActive = false
  updateCode(code: string): void  // Change code with validation
}
```

**Usage**:
```typescript
const domain = DataDomain.create({
  name: "Customer PII",
  code: "CUSTOMER_PII",
  description: "Personal identifiable information for customers",
  isActive: true,
});
```

### 2. DataOwnership Entity

**Business Rules**:

```typescript
class DataOwnership {
  // Polymorphic Constraints
  - Must have EITHER ciClassId OR assetCategoryId (not both)
  - May have EITHER ownerPersonId OR ownerOrgUnitId (not both, owner optional)

  // Setters enforce mutual exclusivity
  set ciClassId(value)       // Auto-clears assetCategoryId
  set assetCategoryId(value) // Auto-clears ciClassId
  set ownerPersonId(value)   // Auto-clears ownerOrgUnitId
  set ownerOrgUnitId(value)  // Auto-clears ownerPersonId

  // Query methods
  hasOwner(): boolean              // Owner assigned?
  isOwnedByPerson(): boolean       // Owned by person?
  isOwnedByOrgUnit(): boolean      // Owned by org unit?
  appliesToCIClass(): boolean      // Applies to CI class?
  appliesToAssetCategory(): boolean // Applies to asset category?

  // Assignment helpers
  assignOwner(type: "person" | "orgunit", id: string): void
  setTarget(type: "ciClass" | "assetCategory", id: string): void
}
```

**Usage**:
```typescript
const ownership = DataOwnership.create({
  dataDomainId: "domain-123",
  ciClassId: "db-server-class",      // Applies to DB server CI class
  ownerPersonId: "dba-person-id",    // Owned by DBA person
  note: "Database administrator owns customer PII data",
});
```

### 3. VerificationCampaign Entity

**Business Rules**:

```typescript
class VerificationCampaign {
  // Validations
  - Name: Required, max 255 chars
  - Scheduled start: Required, must be valid date
  - Scheduled end: Must be after start date (if provided)

  // Status checks
  isActive(asOfDate?: Date): boolean     // Campaign is active on date?
  isCompleted(): boolean                 // Past scheduled end date?
  hasStarted(): boolean                  // Past scheduled start date?

  // Workflow actions
  start(): void       // Start campaign (updates scheduledStart to now)
  complete(): void    // Complete campaign (sets scheduledEnd to now)
  updateSchedule(start: Date, end?: Date): void  // Reschedule

  // Validation rules
  - Cannot start a campaign that already started
  - Cannot complete a campaign that hasn't started
  - Cannot complete an already completed campaign
}
```

**Usage**:
```typescript
const campaign = VerificationCampaign.create({
  name: "Q4 2024 Asset Verification",
  description: "Quarterly verification of all production assets",
  targetType: "ASSET",
  filterDefinition: { environment: "PROD", locationId: "datacenter-riyadh" },
  scheduledStart: new Date("2024-10-01"),
  scheduledEnd: new Date("2024-10-31"),
  createdById: "manager-id",
});

// Start campaign
campaign.start();

// Complete campaign
campaign.complete();
```

### 4. VerificationItem Entity

**Business Rules**:

```typescript
class VerificationItem {
  // Status checks
  isPending(): boolean
  isInProgress(): boolean
  isVerified(): boolean
  isException(): boolean

  // Workflow transitions
  startVerification(verifierPersonId: string): void
    // PENDING → IN_PROGRESS
    // Assigns verifier, updates status

  verify(comment?: string): void
    // IN_PROGRESS → VERIFIED
    // Sets verifiedAt timestamp, optional comment

  flagException(comment: string): void
    // IN_PROGRESS → EXCEPTION
    // Requires comment explaining the issue
    // Sets verifiedAt timestamp

  // Validation rules
  - Can only start PENDING items
  - Can only verify or flag IN_PROGRESS items
  - Exception flag requires a comment
}
```

**Usage**:
```typescript
const item = VerificationItem.create({
  verificationCampaignId: "campaign-123",
  targetType: "CI",
  targetId: "db-server-ci-id",
  status: VerificationStatusEnum.PENDING,
});

// Assign verifier and start
item.startVerification("verifier-person-id");

// Mark as verified
item.verify("All fields validated, data accurate");

// OR flag as exception
item.flagException("Owner information outdated, requires update");
```

---

## Use Cases

### DataDomain Use Cases (5)

| Use Case | Description |
|----------|-------------|
| **CreateDataDomainUseCase** | Create new data domain classification |
| **GetDataDomainUseCase** | Retrieve data domain by ID |
| **ListDataDomainsUseCase** | List all data domains (with optional activeOnly filter) |
| **UpdateDataDomainUseCase** | Update data domain details |
| **DeleteDataDomainUseCase** | Delete data domain (cascade deletes ownerships) |

### DataOwnership Use Cases (5)

| Use Case | Description |
|----------|-------------|
| **CreateDataOwnershipUseCase** | Assign data domain to CI class or asset category |
| **GetDataOwnershipUseCase** | Retrieve ownership record by ID |
| **ListDataOwnershipsUseCase** | List ownership assignments (filterable) |
| **UpdateDataOwnershipUseCase** | Update ownership details (owner, target, note) |
| **DeleteDataOwnershipUseCase** | Remove ownership assignment |

### VerificationCampaign Use Cases (7)

| Use Case | Description |
|----------|-------------|
| **CreateVerificationCampaignUseCase** | Create new verification campaign |
| **GetVerificationCampaignUseCase** | Retrieve campaign by ID |
| **ListVerificationCampaignsUseCase** | List campaigns (filterable by target type, status) |
| **UpdateVerificationCampaignUseCase** | Update campaign details |
| **DeleteVerificationCampaignUseCase** | Delete campaign (cascade deletes items) |
| **StartVerificationCampaignUseCase** | Start campaign (sets start date to now) |
| **CompleteVerificationCampaignUseCase** | Complete campaign (sets end date to now) |

### VerificationItem Use Cases (7)

| Use Case | Description |
|----------|-------------|
| **CreateVerificationItemUseCase** | Add item to campaign for verification |
| **GetVerificationItemUseCase** | Retrieve verification item by ID |
| **ListVerificationItemsUseCase** | List items (filter by campaign, status) |
| **UpdateVerificationItemUseCase** | Update item details |
| **DeleteVerificationItemUseCase** | Remove item from campaign |
| **VerifyVerificationItemUseCase** | Mark item as VERIFIED |
| **FlagExceptionVerificationItemUseCase** | Mark item as EXCEPTION with comment |

---

## API Reference

### DataDomain Controllers

#### 1. Create Data Domain

```typescript
import { createDataDomain } from "@/interface-adapters/controllers/data-domain.controller";

const result = await createDataDomain({
  name: "Customer PII",
  code: "CUSTOMER_PII",  // Auto-uppercase
  description: "Personal identifiable information for customer accounts",
  isActive: true,
});

// Returns
{
  success: true,
  data: {
    id: "domain-123",
    name: "Customer PII",
    code: "CUSTOMER_PII",
    description: "...",
    isActive: true,
    createdAt: "2024-11-22T...",
    updatedAt: "2024-11-22T...",
  }
}
```

**Permission Required**: `DATA_DOMAINS_CREATE`

#### 2. List Data Domains

```typescript
import { listDataDomains } from "@/interface-adapters/controllers/data-domain.controller";

const result = await listDataDomains({ activeOnly: true });

// Returns
{
  success: true,
  data: [/* array of DataDomainDTO */]
}
```

**Permission Required**: `DATA_DOMAINS_VIEW`

#### 3. Update Data Domain

```typescript
import { updateDataDomain } from "@/interface-adapters/controllers/data-domain.controller";

const result = await updateDataDomain("domain-123", {
  description: "Updated description",
  isActive: false,  // Deactivate domain
});
```

**Permission Required**: `DATA_DOMAINS_UPDATE`

#### 4. Delete Data Domain

```typescript
import { deleteDataDomain } from "@/interface-adapters/controllers/data-domain.controller";

const result = await deleteDataDomain("domain-123");
// Cascade deletes all DataOwnership records
```

**Permission Required**: `DATA_DOMAINS_DELETE`

### DataOwnership Controllers

#### 1. Create Data Ownership

```typescript
import { createDataOwnership } from "@/interface-adapters/controllers/data-ownership.controller";

// Example 1: Assign to CI class with person owner
const result = await createDataOwnership({
  dataDomainId: "customer-pii-domain",
  ciClassId: "database-server-class",
  ownerPersonId: "dba-person-id",
  note: "DBA owns customer data in database servers",
});

// Example 2: Assign to asset category with org unit owner
const result2 = await createDataOwnership({
  dataDomainId: "financial-data-domain",
  assetCategoryId: "server-category",
  ownerOrgUnitId: "finance-dept",
  note: "Finance department owns financial data on servers",
});
```

**Permission Required**: `DATA_OWNERSHIPS_CREATE`

**Validation**:
- Must provide exactly ONE of: `ciClassId` OR `assetCategoryId`
- May provide at most ONE of: `ownerPersonId` OR `ownerOrgUnitId` (owner optional)

#### 2. List Data Ownerships

```typescript
import { listDataOwnerships } from "@/interface-adapters/controllers/data-ownership.controller";

const result = await listDataOwnerships({
  dataDomainId: "customer-pii-domain",  // Filter by domain
});
```

**Permission Required**: `DATA_OWNERSHIPS_VIEW`

### VerificationCampaign Controllers

#### 1. Create Verification Campaign

```typescript
import { createVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";

const result = await createVerificationCampaign({
  name: "Q4 2024 CI Verification",
  description: "Quarterly verification of all production CIs",
  targetType: "CI",
  filterDefinition: {
    environment: "PROD",
    ciClassIds: ["app-server", "db-server"],
    locationId: "riyadh-datacenter",
  },
  scheduledStart: new Date("2024-10-01"),
  scheduledEnd: new Date("2024-10-31"),
  createdById: "manager-id",
});
```

**Permission Required**: `VERIFICATION_CAMPAIGNS_CREATE`

#### 2. Start Verification Campaign

```typescript
import { startVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";

const result = await startVerificationCampaign("campaign-id");
// Sets scheduledStart to current timestamp
```

**Permission Required**: `VERIFICATION_CAMPAIGNS_START`

#### 3. Complete Verification Campaign

```typescript
import { completeVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";

const result = await completeVerificationCampaign("campaign-id");
// Sets scheduledEnd to current timestamp
```

**Permission Required**: `VERIFICATION_CAMPAIGNS_COMPLETE`

### VerificationItem Controllers

#### 1. Create Verification Item

```typescript
import { createVerificationItem } from "@/interface-adapters/controllers/verification-item.controller";

const result = await createVerificationItem({
  verificationCampaignId: "campaign-123",
  targetType: "CI",
  targetId: "db-server-ci-001",
  status: "PENDING",  // Default
});
```

**Permission Required**: `VERIFICATION_ITEMS_VIEW`

#### 2. Verify Item

```typescript
import { verifyVerificationItem } from "@/interface-adapters/controllers/verification-item.controller";

const result = await verifyVerificationItem({
  id: "item-123",
  comment: "All data validated, ownership confirmed",
});
// Transitions: IN_PROGRESS → VERIFIED
```

**Permission Required**: `VERIFICATION_ITEMS_VERIFY`

#### 3. Flag Exception

```typescript
import { flagExceptionVerificationItem } from "@/interface-adapters/controllers/verification-item.controller";

const result = await flagExceptionVerificationItem({
  id: "item-123",
  comment: "Owner information is outdated, requires investigation",
});
// Transitions: IN_PROGRESS → EXCEPTION
```

**Permission Required**: `VERIFICATION_ITEMS_FLAG_EXCEPTION`

---

## Business Rules

### DataDomain Validation

1. **Name**: Required, max 255 characters, must be unique
2. **Code**: Optional (auto-generated if empty), max 50 characters, alphanumeric + hyphens/underscores, auto-uppercase, must be unique
3. **Description**: Optional, max 2000 characters
4. **isActive**: Boolean, defaults to true

### DataOwnership Validation

1. **Target Constraint**: Must provide **exactly one** of:
   - `ciClassId` (applies to CI class)
   - `assetCategoryId` (applies to asset category)

2. **Owner Constraint**: May provide **at most one** of:
   - `ownerPersonId` (person owner)
   - `ownerOrgUnitId` (organization unit owner)
   - Owner is **optional** (can be null)

3. **Mutual Exclusivity**: Setters enforce constraints:
   - Setting `ciClassId` auto-clears `assetCategoryId`
   - Setting `assetCategoryId` auto-clears `ciClassId`
   - Setting `ownerPersonId` auto-clears `ownerOrgUnitId`
   - Setting `ownerOrgUnitId` auto-clears `ownerPersonId`

### VerificationCampaign Status Transitions

```
Campaign Lifecycle:
┌─────────────────────────────────────────────────┐
│  PLANNED → ACTIVE → COMPLETED                   │
│  (before start) (start ≤ now < end) (past end)  │
└─────────────────────────────────────────────────┘

Actions:
- start(): Sets scheduledStart to now (can only start PLANNED campaigns)
- complete(): Sets scheduledEnd to now (can only complete ACTIVE campaigns)
```

### VerificationItem Status Transitions

```
Item Workflow:
┌──────────────────────────────────────────────────┐
│  PENDING → IN_PROGRESS → VERIFIED                │
│                ↓                                  │
│           EXCEPTION                               │
└──────────────────────────────────────────────────┘

Transitions:
- startVerification(): PENDING → IN_PROGRESS
- verify(): IN_PROGRESS → VERIFIED
- flagException(): IN_PROGRESS → EXCEPTION

Rules:
- Can only start PENDING items
- Can only verify/flag IN_PROGRESS items
- Exception flag requires comment
```

---

## RBAC Permissions

### Complete Permission List (22 permissions)

#### Data Domains (5 permissions)

```typescript
PERMISSIONS.DATA_DOMAINS_VIEW      // "data-domains:view"
PERMISSIONS.DATA_DOMAINS_CREATE    // "data-domains:create"
PERMISSIONS.DATA_DOMAINS_UPDATE    // "data-domains:update"
PERMISSIONS.DATA_DOMAINS_DELETE    // "data-domains:delete"
PERMISSIONS.DATA_DOMAINS_MANAGE    // "data-domains:manage" (all actions)
```

#### Data Ownerships (5 permissions)

```typescript
PERMISSIONS.DATA_OWNERSHIPS_VIEW      // "data-ownerships:view"
PERMISSIONS.DATA_OWNERSHIPS_CREATE    // "data-ownerships:create"
PERMISSIONS.DATA_OWNERSHIPS_UPDATE    // "data-ownerships:update"
PERMISSIONS.DATA_OWNERSHIPS_DELETE    // "data-ownerships:delete"
PERMISSIONS.DATA_OWNERSHIPS_MANAGE    // "data-ownerships:manage" (all actions)
```

#### Verification Campaigns (7 permissions)

```typescript
PERMISSIONS.VERIFICATION_CAMPAIGNS_VIEW       // "verification-campaigns:view"
PERMISSIONS.VERIFICATION_CAMPAIGNS_CREATE     // "verification-campaigns:create"
PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE     // "verification-campaigns:update"
PERMISSIONS.VERIFICATION_CAMPAIGNS_DELETE     // "verification-campaigns:delete"
PERMISSIONS.VERIFICATION_CAMPAIGNS_START      // "verification-campaigns:start"
PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE   // "verification-campaigns:complete"
PERMISSIONS.VERIFICATION_CAMPAIGNS_MANAGE     // "verification-campaigns:manage" (all actions)
```

#### Verification Items (5 permissions)

```typescript
PERMISSIONS.VERIFICATION_ITEMS_VIEW            // "verification-items:view"
PERMISSIONS.VERIFICATION_ITEMS_UPDATE          // "verification-items:update"
PERMISSIONS.VERIFICATION_ITEMS_VERIFY          // "verification-items:verify"
PERMISSIONS.VERIFICATION_ITEMS_FLAG_EXCEPTION  // "verification-items:flag-exception"
PERMISSIONS.VERIFICATION_ITEMS_MANAGE          // "verification-items:manage" (all actions)
```

### Permission Implementation

```typescript
// Page level
export default async function DataDomainsPage() {
  await requirePermission(PERMISSIONS.DATA_DOMAINS_VIEW);
  // ... page content
}

// Controller level (server action)
export async function createDataDomain(data: CreateDataDomainDTO) {
  await requirePermission(PERMISSIONS.DATA_DOMAINS_CREATE);
  // ... create logic
}

// UI component level
<PermissionGuard permission={PERMISSIONS.DATA_DOMAINS_CREATE}>
  <Button onClick={handleCreate}>New Data Domain</Button>
</PermissionGuard>
```

---

## Examples

### Example 1: Setting Up Data Governance for Barq

**Step 1: Create Data Domains**

```typescript
// SAMA-regulated customer data
await createDataDomain({
  name: "Customer PII",
  code: "CUSTOMER_PII",
  description: "Personal identifiable information including national ID, contact details, and KYC documents",
});

// Financial transaction data
await createDataDomain({
  name: "Financial Transactions",
  code: "FINANCIAL_TX",
  description: "Payment, transfer, and transaction records subject to SAMA retention policies",
});

// Internal audit logs
await createDataDomain({
  name: "Audit Logs",
  code: "AUDIT_LOGS",
  description: "System access logs, transaction logs, and change audit trails",
});
```

**Step 2: Assign Ownership to CI Classes**

```typescript
// Database servers contain customer PII
await createDataOwnership({
  dataDomainId: "customer-pii-domain",
  ciClassId: "database-server-class",
  ownerPersonId: "database-administrator-id",
  note: "DBA is responsible for customer data in production databases",
});

// Application servers process financial transactions
await createDataOwnership({
  dataDomainId: "financial-tx-domain",
  ciClassId: "application-server-class",
  ownerOrgUnitId: "finance-department-id",
  note: "Finance department owns transaction processing applications",
});
```

**Step 3: Assign Ownership to Asset Categories**

```typescript
// Physical servers store audit logs
await createDataOwnership({
  dataDomainId: "audit-logs-domain",
  assetCategoryId: "server-category",
  ownerOrgUnitId: "compliance-department-id",
  note: "Compliance department owns audit log storage infrastructure",
});
```

### Example 2: Running a Quarterly Verification Campaign

**Scenario**: Barq needs to verify all production CIs quarterly for SAMA audit readiness.

**Step 1: Create Campaign**

```typescript
const campaign = await createVerificationCampaign({
  name: "Q4 2024 Production CI Verification",
  description: "Quarterly verification of all production CIs for SAMA compliance",
  targetType: "CI",
  filterDefinition: {
    environment: "PROD",
    criticality: ["HIGH", "CRITICAL"],
  },
  scheduledStart: new Date("2024-10-01T09:00:00"),
  scheduledEnd: new Date("2024-10-15T17:00:00"),
  createdById: "compliance-manager-id",
});
```

**Step 2: Populate Campaign with Items**

```typescript
// Get all production CIs matching filter
const prodCIs = await listConfigurationItems({
  environment: "PROD",
  criticality: ["HIGH", "CRITICAL"],
});

// Create verification item for each CI
for (const ci of prodCIs) {
  await createVerificationItem({
    verificationCampaignId: campaign.data.id,
    targetType: "CI",
    targetId: ci.id,
    status: "PENDING",
  });
}
```

**Step 3: Start Campaign**

```typescript
await startVerificationCampaign(campaign.data.id);
```

**Step 4: Verifiers Process Items**

```typescript
// Verifier starts an item
const item = await getVerificationItem("item-123");
item.startVerification("verifier-person-id");  // PENDING → IN_PROGRESS

// Verification successful
await verifyVerificationItem({
  id: "item-123",
  comment: "CI data verified: owner confirmed, lifecycle state accurate, location validated",
});
// IN_PROGRESS → VERIFIED

// OR: Issue found
await flagExceptionVerificationItem({
  id: "item-456",
  comment: "Owner information is outdated - person transferred to different department",
});
// IN_PROGRESS → EXCEPTION
```

**Step 5: Monitor Progress**

```typescript
// Get campaign stats
const items = await listVerificationItems({ campaignId: campaign.data.id });

const stats = {
  total: items.data.length,
  pending: items.data.filter(i => i.status === "PENDING").length,
  inProgress: items.data.filter(i => i.status === "IN_PROGRESS").length,
  verified: items.data.filter(i => i.status === "VERIFIED").length,
  exceptions: items.data.filter(i => i.status === "EXCEPTION").length,
};

// Dashboard: 150 items total
// - 10 pending
// - 5 in progress
// - 130 verified
// - 5 exceptions (requires follow-up)
```

**Step 6: Complete Campaign**

```typescript
await completeVerificationCampaign(campaign.data.id);
```

### Example 3: Tracking Data Ownership Across Infrastructure

**Scenario**: Compliance officer needs to know who owns customer PII data.

```typescript
// Query all ownerships for customer PII domain
const ownerships = await listDataOwnerships({
  dataDomainId: "customer-pii-domain",
});

// Result shows:
// - Database Server CI Class → Owner: Ahmad Al-Mansour (DBA)
// - CRM Application CI Class → Owner: Customer Service Department
// - Backup Storage Asset Category → Owner: IT Operations Department

// Generate compliance report
const report = ownerships.data.map(o => ({
  dataDomain: o.dataDomainName,
  appliesTo: o.ciClassName || o.assetCategoryName,
  owner: o.ownerPersonName || o.ownerOrgUnitName,
  note: o.note,
}));

// Export for SAMA audit
exportToCSV(report, "customer-pii-ownership-report.csv");
```

---

## Integration with Assets and CIs

### How Governance Integrates

```
┌──────────────────────────────────────────────────────────┐
│                    Data Governance                        │
│                                                           │
│  DataDomain (e.g., "Customer PII")                       │
│         ↓                                                 │
│  DataOwnership                                            │
│         ├─→ CIClass (e.g., "Database Server")            │
│         │        ↓                                        │
│         │   ConfigurationItem instances                   │
│         │   (all DB servers inherit ownership)           │
│         │                                                 │
│         └─→ AssetCategory (e.g., "Server")               │
│                  ↓                                        │
│             Asset instances                               │
│             (all servers inherit ownership)              │
│                                                           │
│  VerificationCampaign                                     │
│         ├─→ VerificationItem (targetType: CI)            │
│         │        ↓                                        │
│         │   Verifies specific ConfigurationItem          │
│         │                                                 │
│         └─→ VerificationItem (targetType: ASSET)         │
│                  ↓                                        │
│             Verifies specific Asset                       │
└──────────────────────────────────────────────────────────┘
```

### Example: Complete Integration Flow

```typescript
// 1. Define data classification
const piiDomain = await createDataDomain({
  name: "Customer PII",
  code: "CUSTOMER_PII",
});

// 2. Assign to CI class
const ownership = await createDataOwnership({
  dataDomainId: piiDomain.data.id,
  ciClassId: "database-server-class",
  ownerPersonId: "dba-id",
});

// 3. Create verification campaign for CIs in that class
const campaign = await createVerificationCampaign({
  name: "Customer PII Data Verification",
  targetType: "CI",
  filterDefinition: { ciClassId: "database-server-class" },
  scheduledStart: new Date(),
  createdById: "compliance-manager-id",
});

// 4. System auto-generates verification items for all CIs in class
const dbServerCIs = await listConfigurationItems({
  ciClassId: "database-server-class",
});

for (const ci of dbServerCIs) {
  await createVerificationItem({
    verificationCampaignId: campaign.data.id,
    targetType: "CI",
    targetId: ci.id,
  });
}

// 5. Verification team validates each CI
// Result: Compliance-ready audit trail of data ownership and verification
```

---

## DI Configuration

**Module**: `/home/user/barq-assets/src/di/modules/governance.module.ts`

**Registration**: `bindGovernanceDependencies(container)` in `/home/user/barq-assets/src/di/container.ts`

```typescript
// Repositories (Singleton Scope)
container.bind<IDataDomainRepository>(DI_TOKENS.IDataDomainRepository)
  .to(PrismaDataDomainRepository)
  .inSingletonScope();

container.bind<IDataOwnershipRepository>(DI_TOKENS.IDataOwnershipRepository)
  .to(PrismaDataOwnershipRepository)
  .inSingletonScope();

container.bind<IVerificationCampaignRepository>(DI_TOKENS.IVerificationCampaignRepository)
  .to(PrismaVerificationCampaignRepository)
  .inSingletonScope();

container.bind<IVerificationItemRepository>(DI_TOKENS.IVerificationItemRepository)
  .to(PrismaVerificationItemRepository)
  .inSingletonScope();

// Use Cases (Transient Scope)
// DataDomain: 5 use cases
container.bind<CreateDataDomainUseCase>(DI_TOKENS.CreateDataDomainUseCase)
  .to(CreateDataDomainUseCase)
  .inTransientScope();
// ... +4 more

// DataOwnership: 5 use cases
// VerificationCampaign: 7 use cases
// VerificationItem: 7 use cases
// Total: 24 use cases bound
```

---

## File Structure

```
src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── data-domain.entity.ts                    ✅
│   │   │   ├── data-ownership.entity.ts                 ✅
│   │   │   ├── verification-campaign.entity.ts          ✅
│   │   │   └── verification-item.entity.ts              ✅
│   │   └── value-objects/
│   │       └── permission-key.ts                        ✅ 22 permissions
│   ├── repositories/
│   │   ├── data-domain.repository.interface.ts          ✅
│   │   ├── data-ownership.repository.interface.ts       ✅
│   │   ├── verification-campaign.repository.interface.ts ✅
│   │   └── verification-item.repository.interface.ts    ✅
│   └── use-cases/
│       └── governance/
│           ├── data-domain/                              ✅ 5 use cases + index.ts
│           ├── data-ownership/                           ✅ 5 use cases + index.ts
│           ├── verification-campaign/                    ✅ 7 use cases + index.ts
│           └── verification-item/                        ✅ 7 use cases + index.ts
│
├── infrastructure/
│   ├── database/prisma/
│   │   └── schema.prisma                                ✅ 4 models + 2 enums
│   └── repositories/
│       ├── prisma-data-domain.repository.ts             ✅
│       ├── prisma-data-ownership.repository.ts          ✅
│       ├── prisma-verification-campaign.repository.ts   ✅
│       └── prisma-verification-item.repository.ts       ✅
│
├── interface-adapters/
│   ├── controllers/
│   │   ├── data-domain.controller.ts                    ✅ 5 actions
│   │   ├── data-ownership.controller.ts                 ✅ 5 actions
│   │   ├── verification-campaign.controller.ts          ✅ 7 actions
│   │   └── verification-item.controller.ts              ✅ 7 actions
│   ├── dtos/generated/
│   │   ├── data-domain.dto.ts                           ✅
│   │   ├── data-ownership.dto.ts                        ✅
│   │   ├── verification-campaign.dto.ts                 ✅
│   │   └── verification-item.dto.ts                     ✅
│   └── presenters/
│       ├── data-domain.presenter.ts                     ✅
│       ├── data-ownership.presenter.ts                  ✅
│       ├── verification-campaign.presenter.ts           ✅
│       └── verification-item.presenter.ts               ✅
│
└── di/
    └── modules/
        └── governance.module.ts                         ✅ All bindings
```

---

## Best Practices

### Data Domain Naming

**Format**: Use descriptive names that align with regulatory frameworks

```
Good Examples:
- "Customer PII"
- "Financial Transactions"
- "SAMA Regulatory Reports"
- "KYC Documentation"
- "Audit Logs"
- "Internal Operations"

Bad Examples:
- "Data Type 1"
- "Sensitive"
- "Important"
```

**Code Convention**: Uppercase with underscores

```
Good Examples:
- CUSTOMER_PII
- FINANCIAL_TX
- SAMA_REPORTS
- KYC_DOCS

Bad Examples:
- customer-pii (lowercase)
- CustomerPII (mixed case)
- customer_PII (inconsistent)
```

### Data Ownership Assignment

**Principle**: Assign ownership at the class/category level, not individual items

```
✅ Good:
DataOwnership → CIClass "Database Server" → Owner: DBA
  (all DB server CIs inherit this ownership)

❌ Bad:
Create separate DataOwnership for each individual DB server CI
  (maintenance nightmare, defeats purpose of classification)
```

### Verification Campaign Strategy

**Quarterly Verification**:
```typescript
// Q1: Verify all CRITICAL production CIs
filterDefinition: {
  environment: "PROD",
  criticality: "CRITICAL"
}

// Q2: Verify all HIGH/CRITICAL production CIs
filterDefinition: {
  environment: "PROD",
  criticality: ["HIGH", "CRITICAL"]
}

// Q3: Verify all production assets
targetType: "ASSET",
filterDefinition: {
  // Custom asset filters
}

// Q4: Full verification (all CIs and assets)
```

**Campaign Naming Convention**:
```
Format: [Period] [Scope] [Type] Verification

Examples:
- "Q4 2024 Production CI Verification"
- "Annual 2024 Asset Inventory Verification"
- "Monthly Customer PII Data Verification"
- "SAMA Audit Prep - Critical Systems Verification"
```

---

## Future Enhancements

### Ready for Implementation

1. **Auto-Population of Verification Items**
   ```typescript
   // Automatically create items based on filterDefinition
   const autoPopulateItems = await autoPopulateCampaign(campaignId);
   ```

2. **Verification Dashboard**
   - Campaign progress metrics
   - Exception tracking
   - Verifier performance stats
   - Compliance reports

3. **Notification System**
   - Email verifiers when items assigned
   - Reminder emails for pending items
   - Alert on exception flagged
   - Campaign completion notification

4. **Data Classification Hierarchy**
   ```typescript
   // Parent-child data domains
   FINANCIAL_DATA (parent)
   ├─ TRANSACTIONS
   ├─ ACCOUNT_BALANCES
   └─ INVESTMENT_RECORDS
   ```

5. **Automated Compliance Reports**
   ```typescript
   // Generate SAMA-compliant reports
   const report = await generateComplianceReport({
     dataDomainId: "customer-pii",
     period: "Q4-2024",
     format: "PDF",
   });
   ```

6. **Background Jobs**
   - Auto-start campaigns at scheduled time
   - Auto-complete campaigns at scheduled end
   - Send reminder emails for pending verifications
   - Generate weekly compliance digest

---

## Testing Scenarios

### Scenario 1: Basic Governance Setup

1. Create data domain
2. Verify domain appears in listing
3. Create ownership assignment to CI class
4. Verify ownership exists
5. Update ownership to change owner
6. Delete ownership
7. Delete data domain

### Scenario 2: Verification Workflow

1. Create verification campaign for CIs
2. Add verification items manually
3. Start campaign
4. Start verification on item (PENDING → IN_PROGRESS)
5. Verify item (IN_PROGRESS → VERIFIED)
6. Flag another item as exception (IN_PROGRESS → EXCEPTION)
7. Complete campaign
8. Verify campaign is completed

### Scenario 3: Polymorphic Constraints

1. Try to create ownership with both ciClassId AND assetCategoryId
   - Should fail validation
2. Try to create ownership with neither ciClassId nor assetCategoryId
   - Should fail validation
3. Try to create ownership with both ownerPersonId AND ownerOrgUnitId
   - Should fail validation
4. Create ownership with ciClassId and ownerPersonId
   - Should succeed
5. Update ownership to change from ciClassId to assetCategoryId
   - Should succeed, ciClassId should be nulled

---

## Future Enhancements

While core UI is implemented, the following enhancements are planned:

1. **Compliance Dashboard**
   - Data ownership coverage metrics
   - Verification campaign status
   - Exception tracking
   - Audit readiness score

2. **Advanced Visualizations**
   - Data ownership map visualization
   - Campaign progress charts
   - Compliance trend graphs

3. **Automation**
   - Auto-population of campaign items
   - Scheduled campaign creation
   - Automated verification reminders

---

## See Also

- [CMDB_GUIDE.md](./CMDB_GUIDE.md) - Configuration Management Database (integrates with verification)
- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Overview of all ITAM modules
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Clean Architecture implementation
- [DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md) - Schema design patterns
- [RBAC_DEVELOPER_GUIDE.md](./guides/RBAC_DEVELOPER_GUIDE.md) - Permission system
- [DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md) - Development patterns

---

## License & Credits

Part of the Barq Assets CMDB/ITAM system.
Built with Clean Architecture principles for SAMA compliance.
Technology: Next.js 16, Prisma 7, PostgreSQL, InversifyJS, Zod.
