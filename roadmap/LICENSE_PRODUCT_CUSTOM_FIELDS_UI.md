# LicenseProduct Custom Fields UI

**Status**: Planned (Infrastructure Ready)
**Priority**: Medium
**Complexity**: Small
**Estimated Effort**: 2-3 hours
**Last Updated**: 2026-03-27

## Overview

Custom fields for LicenseProduct have full backend infrastructure in place. Only the UI form and display components are missing.

## What's Already Done

| Layer | Component | Status |
|-------|-----------|--------|
| Database | `LicenseProductField` model + `attributes Json?` on LicenseProduct | Done |
| Repository | `findByLicenseProductIdWithDefinition()` | Done |
| Controller | `listEnrichedLicenseProductFieldsAction()` | Done |
| Client Hook | `useLicenseProductFields()` | Done |
| DI | Tokens + bindings registered | Done |

## What's Missing

### 1. Create/Edit Form Integration

Add custom fields section to the LicenseProduct create/edit forms, following the pattern from Asset custom fields.

**Pattern to follow**: `src/components/custom-fields/custom-fields-section.tsx` (Asset implementation)

**What to build**:
- `LicenseProductCustomFieldsSection` component
- Uses `useLicenseProductFields()` hook to load field definitions
- Renders `CustomFieldInput` for each field (reuse existing component)
- Integrates with the parent form's state

### 2. Detail Page Display

Add custom fields display to the LicenseProduct detail page.

**Pattern to follow**: `src/components/custom-fields/ci-custom-fields-display.tsx` (CI implementation)

**What to build**:
- Display section on LicenseProduct detail page showing field values
- Formatted display per field type (dates, numbers, booleans, etc.)

## Files to Create

| File | Description |
|------|-------------|
| `src/components/custom-fields/license-product-custom-fields-section.tsx` | Form section component |
| `src/components/custom-fields/license-product-custom-fields-display.tsx` | Detail page display |

## Files to Modify

| File | Change |
|------|--------|
| LicenseProduct create form | Add `LicenseProductCustomFieldsSection` |
| LicenseProduct edit form | Add `LicenseProductCustomFieldsSection` |
| LicenseProduct detail page | Add `LicenseProductCustomFieldsDisplay` |

## Verification

1. `npm run validate` passes
2. Create a LicenseProduct with custom field values
3. Edit and update custom field values
4. View custom fields on detail page
5. Verify field types render correctly (string, number, date, boolean, enum)
