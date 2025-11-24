# Refactoring Patterns

This guide provides proven refactoring patterns for maintaining clean, maintainable code as the codebase grows.

## When to Refactor

Apply these patterns when you encounter:

- **File size**: Component/file exceeds 300-500 lines
- **Multiple responsibilities**: Mixed state management + UI rendering + business logic
- **Code duplication**: Similar code repeated across entities or modules
- **Maintainability issues**: Difficult to test, understand, or modify
- **Boilerplate burden**: Adding new entities requires copying 15+ lines of repeated code
- **Poor separation**: Violates Single Responsibility Principle

## Core Principles

All refactoring patterns follow these principles:

- **DRY (Don't Repeat Yourself)**: Eliminate duplication through abstraction
- **SOLID Principles**: Especially Single Responsibility and Open/Closed
- **Composition over Inheritance**: Build complex behavior from simple parts
- **Type Safety**: Maintain TypeScript type checking throughout refactoring
- **Testability**: Make code easier to test in isolation

---

## Pattern 1: Component Refactoring (Hooks + Composition)

### Problem

Large React components mixing concerns:
- State management logic
- Business logic and data transformations
- UI rendering and layout
- Event handling
- Side effects

### Solution

Extract responsibilities into custom hooks and focused sub-components.

### Implementation Steps

#### 1. Extract Custom Hooks for State Management

Create focused hooks for different state concerns:

```typescript
// usePermissionSelection.ts
export function usePermissionSelection(initialPermissions: Permission[]) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(initialPermissions.map(p => p.name))
  );

  const togglePermission = useCallback((name: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((names: string[]) => {
    setSelectedPermissions(prev => new Set([...prev, ...names]));
  }, []);

  const deselectAll = useCallback((names: string[]) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      names.forEach(name => next.delete(name));
      return next;
    });
  }, []);

  return {
    selectedPermissions,
    togglePermission,
    selectAll,
    deselectAll,
  };
}
```

#### 2. Create Focused Sub-Components

Break down UI into single-responsibility components:

```typescript
// PermissionsSummaryCard.tsx
interface PermissionsSummaryCardProps {
  totalPermissions: number;
  selectedCount: number;
  groupCount: number;
}

export function PermissionsSummaryCard({
  totalPermissions,
  selectedCount,
  groupCount,
}: PermissionsSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total" value={totalPermissions} />
          <StatCard label="Selected" value={selectedCount} />
          <StatCard label="Groups" value={groupCount} />
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Create Orchestrator Component

Main component composes hooks and sub-components:

```typescript
// PermissionsManager.tsx
export function PermissionsManager({ roleName }: Props) {
  // Hooks for state and logic
  const { selectedPermissions, togglePermission, selectAll, deselectAll } =
    usePermissionSelection(initialPermissions);

  const { groups, filteredGroups, searchQuery, setSearchQuery } =
    usePermissionGroups(allPermissions);

  const { isBulkMode, toggleBulkMode } = useBulkSelection();

  // Render composition
  return (
    <div>
      <PermissionsSummaryCard
        totalPermissions={allPermissions.length}
        selectedCount={selectedPermissions.size}
        groupCount={groups.length}
      />

      <SearchInput value={searchQuery} onChange={setSearchQuery} />

      {filteredGroups.map(group => (
        <PermissionGroupCard
          key={group.id}
          group={group}
          selected={selectedPermissions}
          onToggle={togglePermission}
          onSelectAll={() => selectAll(group.permissions)}
        />
      ))}

      <PermissionActionsFooter
        onSave={handleSave}
        onReset={handleReset}
        hasChanges={hasChanges}
      />
    </div>
  );
}
```

### Benefits

- **Single Responsibility**: Each hook/component has one clear purpose
- **Testability**: Hooks and components can be tested in isolation
- **Reusability**: Hooks can be used in multiple components
- **Maintainability**: Changes are localized to specific hooks/components
- **Readability**: Orchestrator shows high-level structure clearly

### Real-World Example

**PermissionsManager.tsx**: Component managing permission assignment for roles
- **Before**: 698 lines mixing state, validation, UI, and API calls
- **After**: Split into 3 hooks + 5 components + 1 orchestrator (243 lines main component)
- **Result**: 65% reduction, improved testability and maintainability

---

## Pattern 2: Configuration Refactoring (Builder Pattern)

### Problem

Configuration objects with repetitive field definitions:
- Same validation patterns repeated
- Same sanitization rules duplicated
- Same structure for similar field types
- 15-20 lines per field definition

### Solution

Create builder functions for common field patterns.

### Implementation Steps

#### 1. Identify Repetitive Patterns

Analyze configuration to find repeated structures:

```typescript
// BEFORE: Repetitive field definitions
{
  name: "email",
  label: "Email Address",
  type: "string",
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  errorMessage: "Invalid email format",
  sanitization: [
    { operation: "trim" },
    { operation: "lowercase" }
  ],
  autoMap: ["email", "email_address", "e_mail"],
  examples: ["user@example.com"]
}

// Repeated for every email field across multiple entity configs
```

#### 2. Create Builder Functions

Extract patterns into reusable builders:

```typescript
// field-builders.ts

/**
 * Creates a standard email field definition
 */
export function emailField(overrides?: Partial<FieldConfig>): FieldConfig {
  return {
    name: "email",
    label: "Email Address",
    type: "string",
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: "Please enter a valid email address",
    sanitization: [
      { operation: "trim" },
      { operation: "lowercase" },
    ],
    autoMap: ["email", "email_address", "e_mail", "contact_email"],
    examples: ["user@example.com", "contact@company.com"],
    ...overrides,
  };
}

/**
 * Creates a lookup field for foreign key references
 */
export function lookupField(
  name: string,
  label: string,
  lookupTarget: string,
  lookupField: string = "code",
  displayField: string = "name"
): FieldConfig {
  return {
    name,
    label,
    type: "lookup",
    required: false,
    lookupTarget,
    lookupField,
    lookupDisplayField: displayField,
    sanitization: [{ operation: "trim" }],
    autoMap: [name, name.replace("Id", ""), name.replace("Id", "_id")],
  };
}

/**
 * Creates a currency amount field
 */
export function currencyField(
  name: string = "amount",
  label: string = "Amount",
  required: boolean = false
): FieldConfig {
  return {
    name,
    label,
    type: "number",
    required,
    min: 0,
    errorMessage: `${label} must be a positive number`,
    sanitization: [{ operation: "trim" }],
    autoMap: [name, `${name}_value`, name.replace("Amount", "")],
    examples: ["1000.00", "250.50"],
  };
}
```

#### 3. Use Builders in Configurations

Replace boilerplate with builder calls:

```typescript
// entity-configs.ts

export const PERSON_CONFIG: EntityConfig = {
  key: "PERSON",
  name: "Persons",
  fields: [
    textField("firstName", "First Name", true),
    textField("lastName", "Last Name", true),
    emailField({ required: true }), // 1 line instead of 15
    phoneField(),
    lookupField("organizationUnitId", "Organization Unit", "OrganizationUnit"),
    lookupField("locationId", "Primary Location", "Location"),
    dateField("hireDate", "Hire Date"),
  ],
};

export const ASSET_CONFIG: EntityConfig = {
  key: "ASSET",
  name: "Assets",
  fields: [
    textField("assetTag", "Asset Tag", true, {
      sanitization: [
        { operation: "trim" },
        { operation: "uppercase" },
      ],
    }),
    lookupField("assetCategoryId", "Asset Category", "AssetCategory"),
    lookupField("assetModelId", "Asset Model", "AssetModel"),
    lookupField("vendorId", "Vendor", "Vendor"),
    currencyField("purchasePrice", "Purchase Price"),
    dateField("purchaseDate", "Purchase Date"),
    selectField("status", "Status", ASSET_STATUSES),
  ],
};
```

### Available Field Builders

#### Basic Fields
- `textField(name, label, required?, overrides?)`
- `numberField(name, label, required?, min?, max?)`
- `booleanField(name, label)`
- `textareaField(name, label, maxLength?)`

#### Contact Fields
- `emailField(overrides?)`
- `phoneField(name?, label?)`
- `urlField(name?, label?)`

#### Financial Fields
- `currencyField(name?, label?, required?)`
- `percentageField(name?, label?)`

#### Date Fields
- `dateField(name, label, required?)`
- `datetimeField(name, label, required?)`

#### Lookup Fields
- `lookupField(name, label, target, lookupField?, displayField?)`

#### Enumeration Fields
- `selectField(name, label, options, required?)`
- `statusField(name, label, statuses)`

#### Location Fields
- `countryField()`
- `cityField()`
- `postalCodeField()`

### Benefits

- **Zero Duplication**: Each field type defined once
- **Consistency**: Same validation/sanitization across all uses
- **Type Safety**: TypeScript ensures correct builder usage
- **Faster Development**: Add new entity configs 40% faster
- **Easy Updates**: Change builder once, affects all uses

### Real-World Example

**Field builders for Universal Data Importer**:
- **Before**: 205 lines of repetitive field definitions
- **After**: 17 builders + 145 lines of config using builders
- **Result**: 30% reduction, eliminated all duplication

---

## Pattern 3: Logic Refactoring (Helper Functions)

### Problem

Business logic repeated across similar entities:
- CRUD permission dependencies duplicated 89 times
- Action permission patterns repeated for each entity
- Manual dependency mapping prone to errors
- Difficult to maintain consistency

### Solution

Extract repeated logic into type-safe helper functions.

### Implementation Steps

#### 1. Identify Repetitive Logic

Find patterns repeated across entities:

```typescript
// BEFORE: Manual dependency mapping for each entity

// Assets
[PERMISSIONS.ASSETS_CREATE]: {
  required: [PERMISSIONS.ASSETS_VIEW],
  description: "Create requires View"
},
[PERMISSIONS.ASSETS_UPDATE]: {
  required: [PERMISSIONS.ASSETS_VIEW],
  description: "Update requires View"
},
[PERMISSIONS.ASSETS_DELETE]: {
  required: [PERMISSIONS.ASSETS_VIEW, PERMISSIONS.ASSETS_UPDATE],
  description: "Delete requires View and Update"
},
[PERMISSIONS.ASSETS_MANAGE]: {
  required: [
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_DELETE
  ],
  description: "Manage requires all CRUD permissions"
},

// Vendors (same pattern repeated)
[PERMISSIONS.VENDORS_CREATE]: {
  required: [PERMISSIONS.VENDORS_VIEW],
  description: "Create requires View"
},
// ... repeated for all 89 entities
```

#### 2. Create Helper Functions

Extract patterns into reusable helpers:

```typescript
// permission-dependency-helpers.ts

/**
 * Generates standard CRUD permission dependencies
 * CREATE, UPDATE, DELETE → VIEW
 * MANAGE → all CRUD
 */
export function generateCRUDDependencies(
  entityPrefix: string
): PermissionDependencyMap {
  const VIEW = `${entityPrefix}_VIEW`;
  const CREATE = `${entityPrefix}_CREATE`;
  const UPDATE = `${entityPrefix}_UPDATE`;
  const DELETE = `${entityPrefix}_DELETE`;
  const MANAGE = `${entityPrefix}_MANAGE`;

  return {
    [CREATE]: {
      required: [VIEW],
      description: "Creating requires viewing",
    },
    [UPDATE]: {
      required: [VIEW],
      description: "Updating requires viewing",
    },
    [DELETE]: {
      required: [VIEW, UPDATE],
      description: "Deleting requires viewing and updating",
    },
    [MANAGE]: {
      required: [VIEW, CREATE, UPDATE, DELETE],
      description: "Managing requires all CRUD permissions",
    },
  };
}

/**
 * Generates dependencies for action permissions
 */
export function generateActionDependencies(
  entityPrefix: string,
  actions: string[]
): PermissionDependencyMap {
  const VIEW = `${entityPrefix}_VIEW`;
  const dependencies: PermissionDependencyMap = {};

  for (const action of actions) {
    dependencies[`${entityPrefix}_${action}`] = {
      required: [VIEW],
      description: `${action} requires viewing`,
    };
  }

  return dependencies;
}

/**
 * Merges multiple dependency maps
 */
export function mergeDependencies(
  ...maps: PermissionDependencyMap[]
): PermissionDependencyMap {
  return Object.assign({}, ...maps);
}
```

#### 3. Use Helpers in Dependency Definitions

Replace manual mapping with helper calls:

```typescript
// permission-dependencies.ts

export const PERMISSION_DEPENDENCIES: PermissionDependencyMap = {
  // Assets - 4 lines instead of 40
  ...generateCRUDDependencies("ASSETS"),

  // Vendors - 4 lines instead of 40
  ...generateCRUDDependencies("VENDORS"),

  // Asset Disposals - CRUD + actions
  ...generateCRUDDependencies("ASSET_DISPOSALS"),
  ...generateActionDependencies("ASSET_DISPOSALS", [
    "APPROVE",
    "REJECT",
    "START",
    "COMPLETE",
    "CANCEL",
  ]),

  // License Allocations - CRUD + special actions
  ...generateCRUDDependencies("LICENSE_ALLOCATIONS"),
  ...generateActionDependencies("LICENSE_ALLOCATIONS", [
    "DEALLOCATE",
    "REACTIVATE",
  ]),

  // Complex custom dependencies (when needed)
  [PERMISSIONS.SYSTEM_SETUP_MANAGE]: {
    required: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.PERMISSIONS_MANAGE,
    ],
    description: "System setup requires user, role, and permission management",
  },
};
```

### Helper Function Categories

#### CRUD Helpers
- `generateCRUDDependencies(prefix)` - Standard create/update/delete → view
- `generateViewOnlyDependency(prefix)` - For read-only entities

#### Action Helpers
- `generateActionDependencies(prefix, actions)` - Action permissions → view
- `generateWorkflowDependencies(prefix, states)` - State transition permissions

#### Special Helpers
- `generateExportDependency(prefix)` - Export → view permission
- `generateSimpleActionDependency(permission, requiredPerms)` - Custom single action
- `mergeDependencies(...maps)` - Combine multiple dependency maps

### Benefits

- **Massive Reduction**: 60-70% fewer lines for dependency definitions
- **Type Safety**: TypeScript catches invalid permission names
- **Self-Documenting**: Helper names describe the pattern
- **Easy to Extend**: Add new entity dependencies in 1-2 lines
- **Consistency**: Same pattern applied uniformly
- **Maintainability**: Change pattern once, affects all entities

### Real-World Example

**Permission dependency definitions**:
- **Before**: 592 lines of manual dependency mapping (89 entities × ~7 lines each)
- **After**: 5 helper functions + 374 lines using helpers
- **Result**: 37% reduction, eliminated errors from manual mapping

---

## Pattern 4: Module Extraction

### Problem

Single file contains multiple related but distinct responsibilities:
- Utilities, types, and business logic mixed
- Large files (1000+ lines)
- Difficult to find specific functionality
- Import pollution

### Solution

Split into focused modules with clear boundaries.

### Implementation Steps

#### 1. Analyze Current Structure

Identify distinct responsibilities:

```
seed.ts (1500 lines):
- Cleanup logic
- RBAC seeding
- Foundation seeding
- Asset seeding
- Configuration data
- Utility functions
- Factory functions
```

#### 2. Create Module Structure

Split into focused files:

```
prisma/
├── seed.ts (100 lines) - Main orchestrator
├── seed-config.ts - Configuration data only
├── seed-utils.ts - Shared utilities
├── seed-factories.ts - Factory functions
├── seed-rbac-roles.ts - RBAC role seeding
├── seed-foundation.ts - Foundation entities
├── seed-assets.ts - Asset entities
└── seed-layer3.ts - Layer 3 features
```

#### 3. Define Clear Interfaces

Each module exports specific interface:

```typescript
// seed-rbac-roles.ts
export async function seedRBACRoles(prisma: PrismaClient): Promise<void> {
  // Implementation
}

// seed-foundation.ts
export async function seedFoundationEntities(
  prisma: PrismaClient
): Promise<SeededFoundationData> {
  // Implementation
  return { locations, orgUnits, persons };
}

// seed-assets.ts
export async function seedAssets(
  prisma: PrismaClient,
  foundationData: SeededFoundationData
): Promise<void> {
  // Implementation
}
```

#### 4. Create Orchestrator

Main file coordinates modules:

```typescript
// seed.ts
import { seedRBACRoles } from "./seed-rbac-roles";
import { seedFoundationEntities } from "./seed-foundation";
import { seedAssets } from "./seed-assets";
import { cleanupDatabase } from "./seed-utils";

async function main() {
  // 1. Cleanup
  await cleanupDatabase(prisma);

  // 2. Seed in dependency order
  await seedRBACRoles(prisma);
  const foundationData = await seedFoundationEntities(prisma);
  await seedAssets(prisma, foundationData);

  console.log("✅ Seeding complete");
}
```

### Benefits

- **Focused Modules**: Each file has single clear purpose
- **Easy Navigation**: Find functionality quickly
- **Parallel Development**: Multiple developers can work on different modules
- **Testing**: Test modules in isolation
- **Reusability**: Import only what you need

---

## Additional Refactoring Guidelines

### Code Smells to Watch For

1. **Long Parameter Lists**: More than 3-4 parameters → Use options object
2. **Deep Nesting**: More than 3 levels → Extract functions
3. **Magic Numbers**: Unexplained constants → Named constants
4. **Commented Code**: Dead code → Delete it (Git remembers)
5. **God Objects**: Class doing too much → Split responsibilities

### Refactoring Safety

Always:
- Run tests before and after refactoring
- Commit working code before major refactoring
- Refactor in small, incremental steps
- Verify TypeScript compilation after each step
- Use IDE refactoring tools when possible

### When NOT to Refactor

Avoid refactoring when:
- Code works well and is easy to understand
- File is small (<200 lines) and focused
- No duplication exists
- Team is unfamiliar with the pattern
- On a tight deadline (refactor later)

---

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Complete development guide with refactoring examples
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Clean Architecture principles
- [DATABASE_SEEDING.md](DATABASE_SEEDING.md) - Module extraction example (seed system)
- [UNIVERSAL_DATA_IMPORTER.md](../../roadmap/UNIVERSAL_DATA_IMPORTER.md) - Builder pattern example (field builders)
- [RBAC_DEVELOPER_GUIDE.md](RBAC_DEVELOPER_GUIDE.md) - Helper functions example (permission dependencies)
