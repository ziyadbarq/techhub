# Changelog

All notable changes to the Barq Assets ITAM/CMDB system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-12-01

### Added

#### Intune Integration Enhancements
- **ITAM Links Management Card** in device detail Overview tab
  - Visual UI for managing device-to-asset and device-to-person links
  - Unlink buttons for both Asset and Person with loading states
  - Link Existing buttons with search dialogs
  - Create New Asset button (conditional on permissions and serial number)
  - Permission-aware button states and notices
  - Clear status indicators showing link methods (auto_serial, auto_azuread, manual)

- **Enhanced Device Detail Page**
  - All link/unlink operations fully functional
  - Real-time device refresh after link/unlink operations
  - Proper error handling and user feedback
  - Loading states for all async operations

- **Compliance History Tab** - fully implemented timeline view
  - Filterable by time period (7, 14, 30, 60, 90 days)
  - Visual timeline with color-coded state changes
  - Policy information display
  - Critical/recovery state highlighting

- **Related Items Tab** - enhanced enriched data display
  - Linked asset details (category, vendor, model, location)
  - Linked person details (job title, department, email)
  - Intune user assignment comparison
  - Empty state guidance

#### Service Management Enhancements
- **Service Ownership Card** in service detail Overview tab
  - Primary Business Owner display with blue badge
  - Primary Technical Owner display with purple badge
  - Additional Owners list with role badges
  - Contact information (name and email) for each owner
  - Empty state message when no owners assigned
  - Improves governance and incident response by making ownership immediately visible

- **Enhanced Service Domain Model**
  - Added `url` field for primary service URL (web interface, API endpoint, etc.)
  - Added `supportContact` field for general support contact information
  - Added `supportHours` field for support availability (e.g., "24/7", "Business Hours")
  - Full stack implementation: schema, migration, DTO, presenter, entity, UI
  - Displayed in service detail Overview tab

### Fixed
- Fixed TypeScript errors in Configuration Item form (union type handling)
- Fixed missing `tabs` configuration in Intune Device Detail component
- Fixed incorrect property references in Intune Device Detail (`deviceId` → `intuneDeviceId`, `managementAgent` → `ownershipType`)
- Fixed duplicate `linksCount` variable declaration
- Fixed missing properties in Service Detail View (removed non-existent DTO fields)
- Removed unused imports and variables across multiple components
- Fixed function hoisting issues in Intune Device Detail

### Changed
- Updated Intune Integration documentation to v1.2.0
- Updated Service Management documentation to v1.2.0
- Improved error handling in link/unlink operations
- Enhanced UI feedback for all async operations

### Documentation
- Updated [INTUNE_INTEGRATION.md](docs/features/INTUNE_INTEGRATION.md) with completed features
- Updated [SERVICE_MANAGEMENT.md](docs/features/SERVICE_MANAGEMENT.md) with ownership display
- Created CHANGELOG.md for version tracking

### Developer Experience
- All validation passes (TypeScript type-check + ESLint) with zero errors
- Improved code maintainability with proper type assertions
- Better state management patterns

## [1.1.0] - Previous versions

See git history for previous changes prior to CHANGELOG introduction.

[Unreleased]: https://github.com/your-org/barq-assets/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/your-org/barq-assets/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/your-org/barq-assets/releases/tag/v1.1.0
