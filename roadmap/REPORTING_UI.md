# Reporting UI — Dedicated Report Pages

**Status**: Planned
**Priority**: Medium
**Complexity**: Medium
**Estimated Effort**: 2-3 days
**Last Updated**: 2026-03-27

## Overview

3 backend report use cases exist with server actions but the UI at `/reports` is minimal/placeholder. Each report needs a dedicated page with tables, filters, and summary cards.

## Existing Backend (Ready)

| Report | Use Case | Controller Action | Module |
|--------|----------|-------------------|--------|
| License Compliance | `GetLicenseComplianceReportUseCase` | `getLicenseComplianceReportAction()` | licenses (HEAVY) |
| Contract Expiration | `GetContractExpirationReportUseCase` | `getContractExpirationReportAction()` | contracts (DASHBOARD) |
| OCI Resource Inventory | `GetOciResourceInventoryReportUseCase` | `getOciResourceInventoryReportAction()` | cmdb (DASHBOARD) |

## Reports to Build

### 1. License Compliance Report (`/reports/license-compliance`)

**Data available**:
- Per-entitlement: product name, purchased vs allocated quantity, utilization %, status, expiry
- Summary: total entitlements, compliant count, over-allocated, under-utilized, expiring, expired

**UI design**:
- Summary cards at top (compliant, at-risk, expired counts)
- Data table with sorting/filtering
- Status badges (compliant = green, over-allocated = red, expiring = yellow)
- Export to CSV

### 2. Contract Expiration Report (`/reports/contract-expiration`)

**Data available**:
- Per-contract: name, number, start/end dates, days until expiry, auto-renew, total value, status
- Summary: total contracts, active, expiring in 30/60/90 days, expired, total value at risk

**UI design**:
- Summary cards (active, expiring soon, expired, value at risk in SAR)
- Data table sorted by expiry date (soonest first)
- Color coding by urgency (30 days = red, 60 = orange, 90 = yellow)
- Export to CSV

### 3. OCI Resource Inventory Report (`/reports/oci-inventory`)

**Data available**:
- Per-resource: CI name, class, environment, criticality, lifecycle state, region, compartment, last synced
- Summary: total resources, by type, by region, by lifecycle state

**UI design**:
- Summary cards (total resources, by environment)
- Breakdown tables (by type, by region)
- Main data table with all resources
- Export to CSV

## Implementation Pattern

Each report page follows the same pattern:
1. Server component with `export const dynamic = "force-dynamic"`
2. Permission check: `await requirePermission(PERMISSIONS.DASHBOARD_ANALYTICS)`
3. Client component with data fetching via server action
4. Reusable `<ReportPage>` wrapper component (optional — evaluate if 3 pages justify it)

## Out of Scope

- SAMA compliance reports (separate, larger initiative)
- Custom report builder
- Chart/graph visualizations (can be added later)
- Scheduled report delivery via email

## Files to Create

| File | Description |
|------|-------------|
| `src/app/(dashboard)/reports/license-compliance/page.tsx` | License compliance report page |
| `src/app/(dashboard)/reports/contract-expiration/page.tsx` | Contract expiration report page |
| `src/app/(dashboard)/reports/oci-inventory/page.tsx` | OCI inventory report page |
| `src/components/reports/report-summary-cards.tsx` | Reusable summary cards component |

## Files to Modify

| File | Change |
|------|--------|
| `src/config/routes-manifest.ts` | Add 3 report sub-routes |
| `src/app/(dashboard)/reports/page.tsx` | Update to link to sub-reports |

## Verification

1. `npm run validate` passes
2. Each report page loads with real data
3. Tables are sortable and filterable
4. Permission denied for users without `DASHBOARD_ANALYTICS`
5. CSV export works
