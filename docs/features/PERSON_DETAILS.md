# Person Details Page

**Status**: Implemented (Layer 1 Feature)
**Version**: 1.1.0
**Last Updated**: 2025-11-30

## Table of Contents

- [Overview](#overview)
- [Route & Permissions](#route--permissions)
- [Page Structure](#page-structure)
- [Data Fetching](#data-fetching)
- [Components](#components)
- [Actions & Workflows](#actions--workflows)
- [Related Documentation](#related-documentation)

## Overview

The Person Details Page provides a comprehensive 360-degree view of an employee's profile, including their organizational position, related entities, and activity history. It serves as the central hub for viewing all information related to a person in the system.

### Key Features

- **Quick Stats Cards**: At-a-glance metrics for role, team, assets, and activity
- **Tabbed Interface**: 6 tabs organizing related data by category
- **Reporting Chain**: Visual hierarchy showing manager chain
- **Direct Reports**: Lazy-loaded list of people reporting to this person
- **Cross-Entity Links**: Clickable links to all related entities
- **Actions**: Edit, Delete, Include/Exclude controls with permission checks

### Navigation

Users can access the Person Details page by:

1. Clicking a person's name in the Persons table view
2. Direct URL: `/persons/[id]`
3. Clicking a person's name in reporting chain dialogs or org chart

## Route & Permissions

| Route | Permission Required | Description |
|-------|-------------------|-------------|
| `/persons/[id]` | `PERSONS_VIEW` | View person details |
| Edit action | `PERSONS_UPDATE` | Edit person information |
| Delete action | `PERSONS_DELETE` | Delete person record |
| Toggle exclusion | `PERSONS_MANAGE` | Include/exclude from directory |

## Page Structure

### Header Section

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    [Avatar]  John Smith                    [Actions ▾]   │
│                     Senior Developer                            │
│                     Engineering • Active                        │
│                     [Email] [Call]                              │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Stats Cards (4 Cards)

| Card | Content |
|------|---------|
| **Organization** | Organization unit name + department |
| **Team** | Direct reports count + "Manager" or "Individual Contributor" label |
| **Assets & Devices** | Total count of Intune devices + license allocations + reservations + kit checkouts |
| **Activity** | Governance items count (verification campaigns, items, attachments, disposals) |

> **Note**: Person.title (synced from Intune) is the job title field. Roles are ONLY for RBAC (UserRole table for system permissions).

### Tab Structure (6 Tabs)

#### Tab 1: Overview (Default)

- **Personal Information**: Name, email, phone, mobile, employee ID
- **Employment**: Title, department, hire date
- **Organization**: Org unit link, manager link, reporting chain preview
- **Location**: Assigned location, city, office
- **Status**: Active/Inactive badge, Excluded/Visible badge, direct reports count

#### Tab 2: Organization

- **Reporting Chain**: Visual hierarchy from CEO to this person
- **Direct Reports**: Grid of direct reports with lazy loading

#### Tab 3: Assets & Licenses

- **Intune Devices**: Mobile devices linked via Microsoft Intune
- **License Allocations**: Software licenses assigned (with qty, active/returned)
- **Asset Reservations**: Reserved assets with dates/purpose
- **Kit Checkouts**: Asset kit checkout history with due/returned dates
- **Maintenance Schedules**: Assigned maintenance tasks with next due date
- **Stock Movements**: Inventory movements initiated by this person

#### Tab 4: Services & CMDB

- **Service Ownerships**: Services owned (Technical/Business/Product owner types)
- **Configuration Items**: CMDB CIs owned
- **Data Ownerships**: Data domains owned for governance

#### Tab 5: Governance

- **Verification Campaigns**: Campaigns created by this person
- **Verification Items**: Items assigned for verification
- **Attachments**: Files uploaded by this person
- **Disposal Activities**: Disposals initiated and approved

#### Tab 6: Activity Log

- Audit log entries performed by this person
- Audit log entries affecting this person (target = PERSON)
- Source system badge and field-level notes where available

## Data Fetching

### Server-Side (Initial Load)

```typescript
// page.tsx - Parallel data fetching
const [personResult, countsResult, chainResult] = await Promise.all([
  getPersonDetailsAction(id),        // Person with directory relations
  getPersonRelationCountsAction(id), // All relation counts for badges
  getReportingChainAction(id),       // Recursive CTE for chain
]);
```

### Client-Side (Tab Loading)

- **Organization Tab**: Direct reports via `getPersonDirectReportsAction`
- **Assets Tab**: License allocations, reservations, kit checkouts, maintenance schedules, stock movements via respective `getPerson*` actions
- **Services Tab**: Service ownerships, configuration items, data ownerships via `getPerson*` actions
- **Governance Tab**: Verification campaigns/items, attachments, disposals via `getPerson*` actions
- **Activity Tab**: Audit logs performed by and affecting the person via `getPersonAuditLogAction`

### Relation Counts Fetched

```typescript
interface PersonRelationCounts {
  directReports: number;
  intuneDevices: number;
  licenseAllocations: number;
  assetReservations: number;
  kitCheckouts: number;
  stockMovements: number;
  maintenanceSchedules: number;
  serviceOwnerships: number;
  configurationItems: number;
  dataOwnerships: number;
  verificationCampaigns: number;
  verificationItems: number;
  attachments: number;
  initiatedDisposals: number;
  approvedDisposals: number;
}
```

## Components

### File Structure

```
src/
├── app/(dashboard)/persons/[id]/
│   └── page.tsx                           # Server page with permission checks
├── components/persons/
│   ├── person-detail-page-client.tsx      # Main client component
│   └── tabs/
│       ├── index.ts                       # Barrel export
│       ├── person-overview-tab.tsx        # Overview tab
│       ├── person-organization-tab.tsx    # Organization tab (with lazy loading)
│       ├── person-assets-tab.tsx          # Assets & licenses tab
│       ├── person-services-tab.tsx        # Services & CMDB tab
│       ├── person-governance-tab.tsx      # Governance tab
│       └── person-activity-tab.tsx        # Activity log tab
└── interface-adapters/controllers/
    └── person-details.controller.ts       # Server actions
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `PersonDetailPageClient` | Main orchestrator with header, stats, tabs, dialogs |
| `PersonOverviewTab` | Personal info, employment, organization cards |
| `PersonOrganizationTab` | Reporting chain visualization, direct reports grid |
| `PersonAssetsTab` | Device, license, reservation, kit sections |
| `PersonServicesTab` | Service ownership, CI ownership, data ownership |
| `PersonGovernanceTab` | Verification, attachments, disposal activities |
| `PersonActivityTab` | Activity timeline (placeholder) |

## Actions & Workflows

### Edit Person

1. User clicks "Edit" button (requires `PERSONS_UPDATE` permission)
2. PersonForm dialog opens pre-populated with person data
3. On save, page refreshes with updated data

### Delete Person

1. User clicks "Delete" in actions menu (requires `PERSONS_DELETE` permission)
2. Confirmation dialog appears
3. On confirm, person is deleted and user redirected to `/persons`

### Toggle Exclusion

1. User clicks "Exclude" or "Include" in actions menu (requires `PERSONS_MANAGE`)
2. Person's `isExcluded` flag is toggled
3. Affects visibility in TechHub employee directory

## Related Documentation

- [Employee Directory & Org Chart](./EMPLOYEE_DIRECTORY.md) - Directory views and org chart visualization
- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md) - Complete Person entity documentation
- [Entity Reference](../guides/ENTITY_REFERENCE.md) - Quick reference for all foundation entities
- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission implementation patterns
