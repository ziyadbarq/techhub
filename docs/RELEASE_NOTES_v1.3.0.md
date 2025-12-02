# Release Notes - Version 1.3.0

**Release Date**: December 2, 2024
**Status**: ✅ Production Ready
**Breaking Changes**: None

## Overview

Version 1.3.0 introduces automatic assignment synchronization between Microsoft Intune device links and ITAM asset assignments. This release bridges the gap between Intune device management and asset assignment tracking, providing dual assignment support with intelligent conflict detection.

## What's New

### 🎉 Major Feature

#### Automatic Intune-ITAM Assignment Synchronization

**Problem Solved**:

Previously, when IT staff linked an Intune device to both an asset and a person, the Asset Assignment system wasn't aware of this relationship. This created confusion:
- Assets showed as "Unassigned" despite having linked Intune devices with assigned users
- No visibility into which person was using an asset based on Intune data
- Manual effort required to maintain dual records (Intune links + ITAM assignments)
- Real-world scenario: IT helpdesk provisions devices under their account, but actual user is different - no way to track both

**Solution**:

Automatic assignment synchronization that creates AssetAssignment records whenever Intune devices are linked to both assets and persons, with support for dual assignments and conflict detection.

**Features**:

✅ **Automatic Sync**
- Auto-creates `AssetAssignment` when device is linked to both asset + person
- Auto-ends assignment when device is unlinked from either asset or person
- Records assignment source (`INTUNE_MANUAL` for manual links)
- Stores reference to originating Intune device for audit trail

✅ **Dual Assignment Support**
- Intune-sourced and manual assignments can coexist on same asset
- No overriding behavior - each source tracks independently
- Supports real-world scenarios where IT provisions devices under their account but actual user is different

✅ **Conflict Detection**
- Automatic flagging when Intune person ≠ Manual person
- Both assignments flagged with conflict status
- Conflict notes for documentation

✅ **Admin Conflict Resolution Page** (`/admin/assignment-conflicts`)
- Lists all conflicted assignments grouped by asset
- Shows side-by-side comparison of conflicting assignments
- Actions: Clear conflict or update conflict note
- Permission-gated with `asset-assignments:view` and `asset-assignments:update`

✅ **Enhanced Assignment UI**
- Asset detail **Assignments tab** redesigned with CountedTabs
- Separate tabs: **Manual** (User icon) and **Intune** (Laptop icon)
- Conflict badges with AlertTriangle icon in destructive color
- Conflict notes displayed prominently

**User Impact**:

**For IT Administrators:**
- No manual effort to keep assignments in sync with Intune
- Clear visibility into assignment discrepancies
- Centralized conflict resolution interface
- Audit trail linking assignments back to Intune devices

**For Asset Managers:**
- Accurate assignment tracking reflecting Intune reality
- Better understanding of asset utilization
- Separate visibility into Intune vs manual assignment sources

**For Help Desk:**
- Can provision devices under their account without losing track of actual user
- Quick identification of assignment conflicts

**Location**:
- Automatic sync: Background (triggered by link/unlink operations)
- Conflict resolution: `/admin/assignment-conflicts`
- Assignment viewing: Asset detail page → Assignments tab

---

## Technical Details

### New Components

**Use Cases** (3 new):
- `SyncAssetAssignmentFromIntuneDeviceUseCase` - Core sync orchestrator
- `ListConflictsUseCase` - Query conflicted assignments
- `UpdateConflictStatusUseCase` - Manage conflict flags

**Repository Methods** (4 new):
- `findBySourceReference()` - Find assignment by Intune device reference
- `findAllActiveByAssetGrouped()` - Get assignments grouped by source
- `findConflicts()` - Query assignments with conflicts
- `updateConflictStatus()` - Update conflict flags

**UI Components** (2 new):
- `AssetAssignmentsTab` - Redesigned with CountedTabs (Manual vs Intune)
- `AssignmentConflictsPageClient` - Admin conflict resolution interface

**Admin Page** (1 new):
- `/admin/assignment-conflicts` - Full conflict management interface

### Database Changes

**Schema Updates**:
- Added 5 fields to `AssetAssignment`: `source`, `sourceReferenceType`, `sourceReferenceId`, `hasConflict`, `conflictNote`
- Added 3 indexes for performance
- Migration: `20251201152454_add_service_url_support_fields`

**Entity Enhancements**:
- New methods: `isIntuneManaged()`, `isManual()`, `flagConflict()`, `clearConflict()`

### Assignment Sources

| Source | Description |
|--------|-------------|
| `MANUAL` | Created manually by user in ITAM |
| `INTUNE_SYNC` | Auto-created during daily Intune sync (future) |
| `INTUNE_MANUAL` | Created via manual Intune device linking |
| `IMPORT` | Created during data import |
| `SYSTEM` | System-generated |

### Integration Points

The sync logic is integrated into 4 Intune use cases:
1. `LinkIntuneDeviceToAssetUseCase` - Syncs after asset link
2. `LinkIntuneDeviceToPersonUseCase` - Syncs after person link
3. `UnlinkIntuneDeviceFromAssetUseCase` - Ends assignment after asset unlink
4. `UnlinkIntuneDeviceFromPersonUseCase` - Ends assignment after person unlink

### Data Flow

```
1. User manually links Intune device to asset and person
   ↓
2. Link use case updates device entity
   ↓
3. SyncAssetAssignmentFromIntuneDeviceUseCase automatically triggers:
   - Validates device has both asset + person links
   - Creates/updates assignment (source: INTUNE_MANUAL)
   - Checks for conflicts with manual assignments
   - Flags both assignments if persons differ
   ↓
4. Admin reviews conflicts at /admin/assignment-conflicts
   ↓
5. Admin clears or documents conflict
```

## Configuration

No additional configuration required. Feature is automatically enabled when:
- Intune integration is enabled (`INTUNE` feature flag)
- User has appropriate permissions

## Permissions

| Permission | Usage |
|------------|-------|
| `asset-assignments:view` | View assignments and conflicts |
| `asset-assignments:update` | Manage conflict status |
| `intune-devices:link` | Link/unlink devices (triggers sync) |

## Upgrade Notes

### For Existing Deployments

✅ **Safe to Deploy**:
- Non-breaking change
- Historical data unaffected
- Only new links going forward will have automatic sync

✅ **No Backfill Required**:
- Existing Intune device links remain as-is
- Assignments only created for new manual links

✅ **Migration Required**:
- Run Prisma migration to add new fields
- Indexes created automatically

### Database Migration

```bash
npx prisma migrate deploy
```

## Known Limitations

1. **Historical Data**: Existing Intune device links are not backfilled with assignments (intentional design choice)
2. **Daily Sync**: Automatic sync during scheduled Intune sync job is not yet implemented (currently only manual linking triggers sync)
3. **Bulk Operations**: No bulk conflict resolution actions yet

## Future Enhancements

- [ ] Automatic sync during daily Intune scheduled sync job
- [ ] Bulk conflict resolution actions
- [ ] Conflict resolution workflow with approval process
- [ ] Email notifications for new conflicts
- [ ] Conflict analytics dashboard

## Documentation Updates

- ✅ Updated [INTUNE_INTEGRATION.md](features/INTUNE_INTEGRATION.md) with assignment sync workflows
- ✅ Updated [CHANGELOG.md](../CHANGELOG.md) with detailed changes
- ✅ Updated [CLAUDE.md](../CLAUDE.md) with new use case counts
- ✅ Created new user guide: [Assets vs Configuration Items](/docs/user-guides/assets-vs-configuration-items) - comprehensive decision guide
- ✅ Updated [CMDB_GUIDE.md](features/CMDB_GUIDE.md) with reference to new user guide

## UI/UX Improvements

- ✅ Removed truncated Intune User ID badge from Related Items tab (cleaner display)
- ✅ Removed redundant "Serial Number" custom field from seed data (built-in Asset.serialNumber is sufficient)

## Validation

✅ All checks passing:
- TypeScript type-check: ✅ Passing (0 errors)
- ESLint: ✅ Passing (0 errors)
- Layer boundaries: ✅ No violations
- Test files: ✅ Updated with new fields

## Related Issues

This release addresses the data inconsistency issue where assets linked to Intune devices with assigned users showed as "Unassigned" in the ITAM system.

## Support

For questions or issues:
1. Check [INTUNE_INTEGRATION.md](features/INTUNE_INTEGRATION.md) documentation
2. Review conflict resolution workflow
3. Report issues via GitHub Issues

---

**Previous Release**: [v1.2.0](RELEASE_NOTES_v1.2.0.md)
**Next Release**: TBD
