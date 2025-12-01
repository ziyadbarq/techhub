# Microsoft Intune/MDM Integration

**Status**: ✅ Production Ready
**Version**: 1.2.0
**Last Updated**: December 1, 2024
**Feature Flag**: `INTUNE`

## Overview

The Intune Integration module enables synchronization of Microsoft Intune managed devices with the ITAM system. This provides comprehensive device visibility, compliance monitoring, and cross-referencing between MDM-managed devices and ITAM assets.

### Key Benefits

- **Device Reconciliation**: Cross-check devices in Intune against ITAM assets
- **Compliance Monitoring**: Track device compliance state for SAMA governance
- **Gap Analysis**: Identify coverage gaps (devices in Intune not in ITAM and vice versa)
- **Automated Linking**: Auto-link devices to assets via serial number matching
- **User Association**: Auto-link devices to persons via Azure AD user ID
- **Asset Creation**: Create single or bulk ITAM assets directly from Intune devices

## Architecture

### Components

```
Intune Integration Module
├── Domain
│   ├── IntuneDevice.entity.ts           # Device entity with compliance tracking
│   └── IntuneComplianceHistory.entity.ts # Historical compliance records
├── Infrastructure
│   ├── MSGraphService                    # Microsoft Graph API client
│   ├── PrismaIntuneDeviceRepository      # Device persistence
│   └── PrismaIntuneComplianceHistoryRepository
├── Use Cases (11 total)
│   ├── SyncDevicesFromIntuneUseCase      # Main sync orchestrator
│   ├── GetIntuneDeviceUseCase            # Single device lookup
│   ├── ListIntuneDevicesUseCase          # Paginated list with filters
│   ├── GetIntuneComplianceStatsUseCase   # Dashboard statistics
│   ├── CreateAssetFromIntuneDeviceUseCase # Create single asset from device
│   ├── BulkCreateAssetsFromIntuneUseCase # Create multiple assets from devices
│   ├── LinkIntuneDeviceToAssetUseCase    # Manual asset linking
│   ├── UnlinkIntuneDeviceFromAssetUseCase
│   ├── LinkIntuneDeviceToPersonUseCase   # Manual person linking
│   └── UnlinkIntuneDeviceFromPersonUseCase
├── Controllers
│   └── intune-device.controller.ts       # Server actions
├── UI Components
│   ├── /intune/devices                   # Device list page
│   ├── /intune/devices/[id]              # Device detail page
│   ├── IntuneDevicesTable                # Data table with row selection
│   ├── IntuneDeviceDetailClient          # Detail view with tabs, stats & ITAM Links Management
│   ├── CreateAssetFromDeviceWizard       # Single asset creation wizard
│   ├── BulkCreateAssetsWizard            # Bulk asset creation wizard
│   ├── ComplianceHistoryTab              # Timeline of compliance changes
│   └── RelatedItemsTab                   # Linked asset/person enriched details
└── Background Jobs
    └── handleIntuneDeviceSync            # BullMQ scheduled job (daily 3 AM UTC)
```

### Data Flow

```
1. Scheduled job triggers (or manual sync)
   ↓
2. MSGraphService fetches all managed devices from Intune
   ↓
3. SyncDevicesFromIntuneUseCase processes each device:
   - Creates new devices or updates existing
   - Auto-links to Assets by serial number match
   - Auto-links to Persons by Azure AD user ID
   - Records compliance history if state changed
   - Deactivates devices no longer in Intune
   ↓
4. UI displays synced data with compliance badges
```

## Configuration

### Environment Variables

```bash
# Required: Microsoft Graph API credentials
MS_GRAPH_TENANT_ID=your-azure-tenant-id
MS_GRAPH_CLIENT_ID=your-app-registration-client-id
MS_GRAPH_CLIENT_SECRET=your-client-secret

# Required: Feature flag must be enabled
# Enable via Admin → Feature Flags → INTUNE
```

### Azure AD App Registration

1. Create an App Registration in Azure AD
2. Add the following API permissions:
   - `DeviceManagementManagedDevices.Read.All` (Application)
3. Grant admin consent for the permissions
4. Create a client secret and save the value

## Permissions

| Permission Key | Description |
|----------------|-------------|
| `intune-devices:view` | View managed devices list and details |
| `intune-devices:sync` | Trigger manual sync from Intune |
| `intune-devices:link` | Link/unlink devices to assets and persons |
| `intune-devices:manage` | Full device management (includes all above) |
| `intune-compliance:view` | View compliance statistics and reports |

## User Workflows

### Viewing Intune Devices

1. Enable the `INTUNE` feature flag (Admin → Feature Flags)
2. Assign `intune-devices:view` permission to appropriate roles
3. Navigate to **Intune → Managed Devices**
4. View device list with compliance status, ownership, and linked assets

### Manual Sync

1. Navigate to **Intune → Managed Devices**
2. Click **"Sync Now"** button (requires `intune-devices:sync`)
3. Wait for sync to complete
4. View toast notification with sync results

### Linking Devices to Assets

**Automatic Linking** occurs during sync when:
- Device serial number matches an Asset serial number
- Link method is recorded as `auto_serial`

**Manual Linking** (✅ Implemented):
1. Navigate to device detail page
2. Scroll to **ITAM Links Management** card in Overview tab
3. Click **"Link Existing"** button under Asset Link
4. Search and select target asset from the dialog
5. Confirm linking
6. Link method is recorded as `manual`

**Unlinking Assets**:
1. Navigate to device detail page
2. Scroll to **ITAM Links Management** card
3. Click **"Unlink"** button under Asset Link
4. Confirm the action
5. Device is immediately unlinked from the asset

### Creating Assets from Devices

**Single Asset Creation**:
1. Navigate to a device detail page
2. Click **"Create Asset"** button in the header
3. Wizard auto-populates device data (name, serial, manufacturer, model)
4. Select category, stock location, and lifecycle state
5. Review and create the asset
6. Asset is automatically linked to the Intune device

**Bulk Asset Creation**:
1. Navigate to **Intune → Managed Devices**
2. Select multiple devices using checkboxes
3. Click **"Create Assets"** in the bulk action toolbar
4. Configure: Select category, stock location, lifecycle state, and asset tag prefix
5. View eligibility summary (devices without serial/already linked are skipped)
6. Click **"Create Assets"** to process all eligible devices
7. Review results: success count, failed devices with error details

### Linking Devices to Persons

**Automatic Linking** occurs during sync when:
- Device's assigned Intune user ID matches a Person's Azure AD user ID
- Link method is recorded as `auto_azuread`

**Manual Linking** (✅ Implemented):
1. Navigate to device detail page
2. Scroll to **ITAM Links Management** card in Overview tab
3. Click **"Link Person"** button under Person Link
4. Search and select target person from the dialog (active persons only)
5. Confirm linking
6. Link method is recorded as `manual`

**Unlinking Persons**:
1. Navigate to device detail page
2. Scroll to **ITAM Links Management** card
3. Click **"Unlink"** button under Person Link
4. Confirm the action
5. Device is immediately unlinked from the person

### Viewing Device Details

1. Click on a device name in the list
2. View **Quick Stats** cards at the top:
   - Compliance status (Compliant/Non-Compliant with color indicators)
   - Days since enrollment
   - Days since last sync
   - ITAM link status (Fully Linked/Asset Linked/Person Linked/Not Linked)
3. View **ITAM Links Management** card in Overview tab:
   - **Asset Link Section**: Shows linked asset tag and method, or "No asset linked"
     - When linked: **Unlink** button (requires `intune-devices:link` permission)
     - When not linked: **Link Existing** and **Create New Asset** buttons
   - **Person Link Section**: Shows linked person name and method, or "No person linked"
     - When linked: **Unlink** button
     - When not linked: **Link Person** button
   - Permission notice displayed if user lacks linking permissions
4. View four tabs:
   - **Overview**: Device info, user assignment, timestamps, identifiers, ITAM Links Management
   - **Security**: Compliance state, ownership, management state, encryption, supervision, jailbreak status
   - **Compliance History**: Timeline of compliance state changes with policy details (filterable by time period)
   - **Related Items**: Full details of linked asset and person with enriched information

### Asset Detail Integration

The Asset detail page includes an **Intune tab** (permission-gated) that displays all Intune devices linked to that asset:

- **Component**: `src/components/assets/asset-intune-tab.tsx`
- **Controller Action**: `getIntuneDevicesByAssetAction(assetId)`
- **Permission Required**: `INTUNE_DEVICES_VIEW`
- Shows: Device name (linked to device detail), OS version, compliance state badge, ownership type, management state, serial number
- Compliance colors: COMPLIANT (default), NON_COMPLIANT (destructive), IN_GRACE_PERIOD (secondary), UNKNOWN (outline)

## Data Model

### IntuneDevice Entity

| Field | Type | Description |
|-------|------|-------------|
| `intuneDeviceId` | string | Unique ID from Intune |
| `azureAdDeviceId` | string? | Azure AD device ID |
| `deviceName` | string | Display name |
| `serialNumber` | string? | Hardware serial number |
| `manufacturer` | string? | Device manufacturer |
| `model` | string? | Device model |
| `operatingSystem` | string? | OS name (Windows, iOS, Android) |
| `osVersion` | string? | OS version |
| `ownershipType` | enum | CORPORATE, PERSONAL, UNKNOWN |
| `complianceState` | enum | COMPLIANT, NON_COMPLIANT, etc. |
| `managementState` | enum | MANAGED, RETIRE_PENDING, etc. |
| `isEncrypted` | boolean | Device encryption status |
| `isSupervised` | boolean | Supervision status (iOS) |
| `isJailBroken` | boolean | Jailbreak/root detection |
| `linkedAssetId` | string? | Linked ITAM asset ID |
| `linkedPersonId` | string? | Linked ITAM person ID |
| `assetLinkMethod` | enum | auto_serial, manual |
| `personLinkMethod` | enum | auto_azuread, manual |

### Compliance States

| State | Badge Color | Description |
|-------|-------------|-------------|
| COMPLIANT | Default (Primary) | Meets all compliance policies |
| NON_COMPLIANT | Destructive (Red) | Fails one or more policies |
| IN_GRACE_PERIOD | Secondary | Non-compliant but within grace period |
| CONFLICT | Outline | Conflicting policy assignments |
| ERROR | Destructive (Red) | Compliance check error |
| CONFIG_MANAGER | Secondary | Managed by Config Manager |
| UNKNOWN | Outline | Compliance state not determined |

## Background Jobs

### Scheduled Sync Job

- **Schedule**: Daily at 3:00 AM UTC
- **Queue**: `MAINTENANCE`
- **Job Name**: `intune-device-sync`

**Default Options**:
```typescript
{
  autoLinkToAssets: true,
  autoLinkToPersons: true,
  trackComplianceHistory: true,
  deactivateMissing: true,
  dryRun: false
}
```

### Starting the Worker

```bash
# Development
npm run worker:dev

# Production
npm run worker:start
```

## API Reference

### Server Actions

```typescript
// List devices with filters and pagination
listIntuneDevicesAction(
  filters?: IntuneDeviceFiltersDTO,
  pagination?: { skip?: number; take?: number }
): Promise<ActionResponse<{ devices: IntuneDeviceDTO[]; total: number; hasMore: boolean }>>

// Get single device by ID
getIntuneDeviceAction(id: string): Promise<ActionResponse<IntuneDeviceDTO>>

// Get compliance statistics
getIntuneComplianceStatsAction(): Promise<ActionResponse<IntuneComplianceStatsDTO>>

// Trigger manual sync
triggerIntuneSyncAction(options?: TriggerIntuneSyncDTO): Promise<ActionResponse<IntuneSyncResultDTO>>

// Link device to asset
linkDeviceToAssetAction(data: LinkDeviceToAssetDTO): Promise<ActionResponse<IntuneDeviceDTO>>

// Unlink device from asset
unlinkDeviceFromAssetAction(data: UnlinkDeviceDTO): Promise<ActionResponse<IntuneDeviceDTO>>

// Link device to person
linkDeviceToPersonAction(data: LinkDeviceToPersonDTO): Promise<ActionResponse<IntuneDeviceDTO>>

// Unlink device from person
unlinkDeviceFromPersonAction(data: UnlinkDeviceDTO): Promise<ActionResponse<IntuneDeviceDTO>>

// Create asset from single Intune device
createAssetFromIntuneDeviceAction(data: CreateAssetFromIntuneDeviceDTO): Promise<ActionResponse<CreateAssetFromIntuneDeviceOutput>>

// Bulk create assets from multiple Intune devices
bulkCreateAssetsFromIntuneAction(data: BulkCreateAssetsFromIntuneDTO): Promise<ActionResponse<BulkCreateAssetsFromIntuneOutput>>
```

### Filter Options

```typescript
interface IntuneDeviceFiltersDTO {
  search?: string;              // Search device name, serial, user
  complianceState?: string;     // COMPLIANT, NON_COMPLIANT, etc.
  ownershipType?: string;       // CORPORATE, PERSONAL, UNKNOWN
  managementState?: string;     // MANAGED, RETIRE_PENDING, etc.
  operatingSystem?: string;     // Windows, iOS, Android
  isActive?: boolean;           // Active/inactive devices
  linkedToAsset?: boolean;      // Has linked asset
  linkedToPerson?: boolean;     // Has linked person
}
```

## Troubleshooting

### Common Issues

**Sync fails with authentication error**
- Verify `MS_GRAPH_*` environment variables are set correctly
- Check that the app registration has correct permissions
- Ensure admin consent has been granted

**Devices not appearing after sync**
- Verify the `INTUNE` feature flag is enabled
- Check user has `intune-devices:view` permission
- Check worker logs for sync errors

**Auto-linking not working**
- For assets: Ensure Asset has matching serial number
- For persons: Ensure Person has matching Azure AD user ID (from MS Graph sync)

### Viewing Logs

```bash
# Worker logs
npm run worker:dev

# Look for log entries with scope "IntuneSync" or "MSGraphService"
```

## Recent Updates (v1.2.0 - December 1, 2024)

### ✅ Completed Features

- **ITAM Links Management Card**: Comprehensive UI for managing device-asset-person links
  - Unlink Asset/Person buttons with loading states
  - Link Existing Asset/Person buttons with search dialogs
  - Create New Asset button (conditional on permissions and serial number presence)
  - Permission-aware button states
  - Clear status indicators for link methods (auto vs manual)

- **Enhanced Device Detail Page**:
  - ITAM Links Management card integrated in Overview tab
  - All link/unlink operations functional with proper error handling
  - Real-time device refresh after link/unlink operations
  - Loading states for all async operations

- **Compliance History Tab**: Fully implemented timeline view
  - Filterable by time period (7, 14, 30, 60, 90 days)
  - Visual timeline with color-coded state changes
  - Policy information display
  - Critical/recovery state highlighting

- **Related Items Tab**: Enhanced enriched data display
  - Linked asset details with category, vendor, model, location
  - Linked person details with job title, department, email
  - Intune user assignment comparison
  - Empty state guidance

## Future Enhancements

- [ ] Compliance dashboard with charts and trends
- [ ] Compliance policy configuration
- [ ] Device actions (wipe, retire, sync individual devices)
- [ ] Export to CSV/Excel
- [ ] Email alerts for compliance changes
- [ ] Bulk link/unlink operations
- [ ] Device assignment history tracking

## Related Documentation

- [Feature Flags](./FEATURE_FLAGS.md) - Enable/disable Intune module
- [User Provisioning](./USER_PROVISIONING.md) - MS Graph user sync
- [Layer 3 Overview](./LAYER3_OVERVIEW.md) - Advanced ITAM modules
