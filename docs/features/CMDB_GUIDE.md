# Configuration Management Database (CMDB) Guide

**Complete guide to CMDB implementation for IT infrastructure tracking and dependency management**

## Overview

The CMDB (Configuration Management Database) module provides infrastructure for tracking Configuration Items (CIs), their relationships, and dependencies. This enables impact analysis, change management, and infrastructure documentation.

**Key Capabilities**:

- Track any IT infrastructure component as a Configuration Item
- Define relationship types (DEPENDS_ON, RUNS_ON, HOSTED_BY, etc.)
- Create directed or bidirectional relationships between CIs
- Link CIs to physical assets
- Track lifecycle states and criticality
- Foundation for dependency graphs and impact analysis

---

## Architecture

### Database Schema

**3 Core Tables**:

1. **`configuration_items`** - IT infrastructure components
   - Links to: `ci_classes`, `lifecycle_states`, `persons`, `organization_units`, `locations`, `assets`
   - Tracks: name, CI key, criticality, environment, attributes

2. **`ci_relationships`** - Dependencies between CIs
   - Links: `from_ci` → `relationship_type` → `to_ci`
   - Tracks: validity periods, active state, notes

3. **`relationship_types`** - Relationship definitions
   - Defines: name, code, direction (uni/bidirectional), impact flag
   - Examples: DEPENDS_ON, RUNS_ON, HOSTED_BY, CONNECTED_TO

### Entity Model

```typescript
// Configuration Item
class ConfigurationItemEntity {
  id: string;
  name: string;
  ciClassId: string;
  ciKey?: string; // Unique identifier (e.g., APP-001)
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  environment?: "PROD" | "UAT" | "DEV" | "TEST" | "DR" | "OTHER";
  lifecycleStateId?: string;
  primaryOwnerPersonId?: string;
  primaryOwnerOrgUnitId?: string;
  locationId?: string;
  linkedAssetId?: string; // Link to physical asset
  description?: string;
  attributes?: Record<string, unknown>; // Custom fields
}

// Relationship Type
class RelationshipTypeEntity {
  id: string;
  name: string; // "Depends On"
  code: string; // "DEPENDS_ON"
  direction: "UNIDIRECTIONAL" | "BIDIRECTIONAL";
  isImpacting: boolean; // Used for impact analysis
  description?: string;
}

// CI Relationship
class CIRelationshipEntity {
  id: string;
  fromCiId: string;
  toCiId: string;
  relationshipTypeId: string;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  note?: string;
}
```

---

## Use Cases

### Configuration Items (6 use cases)

1. **Create Configuration Item**
   - Validates CI key uniqueness
   - Validates CI class exists
   - Creates CI with optional lifecycle state

2. **Get Configuration Item**
   - Retrieves with enriched data (class name, lifecycle state, owner name, location, linked asset tag)
   - Returns null if not found

3. **List Configuration Items**
   - Supports filtering by CI class, criticality, environment, owner
   - Returns enriched DTOs

4. **Update Configuration Item**
   - Updates mutable fields (name, lifecycle, criticality, environment, owner, location, linked asset, description, attributes)
   - Validates CI class and lifecycle state if changed

5. **Delete Configuration Item**
   - Soft or hard delete
   - Checks for existing relationships (should warn or block)

### Relationship Types (5 use cases)

1. **Create Relationship Type**
   - Validates code uniqueness
   - Creates relationship type definition

2. **Get Relationship Type**
   - Retrieves by ID

3. **List Relationship Types**
   - Returns all available relationship types

4. **Update Relationship Type**
   - Updates name, description, direction, isImpacting flag
   - Code is immutable after creation

5. **Delete Relationship Type**
   - Checks for existing relationships using this type
   - Should block or warn if in use

### CI Relationships (5 use cases)

1. **Create CI Relationship**
   - Validates both CIs exist
   - Validates relationship type exists
   - Checks for duplicate relationships
   - Creates relationship with validity period

2. **Get CI Relationship**
   - Retrieves with enriched data (CI names, relationship type name)

3. **List CI Relationships**
   - Filters by fromCi, toCi, relationshipType, isActive
   - Returns enriched DTOs

4. **Update CI Relationship**
   - Updates validTo, isActive, note
   - Cannot change fromCi, toCi, or relationshipType (create new instead)

5. **Delete CI Relationship**
   - Removes relationship
   - Logs for audit trail

---

## Routes

### Configuration Items

**Route**: `/configuration-items`
**Permission**: `CONFIGURATION_ITEMS_VIEW`

**Features**:

- Table view with debounced search, saved filters (Prod Critical, Unlinked), column chooser, compact default density (no toggle), stale-highlighting, and asset/owner filters
- Saved views via URL params (q, criticality, environment, owner, assetLink, density) so teams can share filtered views
- Create/edit form with CI key validation, lifecycle state, owner (person/org unit), location, and linked asset selectors (searchable)
- Detail view with tabbed layout (Overview, Relationships, Custom Fields, Activity) and copyable CI key
- Delete confirmation dialog

**UI Components**:

- `ConfigurationItemsPageClient` - Main page wrapper
- `ConfigurationItemsTable` - Data table with TanStack Table
- `ConfigurationItemForm` - Create/edit dialog
- `ConfigurationItemDetail` - Read-only detail view

### CI Relationships

**Route**: `/ci-relationships`
**Permission**: `CI_RELATIONSHIPS_VIEW`

**Features**:

- Table view showing From CI → Relationship → To CI
- Active/inactive status indicators
- Validity period display
- Create/edit relationship forms
- Delete confirmation

**UI Components**:

- `CIRelationshipsPageClient` - Main page wrapper
- `CIRelationshipsTable` - Relationship listing
- `CIRelationshipForm` - Create/edit dialog
- `CIRelationshipDetail` - Relationship details with visual representation

### Relationship Types

**Route**: `/relationship-types`
**Permission**: `RELATIONSHIP_TYPES_VIEW`

**Features**:

- Table view of all relationship type definitions
- Direction indicators (→ unidirectional, ⟷ bidirectional)
- Impacting flag display
- Create/edit forms
- Usage examples

**UI Components**:

- `RelationshipTypesPageClient` - Main page wrapper
- `RelationshipTypesTable` - Type definitions listing
- `RelationshipTypeForm` - Create/edit dialog
- `RelationshipTypeDetail` - Type details and usage examples

---

## Permissions

### Granular Access Control

```typescript
// Configuration Items
CONFIGURATION_ITEMS_VIEW; // View CIs
CONFIGURATION_ITEMS_CREATE; // Create new CI
CONFIGURATION_ITEMS_UPDATE; // Edit CI
CONFIGURATION_ITEMS_DELETE; // Delete CI
CONFIGURATION_ITEMS_MANAGE; // Full access

// CI Relationships
CI_RELATIONSHIPS_VIEW; // View relationships
CI_RELATIONSHIPS_CREATE; // Create relationship
CI_RELATIONSHIPS_UPDATE; // Edit relationship
CI_RELATIONSHIPS_DELETE; // Delete relationship
CI_RELATIONSHIPS_MANAGE; // Full access

// Relationship Types
RELATIONSHIP_TYPES_VIEW; // View types
RELATIONSHIP_TYPES_CREATE; // Create type
RELATIONSHIP_TYPES_UPDATE; // Edit type
RELATIONSHIP_TYPES_DELETE; // Delete type
RELATIONSHIP_TYPES_MANAGE; // Full access
```

### Implementation

```typescript
// Page level
export default async function ConfigurationItemsPage() {
  await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  // ... page content
}

// UI Component level
<PermissionGuard permission={PERMISSIONS.CONFIGURATION_ITEMS_CREATE}>
  <Button onClick={handleCreate}>New CI</Button>
</PermissionGuard>

// Controller level (server action)
export async function createConfigurationItemAction(data: CreateConfigurationItemDTO) {
  await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_CREATE);
  // ... create logic
}
```

---

## Common Workflows

### 1. Creating a Configuration Item

```typescript
// Example: Create a database server CI
const dbServer = await createConfigurationItem({
  name: "Production Database Server",
  ciClassId: "server-class-id",
  ciKey: "SRV-PROD-DB-01",
  criticality: "CRITICAL",
  environment: "PROD",
  primaryOwnerPersonId: "dba-user-id",
  locationId: "datacenter-location-id",
  linkedAssetId: "physical-server-asset-id", // Link to hardware
  description: "Primary PostgreSQL database server for production",
  attributes: {
    hostname: "db-prod-01.internal",
    ipAddress: "10.0.1.100",
    osVersion: "Ubuntu 22.04 LTS",
    dbVersion: "PostgreSQL 15.2",
  },
});
```

### 2. Defining a Relationship Type

```typescript
// Example: Define "DEPENDS_ON" relationship
const dependsOnType = await createRelationshipType({
  name: "Depends On",
  code: "DEPENDS_ON",
  direction: "UNIDIRECTIONAL", // A depends on B (not reverse)
  isImpacting: true, // Used for impact analysis
  description: "Indicates that one CI requires another CI to function",
});
```

### 3. Creating a CI Relationship

```typescript
// Example: Application depends on database
const appDbRelationship = await createCIRelationship({
  fromCiId: "web-app-ci-id",
  toCiId: "db-server-ci-id",
  relationshipTypeId: "depends-on-type-id",
  validFrom: new Date(),
  validTo: null, // No end date
  note: "Application requires database for user authentication and data storage",
});
```

### 4. Querying Dependencies

```typescript
// Find all dependencies of an application
const dependencies = await listCIRelationships({
  fromCiId: "web-app-ci-id",
  isActive: true,
});

// Find all CIs that depend on a database
const dependents = await listCIRelationships({
  toCiId: "db-server-ci-id",
  isActive: true,
});
```

---

## Use Case Examples

### Example 1: Web Application Stack

```
┌─────────────────┐
│  Load Balancer  │ (CI: LB-PROD-01)
│   (CRITICAL)    │
└────────┬────────┘
         │ ROUTES_TO
         ↓
┌─────────────────┐
│  Web Server 1   │ (CI: WEB-PROD-01)
│     (HIGH)      │
└────────┬────────┘
         │ DEPENDS_ON
         ↓
┌─────────────────┐
│   App Server    │ (CI: APP-PROD-01)
│   (CRITICAL)    │
└────────┬────────┘
         │ DEPENDS_ON
         ↓
┌─────────────────┐
│  Database       │ (CI: DB-PROD-01)
│   (CRITICAL)    │
└─────────────────┘
```

**Relationships**:

1. Load Balancer → ROUTES_TO → Web Server 1
2. Web Server 1 → DEPENDS_ON → App Server
3. App Server → DEPENDS_ON → Database

**Impact Analysis**: If Database goes down, all 3 components above it are affected.

### Example 2: Server Hosting

```
┌─────────────────┐
│ Physical Server │ (CI: SRV-HW-01)
│     (Asset)     │
└────────┬────────┘
         │ HOSTS
         ↓
┌─────────────────┐
│  Hypervisor     │ (CI: VMWARE-01)
│     (HIGH)      │
└────────┬────────┘
         │ RUNS
         ↓
┌─────────────────┐
│  Virtual Machine│ (CI: VM-APP-01)
│    (MEDIUM)     │
└────────┬────────┘
         │ HOSTS
         ↓
┌─────────────────┐
│  Application    │ (CI: APP-WEB-01)
│     (HIGH)      │
└─────────────────┘
```

**Relationships**:

1. Physical Server → HOSTS → Hypervisor
2. Hypervisor → RUNS → Virtual Machine
3. Virtual Machine → HOSTS → Application

### Example 3: Network Infrastructure

```
┌─────────────────┐
│  Core Switch    │ (CI: SW-CORE-01)
│   (CRITICAL)    │ ⟷ CONNECTED_TO ⟷
└────────┬────────┘
         │ CONNECTED_TO
         ↓
┌─────────────────┐
│ Access Switch   │ (CI: SW-ACC-01)
│     (HIGH)      │
└────────┬────────┘
         │ CONNECTED_TO
         ↓
┌─────────────────┐
│  End Device     │ (CI: DEV-WORKSTATION-01)
│     (LOW)       │
└─────────────────┘
```

**Bidirectional Relationship**: Core Switch ⟷ Core Switch (for redundancy)

---

## Best Practices

### CI Key Naming Conventions

```
Format: [TYPE]-[ENV]-[CATEGORY]-[NUMBER]

Examples:
- SRV-PROD-DB-01         (Production Database Server)
- APP-UAT-WEB-02         (UAT Web Application)
- NET-PROD-SWITCH-01     (Production Network Switch)
- VM-DEV-APP-05          (Development VM)
```

### Criticality Assignment

- **CRITICAL**: Service outage affects business operations (production databases, core applications)
- **HIGH**: Important but non-critical services (backup systems, monitoring)
- **MEDIUM**: Standard infrastructure (test environments, dev servers)
- **LOW**: Non-essential components (sandbox environments)

### Environment Tagging

- **PROD**: Production environment
- **UAT**: User Acceptance Testing
- **DEV**: Development environment
- **TEST**: Testing environment
- **DR**: Disaster Recovery
- **OTHER**: Special purposes

### Relationship Type Guidelines

**Unidirectional**:

- DEPENDS_ON: A requires B
- HOSTED_BY: A is hosted on B
- USES: A uses B as a service

**Bidirectional**:

- CONNECTED_TO: A and B are connected (networking)
- SYNCHRONIZED_WITH: A and B sync data
- CLUSTERED_WITH: A and B form a cluster

**Impacting**:

- Set `isImpacting: true` for relationships that affect availability
- Used for change impact analysis and incident management

---

## Integration with Assets

### Linking CIs to Physical Assets

```typescript
// Create CI for a physical server asset
const serverCI = await createConfigurationItem({
  name: "Production Web Server",
  ciClassId: "server-class-id",
  linkedAssetId: assetId, // Links to Asset entity
  // ... other fields
});

// Query: Find all CIs linked to assets in a location
const locationAssets = await listAssets({ locationId });
const linkedCIs = await listConfigurationItems({
  linkedAssetIds: locationAssets.map((a) => a.id),
});
```

### Asset Detail Integration

The Asset detail page includes a **CMDB tab** (permission-gated) that displays all Configuration Items linked to that asset:

- **Component**: `src/components/assets/asset-cmdb-tab.tsx`
- **Controller Action**: `listConfigurationItemsAction({ linkedAssetId: assetId })`
- **Permission Required**: `CONFIGURATION_ITEMS_VIEW`
- Shows: CI name, CI key, criticality badge, environment badge, CI class, description
- Criticality colors: CRITICAL (destructive), HIGH (default), MEDIUM (secondary), LOW (outline)
- Environment colors: PRODUCTION (red), STAGING (yellow), DEVELOPMENT (blue), TEST (green)

### Use Cases

1. **Hardware Tracking**: Link servers, network equipment to CI records
2. **Lifecycle Coordination**: Sync asset lifecycle with CI lifecycle
3. **Cost Tracking**: Associate infrastructure costs with assets
4. **Maintenance Coordination**: Schedule maintenance based on asset and CI status
5. **360-Degree Asset View**: See all CIs linked to an asset from the Asset detail page

---

## Future Enhancements

### Ready for Implementation

1. **Dependency Graph Visualization**

   ```typescript
   // Use react-flow or mermaid for visualization
   const graph = await buildDependencyGraph(ciId);
   renderGraph(graph);
   ```

2. **Impact Analysis**

   ```typescript
   // Calculate impact of CI failure
   const impactedCIs = await getImpactedCIs(ciId, {
     recursive: true,
     impactingOnly: true,
   });
   ```

3. **Change Management Integration**

   ```typescript
   // Before applying change, check impact
   const changeImpact = await assessChangeImpact(ciId, proposedChange);
   if (changeImpact.criticality === "HIGH") {
     requireApproval();
   }
   ```

4. **Auto-Discovery**
   ```typescript
   // Integrate with network scanning tools
   const discoveredCIs = await scanNetwork();
   await reconcileCIs(discoveredCIs);
   ```

### Database Prepared For

- Dependency graph queries (via recursive CTEs)
- Impact analysis (via `isImpacting` flag)
- Temporal relationships (via `validFrom`/`validTo`)
- Custom CI attributes (via `attributes` JSONB field)
- CI hierarchy (via recursive relationships)

---

## Known Issues

### TypeScript Form Errors

The create/update forms have TypeScript type errors due to separate schemas. **Forms are functional** but need type refinement:

**Affected Files**:

- `src/components/configuration-items/configuration-item-form.tsx`
- `src/components/ci-relationships/ci-relationship-form.tsx`
- `src/components/relationship-types/relationship-type-form.tsx`

**Workaround**: Use `npm run build:fast` to skip type-check during builds

**Fix Needed**: Refactor to use conditional rendering with fully separated forms for create vs edit modes

---

## DI Configuration

**Module**: `src/di/modules/cmdb.module.ts`
**Registration**: `src/di/container.ts` line 103

```typescript
// Container registration
export function bindCMDBDependencies(container: Container) {
  // Repositories
  container
    .bind<IConfigurationItemRepository>(DI_TOKENS.IConfigurationItemRepository)
    .to(PrismaConfigurationItemRepository)
    .inSingletonScope();
  // ... additional bindings

  // Use Cases
  container
    .bind<CreateConfigurationItemUseCase>(
      DI_TOKENS.CreateConfigurationItemUseCase,
    )
    .to(CreateConfigurationItemUseCase)
    .inRequestScope();
  // ... additional use cases
}
```

---

## Testing Scenarios

### Scenario 1: Basic CI Creation

1. Create CI class (if not exists)
2. Create configuration item
3. Verify CI appears in listing
4. Update CI details
5. Delete CI

### Scenario 2: Relationship Management

1. Create two CIs
2. Create relationship type
3. Create relationship between CIs
4. Query relationships
5. Deactivate relationship
6. Verify relationship marked inactive

### Scenario 3: Impact Analysis

1. Create dependency chain (A → B → C)
2. Mark relationships as impacting
3. Query all dependencies of C
4. Verify chain is returned

---

## See Also

- **[Assets vs Configuration Items User Guide](/docs/user-guides/assets-vs-configuration-items)** - When to create Assets, CIs, or both (in-app documentation)
- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Overview of all ITAM modules
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) - Schema design
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Development patterns
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission system
