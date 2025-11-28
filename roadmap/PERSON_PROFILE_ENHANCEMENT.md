# Person Profile Page Enhancement

**Status**: Planned
**Priority**: Medium
**Complexity**: Medium-Large
**Estimated Effort**: 3-4 days

## Overview

Enhance the Person Details Page (`/persons/[id]`) to be a fully rich 360-degree profile view. The current implementation has the structure (6 tabs, quick stats, actions) but most tabs only show counts without actual data tables.

### Business Value

- Employees can see everything related to them in one place
- IT admins get comprehensive visibility into person-asset-service relationships
- Supports SAMA compliance by providing audit trails per person
- Reduces navigation between multiple pages to understand a person's IT footprint

## Current State

### Implemented ✅
- Page structure with 6 tabs
- Overview Tab - Personal info, employment, organization, location, status
- Organization Tab - Reporting chain visualization, direct reports grid
- Quick Stats Cards (4 cards)
- Actions (Edit, Delete, Include/Exclude)
- Server-side permission checks

### Not Implemented ❌ (14 TODOs)

| Tab | Section | Status |
|-----|---------|--------|
| Organization | Role Assignments list | Count only |
| Assets | Intune Devices list | Count only |
| Assets | License Allocations list | Count only |
| Assets | Asset Reservations list | Count only |
| Assets | Kit Checkouts list | Count only |
| Assets | Maintenance Schedules list | Count only |
| Assets | Stock Movements list | Count only |
| Services | Service Ownerships list | Count only |
| Services | Configuration Items list | Count only |
| Services | Data Ownerships list | Count only |
| Governance | Verification Campaigns list | Count only |
| Governance | Verification Items list | Count only |
| Governance | Attachments list | Count only |
| Governance | Disposal Activities list | Count only |
| Activity | Audit Log Timeline | Placeholder |

## Technical Design

### Data Available (Person Relations)

The Person model has 27+ relations that can be displayed:

```
Organizational: manager, directReports, orgUnit, managedOrgUnits, primaryRole, roleAssignments, location
Devices: intuneDevices
Assets: stockMovements, assignedMaintenanceSchedules, performedMaintenanceRecords
Reservations: reservationsFor, reservationsCreated, reservationsConfirmed, reservationsCancelled
Kits: kitCheckouts
Disposals: initiatedDisposals, approvedDisposals, disposalApprovals, uploadedDisposalDocuments
Governance: dataOwnerships, verificationCampaigns, verificationItems
Files: attachments
Services: serviceOwnerships, configurationItems
Audit: auditLogsChanged
```

### Architecture Approach

Each tab component will:
1. Receive `personId` and initial counts from parent
2. Fetch actual data on mount using `useCallback` + `useEffect`
3. Display loading skeletons during fetch
4. Show empty state if no data
5. Render data in card-based tables with clickable links

### New Server Actions Required

| Action | Returns | Permission |
|--------|---------|------------|
| `getPersonRoleAssignmentsAction(personId)` | PersonRoleAssignment[] | PERSONS_VIEW |
| `getPersonIntuneDevicesAction(personId)` | IntuneDevice[] | INTUNE_DEVICES_VIEW |
| `getPersonLicenseAllocationsAction(personId)` | LicenseAllocation[] | LICENSE_ALLOCATIONS_VIEW |
| `getPersonReservationsAction(personId)` | AssetReservation[] | ASSET_RESERVATIONS_VIEW |
| `getPersonKitCheckoutsAction(personId)` | AssetKitCheckout[] | ASSET_KITS_VIEW |
| `getPersonMaintenanceAction(personId)` | MaintenanceSchedule[] | MAINTENANCE_VIEW |
| `getPersonStockMovementsAction(personId)` | StockMovement[] | STOCK_MOVEMENTS_VIEW |
| `getPersonServiceOwnershipsAction(personId)` | ServiceOwnership[] | SERVICES_VIEW |
| `getPersonConfigItemsAction(personId)` | ConfigurationItem[] | CMDB_VIEW |
| `getPersonDataOwnershipsAction(personId)` | DataOwnership[] | DATA_OWNERSHIPS_VIEW |
| `getPersonVerificationCampaignsAction(personId)` | VerificationCampaign[] | VERIFICATION_CAMPAIGNS_VIEW |
| `getPersonVerificationItemsAction(personId)` | VerificationItem[] | VERIFICATION_ITEMS_VIEW |
| `getPersonAttachmentsAction(personId)` | Attachment[] | ATTACHMENTS_VIEW |
| `getPersonDisposalsAction(personId)` | AssetDisposal[] | ASSET_DISPOSALS_VIEW |
| `getPersonAuditLogsAction(personId, pagination)` | AuditLogEntry[] | AUDIT_LOGS_VIEW |

### Files to Modify

```
src/components/persons/tabs/person-organization-tab.tsx  # Add role assignments table
src/components/persons/tabs/person-assets-tab.tsx        # Add 6 data tables
src/components/persons/tabs/person-services-tab.tsx      # Add 3 data tables
src/components/persons/tabs/person-governance-tab.tsx    # Add 4 data tables
src/components/persons/tabs/person-activity-tab.tsx      # Add audit log timeline
src/interface-adapters/controllers/person-details.controller.ts  # Add 15 new actions
```

## Implementation Checklist

### Phase 1: Controller Layer
- [ ] Add 15 new server actions to `person-details.controller.ts`
- [ ] Create DTOs for each relation type if not existing
- [ ] Add permission checks per action

### Phase 2: Organization Tab Enhancement
- [ ] Implement role assignments table with start/end dates, scope, notes
- [ ] Add "Primary" badge for primary role

### Phase 3: Assets Tab Implementation
- [ ] Implement Intune devices table (device name, OS, compliance status, last sync)
- [ ] Implement license allocations table (product, quantity, assignment date)
- [ ] Implement reservations table (asset, dates, status, purpose)
- [ ] Implement kit checkouts table (kit name, checkout/return dates, status)
- [ ] Implement maintenance schedules table (asset, type, next due, priority)
- [ ] Implement stock movements table (type, asset, from/to, date)

### Phase 4: Services Tab Implementation
- [ ] Implement service ownerships table (service, type, isPrimary)
- [ ] Implement configuration items table (CI name, class, lifecycle state)
- [ ] Implement data ownerships table (domain, notes)

### Phase 5: Governance Tab Implementation
- [ ] Implement verification campaigns table (name, target type, status, dates)
- [ ] Implement verification items table (campaign, target, status, verified date)
- [ ] Implement attachments table (filename, type, size, upload date)
- [ ] Implement disposals table (asset, type, status, dates)

### Phase 6: Activity Tab Implementation
- [ ] Create audit log timeline component with date grouping
- [ ] Add filters (action type, date range)
- [ ] Implement pagination for large activity histories

### Phase 7: Polish
- [ ] Add skeleton loading states to all new sections
- [ ] Add empty states with helpful messages
- [ ] Ensure all entity links navigate correctly
- [ ] Update documentation

## Design Decisions to Make

1. **Data Display Format**: For lists with many items:
   - Option A: Simple card list with "View all" link
   - Option B: Paginated table within tab
   - Option C: Expandable accordion with limited items

2. **Activity Tab Scope**: What to include:
   - Changes made BY this person (audit logs where changedById = personId)
   - Changes made TO this person's record
   - Maintenance records performed
   - All of the above?

3. **Cross-Entity Permissions**: Should viewing a person's devices require:
   - Only PERSONS_VIEW (current person context)
   - Also INTUNE_DEVICES_VIEW (entity-specific permission)
   - Hybrid approach?

## Testing Strategy

- Unit tests for each new server action
- Integration tests for tab data loading
- E2E tests for navigation and cross-linking
- Permission boundary tests

## Risk & Considerations

1. **Performance**: Loading many relations could be slow
   - Mitigation: Lazy loading per tab, pagination for large datasets

2. **Permission Complexity**: Different entities have different permissions
   - Mitigation: Check entity-specific permissions per section

3. **Data Consistency**: Relations may have stale counts
   - Mitigation: Refresh counts on tab switch or use real-time updates

---

**Related Documentation:**
- [Person Details Page](../docs/features/PERSON_DETAILS.md)
- [Employee Directory](../docs/features/EMPLOYEE_DIRECTORY.md)
- [Foundation Layer Guide](../docs/guides/FOUNDATION_LAYER.md)
