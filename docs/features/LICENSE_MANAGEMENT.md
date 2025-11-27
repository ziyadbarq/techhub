# License Management System

This document provides comprehensive documentation for the License Management module, including cost tracking with multi-currency support.

## Overview

The License Management module enables organizations to track software licenses, entitlements, allocations, and associated costs. It supports multiple license metric types, cost tracking with multi-currency conversion, and license addons for extras like premium support or maintenance.

**Routes**:
- `/license-products` - Software products and their configurations
- `/license-entitlements` - Purchased license quantities with cost tracking
- `/license-allocations` - License assignments to users, assets, or CIs

**Entities**: 6 (LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation, LicenseAddon, LicenseEntitlementAddon)

**Use Cases**: 33

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      License Management                              │
├─────────────────────────────────────────────────────────────────────┤
│  License Products                                                    │
│  ├── License Addons (templates: support, training, maintenance)     │
│  └── License Product Fields (custom attributes)                      │
├─────────────────────────────────────────────────────────────────────┤
│  License Entitlements (purchased quantities + costs)                 │
│  ├── License Entitlement Addons (attached with quantity & cost)     │
│  └── Cost Tracking (unit cost, total cost, multi-currency)          │
├─────────────────────────────────────────────────────────────────────┤
│  License Allocations (assignments to users/assets/CIs)              │
│  └── Polymorphic: Person | Asset | ConfigurationItem                │
└─────────────────────────────────────────────────────────────────────┘
```

## Entities

### LicenseProduct

Represents a software product that requires licensing.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Product name (e.g., "Microsoft Office 365") |
| code | String | Unique code (e.g., "MS-O365") |
| vendorId | UUID | Reference to Vendor entity |
| metricType | Enum | License metric (per_device, per_user, per_core, per_vm, per_cluster) |
| description | String? | Optional description |
| lifecycleModelId | UUID? | Optional lifecycle model reference |

### LicenseAddon

Defines addon templates available for a license product (e.g., premium support, training packages).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| licenseProductId | UUID | Parent license product |
| name | String | Addon name (e.g., "Premium Support") |
| code | String | Unique code (e.g., "PREM-SUPPORT") |
| description | String? | Optional description |
| defaultQuantity | Int | Default quantity when attached |
| unitCost | Decimal? | Default unit cost |
| currency | String? | Currency code (ISO 4217) |

### LicenseEntitlement

Represents purchased license quantities with cost information.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| licenseProductId | UUID | Reference to LicenseProduct |
| contractId | UUID? | Optional linked contract |
| purchasedQuantity | Int | Number of licenses purchased |
| effectiveStart | DateTime | Start of validity period |
| effectiveEnd | DateTime? | End of validity (null = perpetual) |
| allowedScope | JSON? | Scope restrictions (e.g., departments) |
| note | String? | Notes about the entitlement |
| unitCost | Decimal? | Cost per license unit |
| currency | String? | Currency code (ISO 4217) |

**Computed Properties**:
- `isActive()` - Whether currently within validity period
- `isExpired()` - Whether past end date
- `calculateTotalCost()` - Unit cost × purchased quantity
- `hasCostTracking()` - Whether cost fields are populated

### LicenseEntitlementAddon

Junction table linking addons to entitlements with quantity and cost overrides.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| licenseEntitlementId | UUID | Parent entitlement |
| licenseAddonId | UUID | Referenced addon template |
| quantity | Int | Quantity of this addon |
| unitCost | Decimal? | Cost per unit (override) |
| currency | String? | Currency (override) |
| note | String? | Notes |

### LicenseAllocation

Tracks individual license assignments to entities.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| licenseEntitlementId | UUID | Parent entitlement |
| allocatedToType | Enum | Target type (person, asset, configuration_item) |
| allocatedToId | UUID | Target entity ID |
| allocatedAt | DateTime | When allocated |
| deallocatedAt | DateTime? | When deallocated (if inactive) |
| isActive | Boolean | Current status |

## Cost Tracking

### Multi-Currency Support

License costs support multi-currency tracking with automatic SAR conversion:

1. **Unit Cost + Currency** stored on entitlements and addons
2. **Exchange Rates** managed via ExchangeRate entity (see MULTI_CURRENCY_GUIDE.md)
3. **Dual Display** shows original currency and SAR equivalent

Example:
```
Unit Cost: $100.00 USD
SAR Equivalent: ر.س 375.00 (at 3.75 exchange rate)
```

### Cost Calculation

**Base Cost**: `unitCost × purchasedQuantity`

**Addon Costs**: Sum of all attached addon costs

**Total Cost**: Base cost + addon costs (grouped by currency)

### UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `EntitlementCostDisplay` | Detail view | Shows cost breakdown with SAR conversion |
| `EntitlementAddonsPanel` | Detail view | Manage addon attachments |
| `ProductAddonsPanel` | Product detail | Define addon templates |
| `LicenseEntitlementForm` | Create/Edit | Form with cost fields |
| `LicenseEntitlementsTable` | List view | Table with cost columns |

## Permissions

### License Products
- `LICENSE_PRODUCTS_VIEW` - View license products
- `LICENSE_PRODUCTS_CREATE` - Create new products
- `LICENSE_PRODUCTS_UPDATE` - Edit existing products
- `LICENSE_PRODUCTS_DELETE` - Delete products
- `LICENSE_PRODUCTS_MANAGE` - Full management access

### License Entitlements
- `LICENSE_ENTITLEMENTS_VIEW` - View entitlements
- `LICENSE_ENTITLEMENTS_CREATE` - Create entitlements
- `LICENSE_ENTITLEMENTS_UPDATE` - Edit entitlements (includes addon management)
- `LICENSE_ENTITLEMENTS_DELETE` - Delete entitlements
- `LICENSE_ENTITLEMENTS_MANAGE` - Full management access

### License Allocations
- `LICENSE_ALLOCATIONS_VIEW` - View allocations
- `LICENSE_ALLOCATIONS_CREATE` - Create allocations
- `LICENSE_ALLOCATIONS_UPDATE` - Edit allocations
- `LICENSE_ALLOCATIONS_DELETE` - Delete allocations
- `LICENSE_ALLOCATIONS_DEALLOCATE` - Soft-deactivate allocations
- `LICENSE_ALLOCATIONS_REACTIVATE` - Reactivate deallocated allocations
- `LICENSE_ALLOCATIONS_MANAGE` - Full management access

## Use Cases

### License Product Use Cases (5)
- CreateLicenseProductUseCase
- GetLicenseProductUseCase
- ListLicenseProductsUseCase
- UpdateLicenseProductUseCase
- DeleteLicenseProductUseCase

### License Addon Use Cases (5)
- CreateLicenseAddonUseCase
- GetLicenseAddonUseCase
- ListLicenseAddonsUseCase
- UpdateLicenseAddonUseCase
- DeleteLicenseAddonUseCase

### License Entitlement Use Cases (5)
- CreateLicenseEntitlementUseCase
- GetLicenseEntitlementUseCase
- ListLicenseEntitlementsUseCase
- UpdateLicenseEntitlementUseCase
- DeleteLicenseEntitlementUseCase

### License Entitlement Addon Use Cases (5)
- AttachAddonToEntitlementUseCase
- DetachAddonFromEntitlementUseCase
- UpdateEntitlementAddonUseCase
- ListEntitlementAddonsUseCase
- CalculateEntitlementTotalCostUseCase

### License Allocation Use Cases (8)
- CreateLicenseAllocationUseCase
- GetLicenseAllocationUseCase
- ListLicenseAllocationsUseCase
- UpdateLicenseAllocationUseCase
- DeleteLicenseAllocationUseCase
- DeallocateLicenseUseCase
- ReactivateLicenseAllocationUseCase
- GetAvailableLicenseCountUseCase

### License Product Field Use Cases (5)
- CreateLicenseProductFieldUseCase
- GetLicenseProductFieldUseCase
- ListLicenseProductFieldsUseCase
- UpdateLicenseProductFieldUseCase
- DeleteLicenseProductFieldUseCase

## Database Schema

```sql
-- License Products
CREATE TABLE "LicenseProduct" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "vendorId" UUID NOT NULL REFERENCES "Vendor"("id"),
  "metricType" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "lifecycleModelId" UUID REFERENCES "LifecycleModel"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- License Addons (templates)
CREATE TABLE "LicenseAddon" (
  "id" UUID PRIMARY KEY,
  "licenseProductId" UUID NOT NULL REFERENCES "LicenseProduct"("id"),
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "defaultQuantity" INT DEFAULT 1,
  "unitCost" DECIMAL(12,2),
  "currency" VARCHAR(3),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("licenseProductId", "code")
);

-- License Entitlements (with cost tracking)
CREATE TABLE "LicenseEntitlement" (
  "id" UUID PRIMARY KEY,
  "licenseProductId" UUID NOT NULL REFERENCES "LicenseProduct"("id"),
  "contractId" UUID REFERENCES "Contract"("id"),
  "purchasedQuantity" INT NOT NULL,
  "effectiveStart" TIMESTAMP NOT NULL,
  "effectiveEnd" TIMESTAMP,
  "allowedScope" JSONB,
  "note" TEXT,
  "unitCost" DECIMAL(12,2),
  "currency" VARCHAR(3),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- License Entitlement Addons (junction with overrides)
CREATE TABLE "LicenseEntitlementAddon" (
  "id" UUID PRIMARY KEY,
  "licenseEntitlementId" UUID NOT NULL REFERENCES "LicenseEntitlement"("id") ON DELETE CASCADE,
  "licenseAddonId" UUID NOT NULL REFERENCES "LicenseAddon"("id"),
  "quantity" INT NOT NULL DEFAULT 1,
  "unitCost" DECIMAL(12,2),
  "currency" VARCHAR(3),
  "note" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("licenseEntitlementId", "licenseAddonId")
);

-- License Allocations
CREATE TABLE "LicenseAllocation" (
  "id" UUID PRIMARY KEY,
  "licenseEntitlementId" UUID NOT NULL REFERENCES "LicenseEntitlement"("id"),
  "allocatedToType" VARCHAR(50) NOT NULL,
  "allocatedToId" UUID NOT NULL,
  "allocatedAt" TIMESTAMP DEFAULT NOW(),
  "deallocatedAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

## Integration Points

### Contract Management
- Entitlements can be linked to contracts for procurement tracking
- Contract renewal dates help track license renewals

### Multi-Currency System
- Uses ExchangeRate entity for SAR conversion
- CurrencyDisplay component for dual currency formatting
- See [MULTI_CURRENCY_GUIDE.md](MULTI_CURRENCY_GUIDE.md)

### CMDB Integration
- Allocations can target Configuration Items
- Tracks software licenses on infrastructure components

### Asset Management
- Allocations can target Assets
- Tracks device-based licenses

## Related Documentation

- [LAYER3_OVERVIEW.md](LAYER3_OVERVIEW.md) - Layer 3 modules overview
- [MULTI_CURRENCY_GUIDE.md](MULTI_CURRENCY_GUIDE.md) - Multi-currency system
- [ITAM_FEATURES.md](ITAM_FEATURES.md) - IT Asset Management features
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Development patterns
