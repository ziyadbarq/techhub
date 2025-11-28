# Vendor Details Page

**Status**: Implemented (Layer 1 Feature)
**Version**: 1.0.0
**Last Updated**: 2025-11-28

## Table of Contents

- [Overview](#overview)
- [Route & Permissions](#route--permissions)
- [Page Structure](#page-structure)
- [Data Fetching](#data-fetching)
- [Components](#components)
- [Actions & Workflows](#actions--workflows)
- [Related Documentation](#related-documentation)

## Overview

The Vendor Details Page provides a comprehensive 360-degree view of a vendor's profile, including their products, assets, contracts, warranties, services, and contact information. It serves as the central hub for viewing all information related to a vendor in the system.

### Key Features

- **Quick Stats Cards**: At-a-glance metrics for portfolio value, contracts, warranties, and products
- **Tabbed Interface**: 7 tabs organizing related data by category
- **Contact Actions**: Quick access to email, phone, and website
- **Cross-Entity Links**: Clickable links to all related entities (assets, contracts, services, etc.)
- **Actions**: Edit, Delete controls with permission checks

### Navigation

Users can access the Vendor Details page by:

1. Clicking a vendor's name in the Vendors table view
2. Direct URL: `/vendors/[id]`
3. Clicking a vendor's name in related entity views (assets, contracts, warranties)

## Route & Permissions

| Route | Permission Required | Description |
|-------|-------------------|-------------|
| `/vendors/[id]` | `VENDORS_VIEW` | View vendor details |
| Edit action | `VENDORS_UPDATE` | Edit vendor information |
| Delete action | `VENDORS_DELETE` | Delete vendor record |

## Page Structure

### Header Section

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    [Icon]  Acme Corporation               [Actions]      │
│                   Acme Corp Ltd.                                │
│                   [VND-001] [Manufacturer] [Preferred] [Active] │
│                   [Email] [Call] [Website] [Edit] [Delete]      │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Stats Cards (4 Cards)

| Card | Content |
|------|---------|
| **Portfolio Value** | Total asset value (SAR) + Asset count |
| **Contracts** | Active contracts count + Total contracts |
| **Warranties** | Active warranties count + Expiring soon alert |
| **Products** | Products count + Asset models + License products breakdown |

### Tab Structure (7 Tabs)

#### Tab 1: Overview (Default)

- **Business Information**: Vendor type, tax ID, website
- **Contact Information**: Email, phone, fax
- **Address**: Full address with city, state, country, postal code
- **Business Terms**: Payment terms, credit limit, lead time
- **Tags**: Tag badges for categorization
- **Notes**: Additional vendor notes
- **Audit Information**: Created/updated timestamps

#### Tab 2: Contacts

- DataTable showing vendor contacts
- Columns: Name, Title, Role, Email, Phone, Status
- Primary contact indicator with star badge
- Clickable email and phone links

#### Tab 3: Products

- **Asset Models Section**: Models manufactured/sold by vendor
- **License Products Section**: Software licenses from vendor
- Each with DataTable showing key details and counts

#### Tab 4: Assets

- **Summary Stats**: Total assets count, Total value (SAR)
- **Assets Table**: All assets purchased from this vendor
- Columns: Asset Tag, Serial Number, Model, Category, State, Location, Cost

#### Tab 5: Warranties

- **Expiring Alert**: Warning banner for warranties expiring within 30 days
- **Summary Stats**: Active, Expiring Soon, Total counts
- **Warranties Table**: All warranties provided by vendor
- Columns: Asset, Coverage Type, Start Date, End Date, Status

#### Tab 6: Contracts

- **Summary Stats**: Active contracts, Total contracts
- **Contracts Table**: All contracts with vendor
- Columns: Contract Name, Type, Status, Start Date, End Date, Value, Auto-Renew

#### Tab 7: Services

- **Services Section**: IT services provided by vendor
- Columns: Service Name, Type, Status, Criticality
- **Disposals Section**: Asset disposals handled by vendor
- Columns: Asset Tag, Type, Status, Date, Value

## Data Fetching

### Server-Side (Initial Load)

```typescript
// page.tsx - Parallel data fetching
const [vendorResult, countsResult, statsResult] = await Promise.all([
  getVendorByIdAction(id),              // Vendor with basic relations
  getVendorRelationCountsAction(id),    // All relation counts for badges
  getVendorStatisticsAction(id),        // Financial statistics
]);
```

### Client-Side (Tab Loading)

Each tab loads data on mount via dedicated server actions:
- `listVendorContactsAction` - Contacts tab
- `listVendorAssetModelsAction` - Products tab (models)
- `listVendorLicenseProductsAction` - Products tab (licenses)
- `listVendorAssetsAction` - Assets tab
- `listVendorWarrantiesAction` - Warranties tab
- `listVendorContractsAction` - Contracts tab
- `listVendorServicesAction` - Services tab
- `listVendorDisposalsAction` - Services tab (disposals)

### Relation Counts Fetched

```typescript
interface VendorRelationCounts {
  contacts: number;
  assetModels: number;
  licenseProducts: number;
  assets: number;
  warranties: number;
  activeWarranties: number;
  contracts: number;
  activeContracts: number;
  services: number;
  disposals: number;
}
```

### Statistics Fetched

```typescript
interface VendorStatistics {
  totalAssetValue: number;      // Sum of purchaseCostSar for all vendor assets
  assetCount: number;           // Total assets from vendor
  warrantiesExpiringSoon: number; // Warranties expiring within 30 days
  productsCount: number;        // Asset models + license products
}
```

## Components

### File Structure

```
src/
├── app/(dashboard)/vendors/[id]/
│   └── page.tsx                           # Server page with permission checks
├── components/vendors/
│   ├── vendor-detail-page-client.tsx      # Main client component
│   └── tabs/
│       ├── vendor-overview-tab.tsx        # Overview tab
│       ├── vendor-contacts-tab.tsx        # Contacts tab
│       ├── vendor-products-tab.tsx        # Products tab
│       ├── vendor-assets-tab.tsx          # Assets tab
│       ├── vendor-warranties-tab.tsx      # Warranties tab
│       ├── vendor-contracts-tab.tsx       # Contracts tab
│       └── vendor-services-tab.tsx        # Services & disposals tab
└── interface-adapters/controllers/
    └── vendor-details.controller.ts       # Server actions
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `VendorDetailPageClient` | Main orchestrator with header, stats, tabs, dialogs |
| `VendorOverviewTab` | Business info, contact, address, terms cards |
| `VendorContactsTab` | Contacts DataTable with status badges |
| `VendorProductsTab` | Asset models and license products tables |
| `VendorAssetsTab` | Asset summary stats and DataTable |
| `VendorWarrantiesTab` | Warranty alerts, stats, and DataTable |
| `VendorContractsTab` | Contract summary and DataTable |
| `VendorServicesTab` | Services and disposals tables |

## Actions & Workflows

### Edit Vendor

1. User clicks "Edit" button (requires `VENDORS_UPDATE` permission)
2. VendorForm dialog opens pre-populated with vendor data
3. On save, page refreshes with updated data

### Delete Vendor

1. User clicks "Delete" button (requires `VENDORS_DELETE` permission)
2. Confirmation dialog appears with warning about associated assets
3. On confirm, vendor is deleted and user redirected to `/vendors`

### Contact Actions

- **Email**: Opens default email client with vendor email
- **Call**: Opens phone dialer with vendor phone number
- **Website**: Opens vendor website in new tab

## Related Documentation

- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md) - Complete Vendor entity documentation
- [Entity Reference](../guides/ENTITY_REFERENCE.md) - Quick reference for all foundation entities
- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission implementation patterns
- [Person Details](./PERSON_DETAILS.md) - Similar 360-degree view pattern for persons
- [ITAM Features](./ITAM_FEATURES.md) - Asset and warranty integrations
