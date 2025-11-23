# Security Patch Workflow V2

**Status**: Planned
**Priority**: High (SAMA Compliance)
**Complexity**: Medium (15-20 files)
**Estimated Effort**: 2-3 days
**Last Updated**: 2025-11-23

## Overview

Automated security patching workflow leveraging Service Management. Services are tracked for patches (30-day rule), technical owners approve via ServiceOwnership, and security team executes approved patches.

**Key Improvement from V1**: Service-centric (not asset-centric) using existing Service.lastPatchDate and ServiceOwnership.

### Compliance Context

- **SAMA Requirements**: Financial institutions must maintain security patch compliance
- **30-Day Standard**: Industry best practice for non-critical patches
- **Critical Patches**: Security override allows immediate patching (0-day vulnerabilities)
- **Audit Trail**: Full history for regulatory inspections and internal audits

### Success Metrics

- **Patch Compliance Rate**: Target >95% of production services patched within 30 days
- **Mean Time to Patch (MTTP)**: Average days from detection to completion
- **Self-Patch Rate**: % of patches applied by technical owners vs. security team
- **Override Rate**: % of emergency patches (should be <5%)

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

## Workflow States

```
PENDING_OWNER_APPROVAL → APPROVED → IN_PROGRESS → COMPLETED
                      ↘ SELF_PATCHED
                      ↘ SECURITY_OVERRIDE → IN_PROGRESS → COMPLETED
```

## Process Flow

```
[DETECT] Background job (2 AM daily)
  Query: Service.lastPatchDate > 30 days AND currentStatus IN [PRODUCTION, UAT, DR]
    ↓
[ENRICH] For each overdue service:
  - Get technical owners (ServiceOwnership WHERE ownershipType = TECHNICAL)
  - Get hosting assets (ServiceAsset WHERE relationship IN [HOSTS, SUPPORTS])
    ↓
[CREATE] MaintenanceRecord per asset
  - Link to service (serviceId)
  - Set ownerApprovalRequired = true
  - Status = PENDING_OWNER_APPROVAL
  - Priority = HIGH (if service.criticality = CRITICAL)
    ↓
[NOTIFY] Technical owner dashboard widget
  "You have X services pending patch approval"
    ↓
[OWNER DECISION]
    ├─ APPROVE → Status = APPROVED
    │   ↓
    │   Security dashboard shows approved patches
    │   ↓
    │   Security team executes → Status = IN_PROGRESS
    │   ↓
    │   Security confirms → Status = COMPLETED, Update Service.lastPatchDate
    │
    ├─ SELF-PATCH → Status = SELF_PATCHED
    │   ↓
    │   Update Service.lastPatchDate immediately
    │
    └─ IGNORE (>7 days) → Escalation notification
        ↓
        Security override option available
```

---

## Database Schema Changes

### Service Model Extension (Optional Field)

```prisma
model Service {
  // ... existing fields

  // NEW: Patch tracking opt-out
  requiresPatchTracking Boolean @default(true) // Set false for static/SaaS services

  @@index([requiresPatchTracking])
}
```

**Services that should set `requiresPatchTracking = false`**:
- Static content (landing pages, documentation sites)
- Third-party SaaS (external services we don't control)
- Pure infrastructure (switches, routers with vendor-managed firmware)
- Retired services (status = RETIRED)
- Read-only databases (replicas, archives)

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

### Background Jobs

#### 1. Patch Detection Job
**Schedule**: Daily at 2 AM (Asia/Riyadh)
**Purpose**: Create patch requests for overdue services

```typescript
// Pseudo-code
const thirtyDaysAgo = subDays(new Date(), 30);

const overdueServices = await serviceRepo.find({
  OR: [
    { lastPatchDate: null }, // Never patched
    { lastPatchDate: { lt: thirtyDaysAgo } }
  ],
  currentStatus: ["PRODUCTION", "UAT", "DR"],
  serviceType: ["APPLICATION", "DATABASE", "API", "SERVER", "MIDDLEWARE"],
  requiresPatchTracking: true, // NEW: Skip static/SaaS services
  // Optional: Prioritize essential services first
  // isEssentialService: true
});

for (const service of overdueServices) {
  // Skip if already has pending patch request
  const hasPending = await maintenanceRepo.exists({
    serviceId: service.id,
    status: "PENDING_OWNER_APPROVAL"
  });
  if (hasPending) continue;

  const technicalOwners = await serviceOwnershipRepo.find({
    serviceId: service.id,
    ownershipType: "TECHNICAL",
    isPrimary: true
  });

  // Skip if no technical owner assigned
  if (!technicalOwners.length) {
    logger.warn(`Service ${service.name} has no technical owner`);
    continue;
  }

  const assets = await serviceAssetRepo.findByService(service.id, {
    relationships: ["HOSTS", "SUPPORTS"]
  });

  // Skip if service has no assets (might be SaaS or misconfigured)
  if (!assets.length) {
    logger.warn(`Service ${service.name} has no linked assets`);
    continue;
  }

  for (const asset of assets) {
    await createPatchRequest({
      assetId: asset.id,
      serviceId: service.id,
      ownerId: technicalOwners[0]?.personId,
      priority: service.criticality === "CRITICAL" ? "HIGH" : "MEDIUM"
    });
  }
}
```

#### 2. Overdue Approval Notification Job
**Schedule**: Daily at 9 AM (Asia/Riyadh)
**Purpose**: Escalate patches pending approval >7 days

```typescript
const sevenDaysAgo = subDays(new Date(), 7);

const overdueApprovals = await maintenanceRepo.find({
  status: "PENDING_OWNER_APPROVAL",
  createdAt: { lt: sevenDaysAgo }
});

// Notify security team for override consideration
sendEscalationEmail(overdueApprovals);
```

### UI Components

#### Owner Dashboard (`/dashboard`)
1. **PatchRequestsWidget** - Card showing pending patch approvals
   - Badge count of pending items
   - List: Service name, last patch date, days overdue
   - Actions: Approve, Self-patch buttons

#### Security Dashboard (`/security-patches` - NEW PAGE)
2. **SecurityPatchQueue** - Table of approved patches
   - Columns: Service, Asset, Owner, Approved Date, Priority
   - Filter by: Service type, criticality, approval date
   - Bulk actions: Start patching, Mark complete

3. **PatchMetricsDashboard** - Compliance metrics
   - Patch compliance rate gauge
   - Mean time to patch trend chart
   - Services by patch status (pie chart)
   - Overdue services list (>30 days)

#### Dialogs
4. **PatchApprovalDialog** - Owner approval workflow
   - Service details, asset list, criticality badge
   - Notes field (optional)
   - Actions: Approve for Security Team | I Already Patched This

5. **CompletePatchDialog** - Security completion form
   - Patch notes (KB numbers, CVEs, changes)
   - Completion date picker
   - Confirm button

### Permissions

| Permission | Who | What |
|------------|-----|------|
| `SERVICES_MANAGE` | Technical Owners | Approve/self-patch services they own |
| `MAINTENANCE_MANAGE` | Security Team | Execute patches, override approvals |
| `SERVICES_VIEW` | All authenticated | View patch status (read-only) |

---

## Implementation Phases

### Phase 1: Schema (0.5 days)
- Add `requiresPatchTracking` boolean to Service model (default true)
- Add approval workflow fields to MaintenanceRecord
- Update MaintenanceStatus/Type enums
- Migrate database
- Update seed data (set requiresPatchTracking=false for static/SaaS services)

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
- [ ] Service with requiresPatchTracking=false → NOT detected
- [ ] Background job creates patch requests
- [ ] Service without technical owner → skipped with warning
- [ ] Service without linked assets → skipped with warning
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
| requiresPatchTracking flag | Opt-out for static sites, SaaS, non-patchable services |
| Skip services without owners/assets | Prevents false positives, logs warnings for review |

---

## Architecture Integration

### Data Flow
```
Service Management (Source)
  ↓ lastPatchDate, ServiceOwnership, ServiceAsset
Background Job (Detection)
  ↓ Create MaintenanceRecord
Maintenance System (Workflow)
  ↓ Approval states
RBAC (Authorization)
  ↓ Permission checks
Audit Logs (Compliance)
  ↓ Full trail
```

### Dependencies

**Existing Features** (Must exist):
- ✅ Service model with lastPatchDate
- ✅ ServiceOwnership table
- ✅ ServiceAsset table
- ✅ MaintenanceRecord model
- ✅ RBAC permissions (SERVICES_MANAGE, MAINTENANCE_MANAGE)
- ✅ Person entity (for owners)
- ✅ Asset entity (for physical resources)

**New Components** (To be built):
- 🆕 MaintenanceRecord schema extensions (approval fields)
- 🆕 7 new use cases
- 🆕 2 background jobs
- 🆕 4 UI components
- 🆕 Notification system (email/in-app)

### Integration Points

| System | Integration Type | Details |
|--------|------------------|---------|
| **Service Management** | Data Source | Query Service.lastPatchDate, ServiceOwnership, ServiceAsset |
| **Maintenance System** | Workflow Extension | Add approval states to MaintenanceRecord |
| **RBAC** | Authorization | Use existing SERVICES_MANAGE, MAINTENANCE_MANAGE |
| **Audit Logs** | Compliance Trail | Log all approval/execution events |
| **Notifications** | Alerts | Email/dashboard alerts for owners and security |
| **CMDB** | Future | Impact analysis for patching (which CIs affected) |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Owners ignore patch requests | High | Escalation job + security override |
| False positives (already patched) | Medium | Self-patch option, manual lastPatchDate update |
| Service-Asset linking incomplete | Medium | ServiceAsset seeding, validation in detection job |
| Email notification failures | Low | Dashboard widget as primary notification |
| Background job performance | Low | Pagination, batch processing |

## Rollout Strategy

### Phase 1: Shadow Mode (Week 1)
- Deploy with notification disabled
- Run detection job, log results
- Validate detection accuracy
- Fix ServiceAsset linkages if needed

### Phase 2: Pilot (Week 2)
- Enable for non-essential services only
- Limit to 10-15 services
- Gather owner feedback
- Refine UI/notifications

### Phase 3: Full Rollout (Week 3+)
- Enable for all production services
- Monitor compliance metrics
- Adjust thresholds if needed (30-day rule)
- Document runbooks for security team

## Future Enhancements

### Near-term (3-6 months)
- Patch scheduling (maintenance windows)
- Email notifications (SMTP integration)
- Escalation automation (auto-override after 14 days)
- SLA tracking dashboard (% patched within 30 days)

### Long-term (6-12 months)
- Vulnerability scanner integration (Qualys, Nessus, OpenVAS)
- Auto-patching via Ansible/Puppet playbooks
- Impact analysis via CMDB relationships (which CIs affected)
- Patch rollback tracking
- CVE database integration
- Patch testing workflow (UAT → Production)

---

**Related Docs**:
- `docs/features/SERVICE_MANAGEMENT.md`
- `docs/features/MAINTENANCE_SYSTEM.md`
- `docs/guides/RBAC_DEVELOPER_GUIDE.md`
