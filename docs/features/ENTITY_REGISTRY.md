# Entity Registry

The Entity Registry provides a centralized source of truth for entities that support custom field definitions. It powers the Entity Type dropdown in Field Definition forms and provides metadata for UI components and validation.

## Overview

The registry defines 20 business entities across 7 categories:

| Category | Entities |
|----------|----------|
| **Asset Management** | Asset, AssetCategory, AssetModel, AssetKit |
| **People & Organization** | Person, OrganizationUnit, Role |
| **Infrastructure** | Location, StockLocation |
| **Vendors & Contracts** | Vendor, Contract, ContractType |
| **Configuration Management** | ConfigurationItem, CIClass, Service, BusinessProcess |
| **License Management** | LicenseProduct, LicenseEntitlement |
| **Maintenance** | MaintenanceSchedule, Warranty |

## Usage

### In Forms (Client Components)

Use the `useEntityTypeOptions()` hook to get options for `SearchableSelect`:

```typescript
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useEntityTypeOptions } from "@/hooks/use-entity-type-options";

function MyForm() {
  const entityTypeOptions = useEntityTypeOptions();

  return (
    <SearchableSelect
      options={entityTypeOptions}
      value={selectedEntity}
      onValueChange={setSelectedEntity}
      placeholder="Select an entity type"
      searchPlaceholder="Search entities..."
    />
  );
}
```

### In Server Code

Use the registry functions directly:

```typescript
import {
  getCustomFieldsEnabledEntities,
  getEntityByKey,
  isValidEntityKey,
  getValidEntityKeys,
} from "@/lib/entity-registry";

// Get all entities that support custom fields
const entities = getCustomFieldsEnabledEntities();

// Get a specific entity by key
const asset = getEntityByKey("Asset");
// Returns: { key: "Asset", displayName: "Asset", category: "ASSET_MANAGEMENT", ... }

// Validate an entity key
const isValid = isValidEntityKey("Asset"); // true
const isInvalid = isValidEntityKey("Unknown"); // false

// Get all valid keys (for Zod validation)
const validKeys = getValidEntityKeys();
// Returns: ["Asset", "AssetCategory", "Person", ...]
```

### In Zod Schemas

Validate entity types in DTOs:

```typescript
import { z } from "zod";
import { getValidEntityKeys } from "@/lib/entity-registry";

const schema = z.object({
  entityType: z
    .string()
    .min(1, "Entity type is required")
    .refine(
      (val) => getValidEntityKeys().includes(val),
      { message: "Invalid entity type" }
    ),
});
```

## Adding a New Entity

To add a new entity that supports custom fields:

1. Edit `src/lib/entity-registry/entity-registry.ts`
2. Add a new entry to the `ENTITY_REGISTRY` array:

```typescript
{
  key: "NewEntity",              // Must match Prisma model name exactly
  displayName: "New Entity",     // Human-readable singular name
  pluralName: "New Entities",    // Human-readable plural name
  category: "ASSET_MANAGEMENT",  // One of the EntityCategory values
  description: "Description",    // Brief description
  supportsCustomFields: true,    // Enable custom fields
},
```

The form dropdowns and validation automatically pick up the change.

## API Reference

### Types

```typescript
type EntityCategory =
  | "ASSET_MANAGEMENT"
  | "PEOPLE_ORGANIZATION"
  | "INFRASTRUCTURE"
  | "VENDORS_CONTRACTS"
  | "CMDB"
  | "LICENSING"
  | "MAINTENANCE";

interface EntityRegistryEntry {
  key: string;                    // Prisma model name
  displayName: string;            // UI display name (singular)
  pluralName: string;             // UI display name (plural)
  category: EntityCategory;       // Category for grouping
  description: string;            // Brief description
  supportsCustomFields: boolean;  // Whether custom fields are enabled
}
```

### Constants

| Constant | Description |
|----------|-------------|
| `ENTITY_REGISTRY` | Complete array of all entity entries |
| `ENTITY_CATEGORY_LABELS` | Human-readable labels for each category |

### Functions

| Function | Description |
|----------|-------------|
| `getCustomFieldsEnabledEntities()` | Get all entities with `supportsCustomFields: true` |
| `getEntityByKey(key)` | Get entity entry by its key |
| `getEntitiesByCategory(category)` | Get all entities in a category |
| `isValidEntityKey(key)` | Check if a key is valid |
| `getValidEntityKeys()` | Get array of all valid keys |

### Hooks

| Hook | Description |
|------|-------------|
| `useEntityTypeOptions()` | Returns `SearchableSelectOption[]` for form dropdowns |

## File Locations

| File | Purpose |
|------|---------|
| `src/lib/entity-registry/entity-registry.ts` | Registry configuration and types |
| `src/lib/entity-registry/index.ts` | Barrel export |
| `src/hooks/use-entity-type-options.ts` | Form options hook |

## Related Documentation

- [Custom Fields Completion](../../roadmap/CUSTOM_FIELDS_COMPLETION.md) - Custom field definitions attached to entities
- [Foundation Layer Guide](../guides/FOUNDATION_LAYER.md) - Core entity documentation
