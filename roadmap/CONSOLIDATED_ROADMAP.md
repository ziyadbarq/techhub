# Consolidated Roadmap

High-level overview of all planned features, partially complete work, and suggestions for future development.

## Priority 1: Core Completion

### Universal Data Importer (Partially Complete)
**Status**: Partially Complete | **Complexity**: Medium

**Done**:
- 7-step wizard with validation engine
- Fuzzy matching and auto-mapping
- Assets and Persons entity support

**Remaining**:
- 64 entity configurations
- Import history and audit trail
- Bulk actions for remaining entities

**Reference**: [UNIVERSAL_DATA_IMPORTER.md](UNIVERSAL_DATA_IMPORTER.md)

---

### LicenseProduct Form with Custom Fields
**Status**: Infrastructure Ready | **Complexity**: Small

**Done**:
- Database schema (`LicenseProductField` + `attributes`)
- Repository with `findByLicenseProductIdWithDefinition()`
- Controller action `listEnrichedLicenseProductFieldsAction()`
- Client hook `useLicenseProductFields()`

**Remaining**:
- Create/Edit form UI (currently TODO in codebase)
- Integrate `LicenseProductCustomFieldsSection` component
- Detail page custom fields display

---

## Priority 2: User Experience

### Profile Page Enhancement
**Status**: Planned | **Complexity**: Medium

Unified profile page merging User (auth) and Person (employee) data with:
- My Assets summary
- Roles/permissions display
- User preferences (notifications, display settings)

**Reference**: [PROFILE_PAGE_ENHANCEMENT.md](PROFILE_PAGE_ENHANCEMENT.md)

---

### Person Profile Enhancement
**Status**: Planned | **Complexity**: Medium-Large

Enhance Person Details Page to 360-degree profile view with data tables for:
- Assets (assigned, historical)
- Services (owned, used)
- Governance (data ownership, verification)
- Activity tabs (audit trail, changes)

**Reference**: [PERSON_PROFILE_ENHANCEMENT.md](PERSON_PROFILE_ENHANCEMENT.md)

---

## Priority 3: Security & Admin

### RBAC Improvements
**Status**: Planned | **Complexity**: Medium

Enhanced validation and enforcement:
- Bidirectional conflict detection
- SoD enforcement in bulk assignment
- Server-side permission dependency validation
- UI improvements (role name comparison, same-day expiration)
- Audit logging for blocked operations

**Reference**: [RBAC_IMPROVEMENTS.md](RBAC_IMPROVEMENTS.md)

---

## Priority 4: Advanced Features

### Service Management System
**Status**: Planned | **Complexity**: Large

Comprehensive IT service catalog with:
- Service ownership model
- Infrastructure relationships
- Asset relationships
- Business process mapping

**Reference**: [SERVICE_MANAGEMENT.md](SERVICE_MANAGEMENT.md)

---

### Security Patch Workflow
**Status**: Planned | **Complexity**: Medium-Large

Monthly security patching with:
- Owner approval workflow
- Compliance tracking
- Patch scheduling
- Status reporting

**Reference**: [SECURITY_PATCH_WORKFLOW.md](SECURITY_PATCH_WORKFLOW.md)

---

## Priority 5: Enhancements

### ConfigurationItem Export
**Status**: Not Started | **Complexity**: Small

Add export functionality to CI table:
- CSV export with custom fields
- XLSX export with custom fields
- Follow Asset export pattern

---

### Custom Fields Expansion
**Status**: Future | **Complexity**: Medium per entity

Extend custom fields to remaining 17 registered entities:
- **Asset Management**: AssetCategory, AssetModel, AssetKit
- **People & Organization**: Person, OrganizationUnit, Role
- **Infrastructure**: Location, StockLocation
- **Vendors & Contracts**: Vendor, Contract, ContractType
- **CMDB**: CIClass, Service, BusinessProcess
- **Licensing**: LicenseEntitlement
- **Maintenance**: MaintenanceSchedule, Warranty

Each requires:
1. `*Field` junction table
2. `attributes Json?` field
3. Repository enriched query
4. Controller action
5. Client hook
6. Form + Display components

---

## Suggested Implementation Order

| Phase | Features | Estimated Scope |
|-------|----------|-----------------|
| **1** | LicenseProduct Form, CI Export | Small |
| **2** | Universal Data Importer completion | Medium |
| **3** | Profile Page Enhancement | Medium |
| **4** | Person Profile Enhancement | Medium-Large |
| **5** | RBAC Improvements | Medium |
| **6** | Custom Fields: Person, Vendor, Contract | Medium |
| **7** | Service Management System | Large |
| **8** | Security Patch Workflow | Medium-Large |
| **9** | Remaining Custom Fields entities | Large |

---

## Quick Wins (< 1 day each)

1. LicenseProduct create/edit form with custom fields
2. CI table CSV/XLSX export
3. Custom fields for Person entity (high value)
4. Custom fields for Vendor entity (high value)

---

## Dependencies

```
Service Management → Security Patch Workflow
Profile Page Enhancement → Person Profile Enhancement
Universal Data Importer → Custom Fields Expansion (for import support)
```

---

**Last Updated**: 2025-11-29
