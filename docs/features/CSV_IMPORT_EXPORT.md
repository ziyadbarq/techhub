# CSV Import/Export for Assets

This document describes the CSV import/export functionality for managing assets in bulk.

## Overview

The CSV import/export feature allows users to:

- **Export** existing assets to CSV format for backup, analysis, or sharing
- **Import** large numbers of assets from CSV files
- **Download** a template CSV file with example data and field descriptions
- **Validate** CSV data before importing
- **Preview** import results with detailed error reporting

## Features

### 1. CSV Export

**Location**: Assets page → "Export CSV" button
**Permission**: `ASSETS_VIEW`

**Functionality**:

- Exports all currently displayed assets to a CSV file
- Includes all asset fields plus computed fields (warranty status, depreciation status)
- Includes enriched display names for categories, models, vendors, locations, and lifecycle states
- Filename format: `assets-export-YYYY-MM-DD.csv`
- UTF-8 encoding with BOM for Excel compatibility

**Exported Fields**:

- Asset Tag
- Category (name and ID)
- Model (name and ID)
- Vendor (name and ID)
- Serial Number
- Purchase Date
- Purchase Cost
- Currency
- Warranty End Date
- Stock Location (name and ID)
- Lifecycle State (name and ID)
- Depreciation Model
- Depreciation Start/End Dates
- Warranty/Depreciation Status (computed)
- Note
- Created At / Updated At

### 2. CSV Template Download

**Location**: Assets page → "Template" button
**Permission**: `ASSETS_CREATE`

**Functionality**:

- Downloads a template CSV file with:
  - Required field indicators (`*`)
  - Field descriptions row
  - Example data row
- Helps users understand the expected format

**Template Structure**:

```csv
assetTag*,categoryCode*,modelCode,vendorCode,serialNumber,purchaseDate,...
Required: Unique asset identifier,Required: Asset category code,...
LAPTOP-001,LAPTOP,MBP-M3,APPLE,C02XYZ123ABC,2024-01-15,...
```

### 3. CSV Import Wizard

**Location**: Assets page → "Import CSV" button
**Permission**: `ASSETS_CREATE`

**Workflow**:

#### Step 1: Upload CSV File

- User selects a CSV file from their computer
- Supports files with up to 10,000+ rows
- File is parsed client-side using PapaParse library

#### Step 2: Validate Data

- Displays summary statistics:
  - Total rows
  - Valid rows (can be imported)
  - Invalid rows (have errors)
- Shows validation errors for each invalid row:
  - Missing required fields
  - Invalid data formats
  - Field length violations
  - Invalid date formats
  - Invalid currency codes
- Allows user to:
  - Download error report as CSV for correction
  - Continue with valid rows only
  - Cancel and fix the file

#### Step 3: Import Assets

- Converts CSV codes to database IDs using lookup maps:
  - Category code → Category ID
  - Model code → Model ID
  - Vendor code → Vendor ID
  - Location code → Location ID
  - State code → State ID
- Validates that all referenced entities exist
- Imports assets sequentially to avoid database overload
- Shows progress indicator

#### Step 4: Results Summary

- Displays import results:
  - Number of successfully imported assets
  - Number of failed imports
  - Error details for failures
- Failed imports can be due to:
  - Duplicate asset tags
  - Non-existent codes (category, model, etc.)
  - Database constraints
  - Permission issues

## CSV Format Specification

### Required Fields

- `assetTag*` - Unique identifier for the asset
  - Format: Alphanumeric, hyphens, underscores
  - Length: 2-100 characters
  - Example: `LAPTOP-001`, `SERVER-DC1-R01`

- `categoryCode*` - Asset category code
  - Must match an existing category code in the system
  - Case-insensitive (converted to uppercase)
  - Example: `LAPTOP`, `SERVER`, `MONITOR`

### Optional Fields

- `modelCode` - Asset model code
  - Must match an existing model code if provided
  - Example: `MBP-M3`, `DELL-R750`

- `vendorCode` - Vendor code
  - Must match an existing vendor code if provided
  - Example: `APPLE`, `DELL`, `HP`

- `serialNumber` - Manufacturer serial number
  - Max length: 200 characters
  - Example: `C02XYZ123ABC`

- `purchaseDate` - Purchase date
  - Format: `YYYY-MM-DD`
  - Example: `2024-01-15`

- `purchaseCost` - Purchase cost
  - Numeric value, no currency symbols
  - Range: 0 to 9,999,999,999.99
  - Example: `2499.99`

- `currency` - Currency code
  - Format: 3-letter ISO code (uppercase)
  - Example: `USD`, `EUR`, `GBP`

- `warrantyEndDate` - Warranty end date
  - Format: `YYYY-MM-DD`
  - Example: `2027-01-15`

- `stockLocationCode` - Stock location code
  - Must match an existing location code if provided
  - Example: `HQ-WAREHOUSE`, `DC1-RACK-A01`

- `lifecycleStateCode` - Lifecycle state code
  - Must match an existing state code if provided
  - Example: `IN-USE`, `DEPLOYED`, `RETIRED`

- `depreciationModel` - Depreciation model name
  - Max length: 100 characters
  - Example: `STRAIGHT-LINE`, `DECLINING-BALANCE`

- `depreciationStart` - Depreciation start date
  - Format: `YYYY-MM-DD`

- `depreciationEnd` - Depreciation end date
  - Format: `YYYY-MM-DD`

- `note` - Additional notes
  - Max length: 5,000 characters
  - Example: `Executive laptop for CEO`

## Validation Rules

### Format Validation

- **Asset Tag**: Must be 2-100 characters, alphanumeric with hyphens/underscores
- **Dates**: Must be in `YYYY-MM-DD` format
- **Currency**: Must be exactly 3 uppercase letters
- **Numbers**: Must be valid numbers (no symbols or text)

### Business Rules

- **Duplicate Asset Tags**: Not allowed (enforced by database)
- **Required Fields**: Asset tag and category code must be present
- **Code Lookups**: All codes must reference existing entities

### Error Handling

- **Parse Errors**: Invalid CSV format, encoding issues
- **Validation Errors**: Field format violations, missing required fields
- **Lookup Errors**: Non-existent category/model/vendor codes
- **Import Errors**: Duplicate tags, database constraints, permissions

## Implementation Files

### Core Libraries

- `/src/lib/csv-export.ts` - Export functionality
  - `exportAssetsToCSV(assets: AssetDTO[]): void`
  - Converts assets to CSV and triggers download

- `/src/lib/csv-template.ts` - Template generation
  - `downloadAssetCSVTemplate(): void`
  - Generates and downloads template CSV

- `/src/lib/csv-import.ts` - Import parsing and validation
  - `parseCSVFile(file: File): Promise<CSVParseResult>`
  - `csvRowToDTO(row, lookupMaps): { dto, errors }`
  - `exportFailedRowsToCSV(failedAssets): void`

### UI Components

- `/src/components/assets/import-assets-wizard.tsx`
  - Multi-step wizard dialog for CSV import
  - Steps: Upload → Validate → Import → Complete

- `/src/components/assets/assets-page-client.tsx`
  - Added export/import/template buttons
  - Integrated with permission guards

### Server Actions

- `/src/interface-adapters/controllers/asset.controller.ts`
  - `bulkCreateAssetsAction(assetsData: CreateAssetDTO[])`
    - Bulk creates assets from CSV data
    - Returns success/failure counts
  - `getImportLookupMapsAction()`
    - Returns code → ID maps for categories, models, vendors, locations, states

## Usage Examples

### Basic Import Workflow

1. Click "Template" button to download template
2. Fill in template with asset data:
   ```csv
   assetTag*,categoryCode*,modelCode,vendorCode,serialNumber,purchaseDate,purchaseCost,currency
   LAPTOP-001,LAPTOP,MBP-M3,APPLE,C02XYZ123ABC,2024-01-15,2499.99,USD
   LAPTOP-002,LAPTOP,MBP-M3,APPLE,C02XYZ456DEF,2024-01-15,2499.99,USD
   ```
3. Click "Import CSV" button
4. Upload the file
5. Review validation results
6. Click "Import X Asset(s)" to proceed
7. Review import summary

### Export Workflow

1. Navigate to Assets page
2. (Optional) Apply filters to export subset of assets
3. Click "Export CSV" button
4. CSV file downloads automatically

### Error Correction Workflow

1. Import CSV file with errors
2. Review validation errors in wizard
3. Click "Download Errors" button
4. Fix errors in downloaded CSV
5. Re-import corrected file

## Performance Considerations

- **Client-side parsing**: CSV parsing happens in the browser (PapaParse library)
- **Sequential import**: Assets are created one at a time to avoid overwhelming the database
- **Large files**: Tested with 10,000+ rows
- **Memory usage**: Entire CSV is loaded into memory for processing
- **Recommended limits**: Keep imports under 10,000 rows for best performance

## Security

- **Permission checks**: All operations require appropriate permissions
  - Export: `ASSETS_VIEW`
  - Import/Template: `ASSETS_CREATE`
- **Input validation**: All CSV data is validated before import
- **SQL injection**: Protected by Prisma ORM parameterized queries
- **File type validation**: Only `.csv` files accepted

## Future Enhancements

- [ ] Support for updating existing assets via CSV
- [ ] Batch validation API for large files (server-side)
- [ ] Import templates for other entities (categories, models, etc.)
- [ ] Progress bar showing actual progress (currently shows indeterminate)
- [ ] Parallel import processing with concurrency limits
- [ ] Support for custom field attributes in CSV
- [ ] Import history and audit trail
- [ ] Scheduled/automated imports
- [ ] Excel (.xlsx) file support

## Troubleshooting

### Common Issues

**Issue**: "Category code 'LAPTOP' not found"
**Solution**: Ensure the category code exists in the system. Codes are case-insensitive but must match exactly.

**Issue**: "Purchase cost must be a positive number"
**Solution**: Remove currency symbols and use only numeric values (e.g., `2499.99` not `$2,499.99`).

**Issue**: "Purchase date must be in YYYY-MM-DD format"
**Solution**: Use ISO date format. Excel dates need to be reformatted.

**Issue**: Excel changes date format
**Solution**: Format cells as Text before entering dates, or use CSV import template.

**Issue**: Special characters in notes appear garbled
**Solution**: Ensure CSV file is saved with UTF-8 encoding.

## Testing

To test CSV import/export:

1. Export existing assets to verify export functionality
2. Use the template to create a test import file
3. Import with intentional errors to test validation
4. Import valid data to test successful import
5. Verify imported assets appear in the table
6. Check audit logs for import activity

## Dependencies

- **papaparse** (^5.5.3): CSV parsing library
- **date-fns** (^4.1.0): Date formatting
- All other dependencies are existing project dependencies
