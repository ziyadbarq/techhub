# Hierarchy Management Guide

## Overview

This guide covers working with hierarchical entities in the Barq Assets CMDB/ITAM system. The Foundation layer includes two primary hierarchical structures: **OrganizationUnit** (organizational hierarchy) and **Location** (geographical hierarchy).

Both use self-referencing parent-child relationships, enabling flexible tree structures of unlimited depth.

---

## Hierarchical Entities

### OrganizationUnit Hierarchy

**Structure**: Company → Business Unit → Department → Team

**Use Cases**:
- Define organizational structure
- Assign assets and CIs to departments/teams
- Track cost centers and budgets
- Determine ownership and responsibility

**Key Fields**:
- `parentId` - References parent unit (null for top level)
- `level` - Depth in hierarchy (1 = Company, 2 = BU, 3 = Dept, etc.)
- `unitType` - Type enum (COMPANY, BUSINESS_UNIT, DEPARTMENT, TEAM)

### Location Hierarchy

**Structure**: Country → City → Campus → Building → Floor → Room → Rack

**Use Cases**:
- Track physical location of assets and CIs
- Support multi-site organizations
- Enable location-based reporting
- Manage data center racks and cloud regions

**Key Fields**:
- `parentId` - References parent location (null for top level)
- `locationType` - Type enum (COUNTRY, CITY, BUILDING, ROOM, RACK, etc.)
- `addressLine1/2`, `city`, `country` - Physical address
- `latitude`, `longitude` - Geolocation coordinates

---

## Creating Hierarchies

### Pattern 1: Top-Down Creation

Create parent first, then children:

```typescript
// 1. Create top-level (Company)
const company = await createOrganizationUnitAction({
  name: "Barq Technologies",
  code: "BARQ",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
  parentId: null, // No parent
  userId: currentUserId
});

// 2. Create child (Business Unit)
const engineering = await createOrganizationUnitAction({
  name: "Engineering Division",
  code: "BARQ-ENG",
  unitType: OrganizationUnitType.BUSINESS_UNIT,
  level: 2,
  parentId: company.data.id, // Link to parent
  userId: currentUserId
});

// 3. Create grandchild (Department)
const itDept = await createOrganizationUnitAction({
  name: "IT Department",
  code: "BARQ-ENG-IT",
  unitType: OrganizationUnitType.DEPARTMENT,
  level: 3,
  parentId: engineering.data.id,
  costCenter: "CC-IT-001",
  userId: currentUserId
});

// 4. Create great-grandchild (Team)
const devOpsTeam = await createOrganizationUnitAction({
  name: "DevOps Team",
  code: "BARQ-ENG-IT-DEVOPS",
  unitType: OrganizationUnitType.TEAM,
  level: 4,
  parentId: itDept.data.id,
  userId: currentUserId
});
```

**Result**:
```
Barq Technologies (Company)
└── Engineering Division (BU)
    └── IT Department (Dept)
        └── DevOps Team (Team)
```

### Pattern 2: Bulk Hierarchy Creation

Create entire hierarchy in single operation:

```typescript
async function createOrgHierarchy() {
  // Create hierarchy data structure
  const hierarchy = {
    name: "Barq Technologies",
    code: "BARQ",
    type: "COMPANY",
    level: 1,
    children: [
      {
        name: "Engineering",
        code: "BARQ-ENG",
        type: "BUSINESS_UNIT",
        level: 2,
        children: [
          {
            name: "IT Department",
            code: "BARQ-ENG-IT",
            type: "DEPARTMENT",
            level: 3,
            costCenter: "CC-IT-001",
            children: []
          },
          {
            name: "R&D Department",
            code: "BARQ-ENG-RD",
            type: "DEPARTMENT",
            level: 3,
            costCenter: "CC-RD-001",
            children: []
          }
        ]
      },
      {
        name: "Sales",
        code: "BARQ-SALES",
        type: "BUSINESS_UNIT",
        level: 2,
        children: [
          {
            name: "Enterprise Sales",
            code: "BARQ-SALES-ENT",
            type: "DEPARTMENT",
            level: 3,
            children: []
          }
        ]
      }
    ]
  };

  // Recursive creation function
  async function createUnitsRecursively(
    unitData: any,
    parentId: bigint | null = null
  ) {
    const unit = await createOrganizationUnitAction({
      name: unitData.name,
      code: unitData.code,
      unitType: unitData.type,
      level: unitData.level,
      parentId: parentId,
      costCenter: unitData.costCenter,
      userId: currentUserId
    });

    // Create children
    for (const child of unitData.children) {
      await createUnitsRecursively(child, unit.data.id);
    }

    return unit;
  }

  return await createUnitsRecursively(hierarchy);
}

// Execute
await createOrgHierarchy();
```

### Pattern 3: Location Hierarchy Creation

```typescript
// Create location hierarchy for Saudi Arabia office
async function createLocationHierarchy() {
  // Country
  const saudiArabia = await createLocationAction({
    name: "Saudi Arabia",
    code: "SA",
    locationType: LocationType.COUNTRY,
    country: "Saudi Arabia",
    userId: currentUserId
  });

  // City
  const riyadh = await createLocationAction({
    name: "Riyadh",
    code: "SA-RUH",
    locationType: LocationType.CITY,
    parentId: saudiArabia.data.id,
    city: "Riyadh",
    country: "Saudi Arabia",
    latitude: 24.7136,
    longitude: 46.6753,
    timeZone: "Asia/Riyadh",
    userId: currentUserId
  });

  // Building
  const hqBuilding = await createLocationAction({
    name: "HQ Building",
    code: "SA-RUH-HQ",
    locationType: LocationType.BUILDING,
    parentId: riyadh.data.id,
    addressLine1: "King Fahd Road",
    addressLine2: "Al Olaya District",
    city: "Riyadh",
    country: "Saudi Arabia",
    userId: currentUserId
  });

  // Floor
  const floor3 = await createLocationAction({
    name: "Floor 3",
    code: "SA-RUH-HQ-F3",
    locationType: LocationType.FLOOR,
    parentId: hqBuilding.data.id,
    userId: currentUserId
  });

  // Server Room
  const serverRoom = await createLocationAction({
    name: "Server Room 301",
    code: "SA-RUH-HQ-F3-SR301",
    locationType: LocationType.ROOM,
    parentId: floor3.data.id,
    userId: currentUserId
  });

  // Racks
  const rack01 = await createLocationAction({
    name: "Rack A01",
    code: "SA-RUH-HQ-F3-SR301-A01",
    locationType: LocationType.RACK,
    parentId: serverRoom.data.id,
    userId: currentUserId
  });

  const rack02 = await createLocationAction({
    name: "Rack A02",
    code: "SA-RUH-HQ-F3-SR301-A02",
    locationType: LocationType.RACK,
    parentId: serverRoom.data.id,
    userId: currentUserId
  });

  return {
    country: saudiArabia,
    city: riyadh,
    building: hqBuilding,
    floor: floor3,
    room: serverRoom,
    racks: [rack01, rack02]
  };
}

await createLocationHierarchy();
```

**Result**:
```
Saudi Arabia (Country)
└── Riyadh (City)
    └── HQ Building (Building)
        └── Floor 3 (Floor)
            └── Server Room 301 (Room)
                ├── Rack A01 (Rack)
                └── Rack A02 (Rack)
```

---

## Querying Hierarchies

### Get Children

Retrieve all direct children of a node:

```typescript
// Get all direct children of an org unit
const children = await orgUnitRepository.findChildren(engineeringId);

console.log("Engineering has departments:", children.map(c => c.name));
// ["IT Department", "R&D Department"]

// Get all direct children of a location
const floors = await locationRepository.findChildren(buildingId);

console.log("Building has floors:", floors.map(f => f.name));
// ["Floor 1", "Floor 2", "Floor 3"]
```

### Get Parent

Retrieve the direct parent of a node:

```typescript
// Get parent of department
const parent = await orgUnitRepository.findParent(itDeptId);

console.log("Parent of IT Department:", parent?.name);
// "Engineering Division"

// Get parent of room
const parentFloor = await locationRepository.findParent(serverRoomId);

console.log("Room is on:", parentFloor?.name);
// "Floor 3"
```

### Check for Children

Check if a node has children (useful for delete operations):

```typescript
const hasChildren = await orgUnitRepository.hasChildren(engineeringId);

if (hasChildren) {
  console.log("Cannot delete - has child units");
} else {
  await deleteOrganizationUnitAction({ id: engineeringId, userId });
}
```

### Recursive Traversal

Get all descendants (children, grandchildren, etc.):

```typescript
// Recursive function to get all descendants
async function getAllDescendants(
  parentId: bigint,
  repository: IOrganizationUnitRepository
): Promise<OrganizationUnit[]> {
  const children = await repository.findChildren(parentId);
  const descendants: OrganizationUnit[] = [...children];

  for (const child of children) {
    const childDescendants = await getAllDescendants(child.id!, repository);
    descendants.push(...childDescendants);
  }

  return descendants;
}

// Usage
const allUnits = await getAllDescendants(companyId, orgUnitRepository);
console.log("Total units in company:", allUnits.length);
```

### Get Full Path

Get the complete hierarchical path from root to node:

```typescript
// Recursive function to build path
async function getFullPath(
  id: bigint,
  repository: ILocationRepository
): Promise<string> {
  const location = await repository.findById(id);
  if (!location) return "";

  if (!location.parentId) {
    return location.name; // Root node
  }

  const parentPath = await getFullPath(location.parentId, repository);
  return `${parentPath} / ${location.name}`;
}

// Usage
const path = await getFullPath(rackId, locationRepository);
console.log(path);
// "Saudi Arabia / Riyadh / HQ Building / Floor 3 / Server Room 301 / Rack A01"
```

**Note**: The `Location` entity has a built-in `getFullPath()` method that implements this pattern.

---

## Moving Nodes in Hierarchy

### Move to Different Parent

```typescript
// Move IT Department from Engineering to Operations
async function moveOrgUnit(
  unitId: bigint,
  newParentId: bigint,
  userId: string
) {
  // 1. Get the unit to move
  const unit = await getOrganizationUnitAction({ id: unitId });
  if (!unit.success) throw new Error("Unit not found");

  // 2. Get new parent
  const newParent = await getOrganizationUnitAction({ id: newParentId });
  if (!newParent.success) throw new Error("New parent not found");

  // 3. Validate level (new level = parent level + 1)
  const newLevel = newParent.data.level + 1;

  // 4. Update unit
  const updated = await updateOrganizationUnitAction({
    id: unitId,
    parentId: newParentId,
    level: newLevel,
    userId
  });

  // 5. Recursively update children levels
  await updateChildrenLevels(unitId, newLevel, userId);

  return updated;
}

async function updateChildrenLevels(
  parentId: bigint,
  parentLevel: number,
  userId: string
) {
  const children = await orgUnitRepository.findChildren(parentId);

  for (const child of children) {
    const newChildLevel = parentLevel + 1;

    await updateOrganizationUnitAction({
      id: child.id!,
      level: newChildLevel,
      userId
    });

    // Recursively update grandchildren
    await updateChildrenLevels(child.id!, newChildLevel, userId);
  }
}

// Usage
await moveOrgUnit(itDeptId, operationsBuId, currentUserId);
```

### Move Location

```typescript
// Move rack from one room to another
async function moveRack(
  rackId: bigint,
  newRoomId: bigint,
  userId: string
) {
  const updated = await updateLocationAction({
    id: rackId,
    parentId: newRoomId,
    userId
  });

  return updated;
}

// Usage
await moveRack(rackA01Id, serverRoom302Id, currentUserId);
```

---

## Deleting Hierarchy Nodes

### Delete Leaf Node

Safe deletion of node with no children:

```typescript
async function deleteLeafNode(id: bigint, userId: string) {
  // Check for children
  const hasChildren = await orgUnitRepository.hasChildren(id);

  if (hasChildren) {
    throw new Error("Cannot delete - node has children. Delete children first.");
  }

  // Check for dependencies (persons assigned, etc.)
  const hasPersons = await orgUnitRepository.hasPersons(id);

  if (hasPersons) {
    throw new Error("Cannot delete - node has assigned persons. Reassign first.");
  }

  // Safe to delete
  await deleteOrganizationUnitAction({ id, userId });
}
```

### Cascade Delete

Delete node and all descendants:

```typescript
async function cascadeDelete(
  id: bigint,
  userId: string,
  repository: IOrganizationUnitRepository
) {
  // 1. Get all descendants
  const descendants = await getAllDescendants(id, repository);

  // 2. Delete in reverse order (deepest first)
  const sortedByLevel = descendants.sort((a, b) => b.level - a.level);

  for (const unit of sortedByLevel) {
    await deleteOrganizationUnitAction({ id: unit.id!, userId });
  }

  // 3. Delete the node itself
  await deleteOrganizationUnitAction({ id, userId });
}

// Usage with confirmation
const descendants = await getAllDescendants(engineeringId, orgUnitRepository);
const confirmMessage = `This will delete ${descendants.length + 1} units. Continue?`;

if (confirm(confirmMessage)) {
  await cascadeDelete(engineeringId, currentUserId, orgUnitRepository);
}
```

### Orphan Children Strategy

Move children to parent before deleting:

```typescript
async function deleteAndOrphanChildren(
  id: bigint,
  userId: string
) {
  // 1. Get node and its parent
  const unit = await orgUnitRepository.findById(id);
  if (!unit) throw new Error("Unit not found");

  const children = await orgUnitRepository.findChildren(id);

  // 2. Move children to grandparent
  if (unit.parentId) {
    for (const child of children) {
      await updateOrganizationUnitAction({
        id: child.id!,
        parentId: unit.parentId,
        level: unit.level, // Same level as deleted node
        userId
      });
    }
  } else {
    // If deleting root, children become roots
    for (const child of children) {
      await updateOrganizationUnitAction({
        id: child.id!,
        parentId: null,
        level: 1,
        userId
      });
    }
  }

  // 3. Delete the node
  await deleteOrganizationUnitAction({ id, userId });
}
```

---

## Hierarchy UI Patterns

### Tree View Component

Display hierarchy as collapsible tree:

```typescript
interface TreeNode {
  id: bigint;
  name: string;
  code: string;
  level: number;
  children?: TreeNode[];
}

async function buildTree(
  parentId: bigint | null,
  repository: IOrganizationUnitRepository
): Promise<TreeNode[]> {
  const units = parentId
    ? await repository.findChildren(parentId)
    : await repository.findAll({ level: 1 }); // Get roots

  const tree: TreeNode[] = [];

  for (const unit of units) {
    const children = await buildTree(unit.id!, repository);

    tree.push({
      id: unit.id!,
      name: unit.name,
      code: unit.code,
      level: unit.level,
      children: children.length > 0 ? children : undefined
    });
  }

  return tree;
}

// React component
function OrgTreeView({ tree }: { tree: TreeNode[] }) {
  return (
    <ul>
      {tree.map(node => (
        <li key={node.id.toString()}>
          <div className="flex items-center gap-2">
            {node.children && (
              <button onClick={() => toggleCollapse(node.id)}>
                {isCollapsed(node.id) ? "▶" : "▼"}
              </button>
            )}
            <span>{node.name}</span>
            <span className="text-muted-foreground">({node.code})</span>
          </div>
          {node.children && !isCollapsed(node.id) && (
            <OrgTreeView tree={node.children} />
          )}
        </li>
      ))}
    </ul>
  );
}
```

### Breadcrumb Navigation

Show path from root to current node:

```typescript
async function buildBreadcrumbs(
  id: bigint,
  repository: IOrganizationUnitRepository
): Promise<{ id: bigint; name: string; code: string }[]> {
  const breadcrumbs = [];
  let currentId: bigint | null = id;

  while (currentId !== null) {
    const unit = await repository.findById(currentId);
    if (!unit) break;

    breadcrumbs.unshift({
      id: unit.id!,
      name: unit.name,
      code: unit.code
    });

    currentId = unit.parentId ?? null;
  }

  return breadcrumbs;
}

// React component
function Breadcrumbs({ unitId }: { unitId: bigint }) {
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    buildBreadcrumbs(unitId, orgUnitRepository).then(setBreadcrumbs);
  }, [unitId]);

  return (
    <nav className="flex items-center gap-2">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id.toString()}>
          {index > 0 && <span>/</span>}
          <Link href={`/organization-units/${crumb.id}`}>
            {crumb.name}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
```

### Level Indentation

Display hierarchy with visual indentation:

```typescript
// Flatten hierarchy with level info
async function flattenHierarchy(
  parentId: bigint | null,
  repository: IOrganizationUnitRepository,
  accumulated: Array<{ unit: OrganizationUnit; level: number }> = []
): Promise<Array<{ unit: OrganizationUnit; level: number }>> {
  const units = parentId
    ? await repository.findChildren(parentId)
    : await repository.findAll({ level: 1 });

  for (const unit of units) {
    accumulated.push({ unit, level: unit.level });
    await flattenHierarchy(unit.id!, repository, accumulated);
  }

  return accumulated;
}

// React component with indentation
function OrgListWithIndentation() {
  const [flatUnits, setFlatUnits] = useState([]);

  useEffect(() => {
    flattenHierarchy(null, orgUnitRepository).then(setFlatUnits);
  }, []);

  return (
    <ul>
      {flatUnits.map(({ unit, level }) => (
        <li
          key={unit.id.toString()}
          style={{ paddingLeft: `${(level - 1) * 20}px` }}
        >
          {level > 1 && "└─ "}
          {unit.name} ({unit.code})
        </li>
      ))}
    </ul>
  );
}
```

---

## Best Practices

### 1. Code Naming Conventions

Use hierarchical codes for easy identification:

```typescript
// Good: Hierarchical codes
"BARQ"                  // Company
"BARQ-ENG"              // Business Unit
"BARQ-ENG-IT"           // Department
"BARQ-ENG-IT-DEVOPS"    // Team

// For locations
"SA"                    // Country
"SA-RUH"                // City
"SA-RUH-HQ"             // Building
"SA-RUH-HQ-F3"          // Floor
"SA-RUH-HQ-F3-SR301"    // Room
"SA-RUH-HQ-F3-SR301-A01" // Rack

// Bad: Non-hierarchical codes
"ENG"    // Unclear which company
"IT"     // Unclear which division
"A01"    // Unclear which room/building
```

### 2. Level Consistency

Always maintain level consistency:

```typescript
// Enforce level = parent.level + 1
async function validateLevel(
  unitType: OrganizationUnitType,
  level: number,
  parentId: bigint | null
): Promise<void> {
  if (parentId === null) {
    // Root level must be 1
    if (level !== 1) {
      throw new Error("Root unit must have level 1");
    }
  } else {
    // Child level must be parent level + 1
    const parent = await orgUnitRepository.findById(parentId);
    if (!parent) {
      throw new Error("Parent not found");
    }

    if (level !== parent.level + 1) {
      throw new Error(`Level must be ${parent.level + 1} (parent level + 1)`);
    }
  }
}
```

### 3. Prevent Circular References

Ensure no cycles in hierarchy:

```typescript
async function validateNoCircularReference(
  unitId: bigint,
  newParentId: bigint
): Promise<void> {
  // Check if newParent is a descendant of unit
  const descendants = await getAllDescendants(unitId, orgUnitRepository);

  const isDescendant = descendants.some(d => d.id === newParentId);

  if (isDescendant) {
    throw new Error("Cannot move unit - would create circular reference");
  }
}

// Usage before moving
await validateNoCircularReference(engineeringId, itDeptId);
await moveOrgUnit(engineeringId, itDeptId, userId);
```

### 4. Limit Hierarchy Depth

Prevent excessively deep hierarchies:

```typescript
const MAX_HIERARCHY_DEPTH = 10;

async function validateMaxDepth(
  parentId: bigint | null
): Promise<void> {
  if (parentId === null) return; // Root is OK

  let depth = 1;
  let currentId: bigint | null = parentId;

  while (currentId !== null && depth <= MAX_HIERARCHY_DEPTH) {
    const unit = await orgUnitRepository.findById(currentId);
    if (!unit) break;

    depth++;
    currentId = unit.parentId ?? null;
  }

  if (depth > MAX_HIERARCHY_DEPTH) {
    throw new Error(`Maximum hierarchy depth (${MAX_HIERARCHY_DEPTH}) exceeded`);
  }
}
```

### 5. Batch Operations

Use transactions for bulk hierarchy operations:

```typescript
// Example: Move multiple units to new parent in single transaction
async function bulkMoveUnits(
  unitIds: bigint[],
  newParentId: bigint,
  userId: string
) {
  await prisma.$transaction(async (tx) => {
    const newParent = await tx.organizationUnit.findUnique({
      where: { id: newParentId }
    });

    if (!newParent) {
      throw new Error("New parent not found");
    }

    for (const unitId of unitIds) {
      await tx.organizationUnit.update({
        where: { id: unitId },
        data: {
          parentId: newParentId,
          level: newParent.level + 1
        }
      });
    }
  });
}
```

### 6. Caching Strategies

Cache frequently accessed hierarchy paths:

```typescript
// Simple in-memory cache
const pathCache = new Map<string, string>();

async function getCachedPath(
  id: bigint,
  repository: ILocationRepository
): Promise<string> {
  const cacheKey = `location:path:${id}`;

  // Check cache
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }

  // Compute path
  const path = await getFullPath(id, repository);

  // Cache result
  pathCache.set(cacheKey, path);

  return path;
}

// Invalidate cache when hierarchy changes
async function updateLocationAndInvalidateCache(
  id: bigint,
  data: UpdateLocationDTO
) {
  await updateLocationAction({ id, ...data });

  // Invalidate cache for this location and all descendants
  const descendants = await getAllDescendants(id, locationRepository);

  pathCache.delete(`location:path:${id}`);
  descendants.forEach(d => {
    pathCache.delete(`location:path:${d.id}`);
  });
}
```

---

## Common Use Cases

### Use Case 1: Multi-Tenant Organizations

Create separate organizational trees for different companies:

```typescript
// Company A
const companyA = await createOrganizationUnitAction({
  name: "Company A",
  code: "COMPANY-A",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
  userId
});

// Company B
const companyB = await createOrganizationUnitAction({
  name: "Company B",
  code: "COMPANY-B",
  unitType: OrganizationUnitType.COMPANY,
  level: 1,
  userId
});

// Each company has its own hierarchy
// Filter by company when querying
const companyAUnits = await getAllDescendants(companyA.data.id, orgUnitRepository);
const companyBUnits = await getAllDescendants(companyB.data.id, orgUnitRepository);
```

### Use Case 2: Multi-Region Locations

Create separate location trees for different regions:

```typescript
// Create Middle East region
const me = await createLocationAction({
  name: "Middle East",
  code: "ME",
  locationType: LocationType.OTHER,
  level: 1,
  userId
});

// Create Europe region
const eu = await createLocationAction({
  name: "Europe",
  code: "EU",
  locationType: LocationType.OTHER,
  level: 1,
  userId
});

// Each region has its own country hierarchy
const saudiArabia = await createLocationAction({
  name: "Saudi Arabia",
  code: "ME-SA",
  locationType: LocationType.COUNTRY,
  parentId: me.data.id,
  userId
});

const germany = await createLocationAction({
  name: "Germany",
  code: "EU-DE",
  locationType: LocationType.COUNTRY,
  parentId: eu.data.id,
  userId
});
```

### Use Case 3: Cloud Region Hierarchy

Model cloud providers as locations:

```typescript
// AWS as logical location
const aws = await createLocationAction({
  name: "Amazon Web Services",
  code: "AWS",
  locationType: LocationType.CLOUD_REGION,
  userId
});

// AWS regions
const usEast1 = await createLocationAction({
  name: "US East 1 (N. Virginia)",
  code: "AWS-US-EAST-1",
  locationType: LocationType.CLOUD_REGION,
  parentId: aws.data.id,
  userId
});

// Availability zones
const usEast1a = await createLocationAction({
  name: "us-east-1a",
  code: "AWS-US-EAST-1-AZ-A",
  locationType: LocationType.CLOUD_ZONE,
  parentId: usEast1.data.id,
  userId
});

const usEast1b = await createLocationAction({
  name: "us-east-1b",
  code: "AWS-US-EAST-1-AZ-B",
  locationType: LocationType.CLOUD_ZONE,
  parentId: usEast1.data.id,
  userId
});
```

---

## Troubleshooting

### Issue: Level Mismatch

**Problem**: Child level doesn't match parent level + 1

**Solution**:
```typescript
// Fix level inconsistencies
async function fixLevelInconsistencies(parentId: bigint | null = null) {
  const expectedLevel = parentId
    ? (await orgUnitRepository.findById(parentId))!.level + 1
    : 1;

  const units = parentId
    ? await orgUnitRepository.findChildren(parentId)
    : await orgUnitRepository.findAll({ level: 1 });

  for (const unit of units) {
    if (unit.level !== expectedLevel) {
      console.log(`Fixing ${unit.name}: ${unit.level} → ${expectedLevel}`);

      await updateOrganizationUnitAction({
        id: unit.id!,
        level: expectedLevel,
        userId: "system"
      });
    }

    // Recursively fix children
    await fixLevelInconsistencies(unit.id!);
  }
}

await fixLevelInconsistencies();
```

### Issue: Orphaned Nodes

**Problem**: Node has parentId that doesn't exist

**Solution**:
```typescript
// Find and fix orphaned nodes
async function findOrphanedNodes() {
  const allUnits = await orgUnitRepository.findAll();
  const orphans = [];

  for (const unit of allUnits) {
    if (unit.parentId) {
      const parent = await orgUnitRepository.findById(unit.parentId);
      if (!parent) {
        orphans.push(unit);
      }
    }
  }

  return orphans;
}

// Fix by making them roots or assigning to valid parent
async function fixOrphanedNodes() {
  const orphans = await findOrphanedNodes();

  for (const orphan of orphans) {
    console.log(`Fixing orphaned node: ${orphan.name}`);

    await updateOrganizationUnitAction({
      id: orphan.id!,
      parentId: null, // Make it a root
      level: 1,
      userId: "system"
    });
  }
}
```

### Issue: Circular References

**Problem**: A→B→C→A creates infinite loop

**Solution**:
```typescript
// Detect circular references
async function detectCircularReferences(
  id: bigint,
  visited = new Set<bigint>()
): Promise<boolean> {
  if (visited.has(id)) {
    return true; // Circular reference found!
  }

  visited.add(id);

  const unit = await orgUnitRepository.findById(id);
  if (!unit || !unit.parentId) {
    return false; // Reached root, no cycle
  }

  return detectCircularReferences(unit.parentId, visited);
}

// Check all units
async function checkAllForCircularRefs() {
  const allUnits = await orgUnitRepository.findAll();

  for (const unit of allUnits) {
    const hasCircular = await detectCircularReferences(unit.id!);
    if (hasCircular) {
      console.error(`Circular reference detected for: ${unit.name}`);
    }
  }
}
```

---

## See Also

- [Foundation Layer Guide](./FOUNDATION_LAYER.md) - Complete entity guide
- [Entity Reference](./ENTITY_REFERENCE.md) - Quick reference
- [Layer 1 Implementation](../architecture/LAYER_1_IMPLEMENTATION.md) - Technical details

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Barq Assets Development Team
