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

## Pattern 5: Controller Refactoring (Domain Separation)

### Problem

Large controller files (600+ lines) handling multiple domain responsibilities:
- Mixed CRUD operations across different sub-domains
- Difficult to navigate and maintain
- Violates Single Responsibility Principle
- Unclear boundaries between related but distinct features

### Solution

Split controllers by domain responsibility, aligning with use case structure following SOLID principles.

### Real-World Example

**Before Refactoring**:
- `service.controller.ts` - 739 lines, 20 methods across 4 domains
- `asset-kit.controller.ts` - 643 lines, 18 methods across 3 domains

**After Refactoring**:

Service Controller Split (1 → 4 controllers):
1. `service.controller.ts` - Core CRUD (9 methods, ~330 lines)
2. `service-ownership.controller.ts` - Ownership management (4 methods, ~170 lines)
3. `service-infrastructure.controller.ts` - Infrastructure details (3 methods, ~150 lines)
4. `service-asset.controller.ts` - Asset relationships (4 methods, ~150 lines)

Asset Kit Controller Split (1 → 3 controllers):
1. `asset-kit.controller.ts` - Core kit CRUD (5 methods, ~185 lines)
2. `asset-kit-item.controller.ts` - Kit item management (3 methods, ~130 lines)
3. `asset-kit-checkout.controller.ts` - Checkout operations (10 methods, ~370 lines)

### Implementation Steps

#### 1. Identify Domain Boundaries

Analyze the controller to find logical groupings:

```typescript
// service.controller.ts (BEFORE)
// ==================== Service Management ====================
export async function createServiceAction(...) { }
export async function getServiceAction(...) { }
export async function listServicesAction(...) { }
// ... 6 more service methods

// ==================== Service Ownership ====================
export async function addServiceOwnerAction(...) { }
export async function removeServiceOwnerAction(...) { }
// ... 2 more ownership methods

// ==================== Service Infrastructure ====================
export async function createServiceInfrastructureAction(...) { }
// ... 2 more infrastructure methods

// ==================== Service Asset Linking ====================
export async function linkServiceToAssetAction(...) { }
// ... 3 more asset methods
```

**Key Indicators**:
- Comment separators marking sections
- Methods grouped by feature area
- Distinct import blocks per section
- Separate use case directories

#### 2. Create New Controller Files

For each domain, create a focused controller:

```typescript
// service-ownership.controller.ts (AFTER)
"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  AddServiceOwnerSchema,
  RemoveServiceOwnerSchema,
  SetPrimaryOwnerSchema,
} from "../dtos/generated/service.dto";
import {
  presentServiceOwnerList,
  type ServiceOwnerDTO,
} from "../presenters/service.presenter";
import type {
  AddServiceOwnerUseCase,
  RemoveServiceOwnerUseCase,
  SetPrimaryOwnerUseCase,
  GetServiceOwnersUseCase,
} from "@/core/use-cases/service-ownership";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function addServiceOwnerAction(
  data: z.infer<typeof AddServiceOwnerSchema>,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.SERVICES_MANAGE);
    // ... implementation
  } catch (error) {
    return handleControllerError(error, { function: "addServiceOwnerAction" }, "Failed to add service owner");
  }
}

// ... 3 more ownership methods
```

#### 3. Update Original Controller

Keep only core CRUD operations in the original file:

```typescript
// service.controller.ts (AFTER - core operations only)
"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { CreateServiceSchema, UpdateServiceSchema } from "../dtos/generated/service.dto";
import { presentService, presentServiceList, type ServiceDTO } from "../presenters/service.presenter";
import type {
  CreateServiceUseCase,
  GetServiceUseCase,
  ListServicesUseCase,
  UpdateServiceUseCase,
  DeleteServiceUseCase,
  SearchServicesUseCase,
  GetEssentialServicesUseCase,
  GetRetiringServicesUseCase,
  RetireServiceUseCase,
} from "@/core/use-cases/service";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// ==================== Service Management ====================

export async function createServiceAction(...) { }
export async function getServiceAction(...) { }
export async function listServicesAction(...) { }
export async function updateServiceAction(...) { }
export async function deleteServiceAction(...) { }
export async function searchServicesAction(...) { }
export async function getEssentialServicesAction(...) { }
export async function getRetiringServicesAction(...) { }
export async function retireServiceAction(...) { }
```

#### 4. Update Imports in Client Code

Update all files importing from the original controller:

```typescript
// BEFORE
import {
  getServiceAction,
  getServiceOwnersAction,
  getServiceInfrastructureAction,
  getServiceAssetsAction,
} from "@/interface-adapters/controllers/service.controller";

// AFTER
import { getServiceAction } from "@/interface-adapters/controllers/service.controller";
import { getServiceOwnersAction } from "@/interface-adapters/controllers/service-ownership.controller";
import { getServiceInfrastructureAction } from "@/interface-adapters/controllers/service-infrastructure.controller";
import { getServiceAssetsAction } from "@/interface-adapters/controllers/service-asset.controller";
```

Files updated in this refactoring:
- `src/app/(dashboard)/services/[id]/page.tsx`
- `src/components/services/service-asset-linker.tsx`
- `src/components/services/service-infrastructure-form.tsx`
- `src/components/services/service-owners-manager.tsx`

#### 5. Validate the Refactoring

```bash
# Run full validation suite
npm run validate

# Verify type-checking passes
npm run type-check

# Verify all tests pass
npm run test

# Verify no import errors
npm run lint
```

### Decision Criteria

Split a controller when:

1. **File size > 500 lines** with clear section markers
2. **Multiple domain responsibilities** (ownership, infrastructure, relationships)
3. **Aligned with use case structure** (separate use case directories exist)
4. **Clear boundaries** between feature areas
5. **Different permission requirements** per domain

### Benefits

- **Single Responsibility**: Each controller has one focused domain
- **Easier Navigation**: ~150-200 lines per file vs 600-700 lines
- **Better Testability**: Smaller, focused test suites
- **Open/Closed Principle**: Extend without modifying other domains
- **Interface Segregation**: Import only needed actions
- **Aligned Architecture**: Matches use case directory structure
- **No Breaking Changes**: All exports remain unchanged

### Tradeoffs

**Pros**:
- Improved maintainability and clarity
- Faster navigation and comprehension
- Reduced merge conflicts (different domains, different files)
- Better code organization

**Cons**:
- More files to manage (4 instead of 1)
- Slightly more import statements in client code
- Initial refactoring effort

### Verification

After refactoring, verify:

```bash
# 1. All TypeScript errors resolved
npm run type-check
# ✅ No errors

# 2. All imports updated correctly
npm run lint
# ✅ No import errors

# 3. All tests pass
npm run test
# ✅ 799/800 tests passed (1 pre-existing flaky test)

# 4. Git diff shows clean split
git diff --stat
# service.controller.ts              | 410 ----
# service-ownership.controller.ts    | 170 ++++
# service-infrastructure.controller.ts | 150 ++++
# service-asset.controller.ts        | 150 ++++
```

---

## Pattern 6: Strategy Pattern for Validation

### Problem

Large validation classes with massive switch statements:
- 123-line switch statement with 15+ validation rule types
- Repeated error handling patterns
- Difficult to add new validation rules
- Violates Open/Closed Principle

### Solution

Extract validation rules into strategy pattern with handler registry.

### Implementation Steps

#### 1. Create Strategy Interface

Define a common interface for all validation handlers:

```typescript
// field-validation-rules.ts

type ValidationRuleHandler = (
  value: any,
  rule: ValidationRule,
  label: string
) => string | null; // Returns error message or null if valid
```

#### 2. Implement Rule Handlers

Create individual handlers for each validation type:

```typescript
const emailHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidEmail(String(value))) {
    return rule.message || `${label} must be a valid email address`;
  }
  return null;
};

const urlHandler: ValidationRuleHandler = (value, rule, label) => {
  if (!isValidURL(String(value))) {
    return rule.message || `${label} must be a valid URL`;
  }
  return null;
};

// ... 13 more handlers
```

#### 3. Create Handler Registry

Use a registry pattern for easy lookup and extension:

```typescript
const RULE_HANDLERS: Record<string, ValidationRuleHandler> = {
  email: emailHandler,
  url: urlHandler,
  phone: phoneHandler,
  alphanumeric: alphanumericHandler,
  numeric: numericHandler,
  positive: positiveHandler,
  negative: negativeHandler,
  integer: integerHandler,
  pastDate: pastDateHandler,
  futureDate: futureDateHandler,
  pattern: patternHandler,
  minLength: minLengthHandler,
  maxLength: maxLengthHandler,
  min: minHandler,
  max: maxHandler,
};
```

#### 4. Implement Main Validation Function

Replace switch statement with registry lookup:

```typescript
export function validateRule(
  value: any,
  rule: ValidationRule,
  fieldLabel?: string,
): RuleValidationResult {
  const errors: string[] = [];
  const label = fieldLabel || "Value";

  // Get the appropriate handler for this rule type
  const handler = RULE_HANDLERS[rule.type];

  // If no handler exists, skip it
  if (!handler) {
    return { valid: true, errors: [] };
  }

  // Execute the handler and collect any error message
  const error = handler(value, rule, label);
  if (error) {
    errors.push(error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### 5. Enable Extension

Provide a registration function for custom rules:

```typescript
export function registerRuleHandler(
  ruleType: string,
  handler: ValidationRuleHandler,
): void {
  RULE_HANDLERS[ruleType] = handler;
}
```

### Supporting Patterns

#### Extract Format Validators

Move reusable validation logic into pure functions:

```typescript
// format-validators.ts

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^\+?\d{8,15}$/.test(cleaned);
}

// Export as registry too
export const formatValidators = {
  email: isValidEmail,
  url: isValidURL,
  phone: isValidPhone,
  // ...
} as const;
```

#### Extract String Matching Utilities

Separate fuzzy matching algorithms:

```typescript
// string-matching.ts

export function findClosestMatch(
  input: string,
  candidates: string[],
): { match: string; similarity: number } | null {
  if (candidates.length === 0) return null;

  let closestMatch = candidates[0];
  let minDistance = levenshteinDistance(
    input.toLowerCase(),
    closestMatch.toLowerCase(),
  );

  for (const value of candidates.slice(1)) {
    const distance = levenshteinDistance(
      input.toLowerCase(),
      value.toLowerCase(),
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = value;
    }
  }

  // Calculate similarity percentage
  const maxLength = Math.max(input.length, closestMatch.length);
  const similarity = Math.round(
    ((maxLength - minDistance) / maxLength) * 100,
  );

  return { match: closestMatch, similarity };
}

function levenshteinDistance(str1: string, str2: string): number {
  // ... implementation
}
```

### Benefits

- **Open/Closed Principle**: Add new rules without modifying core code
- **Single Responsibility**: Each handler does one thing
- **Easy Testing**: Test handlers in isolation
- **Extensible**: Register custom rules at runtime
- **Type Safety**: TypeScript ensures handler contract
- **Zero Switch Statements**: Registry pattern eliminates conditionals

### Real-World Example

**Universal Field Validator refactoring**:
- **Before**: 661 lines with 123-line switch statement
- **After**:
  - Main validator: 416 lines (37% reduction)
  - Strategy handlers: 280 lines (field-validation-rules.ts)
  - Format validators: 80 lines (format-validators.ts)
  - String matching: 100 lines (string-matching.ts)
- **Result**: Modular, extensible, testable validation system

---

## Pattern 7: Reusable Component Library

### Problem

React components with repetitive patterns:
- Same field display code repeated 20+ times
- Same form field patterns repeated 13+ times
- Duplicate dialog logic
- Mixed state management and UI rendering
- 600+ line components

### Solution

Create a library of focused, reusable components with custom hooks for state management.

### Implementation Steps

#### 1. Extract Display Components

Create generic components for common display patterns:

```typescript
// service-detail-fields.tsx

interface DetailFieldProps {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
  formatValue?: (value: string | number) => string;
  className?: string;
}

export function DetailField({
  label,
  value,
  fallback = "—",
  formatValue,
  className,
}: DetailFieldProps) {
  const displayValue =
    value !== null && value !== undefined
      ? formatValue ? formatValue(value) : String(value)
      : fallback;

  return (
    <div className={className}>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-sm">{displayValue}</p>
    </div>
  );
}

export function DetailDateField({
  label,
  date,
  fallback = "—",
}: { label: string; date: string | null; fallback?: string }) {
  return (
    <DetailField
      label={label}
      value={date ? format(new Date(date), "MMM d, yyyy") : undefined}
      fallback={fallback}
    />
  );
}

export function ConditionalDetailField({
  label,
  value,
  className,
}: DetailFieldProps & { show?: boolean }) {
  // Only render if value exists
  if (!value) return null;
  return <DetailField label={label} value={value} className={className} />;
}
```

**Usage**:

```typescript
// BEFORE: 10 lines per field
<div>
  <p className="text-muted-foreground text-sm font-medium">Service Type</p>
  <p className="text-sm">{service.serviceType.replace(/_/g, " ")}</p>
</div>

// AFTER: 3 lines per field
<DetailField
  label="Service Type"
  value={service.serviceType}
  formatValue={formatEnumValue}
/>
```

#### 2. Extract Form Field Components

Create generic form field wrappers:

```typescript
// service-form-fields.tsx

export function EnumSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  enumValues,
  required,
  formatValue = formatEnumValue,
}: EnumSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} {required && "*"}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.values(enumValues).map((value) => (
                <SelectItem key={value} value={value}>
                  {formatValue(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: DateFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="date"
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

#### 3. Extract Custom Hooks

Separate state management from UI:

```typescript
// use-service-actions.ts

export function useServiceActions(service: ServiceDTO) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteServiceAction(service.id);
      if (result.success) {
        toast.success("Service deleted successfully");
        router.push("/services");
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRetire = async () => {
    // Similar implementation
  };

  return {
    deleteDialog: { open: deleteDialogOpen, setOpen: setDeleteDialogOpen },
    retireDialog: { open: retireDialogOpen, setOpen: setRetireDialogOpen },
    isDeleting,
    isRetiring,
    handleDelete,
    handleRetire,
  };
}
```

#### 4. Create Configuration-Driven Components

Use configuration objects to eliminate duplicate component code:

```typescript
// service-action-dialogs.tsx

const ACTION_CONFIG: Record<ServiceActionType, {
  title: string;
  getDescription: (name: string) => string;
  buttonText: string;
  processingText: string;
  buttonClass: string;
}> = {
  delete: {
    title: "Delete Service?",
    getDescription: (name) => `This will permanently delete service "${name}".`,
    buttonText: "Delete",
    processingText: "Deleting...",
    buttonClass: "bg-destructive text-destructive-foreground",
  },
  retire: {
    title: "Retire Service?",
    getDescription: (name) => `This will mark service "${name}" as RETIRED.`,
    buttonText: "Retire",
    processingText: "Retiring...",
    buttonClass: "bg-orange-600 text-white",
  },
};

export function ServiceActionDialog({
  actionType,
  serviceName,
  isProcessing,
  onConfirm,
  ...dialogProps
}: ServiceActionDialogProps) {
  const config = ACTION_CONFIG[actionType];

  return (
    <AlertDialog {...dialogProps}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {config.getDescription(serviceName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={config.buttonClass}>
            {isProcessing ? config.processingText : config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### 5. Extract Utility Functions

Pure functions for data transformation and formatting:

```typescript
// service-display-utils.ts

export function getStatusBadgeVariant(status: ServiceStatus): BadgeVariant {
  switch (status) {
    case "PRODUCTION": return "default";
    case "RETIRED": return "secondary";
    case "UAT": return "outline";
    default: return "outline";
  }
}

export function groupOwnersByType(
  owners: ServiceOwnerDTO[],
): Record<string, ServiceOwnerDTO[]> {
  const grouped = { TECHNICAL: [], PRODUCT: [], BUSINESS: [] };
  owners.forEach((owner) => {
    if (grouped[owner.ownershipType]) {
      grouped[owner.ownershipType].push(owner);
    }
  });
  return grouped;
}

export function formatServiceDate(
  date: string | null | undefined,
  fallback: string = "—",
): string {
  return date ? format(new Date(date), "MMM d, yyyy") : fallback;
}
```

#### 6. Refactor Main Component

Use extracted hooks, components, and utilities:

```typescript
// service-detail-view.tsx (AFTER)

export function ServiceDetailView({ service, owners }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Extracted hook handles all action state
  const {
    deleteDialog,
    retireDialog,
    isDeleting,
    isRetiring,
    handleDelete,
    handleRetire,
  } = useServiceActions(service);

  // Extracted utility function
  const groupedOwners = groupOwnersByType(owners);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <h1>{service.name}</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/services/${service.id}/edit`)}>
            Edit
          </Button>
          <Button onClick={() => retireDialog.setOpen(true)}>Retire</Button>
          <Button onClick={() => deleteDialog.setOpen(true)}>Delete</Button>
        </div>
      </div>

      {/* Content with reusable components */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4">
          <DetailField
            label="Service Type"
            value={service.serviceType}
            formatValue={formatEnumValue}
          />
          <DetailDateField
            label="Deployment Date"
            date={service.deploymentDate}
          />
          <ConditionalDetailField
            label="Description"
            value={service.description}
            className="col-span-2"
          />
        </CardContent>
      </Card>

      {/* Configuration-driven dialogs */}
      <ServiceActionDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.setOpen}
        serviceName={service.name}
        actionType="delete"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
      />

      <ServiceActionDialog
        open={retireDialog.open}
        onOpenChange={retireDialog.setOpen}
        serviceName={service.name}
        actionType="retire"
        isProcessing={isRetiring}
        onConfirm={handleRetire}
      />
    </div>
  );
}
```

### Component Library Structure

```
src/
├── hooks/
│   ├── use-service-actions.ts         # State management hook
│   └── use-service-form.ts            # Form state hook
├── lib/
│   └── services/
│       └── service-display-utils.ts   # Pure utility functions
└── components/
    └── services/
        ├── service-action-dialogs.tsx # Unified dialog component
        ├── service-detail-fields.tsx  # Display field components
        └── service-form-fields.tsx    # Form field components
```

### Benefits

- **Massive Reduction**: 28-37% reduction in main component lines
- **Reusability**: Components used across multiple views/forms
- **Consistency**: Same styling and behavior everywhere
- **Testability**: Test components and hooks in isolation
- **Maintainability**: Changes localized to specific components
- **Type Safety**: Full TypeScript support with generics
- **Composition**: Build complex UIs from simple parts

### Real-World Example

**Service Detail View refactoring**:
- **Before**: 617 lines mixing state, display patterns, and dialogs
- **After**:
  - Main component: 443 lines (28% reduction)
  - Extracted components:
    - `use-service-actions.ts`: 140 lines (hook)
    - `service-action-dialogs.tsx`: 130 lines (dialog)
    - `service-detail-fields.tsx`: 220 lines (display components)
    - `service-display-utils.ts`: 158 lines (utilities)
- **Reusability**: Components applicable to 6+ other service-related files
- **Estimated future savings**: 800-1,000 lines when applied across module

**Key Metrics**:
- Eliminated 20+ field display pattern repetitions
- Eliminated 2 duplicate dialog implementations
- Extracted 90+ lines of utility logic
- Created 5 reusable display components
- Created 5 reusable form field components

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
- [SERVICE_MANAGEMENT.md](../features/SERVICE_MANAGEMENT.md) - Controller refactoring example (service controllers)
- [ITAM_FEATURES.md](../features/ITAM_FEATURES.md) - Controller refactoring example (asset-kit controllers)
