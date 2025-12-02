# Changelog

All notable changes to the Barq Assets ITAM/CMDB system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Intune-ITAM Assignment Synchronization
- **Automatic Assignment Sync**: When Intune devices are manually linked to both an asset and a person, the system automatically creates/updates AssetAssignment records
  - Assignment source tracking: `MANUAL`, `INTUNE_SYNC`, `INTUNE_MANUAL`, `IMPORT`, `SYSTEM`
  - Source reference tracking (links back to IntuneDevice for audit trail)
  - Automatic cleanup: ends assignments when devices are unlinked

- **Dual Assignment Support**: Intune and manual assignments can coexist on the same asset
  - No overriding behavior - assignments tracked separately by source
  - Supports real-world scenario: IT provisions under their account, actual user is different

- **Conflict Detection and Resolution**
  - Automatic flagging when Intune person ≠ Manual person
  - Conflict notes for documentation
  - Admin conflict resolution page at `/admin/assignment-conflicts`
  - List all conflicted assignments grouped by asset
  - Clear/flag conflict actions with permission gates

- **Enhanced Assignment UI**
  - Redesigned AssetAssignmentsTab using CountedTabs component
  - Separate tabs for Manual vs Intune assignments
  - Conflict badges with AlertTriangle icon
  - Icons: User (manual), Laptop (Intune)
  - Conflict notes displayed in destructive background

#### Documentation
- **New User Guide**: "Assets vs Configuration Items" (`/docs/user-guides/assets-vs-configuration-items`)
  - Comprehensive decision guide for when to create Assets, CIs, or both
  - Interactive tabs for Physical/Cloud/Software scenarios
  - Real-world examples (load balancers, databases, laptops)
  - Quick reference table and best practices
  - Step-by-step linking instructions

### Changed
- Updated AssetAssignment entity with new methods: `isIntuneManaged()`, `isManual()`, `flagConflict()`, `clearConflict()`
- Added 5 new fields to AssetAssignment schema: `source`, `sourceReferenceType`, `sourceReferenceId`, `hasConflict`, `conflictNote`
- Added 3 new indexes for performance optimization
- Enhanced AssetAssignment repository with 4 new methods for conflict management
- Integrated sync logic into all 4 Intune linking/unlinking use cases
- Updated Intune Integration documentation with assignment sync workflows
- Removed truncated Intune User ID badge from Related Items tab (cleaner UI)
- Removed redundant "Serial Number" custom field from seed data (Asset.serialNumber built-in field is sufficient)

### Technical
- New use case: `SyncAssetAssignmentFromIntuneDeviceUseCase` with `@LogExecution` decorator
- New use cases: `ListConflictsUseCase`, `UpdateConflictStatusUseCase` (using unique DI tokens to avoid collision with reservation conflicts)
- New controller actions: `listConflictsAction()`, `updateConflictStatusAction()`
- New DTOs: `ListConflictsSchema`, `UpdateConflictStatusSchema`
- Updated presenter to include all new assignment fields
- All TypeScript type-check passing with zero errors

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
