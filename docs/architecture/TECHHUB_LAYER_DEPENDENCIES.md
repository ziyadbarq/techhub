# TechHub Complete Layer Dependency Map

**Purpose**: Comprehensive technical reference for TechHub database layer dependencies. This document maps all entities, their dependencies, and the correct population order for initial data migration and demo seeding.

**Audience**: Technical teams (database administrators, backend engineers, migration script developers)

**Last Updated**: 2025-11-23

---

## Table of Contents

- [Overview](#overview)
- [Seeding Order Summary](#seeding-order-summary)
- [Layer Details](#layer-details)
  - [Layer 0: Infrastructure & Code Generation](#layer-0-infrastructure--code-generation)
  - [Layer 0.5: Authentication & RBAC](#layer-05-authentication--rbac)
  - [Layer 1: Foundation](#layer-1-foundation)
  - [Layer 2: CMDB Foundation](#layer-2-cmdb-foundation-metadata)
  - [Layer 2: Asset Management Foundation](#layer-2-asset-management-foundation)
  - [Layer 2: Business Processes](#layer-2-business-processes)
  - [Layer 3: Assets & Inventory](#layer-3-assets--inventory)
  - [Layer 3: CMDB Instances](#layer-3-cmdb-instances)
  - [Layer 3: Service Management](#layer-3-service-management)
  - [Layer 3: Contracts & Licenses](#layer-3-contracts--licenses)
  - [Layer 4: Advanced ITAM Features](#layer-4-advanced-itam-features)
  - [Layer 4: Governance](#layer-4-governance)
  - [Layer 4: Attachments & Audit](#layer-4-attachments--audit)
  - [Layer 5: AI Infrastructure](#layer-5-ai-infrastructure-optional)
- [Critical Migration Notes](#critical-migration-notes)
- [Demo vs Production Data](#demo-vs-production-data)

---

## Overview

TechHub uses a layered architecture where each layer builds upon the previous one. This document defines:

1. **Entity Dependencies**: What data must exist before creating each entity
2. **Required vs Optional Fields**: Minimum data needed vs nice-to-have fields
3. **Population Order**: Exact sequence for seeding/migration to avoid foreign key violations

**Key Principles**:
- No layer can be populated before its dependencies
- Within a layer, entities must be populated in dependency order
- Hierarchical data (self-referencing) requires bottom-up or deferred FK resolution
- Polymorphic relations have no database FK constraints (handled at application level)

---

## Seeding Order Summary

For data migration or demo seeding, populate in this **exact order**:

```
0.  CodeSequence (infrastructure for auto-generation)
1.  User, Account, Session, Verification (authentication)
2.  Permission, Role, RolePermission, UserRole (RBAC)
3.  LifecycleModel → LifecycleState → LifecycleTransition
4.  Vendor → VendorContact
5.  OrganizationUnit (bottom-up: level 4→3→2→1)
6.  Location (bottom-up: leaf→root)
7.  ExchangeRate
8.  FieldDefinition
9.  Person
10. CIClass → CIClassField
11. RelationshipType → RelationshipTypeScope
12. AssetCategory → AssetCategoryField
13. AssetModel
14. StockLocation
15. BusinessProcess
16. Asset
17. StockMovement, AssetAssignment
18. Warranty, MaintenanceSchedule → MaintenanceRecord
19. ConfigurationItem → CIRelationship
20. Service → ServiceOwnership, ServiceInfrastructure, ServiceAsset
21. ContractType → Contract → ContractLinkedObject
22. LicenseProduct → LicenseProductField → LicenseEntitlement → LicenseAllocation
23. AssetDisposal → DisposalApproval, DisposalDocument
24. AssetKit → AssetKitItem → AssetKitCheckout → AssetKitCheckoutItem
25. AssetReservation → AssetReservationConflict
26. DataDomain → DataOwnership
27. VerificationCampaign → VerificationItem
28. AttachmentType → Attachment
29. AuditLogEntry
31. Task (example CRUD, optional)
```

---

## Layer Details

### Layer 0: Infrastructure & Code Generation

**Purpose**: System utilities for auto-generation of unique codes/tags
**Dependencies**: None

#### CodeSequence

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entityType | String | ✅ | Entity type (e.g., "VENDOR", "ASSET_KIT", "ASSET") |
| prefix | String | ✅ | Code prefix (e.g., "VENDOR", "KIT", "ASSET") |
| lastNumber | Int | ✅ | Last generated number (starts at 0) |

**Notes**:
- Initialize before any entities that use auto-generated codes
- See `seed.ts` lines 97-123 for configuration

---

### Layer 0.5: Authentication & RBAC

**Purpose**: User authentication and role-based access control
**Dependencies**: None (foundation for all other layers)

#### Authentication (Better Auth)

**User**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| email | String | ✅ | None | Unique email address |
| name | String | ❌ | None | Full name |
| image | String | ❌ | None | Avatar URL |
| emailVerified | DateTime | ❌ | None | Email verification timestamp |
| lastLoginMethod | String | ❌ | None | 'email' or OAuth provider |
| lastLoginAt | DateTime | ❌ | None | Last login timestamp |

**Account**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| userId | String | ✅ | User | User reference |
| provider | String | ✅ | None | OAuth provider (microsoft, google, etc.) |
| providerAccountId | String | ✅ | None | Provider's user ID |
| refreshToken | String | ❌ | None | OAuth refresh token |
| accessToken | String | ❌ | None | OAuth access token |
| expiresAt | DateTime | ❌ | None | Token expiration |
| password | String | ❌ | None | Hashed password (email/password auth) |

**Session**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| userId | String | ✅ | User | User reference |
| sessionToken | String | ✅ | None | Unique session token |
| expires | DateTime | ✅ | None | Session expiration |
| ipAddress | String | ❌ | None | Client IP address |
| userAgent | String | ❌ | None | Client user agent |

**Verification**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| identifier | String | ✅ | None | Email or phone |
| value | String | ✅ | None | Verification token |
| expiresAt | DateTime | ✅ | None | Token expiration |

---

#### RBAC

**Permission**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Unique permission name (e.g., "ASSETS_VIEW") |
| displayName | String | ✅ | None | Human-readable name |
| resource | String | ✅ | None | Resource type (e.g., "ASSETS") |
| action | String | ✅ | None | Action type (e.g., "VIEW", "CREATE") |
| description | String | ❌ | None | Permission description |
| isSystem | Boolean | ❌ | None | System-managed permission |
| isActive | Boolean | ❌ | None | Active status |

**Role**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Unique role name (e.g., "admin", "asset_manager") |
| displayName | String | ✅ | None | Human-readable name |
| description | String | ❌ | None | Role description |
| parentId | String | ❌ | Role (self) | Parent role for hierarchy |
| isSystem | Boolean | ❌ | None | System-managed role |
| isActive | Boolean | ❌ | None | Active status |

**RolePermission**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| roleId | String | ✅ | Role | Role reference |
| permissionId | String | ✅ | Permission | Permission reference |

**UserRole**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| userId | String | ✅ | User | User reference |
| roleId | String | ✅ | Role | Role reference |
| expiresAt | DateTime | ❌ | None | Role expiration date |
| createdBy | String | ❌ | None | User ID who assigned role |

**AuditLog**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| action | String | ✅ | None | Action performed (CREATE, UPDATE, DELETE) |
| entityType | String | ✅ | None | Entity type affected |
| userId | String | ❌ | User | User who performed action |
| entityId | String | ❌ | None | Entity ID affected |
| changes | JSON | ❌ | None | Change details |
| metadata | JSON | ❌ | None | Additional metadata |
| ipAddress | String | ❌ | None | Client IP |

---

### Layer 1: Foundation

**Purpose**: Core organizational data (vendors, people, locations, lifecycle models)
**Dependencies**: Layer 0.5 (RBAC)

> **Note**: Person.title (from Intune) is the job title field. Roles are ONLY for RBAC (UserRole table for system permissions).

#### Lifecycle Management

**LifecycleModel**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Unique model name (e.g., "Asset Lifecycle") |
| description | String | ❌ | None | Model description |

**LifecycleState**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| lifecycleModelId | String | ✅ | LifecycleModel | Parent lifecycle model |
| name | String | ✅ | None | State name (e.g., "In Use", "Retired") |
| code | String | ✅ | None | Unique code within model |
| stateType | Enum | ✅ | None | INITIAL, ACTIVE, INACTIVE, TERMINAL, TRANSITION |
| sortOrder | Int | ✅ | None | Display order (1, 2, 3...) |
| description | String | ❌ | None | State description |
| isActiveState | Boolean | ❌ | None | If true, asset is in-use |
| isTerminalState | Boolean | ❌ | None | If true, end-of-life state |
| metadata | JSON | ❌ | None | Additional data |

**LifecycleTransition**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| lifecycleModelId | String | ✅ | LifecycleModel | Parent lifecycle model |
| name | String | ✅ | None | Transition name |
| fromStateId | String | ✅ | LifecycleState | Source state |
| toStateId | String | ✅ | LifecycleState | Target state |
| description | String | ❌ | None | Transition description |
| requiredRoleId | String | ❌ | Role | Role required to execute |
| requiresApproval | Boolean | ❌ | None | If approval workflow needed |
| approvalPolicy | JSON | ❌ | None | Approval rules |
| conditions | JSON | ❌ | None | Transition conditions |
| isAutomated | Boolean | ❌ | None | Automated transition flag |

---

#### Vendors

**Vendor**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Vendor name |
| code | String | ✅ | None | Unique vendor code (auto-generated) |
| legalName | String | ❌ | None | Legal business name |
| description | String | ❌ | None | Vendor description |
| vendorType | Enum | ❌ | None | MANUFACTURER, RESELLER, SERVICE_PROVIDER, etc. |
| taxId | String | ❌ | None | Tax/VAT ID |
| website | String | ❌ | None | Company website |
| email | String | ❌ | None | Primary email |
| phone | String | ❌ | None | Primary phone |
| address | String | ❌ | None | Street address |
| city | String | ❌ | None | City |
| state | String | ❌ | None | State/province |
| country | String | ❌ | None | Country |
| postalCode | String | ❌ | None | Postal/ZIP code |
| paymentTerms | String | ❌ | None | Payment terms |
| isPreferred | Boolean | ❌ | None | Preferred vendor flag |
| tags | String[] | ❌ | None | Vendor tags |
| note | String | ❌ | None | Internal notes |

**VendorContact**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| vendorId | String | ✅ | Vendor | Parent vendor |
| firstName | String | ✅ | None | Contact first name |
| lastName | String | ✅ | None | Contact last name |
| title | String | ❌ | None | Job title |
| email | String | ❌ | None | Email address |
| phone | String | ❌ | None | Phone number |
| mobile | String | ❌ | None | Mobile number |
| role | String | ❌ | None | Role (Account Manager, Support, etc.) |
| isPrimary | Boolean | ❌ | None | Primary contact flag |
| note | String | ❌ | None | Notes |

---

#### Organization Structure

**OrganizationUnit**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Unit name |
| code | String | ✅ | None | Unique code (auto-generated) |
| level | Int | ✅ | None | Hierarchy level (1=Company, 2=BU, 3=Dept, 4=Team) |
| parentId | String | ❌ | OrgUnit (self) | Parent unit |
| description | String | ❌ | None | Description |
| unitType | Enum | ❌ | None | COMPANY, BUSINESS_UNIT, DEPARTMENT, TEAM, etc. |
| managerId | String | ❌ | Person | Manager reference |
| costCenter | String | ❌ | None | Cost center code |
| note | String | ❌ | None | Notes |

**Notes**: Populate bottom-up (level 4 → 3 → 2 → 1) to avoid FK violations

**Location**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Location name |
| code | String | ✅ | None | Unique code (auto-generated) |
| locationType | Enum | ✅ | None | COUNTRY, CITY, CAMPUS, BUILDING, FLOOR, ROOM, RACK, etc. |
| parentId | String | ❌ | Location (self) | Parent location |
| description | String | ❌ | None | Description |
| address | String | ❌ | None | Street address |
| addressLine1 | String | ❌ | None | Address line 1 |
| addressLine2 | String | ❌ | None | Address line 2 |
| city | String | ❌ | None | City |
| state | String | ❌ | None | State/province |
| country | String | ❌ | None | Country |
| postalCode | String | ❌ | None | Postal code |
| latitude | Decimal | ❌ | None | GPS latitude |
| longitude | Decimal | ❌ | None | GPS longitude |
| timeZone | String | ❌ | None | Time zone |

**Notes**: Populate bottom-up (leaf → root) or use deferred FK resolution

---

#### People

**Person**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| firstName | String | ✅ | None | First name |
| lastName | String | ✅ | None | Last name |
| email | String | ✅ | None | Email address (can change) |
| orgUnitId | String | ✅ | OrganizationUnit | Organization unit |
| userId | String | ❌ | User | Optional link to auth user |
| azureAdId | String | ❌ | None | Immutable MS Graph ID (unique) |
| middleName | String | ❌ | None | Middle name |
| phone | String | ❌ | None | Phone number |
| mobile | String | ❌ | None | Mobile number |
| employeeId | String | ❌ | None | Employee ID |
| managerId | String | ❌ | Person (self) | Manager reference |
| title | String | ❌ | None | Job title (from Intune) |
| office | String | ❌ | None | Office location (from MS Graph) |
| locationId | String | ❌ | Location | Primary location |
| department | String | ❌ | None | Department name |
| hireDate | DateTime | ❌ | None | Hire date |
| terminationDate | DateTime | ❌ | None | Termination date |
| deletedAt | DateTime | ❌ | None | Soft delete timestamp |

---

#### Field Definitions (Metadata)

**FieldDefinition**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Internal name (e.g., "cpu_cores") |
| label | String | ✅ | None | Display label (e.g., "CPU Cores") |
| dataType | Enum | ✅ | None | STRING, TEXT, INTEGER, DECIMAL, BOOLEAN, DATE, etc. |
| entityType | String | ✅ | None | Target entity (CI, ASSET, LICENSE) |
| description | String | ❌ | None | Field description |
| isGlobal | Boolean | ❌ | None | Reusable across domains |
| isRequired | Boolean | ❌ | None | Required flag |
| isUnique | Boolean | ❌ | None | Unique constraint |
| validationRules | JSON | ❌ | None | Min/max, regex, etc. |
| defaultValue | JSON | ❌ | None | Default value |
| enumOptions | JSON | ❌ | None | Options for ENUM type |
| uiGroup | String | ❌ | None | UI group/tab |
| uiOrder | Int | ❌ | None | Display order |
| isSearchable | Boolean | ❌ | None | Searchable flag |
| isFilterable | Boolean | ❌ | None | Filterable flag |

---

#### Currency Support

**ExchangeRate**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| currency | String | ✅ | None | 3-letter ISO code (USD, EUR, GBP, SAR) |
| rateToSAR | Decimal | ✅ | None | Exchange rate to SAR (e.g., 1 USD = 3.75 SAR) |
| isActive | Boolean | ❌ | None | Active status |

**Notes**:
- SAR is the base currency (no ExchangeRate record needed)
- Store rates **to SAR** (not from SAR)
- See `MULTI_CURRENCY_GUIDE.md` for complete implementation

---

### Layer 2: CMDB Foundation (Metadata)

**Purpose**: CMDB class definitions and relationship types (metadata layer)
**Dependencies**: Layer 1 (LifecycleModel, FieldDefinition)

#### CIClass

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Unique class name (e.g., "Server", "Database") |
| code | String | ✅ | None | Unique code (auto-generated) |
| parentClassId | String | ❌ | CIClass (self) | Parent class for inheritance |
| description | String | ❌ | None | Class description |
| lifecycleModelId | String | ❌ | LifecycleModel | Lifecycle model reference |
| defaultCriticality | Enum | ❌ | None | LOW, MEDIUM, HIGH, CRITICAL |
| defaultEnvironment | Enum | ❌ | None | PROD, UAT, DEV, DR, TEST, OTHER |
| isDiscoverable | Boolean | ❌ | None | Auto-discovery flag |

#### CIClassField

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| ciClassId | String | ✅ | CIClass | Parent CI class |
| fieldDefinitionId | String | ✅ | FieldDefinition | Field definition reference |
| isRequired | Boolean | ❌ | None | Required flag |
| isUnique | Boolean | ❌ | None | Unique flag |
| isVisible | Boolean | ❌ | None | Visible in UI |
| defaultValue | JSON | ❌ | None | Default value |
| uiOrder | Int | ❌ | None | Display order |
| note | String | ❌ | None | Notes |

#### RelationshipType

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Relationship name (e.g., "Depends On") |
| code | String | ✅ | None | Unique code (auto-generated) |
| direction | Enum | ✅ | None | UNIDIRECTIONAL, BIDIRECTIONAL |
| description | String | ❌ | None | Description |
| isImpacting | Boolean | ❌ | None | If failure of "to" impacts "from" |

#### RelationshipTypeScope

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| relationshipTypeId | String | ✅ | RelationshipType | Relationship type |
| fromCiClassId | String | ✅ | CIClass | Source CI class |
| toCiClassId | String | ✅ | CIClass | Target CI class |
| note | String | ❌ | None | Notes |

---

### Layer 2: Asset Management Foundation

**Purpose**: Asset categories, models, and stock structure (metadata layer)
**Dependencies**: Layer 1 (LifecycleModel, Vendor, FieldDefinition, Location)

#### AssetCategory

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Category name (e.g., "Laptop", "Server") |
| code | String | ✅ | None | Unique code (auto-generated) |
| description | String | ❌ | None | Description |
| lifecycleModelId | String | ❌ | LifecycleModel | Lifecycle model reference |
| isConsumable | Boolean | ❌ | None | Consumable flag (cables, mice, etc.) |

#### AssetCategoryField

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetCategoryId | String | ✅ | AssetCategory | Parent asset category |
| fieldDefinitionId | String | ✅ | FieldDefinition | Field definition reference |
| isRequired | Boolean | ❌ | None | Required flag |
| isUnique | Boolean | ❌ | None | Unique flag |
| isVisible | Boolean | ❌ | None | Visible in UI |
| uiOrder | Int | ❌ | None | Display order |
| defaultValue | JSON | ❌ | None | Default value |

#### AssetModel

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetCategoryId | String | ✅ | AssetCategory | Asset category |
| vendorId | String | ✅ | Vendor | Vendor reference |
| name | String | ✅ | None | Model name (e.g., "Dell Latitude 7420") |
| code | String | ✅ | None | Unique code (auto-generated) |
| description | String | ❌ | None | Description |
| defaultWarrantyMonths | Int | ❌ | None | Default warranty period |
| defaultAttributes | JSON | ❌ | None | Default specs (RAM, CPU, etc.) |

#### StockLocation

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Stock location name |
| code | String | ✅ | None | Unique code (auto-generated) |
| locationId | String | ❌ | Location | Physical location reference |
| description | String | ❌ | None | Description |

---

### Layer 2: Business Processes

**Purpose**: Business process catalog for service alignment
**Dependencies**: None

#### BusinessProcess

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| code | String | ✅ | None | Unique code (e.g., "DIGITAL_PAYMENTS") |
| name | String | ✅ | None | Process name (e.g., "Digital Payments") |
| description | String | ❌ | None | Description |
| category | String | ❌ | None | Category (Core Banking, Channels, etc.) |
| metadata | JSON | ❌ | None | Additional data |

---

### Layer 3: Assets & Inventory

**Purpose**: Actual asset instances and inventory tracking
**Dependencies**: Layer 1 (Vendor, LifecycleState, Person), Layer 2 (AssetCategory, AssetModel, StockLocation), Layer 3 (Contract - optional)

#### Asset

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetTag | String | ✅ | None | Unique asset tag |
| assetCategoryId | String | ✅ | AssetCategory | Asset category |
| assetModelId | String | ❌ | AssetModel | Asset model |
| vendorId | String | ❌ | Vendor | Vendor reference |
| contractId | String | ❌ | Contract | Contract reference |
| lifecycleStateId | String | ❌ | LifecycleState | Lifecycle state |
| serialNumber | String | ❌ | None | Serial number (unique if provided) |
| purchaseDate | DateTime | ❌ | None | Purchase date |
| purchaseCost | Decimal | ❌ | None | Purchase cost |
| currency | String | ❌ | None | Currency code (USD, SAR, etc.) |
| depreciationModel | String | ❌ | None | Depreciation model |
| depreciationStart | DateTime | ❌ | None | Depreciation start date |
| depreciationEnd | DateTime | ❌ | None | Depreciation end date |
| warrantyEndDate | DateTime | ❌ | None | Warranty end date |
| condition | String | ❌ | None | Asset condition (NEW, GOOD, FAIR, POOR) |
| currentStockLocationId | String | ❌ | StockLocation | Current stock location |
| attributes | JSON | ❌ | None | Dynamic fields per AssetCategoryField |
| note | String | ❌ | None | Notes |
| deletedAt | DateTime | ❌ | None | Soft delete timestamp |

#### StockMovement

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| movementType | Enum | ✅ | None | IN, OUT, TRANSFER, ADJUSTMENT |
| performedById | String | ✅ | Person | Person who performed movement |
| stockLocationFromId | String | ❌ | StockLocation | Source location (for TRANSFER) |
| stockLocationToId | String | ❌ | StockLocation | Target location (for TRANSFER) |
| assetId | String | ❌ | Asset | Asset reference |
| quantity | Int | ❌ | None | Quantity (default 1) |
| reason | String | ❌ | None | Movement reason |
| occurredAt | DateTime | ❌ | None | Movement timestamp |

#### AssetAssignment

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| assigneeType | Enum | ✅ | None | PERSON, ORG_UNIT, LOCATION, CI |
| assigneeId | String | ✅ | Polymorphic | Assignee ID (no FK - polymorphic) |
| startDate | DateTime | ❌ | None | Assignment start date |
| endDate | DateTime | ❌ | None | Assignment end date |
| isPrimary | Boolean | ❌ | None | Primary assignment flag |
| conditionOnAssignment | String | ❌ | None | Condition when assigned |
| conditionOnReturn | String | ❌ | None | Condition when returned |
| note | String | ❌ | None | Notes |

**Notes**: assigneeId is polymorphic (Person.id, OrgUnit.id, Location.id, or CI.id based on assigneeType)

#### Warranty

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| coverageType | Enum | ✅ | None | STANDARD, EXTENDED, ENHANCED, PREMIUM, etc. |
| startDate | DateTime | ✅ | None | Warranty start date |
| endDate | DateTime | ✅ | None | Warranty end date |
| vendorId | String | ❌ | Vendor | Vendor reference (null for third-party) |
| coverageDetails | String | ❌ | None | Coverage details |
| policyReference | String | ❌ | None | Policy reference number |
| slaDetails | JSON | ❌ | None | SLA terms, response times, etc. |
| cost | Decimal | ❌ | None | Warranty cost |
| currency | String | ❌ | None | Currency code |
| note | String | ❌ | None | Notes |

#### MaintenanceSchedule

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| title | String | ✅ | None | Schedule title |
| scheduleType | String | ✅ | None | WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM |
| intervalValue | Int | ✅ | None | Interval value (default 1) |
| startDate | DateTime | ✅ | None | Schedule start date |
| nextDueDate | DateTime | ✅ | None | Next due date |
| description | String | ❌ | None | Description |
| assignedToId | String | ❌ | Person | Assigned person |
| estimatedDurationMinutes | Int | ❌ | None | Estimated duration |
| priority | String | ❌ | None | LOW, MEDIUM, HIGH, CRITICAL |
| instructions | String | ❌ | None | Maintenance instructions |

#### MaintenanceRecord

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| title | String | ✅ | None | Maintenance title |
| scheduledDate | DateTime | ✅ | None | Scheduled date |
| status | String | ✅ | None | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE |
| maintenanceScheduleId | String | ❌ | MaintenanceSchedule | Schedule reference |
| description | String | ❌ | None | Description |
| completedDate | DateTime | ❌ | None | Completion date |
| performedById | String | ❌ | Person | Person who performed work |
| notes | String | ❌ | None | Notes |
| cost | Decimal | ❌ | None | Maintenance cost |
| currency | String | ❌ | None | Currency code |
| partsUsed | JSON | ❌ | None | Parts used (array of strings) |
| nextMaintenanceDate | DateTime | ❌ | None | Next maintenance date |

---

### Layer 3: CMDB Instances

**Purpose**: Configuration Items and relationships (actual CI instances)
**Dependencies**: Layer 1 (LifecycleState, Person, OrgUnit, Location), Layer 2 (CIClass, RelationshipType), Layer 3 (Asset - optional)

#### ConfigurationItem

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | CI name |
| ciClassId | String | ✅ | CIClass | CI class reference |
| lifecycleStateId | String | ❌ | LifecycleState | Lifecycle state |
| criticality | Enum | ❌ | None | LOW, MEDIUM, HIGH, CRITICAL |
| environment | Enum | ❌ | None | PROD, UAT, DEV, DR, TEST, OTHER |
| primaryOwnerPersonId | String | ❌ | Person | Primary owner (person) |
| primaryOwnerOrgUnitId | String | ❌ | OrgUnit | Primary owner (org unit) |
| locationId | String | ❌ | Location | Location reference |
| linkedAssetId | String | ❌ | Asset | Linked asset reference |
| ciKey | String | ❌ | None | Unique business key (e.g., hostname) |
| description | String | ❌ | None | Description |
| attributes | JSON | ❌ | None | Dynamic fields per CIClassField |

#### CIRelationship

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| fromCiId | String | ✅ | ConfigurationItem | Source CI |
| toCiId | String | ✅ | ConfigurationItem | Target CI |
| relationshipTypeId | String | ✅ | RelationshipType | Relationship type |
| isActive | Boolean | ❌ | None | Active status |
| validFrom | DateTime | ❌ | None | Relationship start date |
| validTo | DateTime | ❌ | None | Relationship end date |
| note | String | ❌ | None | Notes |

---

### Layer 3: Service Management

**Purpose**: IT service catalog with ownership and infrastructure
**Dependencies**: Layer 1 (Vendor, Person), Layer 2 (BusinessProcess), Layer 3 (Asset - optional)

#### Service

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Service name (unique) |
| serviceType | Enum | ✅ | None | APPLICATION, SERVER, NETWORK, DATABASE, API, etc. |
| description | String | ❌ | None | Service description |
| businessPurpose | String | ❌ | None | Business value/need |
| gitlabRepoUrl | String | ❌ | None | GitLab repository URL |
| dataConfidentiality | Enum | ❌ | None | PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED |
| businessImpactLevel | Enum | ❌ | None | HIGH, MEDIUM, LOW |
| criticality | Enum | ❌ | None | CRITICAL, HIGH, MEDIUM, LOW |
| isEssentialService | Boolean | ❌ | None | Core Banking/Payments flag |
| deploymentDate | DateTime | ❌ | None | Deployment date |
| currentStatus | Enum | ❌ | None | PRODUCTION, UAT, DR, DEVELOPMENT, RETIRED, PLANNED |
| lastPatchDate | DateTime | ❌ | None | Last patch date |
| plannedDecommissionDate | DateTime | ❌ | None | Decommission date |
| vendorId | String | ❌ | Vendor | Vendor reference |
| slaDetails | JSON | ❌ | None | SLA terms |
| businessProcessId | String | ❌ | BusinessProcess | Business process reference |
| isInCentralRegister | Boolean | ❌ | None | Central register flag |
| complianceNotes | String | ❌ | None | Compliance notes |
| metadata | JSON | ❌ | None | Additional data |

#### ServiceOwnership

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| serviceId | String | ✅ | Service | Service reference |
| personId | String | ✅ | Person | Person reference |
| ownershipType | Enum | ✅ | None | TECHNICAL, PRODUCT, BUSINESS |
| isPrimary | Boolean | ❌ | None | Primary owner flag (one per type) |

#### ServiceInfrastructure

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| serviceId | String | ✅ | Service | Service reference |
| location | Enum | ✅ | None | ON_PREM, OCI_CLOUD, GCP_CLOUD, AWS_CLOUD, HYBRID |
| cloudProvider | String | ❌ | None | Cloud provider (OCI, GCP, AWS) |
| compartment | String | ❌ | None | OCI compartment |
| project | String | ❌ | None | GCP project |
| region | String | ❌ | None | Region (Riyadh, Frankfurt, Mumbai) |
| ipAddress | String | ❌ | None | IP address |
| hostname | String | ❌ | None | Hostname |
| backupEnabled | Boolean | ❌ | None | Backup enabled flag |
| backupSchedule | String | ❌ | None | Backup schedule (daily, weekly) |
| lastBackupDate | DateTime | ❌ | None | Last backup date |
| cloudProviderDetails | JSON | ❌ | None | Provider-specific metadata |

#### ServiceAsset

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| serviceId | String | ✅ | Service | Service reference |
| relationship | Enum | ✅ | None | HOSTS, SUPPORTS, DEPENDS_ON, MONITORS, BACKS_UP |
| assetId | String | ❌ | Asset | Asset reference (null for third-party) |
| description | String | ❌ | None | Relationship description |

---

### Layer 3: Contracts & Licenses

**Purpose**: Contract management and license tracking
**Dependencies**: Layer 1 (Vendor, LifecycleModel, FieldDefinition)

#### ContractType

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Contract type name |
| code | String | ✅ | None | Unique code (auto-generated) |
| description | String | ❌ | None | Description |
| isActive | Boolean | ❌ | None | Active status |

#### Contract

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| contractTypeId | String | ✅ | ContractType | Contract type |
| vendorId | String | ✅ | Vendor | Vendor reference |
| name | String | ✅ | None | Contract name |
| startDate | DateTime | ✅ | None | Contract start date |
| contractNumber | String | ❌ | None | Contract number (unique) |
| endDate | DateTime | ❌ | None | Contract end date |
| autoRenew | Boolean | ❌ | None | Auto-renewal flag |
| renewalTerms | String | ❌ | None | Renewal terms |
| slaDefinition | JSON | ❌ | None | SLA rules |
| totalValue | Decimal | ❌ | None | Total contract value |
| currency | String | ❌ | None | Currency code |
| note | String | ❌ | None | Notes |

#### ContractLinkedObject

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| contractId | String | ✅ | Contract | Contract reference |
| targetType | Enum | ✅ | None | CI, ASSET, LICENSE_ENTITLEMENT |
| targetId | String | ✅ | Polymorphic | Target ID (no FK - polymorphic) |
| note | String | ❌ | None | Notes |

**Notes**: targetId is polymorphic (CI.id, Asset.id, or LicenseEntitlement.id based on targetType)

#### LicenseProduct

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | License product name (unique) |
| code | String | ✅ | None | Unique code (auto-generated) |
| vendorId | String | ✅ | Vendor | Vendor reference |
| metricType | String | ✅ | None | per_device, per_user, per_core, per_vm, per_cluster |
| description | String | ❌ | None | Description |
| lifecycleModelId | String | ❌ | LifecycleModel | Lifecycle model reference |

#### LicenseProductField

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| licenseProductId | String | ✅ | LicenseProduct | License product |
| fieldDefinitionId | String | ✅ | FieldDefinition | Field definition reference |
| isRequired | Boolean | ❌ | None | Required flag |
| isVisible | Boolean | ❌ | None | Visible in UI |
| uiOrder | Int | ❌ | None | Display order |
| defaultValue | JSON | ❌ | None | Default value |

#### LicenseEntitlement

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| licenseProductId | String | ✅ | LicenseProduct | License product |
| purchasedQuantity | Int | ✅ | None | Purchased quantity |
| effectiveStart | DateTime | ✅ | None | Effective start date |
| contractId | String | ❌ | Contract | Contract reference |
| effectiveEnd | DateTime | ❌ | None | Effective end date |
| allowedScope | JSON | ❌ | None | Allowed scope (regions, departments, etc.) |
| note | String | ❌ | None | Notes |

#### LicenseAllocation

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| licenseEntitlementId | String | ✅ | LicenseEntitlement | License entitlement |
| targetType | Enum | ✅ | None | PERSON, CI, ASSET |
| targetId | String | ✅ | Polymorphic | Target ID (no FK - polymorphic) |
| allocatedQuantity | Int | ✅ | None | Allocated quantity |
| deallocatedAt | DateTime | ❌ | None | Deallocation timestamp (soft delete) |
| note | String | ❌ | None | Notes |

**Notes**: targetId is polymorphic (Person.id, CI.id, or Asset.id based on targetType)

---

### Layer 4: Advanced ITAM Features

**Purpose**: Asset disposals, kits, and reservations
**Dependencies**: Layer 1 (Person, Vendor), Layer 2 (AssetCategory, AssetModel), Layer 3 (Asset)

#### Asset Disposals

**AssetDisposal**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| disposalType | String | ✅ | None | DONATION, SALE, RECYCLING, DESTRUCTION, OTHER |
| initiatedById | String | ✅ | Person | Person who initiated disposal |
| status | String | ✅ | None | PENDING_APPROVAL, APPROVED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED |
| reason | String | ❌ | None | Disposal reason |
| approvedById | String | ❌ | Person | Person who approved |
| approvedAt | DateTime | ❌ | None | Approval timestamp |
| estimatedValue | Decimal | ❌ | None | Estimated value |
| actualProceeds | Decimal | ❌ | None | Actual proceeds |
| currency | String | ❌ | None | Currency code |
| sanitizationChecklist | JSON | ❌ | None | Sanitization checklist |
| disposalDate | DateTime | ❌ | None | Disposal date |
| certificateNumber | String | ❌ | None | Certificate number (unique) |
| certificateIssuedAt | DateTime | ❌ | None | Certificate issue date |
| disposalVendorId | String | ❌ | Vendor | Disposal vendor |
| recipientInfo | String | ❌ | None | Recipient information |
| note | String | ❌ | None | Notes |

**DisposalApproval**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| disposalId | String | ✅ | AssetDisposal | Disposal reference |
| approverId | String | ✅ | Person | Approver reference |
| status | String | ✅ | None | PENDING, APPROVED, REJECTED |
| decisionAt | DateTime | ❌ | None | Decision timestamp |
| comment | String | ❌ | None | Approval comment |

**DisposalDocument**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| disposalId | String | ✅ | AssetDisposal | Disposal reference |
| documentType | String | ✅ | None | CERTIFICATE, RECEIPT, INVOICE, PHOTO, OTHER |
| fileName | String | ✅ | None | File name |
| filePath | String | ✅ | None | File path |
| uploadedById | String | ✅ | Person | Person who uploaded |
| mimeType | String | ❌ | None | MIME type |
| sizeBytes | BigInt | ❌ | None | File size in bytes |

---

#### Asset Kits

**AssetKit**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Kit name |
| code | String | ✅ | None | Unique code (auto-generated) |
| kitType | String | ✅ | None | NEW_HIRE, CONTRACTOR, EXECUTIVE, PROJECT, TEMPORARY, OTHER |
| description | String | ❌ | None | Description |
| isActive | Boolean | ❌ | None | Active status |
| metadata | JSON | ❌ | None | Additional data |

**AssetKitItem**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetKitId | String | ✅ | AssetKit | Asset kit reference |
| quantity | Int | ✅ | None | Quantity (default 1) |
| assetCategoryId | String | ❌ | AssetCategory | Asset category reference |
| assetModelId | String | ❌ | AssetModel | Asset model reference |
| isRequired | Boolean | ❌ | None | Required flag |
| note | String | ❌ | None | Notes |

**Notes**: Either assetCategoryId OR assetModelId should be provided (category for flexibility, model for specificity)

**AssetKitCheckout**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetKitId | String | ✅ | AssetKit | Asset kit reference |
| assigneeType | String | ✅ | None | PERSON, ORG_UNIT, LOCATION |
| assigneeId | String | ✅ | Polymorphic | Assignee ID (no FK - polymorphic) |
| checkedOutById | String | ✅ | Person | Person who checked out |
| status | String | ✅ | None | CHECKED_OUT, PARTIALLY_RETURNED, RETURNED, CANCELLED |
| checkoutDate | DateTime | ❌ | None | Checkout date |
| expectedReturnDate | DateTime | ❌ | None | Expected return date |
| actualReturnDate | DateTime | ❌ | None | Actual return date |
| note | String | ❌ | None | Notes |

**AssetKitCheckoutItem**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| kitCheckoutId | String | ✅ | AssetKitCheckout | Kit checkout reference |
| assetId | String | ✅ | Asset | Asset reference |
| kitItemId | String | ✅ | AssetKitItem | Kit item reference |
| status | String | ✅ | None | CHECKED_OUT, RETURNED, DAMAGED, LOST |
| checkoutDate | DateTime | ❌ | None | Checkout date |
| returnDate | DateTime | ❌ | None | Return date |
| conditionAtCheckout | String | ❌ | None | Condition at checkout |
| conditionAtReturn | String | ❌ | None | Condition at return |
| note | String | ❌ | None | Notes |

---

#### Asset Reservations

**AssetReservation**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| assetId | String | ✅ | Asset | Asset reference |
| reservedById | String | ✅ | Person | Person who created reservation |
| startDate | DateTime | ✅ | None | Reservation start date |
| endDate | DateTime | ✅ | None | Reservation end date |
| status | String | ✅ | None | PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED |
| reservedForPersonId | String | ❌ | Person | Reserved for person |
| reservedForOrgUnitId | String | ❌ | OrgUnit | Reserved for org unit |
| purpose | String | ❌ | None | Reservation purpose |
| note | String | ❌ | None | Notes |
| confirmationDate | DateTime | ❌ | None | Confirmation date |
| confirmedById | String | ❌ | Person | Person who confirmed |
| cancellationReason | String | ❌ | None | Cancellation reason |
| cancelledAt | DateTime | ❌ | None | Cancellation timestamp |
| cancelledById | String | ❌ | Person | Person who cancelled |

**AssetReservationConflict**

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| reservationId | String | ✅ | AssetReservation | Reservation reference |
| conflictingReservationId | String | ✅ | AssetReservation | Conflicting reservation reference |
| resolvedAt | DateTime | ❌ | None | Resolution timestamp |
| resolutionNote | String | ❌ | None | Resolution notes |

---

### Layer 4: Governance

**Purpose**: Data governance, ownership, and verification campaigns
**Dependencies**: Layer 1 (Person, OrgUnit), Layer 2 (CIClass, AssetCategory)

#### DataDomain

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Domain name (e.g., "PII", "Financial Data") |
| code | String | ✅ | None | Unique code |
| description | String | ❌ | None | Description |
| isActive | Boolean | ❌ | None | Active status |

#### DataOwnership

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| dataDomainId | String | ✅ | DataDomain | Data domain reference |
| ciClassId | String | ❌ | CIClass | CI class reference (mutually exclusive with assetCategoryId) |
| assetCategoryId | String | ❌ | AssetCategory | Asset category reference (mutually exclusive with ciClassId) |
| ownerPersonId | String | ❌ | Person | Owner person (mutually exclusive with ownerOrgUnitId) |
| ownerOrgUnitId | String | ❌ | OrgUnit | Owner org unit (mutually exclusive with ownerPersonId) |
| note | String | ❌ | None | Notes |

**Notes**: Must have either ciClassId OR assetCategoryId, and either ownerPersonId OR ownerOrgUnitId

#### VerificationCampaign

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Campaign name |
| targetType | Enum | ✅ | None | CI, ASSET |
| scheduledStart | DateTime | ✅ | None | Campaign start date |
| createdById | String | ✅ | Person | Person who created campaign |
| description | String | ❌ | None | Description |
| filterDefinition | JSON | ❌ | None | Selection rules (by class, category, location, etc.) |
| scheduledEnd | DateTime | ❌ | None | Campaign end date |

#### VerificationItem

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| verificationCampaignId | String | ✅ | VerificationCampaign | Campaign reference |
| targetType | Enum | ✅ | None | CI, ASSET |
| targetId | String | ✅ | Polymorphic | Target ID (no FK - polymorphic) |
| status | Enum | ✅ | None | PENDING, IN_PROGRESS, VERIFIED, EXCEPTION |
| verifierPersonId | String | ❌ | Person | Verifier reference |
| verifiedAt | DateTime | ❌ | None | Verification timestamp |
| comment | String | ❌ | None | Verification comment |

**Notes**: targetId is polymorphic (CI.id or Asset.id based on targetType)

---

### Layer 4: Attachments & Audit

**Purpose**: File attachments and audit trails
**Dependencies**: Layer 1 (Person, User)

#### AttachmentType

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| name | String | ✅ | None | Attachment type name |
| code | String | ✅ | None | Unique code |
| allowedExtensions | String[] | ✅ | None | Allowed file extensions (e.g., ["pdf", "jpg", "png"]) |
| maxFileSizeMB | Int | ✅ | None | Maximum file size in MB |
| description | String | ❌ | None | Description |
| isActive | Boolean | ❌ | None | Active status |

#### Attachment

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| attachmentTypeId | String | ✅ | AttachmentType | Attachment type |
| targetType | Enum | ✅ | None | CI, ASSET, CONTRACT, WARRANTY, ASSET_DISPOSAL, etc. |
| targetId | String | ✅ | Polymorphic | Target ID (no FK - polymorphic) |
| fileName | String | ✅ | None | File name |
| filePath | String | ✅ | None | File path or external URL |
| uploadedById | String | ✅ | Person | Person who uploaded |
| mimeType | String | ❌ | None | MIME type |
| sizeBytes | BigInt | ❌ | None | File size in bytes |
| note | String | ❌ | None | Notes |

**Notes**: targetId is polymorphic (supports 23 target types - see TargetObjectTypeEnum in schema)

#### AuditLogEntry

| Field | Type | Required | Dependencies | Description |
|-------|------|----------|--------------|-------------|
| targetType | Enum | ✅ | None | Entity type (CI, ASSET, etc.) |
| targetId | String | ✅ | Polymorphic | Entity ID (no FK - polymorphic) |
| changedById | String | ✅ | Person | Person who made change |
| fieldName | String | ❌ | None | Field name |
| oldValue | String | ❌ | None | Old value |
| newValue | String | ❌ | None | New value |
| changedByUserId | String | ❌ | User | User reference (for direct user actions) |
| sourceSystem | String | ❌ | None | Source (UI, API, Discovery, Import) |
| note | String | ❌ | None | Notes |

---

## Critical Migration Notes

### 1. Hierarchical Data (Self-Referencing)

**Entities**: OrganizationUnit, Location, Role, CIClass

**Strategy**: Populate **bottom-up** (children first) or use deferred FK resolution:
- **OrganizationUnit**: Level 4 → 3 → 2 → 1
- **Location**: Leaf nodes → root
- **Role**: No parent → children
- **CIClass**: No parent → children

**Example (OrganizationUnit)**:
```
1. Create Level 4 (Team): parentId = null (temporarily)
2. Create Level 3 (Department): parentId = null (temporarily)
3. Create Level 2 (Business Unit): parentId = null (temporarily)
4. Create Level 1 (Company): parentId = null
5. Update Level 2: parentId = Company.id
6. Update Level 3: parentId = Department.id
7. Update Level 4: parentId = Team.id
```

### 2. Polymorphic Relations (No FK in Schema)

**Entities**: ContractLinkedObject, LicenseAllocation, AssetAssignment, Attachment, VerificationItem, AuditLogEntry

**Important**: These tables have `targetType` + `targetId` fields with **no database foreign key constraints**. Validation happens at application level.

**Example (LicenseAllocation)**:
```json
{
  "licenseEntitlementId": "ent_123",
  "targetType": "PERSON",
  "targetId": "person_456", // Must exist in persons table
  "allocatedQuantity": 1
}
```

**Validation**: Ensure `targetId` exists in the corresponding table before creating polymorphic records.

### 3. Soft Deletes

**Entities**: Person, Asset

**Field**: `deletedAt` (nullable DateTime)

**Important**: Soft-deleted records remain in database but are excluded from queries:
```sql
-- Exclude soft-deleted records
WHERE deletedAt IS NULL
```

### 4. Auto-Generation (CodeSequence)

**Entities**: Vendor, Asset, AssetKit, OrganizationUnit, Location, LifecycleState, CIClass, RelationshipType, AssetCategory, AssetModel, StockLocation, ContractType, LicenseProduct

**Process**:
1. Initialize CodeSequence records **before** creating entities
2. System generates codes like: `VENDOR-0001`, `ASSET-0042`, `KIT-0003`

**Configuration** (seed.ts lines 97-123):
```javascript
const sequenceConfigs = [
  { entityType: "VENDOR", prefix: "VENDOR" },
  { entityType: "ASSET", prefix: "ASSET" },
  { entityType: "ASSET_KIT", prefix: "KIT" },
  // ... more
];
```

### 5. Multi-Currency Support

**Entities with Currency**: Asset, Warranty, MaintenanceRecord, Contract, AssetDisposal, Service

**Key Points**:
- **Base Currency**: SAR (Saudi Riyal)
- **ExchangeRate**: Store rates **to SAR** (e.g., 1 USD = 3.75 SAR)
- **Currency Field**: Always include `currency` field with financial amounts
- **Aggregation**: Convert to SAR before summing

**Example**:
```json
{
  "purchaseCost": 1000.00,
  "currency": "USD"
}
```

**See**: `docs/features/MULTI_CURRENCY_GUIDE.md` for complete implementation

### 6. RBAC First Principle

**Critical**: Permission and Role data **must exist before**:
- Enforcing permission checks in application

**Recommended Approach**:
1. Seed all Permissions (153+ permissions)
2. Seed all Roles (admin, asset_manager, etc.)
3. Create RolePermission associations
4. Create Person records (referencing roles)
5. Assign UserRole to Users

### 7. Dynamic Fields (JSON Attributes)

**Entities**: ConfigurationItem, Asset, LicenseEntitlement

**Pattern**: Use `attributes` JSON field for dynamic data defined by:
- **ConfigurationItem**: CIClassField definitions
- **Asset**: AssetCategoryField definitions
- **LicenseEntitlement**: LicenseProductField definitions

**Example (Asset with dynamic attributes)**:
```json
{
  "assetTag": "ASSET-0001",
  "assetCategoryId": "laptop_category_id",
  "attributes": {
    "cpu_cores": 8,
    "ram_gb": 16,
    "screen_size": "14 inches",
    "has_touchscreen": true
  }
}
```

### 8. Required vs Optional Fields

**General Pattern**:
- **Required**: Minimum viable record (unique identifiers, foreign keys, core business fields)
- **Optional**: Enrichment data (notes, metadata, dates, financial details)

**Example (Vendor)**:
- **Required**: `name`, `code`
- **Optional**: `legalName`, `taxId`, `website`, `email`, `phone`, `address`, etc.

**Strategy**:
- **Initial Migration**: Populate required fields only, add optional fields later
- **Demo Seeding**: Populate both required and optional for realistic data

---

## Demo vs Production Data

### Demo Seeding

**Purpose**: Comprehensive test data for showcasing system capabilities

**Quantities** (from `seed-config.ts`):
```javascript
{
  VENDORS: 8,
  LOCATIONS: 10,
  ORGANIZATION_UNITS: 5,
  PERSONS: 15,
  ASSETS_PER_CATEGORY: {
    LAPTOP: 15,
    DESKTOP: 8,
    MONITOR: 10,
    SERVER: 5,
    NETWORK: 6,
    PRINTER: 4,
    PHONE: 10,
    TABLET: 6
  },
  SERVICES: 80,
  CONFIGURATION_ITEMS: 20,
  ASSET_DISPOSALS: 8,
  ASSET_KITS: 5,
  ASSET_RESERVATIONS: 10
}
```

**Run Demo Seed**:
```bash
npm run reset  # Drops all data and re-seeds
```

### Production Migration

**Purpose**: Import existing company data from legacy systems

**Approach**:
1. **Data Extraction**: Export from legacy systems (Excel, CSV, database dumps)
2. **Data Transformation**: Map to TechHub schema (follow layer dependencies)
3. **Validation**: Validate all foreign key references, required fields, unique constraints
4. **Incremental Import**: Import layer by layer (Layer 0 → 1 → 2 → 3 → 4)
5. **Verification**: Run data quality checks, reconcile counts

**Tools**:
- **Migration Scripts**: Use `seed-*.ts` scripts as templates
- **Validation**: Use Zod DTOs from `src/core/interface-adapters/dtos/`
- **Logging**: Use structured logging (`ILoggerService`) for audit trail

**Example Migration Script Structure**:
```typescript
async function migrateProductionData() {
  // Layer 0: CodeSequence
  await initCodeSequences();

  // Layer 1: Foundation
  await importVendors();           // from vendors.csv
  await importLocations();         // from locations.csv
  await importOrgUnits();          // from org_units.csv
  await importPeople();            // from people.csv

  // Layer 2: Asset Foundation
  await importAssetCategories();   // from asset_categories.csv
  await importAssetModels();       // from asset_models.csv

  // Layer 3: Assets
  await importAssets();            // from assets.csv
  await importAssetAssignments();  // from assignments.csv

  // ... continue for all layers

  // Verify data integrity
  await verifyForeignKeys();
  await reconcileCounts();
}
```

**See**:
- `docs/guides/DATABASE_SEEDING.md` - Complete seeding guide
- `src/infrastructure/database/prisma/seed-*.ts` - Seeder implementations

---

## Related Documentation

- [DATABASE_SEEDING.md](../guides/DATABASE_SEEDING.md) - Comprehensive seed system guide
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Schema design and naming conventions
- [ARCHITECTURE.md](ARCHITECTURE.md) - Clean Architecture implementation
- [ENTITY_REFERENCE.md](../guides/ENTITY_REFERENCE.md) - Entity quick reference
- [MULTI_CURRENCY_GUIDE.md](../features/MULTI_CURRENCY_GUIDE.md) - Multi-currency implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-23
**Maintained By**: TechHub Core Team
