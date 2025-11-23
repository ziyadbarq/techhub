# Security Patch Workflow V2

**Status**: Planned
**Priority**: High
**Complexity**: Medium (15-20 files)
**Estimated Effort**: 2-3 days
**Last Updated**: 2025-11-23

## Overview

Automated security patching workflow leveraging Service Management. Services are tracked for patches (30-day rule), technical owners approve via ServiceOwnership, and security team executes approved patches.

**Key Improvement from V1**: Service-centric (not asset-centric) using existing Service.lastPatchDate and ServiceOwnership.

---

## Business Requirements

1. **Auto-Detection**: System detects Services with lastPatchDate > 30 days
2. **Owner Notification**: Technical owners (via ServiceOwnership) approve patches
3. **Approval Options**:
   - Approve → Security team executes
   - Self-patch → Mark complete, update Service.lastPatchDate
   - Security override → Emergency patching without approval
4. **Execution**: Security team completes patches, updates Service.lastPatchDate
5. **Audit Trail**: Full compliance history

---

## Workflow

```
[DETECT] Services where lastPatchDate > 30 days
    ↓
[OWNERS] Get Technical owners via ServiceOwnership
    ↓
[ASSETS] Find assets via ServiceAsset (HOSTS/SUPPORTS relationships)
    ↓
[CREATE] MaintenanceRecord per asset, linked to service
    ↓
[NOTIFY] Technical owner dashboard widget
    ↓
    ├─ Approve → [APPROVED] → Security dashboard
    ├─ Self-patch → [SELF_PATCHED] → Update Service.lastPatchDate
    └─ Override → [SECURITY_OVERRIDE] → [IN_PROGRESS]
    ↓
[EXECUTE] Security patches → [IN_PROGRESS]
    ↓
[COMPLETE] Confirm completion → Update Service.lastPatchDate
```

---

## Database Schema Changes

### MaintenanceRecord Model Extensions

```prisma
model MaintenanceRecord {
  // ... existing fields

  // NEW: Service linkage
  serviceId String?
  service   Service? @relation(fields: [serviceId], references: [id])

  // NEW: Approval workflow
  ownerApprovalRequired Boolean @default(false)
  ownerApprovedAt       DateTime?
  ownerApprovedBy       String? // Person ID
  ownerApprovalNotes    String? @db.Text

  selfPatched           Boolean @default(false)
  selfPatchedBy         String?
  selfPatchedAt         DateTime?
  selfPatchNotes        String? @db.Text

  securityOverride      Boolean @default(false)
  securityOverrideBy    String?
  securityOverrideReason String? @db.Text

  @@index([serviceId])
  @@index([ownerApprovalRequired])
}
```

### Enums

```typescript
// Add to MaintenanceStatus
PENDING_OWNER_APPROVAL
APPROVED
SELF_PATCHED
SECURITY_OVERRIDE

// Add to MaintenanceType (if not exists)
SECURITY_PATCH
```

**Note**: No changes to Service or Asset models - use existing Service.lastPatchDate

---

## Key Components

### Use Cases (7 new)

1. **DetectOverdueServicesUseCase** - Query services where lastPatchDate > 30 days
2. **CreatePatchRequestUseCase** - Create MaintenanceRecord linked to service
3. **ApprovePatchUseCase** - Technical owner approves
4. **SelfPatchUseCase** - Owner marks self-patched, updates Service.lastPatchDate
5. **CompletePatchUseCase** - Security completes, updates Service.lastPatchDate
6. **GetPendingPatchesForOwnerUseCase** - Owner dashboard query via ServiceOwnership
7. **GetApprovedPatchesUseCase** - Security dashboard query

### Background Job

**Schedule**: Daily at 2 AM (Asia/Riyadh)

```typescript
// Pseudo-code
const overdueServices = await serviceRepo.find({
  lastPatchDate: { lt: thirtyDaysAgo },
  currentStatus: ["PRODUCTION", "UAT", "DR"],
  serviceType: ["APPLICATION", "DATABASE", "API", "SERVER"]
});

for (const service of overdueServices) {
  const owners = await serviceOwnershipRepo.findTechnicalOwners(service.id);
  const assets = await serviceAssetRepo.findByService(service.id, ["HOSTS", "SUPPORTS"]);

  for (const asset of assets) {
    createPatchRequest(asset.id, service.id, owners);
  }
}
```

### UI Components

1. **PatchRequestsWidget** - Owner dashboard (shows services pending approval)
2. **PatchApprovalDialog** - Approve or self-patch
3. **SecurityPatchQueue** - Security dashboard (approved patches)
4. **CompletePatchDialog** - Mark patch complete

### Permissions

- `SERVICES_MANAGE` - Technical owners approve patches
- `MAINTENANCE_MANAGE` - Security team executes patches

---

## Implementation Phases

### Phase 1: Schema (0.5 days)
- Add fields to MaintenanceRecord
- Update enums
- Migrate database

### Phase 2: Use Cases (1 day)
- Create 7 service-centric use cases
- Update barrel exports

### Phase 3: Background Job (0.5 days)
- Service detection job (2 AM daily)
- Overdue approval notification (9 AM daily)

### Phase 4: Controllers (0.5 days)
- Approval/self-patch/complete actions
- Dashboard queries

### Phase 5: UI (1 day)
- Owner dashboard widget
- Security dashboard page
- Approval dialogs

### Phase 6: Testing (0.5 days)
- End-to-end workflow
- Background job execution

---

## Testing Checklist

- [ ] Service without lastPatchDate → detected as overdue
- [ ] Background job creates patch requests
- [ ] Technical owner sees pending patches in dashboard
- [ ] Owner approves → appears on security dashboard
- [ ] Security completes → Service.lastPatchDate updated
- [ ] Owner self-patches → Service.lastPatchDate updated
- [ ] Security override works without approval
- [ ] Multiple technical owners per service
- [ ] Permissions enforced

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Service-centric detection | Service.lastPatchDate already exists, patches apply to services not hardware |
| Use ServiceOwnership | Existing table with technical owners, supports multiple approvers |
| Add serviceId to MaintenanceRecord | Direct link cleaner than ServiceAsset indirection |
| No Asset.lastPatchDate | Avoid duplication - Service owns patch date |
| Background job at 2 AM | Off-hours detection, Riyadh timezone |

---

## Integration Points

- **Service Management**: Uses Service.lastPatchDate, ServiceOwnership, ServiceAsset
- **Maintenance System**: Extends MaintenanceRecord with approval fields
- **RBAC**: Leverages existing SERVICES_MANAGE, MAINTENANCE_MANAGE permissions
- **Audit Logs**: Full trail for SAMA compliance

---

## Future Enhancements

- Patch scheduling (maintenance windows)
- Vulnerability scanner integration (Qualys, Nessus)
- Auto-patching via Ansible/Puppet
- SLA tracking (% patched within 30 days)
- Escalation (auto-assign to security after 7 days)
- Impact analysis via CMDB relationships

---

**Related Docs**:
- `docs/features/SERVICE_MANAGEMENT.md`
- `docs/features/MAINTENANCE_SYSTEM.md`
- `docs/guides/RBAC_DEVELOPER_GUIDE.md`
