# Universal Assets Importer

**Single-file import for assets with automatic entity creation**

## Overview

The Universal Assets Importer is a specialized composite import feature that allows importing assets along with all their related entities (manufacturer, category, model, location, stock location, custom fields) in a single CSV file. It automatically creates missing entities and handles asset assignments.

### Key Features

- **Single-file import**: All asset-related data in one CSV
- **Auto-creation**: Missing Manufacturer, Category, Model, Location, StockLocation entities created automatically
- **Custom fields**: Auto-infers data types and creates FieldDefinitions
- **Assignments**: Handles asset-to-person assignments with re-assignment support
- **Prefixed columns**: Clear, organized column naming (e.g., `vendor.name`, `asset.serial_number`)
- **Row-level transactions**: Each row processed independently; failures don't block others

---

## Quick Start

### 1. Access the Importer

Navigate to **Dashboard > Data Import** and select the featured "Universal Assets Import" card.

### 2. Download Template

Download the CSV template from the wizard (Step 1) or via the controller action.

### 3. Prepare Your Data

Fill in the template with your asset data using the prefixed column format:

```csv
person.email,asset.serial_number,asset.asset_tag,vendor.code,vendor.name,category.code,category.name,model.code,model.name,location.code,custom.cpu_cores
john.doe@barq.com,SN001,TAG001,DELL,Dell Inc,LAPTOP,Laptops,XPS15,Dell XPS 15,HQ-FL1,8
jane.doe@barq.com,SN002,TAG002,LENOVO,Lenovo,LAPTOP,Laptops,T14,ThinkPad T14,HQ-FL2,4
```

### 4. Upload and Import

Follow the 7-step wizard to upload, validate, and import your data.

---

## Column Prefixes

All columns must use a prefix to indicate which entity the field belongs to:

| Prefix | Entity | Auto-Create | Required Fields | Description |
|--------|--------|-------------|-----------------|-------------|
| `person.` | Person | No | `email` | Assignee (must exist in system) |
| `asset.` | Asset | - | `serial_number` | Core asset fields |
| `vendor.` | Vendor | Yes | `code` or `name` | Manufacturer (company that makes the model) |
| `category.` | AssetCategory | Yes | `code` or `name` | Asset classification |
| `model.` | AssetModel | Yes | `code` or `name` | Product model (linked to manufacturer) |
| `location.` | Location | Yes | `code` or `name` | Physical location |
| `stock_location.` | StockLocation | Yes | `code` or `name` | Warehouse/storage |
| `lifecycle.` | LifecycleState | No | `code` | Asset lifecycle state (lookup only) |
| `custom.` | FieldDefinition | Yes | - | Custom fields (auto-inferred type) |

---

## Supported Fields

### Person Fields (Lookup Only)

| Column | Description | Required |
|--------|-------------|----------|
| `person.email` | Person's email for assignment lookup | For assignments |

**Note**: Person must already exist in the system. No auto-creation.

### Asset Fields

| Column | Description | Required |
|--------|-------------|----------|
| `asset.serial_number` | Manufacturer serial number | Yes |
| `asset.asset_tag` | Internal asset tag | No |
| `asset.name` | Asset display name | No |
| `asset.purchase_date` | Date of purchase (YYYY-MM-DD) | No |
| `asset.purchase_cost` | Purchase price | No |
| `asset.currency` | Currency code (USD, SAR, etc.) | No |
| `asset.warranty_end_date` | Warranty expiration | No |
| `asset.notes` | Additional notes | No |

### Manufacturer Fields (vendor.*)

| Column | Description | Required |
|--------|-------------|----------|
| `vendor.code` | Unique manufacturer/vendor code | Code OR name |
| `vendor.name` | Manufacturer name (company that makes the model) | Code OR name |

### Category Fields

| Column | Description | Required |
|--------|-------------|----------|
| `category.code` | Unique category code | Code OR name |
| `category.name` | Category display name | Code OR name |

### Model Fields

| Column | Description | Required |
|--------|-------------|----------|
| `model.code` | Unique model code | Code OR name |
| `model.name` | Model display name | Code OR name |

**Note**: Model requires a Manufacturer (vendor.*) to be specified in the same row.

### Location Fields

| Column | Description | Required |
|--------|-------------|----------|
| `location.code` | Unique location code | Code OR name |
| `location.name` | Location display name | Code OR name |

### Stock Location Fields

| Column | Description | Required |
|--------|-------------|----------|
| `stock_location.code` | Unique stock location code | Code OR name |
| `stock_location.name` | Stock location display name | Code OR name |

### Lifecycle Fields (Lookup Only)

| Column | Description | Required |
|--------|-------------|----------|
| `lifecycle.code` | Lifecycle state code | No |

**Note**: Lifecycle state must already exist. No auto-creation.

### Custom Fields

| Column | Description | Required |
|--------|-------------|----------|
| `custom.<field_name>` | Any custom field | No |

**Examples**: `custom.cpu_cores`, `custom.ram_gb`, `custom.storage_type`

Data types are automatically inferred:
- **INTEGER**: All values are whole numbers
- **DECIMAL**: All values are numbers with decimals
- **BOOLEAN**: Values are true/false, yes/no, 1/0
- **DATE**: Values match date patterns (YYYY-MM-DD, etc.)
- **STRING**: Default for mixed or text values

---

## Import Behavior

### Unique Key Resolution

Assets are identified by the combination of:
1. **Person email** (`person.email`)
2. **Serial number** (`asset.serial_number`)

If both match an existing record, the asset is **updated**. Otherwise, a new asset is **created**.

### Auto-Creation Rules

| Entity | Created When | Default Values |
|--------|--------------|----------------|
| Manufacturer (Vendor) | Code/name not found | `vendorType: OTHER`, `isActive: true` |
| Category | Code/name not found | Generated code from name |
| Model | Code/name not found | Linked to manufacturer from same row |
| Location | Code/name not found | `locationType: BUILDING` |
| StockLocation | Code/name not found | `isActive: true` |
| FieldDefinition | Custom field not defined | Inferred type, linked to category |

### Assignment Handling

- If `person.email` is provided and the person exists:
  - For **new assets**: Creates an AssetAssignment
  - For **existing assets with different assignee**: Closes old assignment, creates new one
  - For **existing assets with same assignee**: No change
- If person not found: Row is skipped (configurable)

### Blank Field Handling

- **Create**: Blank fields use defaults or remain null
- **Update**: Blank fields are **ignored** (existing values preserved)

### Error Handling

- Each row is processed independently
- Failed rows don't block other rows
- Errors are collected and reported with row numbers
- Auto-creation failures can skip the row (configurable)

---

## Import Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autoCreateMissingEntities` | `true` | Auto-create vendors, categories, etc. |
| `skipRowOnAutoCreateFailure` | `true` | Skip row if auto-creation fails |
| `handleAssignmentChanges` | `true` | Process assignment changes |
| `closeOldAssignmentsOnReassign` | `true` | Close old assignments on re-assignment |

---

## Architecture

### Module Structure

```
src/lib/data-import/universal-assets/
├── types.ts              # Type definitions and interfaces
├── prefix-parser.ts      # Column prefix detection and parsing
├── auto-create-resolver.ts  # Entity resolution with caching
├── custom-field-inferrer.ts # FieldDefinition type inference
├── assignment-handler.ts    # Asset assignment logic
├── processor.ts          # Main 11-phase orchestrator
├── config.ts             # Entity configuration and templates
└── index.ts              # Barrel exports
```

### Processing Phases

The import runs through 11 sequential phases:

1. **Initializing** - Set up caches and prepare data structures
2. **Parsing columns** - Detect and validate prefixed columns
3. **Grouping rows** - Parse each row into grouped data by prefix
4. **Validating persons** - Look up and validate person emails
5. **Resolving manufacturers** - Find or create manufacturers (vendors)
6. **Resolving categories** - Find or create asset categories
7. **Resolving models** - Find or create asset models (linked to manufacturers)
8. **Resolving locations** - Find or create locations
9. **Processing custom fields** - Infer types and create field definitions
10. **Processing assets** - Create or update assets
11. **Processing assignments** - Create or update assignments

### Server Actions

```typescript
// Main import action
processUniversalAssetsImportAction(rows, columnHeaders, settings?)

// Validation action
validateUniversalAssetsImportAction(columnHeaders, sampleRows?)

// Template download action
downloadUniversalAssetsTemplateAction(includeExamples?)

// Get default settings
getUniversalAssetsImportDefaultSettingsAction()

// Get prefix documentation
getUniversalAssetsPrefixInfoAction()
```

---

## Permissions

| Permission | Required For |
|------------|--------------|
| `ASSETS_CREATE` | Processing imports |
| `ASSETS_VIEW` | Validation and template download |

---

## UI Integration

The Universal Assets Importer is integrated into the existing 7-step Data Import wizard:

1. **Step 1 (Entity Selector)**: Featured card with prominent placement
2. **Step 6 (Import Progress)**: Special handling for Universal Assets with progress phases
3. **Step 7 (Results)**: Summary with created entities, assignments, errors

---

## Example Workflow

### Scenario: Import 100 laptops with assignments

1. **Prepare CSV** with columns:
   - `person.email` - Employee email
   - `asset.serial_number` - Laptop serial
   - `vendor.name` - Manufacturer (Dell, Lenovo, HP)
   - `category.code` - LAPTOP
   - `model.name` - Model names
   - `location.code` - Office locations
   - `custom.ram_gb` - RAM size
   - `custom.cpu_cores` - CPU cores

2. **Upload and import**:
   - System creates missing manufacturers (Dell, Lenovo, HP)
   - System creates category (LAPTOP) if not exists
   - System creates models linked to their manufacturers
   - System creates locations
   - System creates custom fields (ram_gb as INTEGER, cpu_cores as INTEGER)
   - System creates assets linked to all entities
   - System creates assignments to persons

3. **Review results**:
   - 95 assets created
   - 3 manufacturers auto-created
   - 1 category auto-created
   - 5 models auto-created
   - 2 custom fields created
   - 5 rows skipped (person not found)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Person not found" | Email doesn't match any Person | Create person first or check email spelling |
| "Manufacturer creation failed" | Duplicate vendor code | Use existing vendor code |
| "Model requires manufacturer" | No vendor.* columns | Add vendor.code or vendor.name column |
| "Invalid date format" | Non-standard date format | Use YYYY-MM-DD format |
| "Custom field type mismatch" | Mixed data types in column | Ensure consistent values in custom fields |

### Best Practices

1. **Clean your data first**: Remove duplicates, fix spelling errors
2. **Use codes when possible**: More reliable than names for lookups
3. **Include all required columns**: Even if some rows don't use them
4. **Test with small batch**: Import 5-10 rows first to validate
5. **Create persons first**: Import persons separately if they don't exist

---

## Related Documentation

- [Universal Data Importer](../../roadmap/UNIVERSAL_DATA_IMPORTER.md) - Main data import system
- [Custom Fields](../../roadmap/CUSTOM_FIELDS_COMPLETION.md) - Custom fields system
- [Entity Registry](./ENTITY_REGISTRY.md) - Supported entity types

---

**Last Updated**: 2025-11-27
**Maintained By**: Development Team
