# Advanced ITAM Features (Layer 3)

**Complete implementation guide for all 4 advanced IT Asset Management modules**

## Overview

Layer 3 extends the base asset management system with 4 specialized modules providing advanced ITAM capabilities:

1. **Asset Disposals** - End-of-life asset management with approval workflows
2. **Asset Kits** - Predefined asset bundles for streamlined deployment
3. **Asset Reservations** - Future asset booking with conflict prevention
4. **CMDB** - Configuration Management Database for IT infrastructure tracking

All modules follow Clean Architecture patterns with complete separation of concerns, comprehensive permission systems, and production-ready implementations.

---

## Architecture Summary

### Database Layer

**9 New Tables** across 4 migrations:

- `asset_disposals`, `disposal_approvals`, `disposal_documents` (Disposals)
- `asset_kits`, `asset_kit_items`, `asset_kit_checkouts`, `asset_kit_checkout_items` (Kits)
- `asset_reservations`, `asset_reservation_conflicts` (Reservations)
- Already existing: `configuration_items`, `ci_relationships`, `relationship_types` (CMDB)

### Domain Layer

**12 New Entities** with business logic:

- 3 Disposal entities with workflow state management
- 4 Kit entities with inventory tracking
- 2 Reservation entities with conflict detection
- 3 CMDB entities with dependency management

### Use Case Layer

**62 Total Use Cases**:

- 12 Disposal use cases (approval workflow, certificate generation)
- 18 Kit use cases (builder, checkout, partial returns)
- 16 Reservation use cases (conflict detection, availability checks)
- 16 CMDB use cases (CRUD + dependency graph foundation)

### Interface Adapters

- **Controllers**: 4 new controllers with server actions
- **DTOs**: 10 Zod schemas for type-safe validation
- **Presenters**: 10 presenters for data transformation

### Presentation Layer

- **UI Components**: 28 React components
- **Routes**: 6 Next.js pages with permission guards
- **Navigation**: Integrated into existing navigation system

---

## Feature Comparison Matrix

| Feature                | Entities | Use Cases | Routes | Complexity | Status      |
| ---------------------- | -------- | --------- | ------ | ---------- | ----------- |
| **Asset Disposals**    | 3        | 12        | 1      | High       | ✅ Complete |
| **Asset Kits**         | 4        | 18        | 1      | High       | ✅ Complete |
| **Asset Reservations** | 2        | 16        | 1      | High       | ✅ Complete |
| **CMDB**               | 3        | 16        | 3      | Medium     | ✅ Complete |
| **Total**              | **12**   | **62**    | **6**  | -          | **100%**    |

---

## Permission System

All features use feature-specific permissions for fine-grained access control:

### Asset Disposals

```typescript
ASSET_DISPOSALS_VIEW; // View disposal requests
ASSET_DISPOSALS_CREATE; // Create disposal request
ASSET_DISPOSALS_UPDATE; // Update disposal details
ASSET_DISPOSALS_DELETE; // Delete disposal request
ASSET_DISPOSALS_APPROVE; // Approve disposal
ASSET_DISPOSALS_REJECT; // Reject disposal
ASSET_DISPOSALS_START; // Start disposal process
ASSET_DISPOSALS_COMPLETE; // Complete disposal
ASSET_DISPOSALS_CANCEL; // Cancel disposal
ASSET_DISPOSALS_MANAGE; // Full management access
```

### Asset Kits

```typescript
ASSET_KITS_VIEW; // View kits and checkouts
ASSET_KITS_CREATE; // Create new kit
ASSET_KITS_UPDATE; // Update kit details
ASSET_KITS_DELETE; // Delete kit
ASSET_KITS_CHECKOUT; // Check out kit
ASSET_KITS_RETURN; // Return kit/items
ASSET_KITS_MANAGE; // Full management access
```

### Asset Reservations

```typescript
ASSET_RESERVATIONS_VIEW; // View reservations
ASSET_RESERVATIONS_CREATE; // Create reservation
ASSET_RESERVATIONS_UPDATE; // Update reservation
ASSET_RESERVATIONS_DELETE; // Delete reservation
ASSET_RESERVATIONS_CANCEL; // Cancel reservation
ASSET_RESERVATIONS_CONFIRM; // Confirm reservation
ASSET_RESERVATIONS_MANAGE; // Full management access
```

### CMDB

```typescript
CONFIGURATION_ITEMS_VIEW; // View CIs
CONFIGURATION_ITEMS_CREATE; // Create CI
CONFIGURATION_ITEMS_UPDATE; // Update CI
CONFIGURATION_ITEMS_DELETE; // Delete CI
CONFIGURATION_ITEMS_MANAGE; // Full management

CI_RELATIONSHIPS_VIEW; // View relationships
CI_RELATIONSHIPS_CREATE; // Create relationship
CI_RELATIONSHIPS_UPDATE; // Update relationship
CI_RELATIONSHIPS_DELETE; // Delete relationship
CI_RELATIONSHIPS_MANAGE; // Full management

RELATIONSHIP_TYPES_VIEW; // View relationship types
RELATIONSHIP_TYPES_CREATE; // Create relationship type
RELATIONSHIP_TYPES_UPDATE; // Update relationship type
RELATIONSHIP_TYPES_DELETE; // Delete relationship type
RELATIONSHIP_TYPES_MANAGE; // Full management
```

---

## Navigation Structure

```
Assets
├── Assets
├── Asset Categories
├── Asset Models
├── Asset Assignments
├── Asset Kits ← NEW
├── Reservations ← NEW
├── Disposals ← NEW
└── Warranties

CMDB ← NEW GROUP
├── Configuration Items
├── CI Relationships
└── Relationship Types
```

---

## Quick Reference

### Routes

- `/asset-disposals` - Disposal workflow management
- `/asset-kits` - Kit builder and checkout tracking
- `/asset-reservations` - Reservation calendar and availability
- `/configuration-items` - CMDB configuration items
- `/ci-relationships` - Dependency and relationship management
- `/relationship-types` - Relationship type definitions

### Key Files

**Domain**:

- `src/core/domain/entities/{disposal,kit,reservation,cmdb}/*.entity.ts`

**Use Cases**:

- `src/core/use-cases/disposal/*.use-case.ts` (11 files)
- `src/core/use-cases/asset-kits/*.use-case.ts` (19 files)
- `src/core/use-cases/reservations/*.use-case.ts` (17 files)
- `src/core/use-cases/cmdb/*/*.use-case.ts` (15 files)

**Controllers**:

- `src/interface-adapters/controllers/asset-disposal.controller.ts`
- `src/interface-adapters/controllers/asset-kit.controller.ts`
- `src/interface-adapters/controllers/asset-reservation.controller.ts`
- `src/interface-adapters/controllers/configuration-item.controller.ts`
- `src/interface-adapters/controllers/ci-relationship.controller.ts`
- `src/interface-adapters/controllers/relationship-type.controller.ts`

**DI Modules**:

- `src/di/modules/disposal.module.ts`
- `src/di/modules/asset-kits.module.ts`
- `src/di/modules/reservations.module.ts`
- `src/di/modules/cmdb.module.ts`

---

## Common Patterns

### Workflow State Management

Asset Disposals use lifecycle states:

```typescript
PENDING_APPROVAL → APPROVED → IN_PROGRESS → SANITIZED → COMPLETED
                 ↘ REJECTED
                            ↘ CANCELLED
```

### Conflict Detection

Asset Reservations check for overlapping bookings:

```typescript
if (existingReservation.overlaps(newReservation)) {
  createConflict(existingReservation, newReservation);
  throw new ConflictError();
}
```

### Dependency Tracking

CMDB relationships support impact analysis:

```typescript
const dependencies = await getDependencies(ciId, {
  impactingOnly: true,
  recursive: true,
});
```

---

## Integration Points

### With Asset Management

- Disposals link to assets
- Kits contain assets
- Reservations book assets
- Configuration Items can link to physical assets

### With Lifecycle Management

- Disposals trigger lifecycle state changes
- Reservations respect lifecycle states
- CMDB tracks CI lifecycle states

### With RBAC System

- All features enforce permission checks
- Navigation filters based on user roles
- Actions require specific permissions

### With Audit System

- All entity changes logged
- Approval workflows tracked
- State transitions audited

---

## Future Enhancements

### Ready for Implementation

1. **PDF Generation** (Disposal certificates) - Use `jspdf` library
2. **Calendar View** (Reservations) - Integrate `react-big-calendar`
3. **Dependency Graph** (CMDB) - Visualize with `react-flow` or `mermaid`
4. **Background Jobs** (Reservations) - Activate with BullMQ
5. **Email Notifications** - Integrate with notification system

### Architecture Prepared For

- Asset hierarchy (parent/child relationships via CMDB)
- Automated disposal workflows (trigger on lifecycle state)
- Kit templates (quick deployment scenarios)
- Reservation calendars (resource scheduling)
- Impact analysis (cascading changes via CMDB)

---

## See Also

- [ASSET_DISPOSALS.md](./ASSET_DISPOSALS.md) - Detailed disposal workflow guide
- [ASSET_KITS.md](./ASSET_KITS.md) - Kit builder and checkout guide
- [ASSET_RESERVATIONS.md](./ASSET_RESERVATIONS.md) - Reservation system guide
- [CMDB_GUIDE.md](./CMDB_GUIDE.md) - Configuration management guide
- [DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md) - Adding new features
- [RBAC_DEVELOPER_GUIDE.md](./guides/RBAC_DEVELOPER_GUIDE.md) - Permission system
