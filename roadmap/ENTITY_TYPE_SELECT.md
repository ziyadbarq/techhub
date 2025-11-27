# Entity Type Dynamic Select for Field Definitions

**Status**: Complete
**Priority**: Medium
**Complexity**: Small
**Layer**: Foundation (RBAC & Admin)

---

## Overview

### Business Requirements

Previously, the "Entity Type" field in the Field Definition form was a free-text input, which led to:

1. **Data inconsistency**: Same entity typed as "Asset", "asset", "ASSET", or typos like "Aseet"
2. **No discoverability**: Users must know exact entity names (no autocomplete)
3. **No validation**: Invalid entity types accepted without warning
4. **Poor UX**: Placeholder "Asset, Person, etc." was insufficient guidance

### Solution

Replaced the text input with a searchable select component populated from a centralized Entity Registry. This provides:

- **Consistency**: Controlled vocabulary for entity types
- **Discoverability**: All valid entities visible in dropdown
- **Validation**: Only valid entities can be selected
- **Categorization**: Entities grouped by domain (Asset Management, CMDB, etc.)
- **Extensibility**: Single source of truth for future features (form builders, reporting)

---

## Technical Design

### Architecture

```
src/lib/entity-registry/
├── entity-registry.ts    # Registry configuration & types
└── index.ts              # Barrel export

src/hooks/
└── use-entity-type-options.ts  # Options transformation hook

src/components/field-definitions/
└── field-definition-form.tsx   # Form with SearchableSelect
```

### Entity Registry

20 business entities organized into 7 categories:

| Category | Entities |
|----------|----------|
| Asset Management | Asset, AssetCategory, AssetModel, AssetKit |
| People & Organization | Person, OrganizationUnit, Role |
| Infrastructure | Location, StockLocation |
| Vendors & Contracts | Vendor, Contract, ContractType |
| CMDB | ConfigurationItem, CIClass, Service, BusinessProcess |
| Licensing | LicenseProduct, LicenseEntitlement |
| Maintenance | MaintenanceSchedule, Warranty |

### Files Created/Modified

| File | Description |
|------|-------------|
| `src/lib/entity-registry/entity-registry.ts` | Entity registry configuration with types, constants, and helper functions |
| `src/lib/entity-registry/index.ts` | Barrel export |
| `src/hooks/use-entity-type-options.ts` | Hook to transform registry into SearchableSelect options |
| `src/components/field-definitions/field-definition-form.tsx` | Updated to use SearchableSelect for Entity Type |
| `src/interface-adapters/dtos/generated/field-definition.dto.ts` | Added Zod validation against entity registry |

---

## Usage

### Adding a New Entity

To add a new entity that supports custom fields:

1. Add entry to `ENTITY_REGISTRY` in `src/lib/entity-registry/entity-registry.ts`:

```typescript
{
  key: "NewEntity",              // Must match Prisma model name
  displayName: "New Entity",     // Human-readable singular
  pluralName: "New Entities",    // Human-readable plural
  category: "ASSET_MANAGEMENT",  // One of EntityCategory
  description: "Description",    // Brief description
  supportsCustomFields: true,    // Enable custom fields
},
```

2. The form and validation automatically pick up the change.

### Using Entity Registry in Code

```typescript
import {
  getCustomFieldsEnabledEntities,
  getEntityByKey,
  isValidEntityKey,
} from "@/lib/entity-registry";

// Get all entities
const entities = getCustomFieldsEnabledEntities();

// Get specific entity
const asset = getEntityByKey("Asset");

// Validate entity key
const isValid = isValidEntityKey("Asset"); // true
```

---

## Future Enhancements

This Entity Registry can later power:

1. **Dynamic Form Builders** - Generate forms based on entity schema
2. **API Discovery** - Document available entities for integrations
3. **Reporting** - Entity selection in report builders
4. **Data Export** - Select entities for bulk export
5. **Admin UI** - Entity management dashboard

---

**Author**: Development Team
**Completed**: 2025-11-27
