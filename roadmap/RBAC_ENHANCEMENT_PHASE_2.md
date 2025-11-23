# RBAC Admin Enhancement - Phase 2

**Status**: Partially Complete
**Priority**: Medium-High
**Complexity**: Medium-Large
**Estimated Effort**: 40-60 hours (15 hours completed, 25-45 hours remaining)
**Layer**: Layer 1 (Foundation) - RBAC & Admin
**Completed**: 2025-11-22 (Features 2.1, 6, 7)

---

## Completion Status

### ✅ Completed Features (2025-11-22)

**Feature 2.1: Bulk Permission Assignment** - ✅ Complete
- Bulk mode toggle in PermissionsManager
- Multi-select permissions for bulk add/remove
- Bulk actions bar with "Add Selected", "Remove Selected", "Clear" buttons
- Visual feedback with highlighted selections
- ~50% time savings for bulk permission operations

**Feature 6: Permission Dependencies** - ✅ Complete
- Permission dependencies configuration (`src/lib/rbac/permission-dependencies.ts`)
- 153+ permissions mapped with dependency rules
- Validation with `validatePermissionDependencies()` function
- UI warnings in PermissionsManager showing missing dependencies
- Auto-fix button to add required permissions
- Tooltips on individual permissions showing requirements

**Feature 7: Role Conflict Detection** - ✅ Complete
- Segregation of duties enforcement (`src/lib/rbac/role-conflicts.ts`)
- 3 severity levels: warning, error, critical
- `detectRoleConflicts()` and `validateRoleAddition()` logic
- RoleAssignment component shows conflicts with severity badges
- Critical conflicts block assignment, warnings allow override
- Existing conflicts highlighted in user role list

### 🔄 Remaining Features

1. **Enhanced Audit Log UI** - Comprehensive filtering, search, change diffs, and export capabilities (12-16 hours)
2. **Bulk User Role Assignment** - Bulk assign roles to multiple users (6-8 hours)
3. **Advanced User Management** - Enhanced search, filtering, and inline editing (8-10 hours)
4. **Role Analytics** - Usage statistics, orphaned roles, unused permissions (10-12 hours)
5. **Time-Based Role Expiration** - UI and background jobs for automatic role revocation (6-8 hours)
8. **Role Hierarchy/Inheritance** - Parent-child relationships for permission inheritance (12-16 hours)

---

## Overview

Phase 2 builds on Phase 1's foundation to add advanced RBAC administration features:

1. **Enhanced Audit Log UI** - Comprehensive filtering, search, change diffs, and export capabilities (⏳ Pending)
2. **Bulk Operations** - ✅ Bulk permission assignment complete | ⏳ Bulk user role management pending
3. **Advanced User Management** - Enhanced search, filtering, and inline editing (⏳ Pending)
4. **Role Analytics** - Usage statistics, orphaned roles, unused permissions (⏳ Pending)
5. **Time-Based Role Expiration** - UI and background jobs for automatic role revocation (⏳ Pending)
6. **Permission Dependencies** - ✅ COMPLETE - Validation that required permissions are present
7. **Role Conflict Detection** - ✅ COMPLETE - Warnings for contradictory role assignments
8. **Role Hierarchy/Inheritance** - Parent-child relationships for permission inheritance (⏳ Pending)

These features transform the RBAC system from basic administration to enterprise-grade governance.

---

## Business Requirements

### Pain Points Addressed

**Audit & Compliance**:

- Difficult to track who made changes and when
- Cannot export audit logs for compliance reports
- No visibility into before/after changes

**Admin Efficiency**:

- Assigning many permissions is tedious (153+ checkboxes)
- Managing roles for multiple users requires repetitive actions
- Cannot quickly identify unused or orphaned roles

**Data Quality**:

- No warnings when roles have contradictory permissions
- No validation of permission dependencies
- Expired roles remain active indefinitely

**Scalability**:

- As team grows, role management becomes complex
- No hierarchy means duplicating permissions across similar roles
- No analytics to guide role optimization

---

## Technical Design

### 1. Enhanced Audit Log UI

**Current State**: Basic audit log page with minimal filtering (`/admin/audit-logs`)

**Proposed Features**:

#### 1.1 Advanced Filtering

```typescript
interface AuditLogFilters {
  dateRange: { start: Date; end: Date } | null;
  actionTypes: string[]; // create, update, delete, assign, remove
  entityTypes: string[]; // role, permission, user_role, etc.
  users: string[]; // User IDs who performed actions
  searchQuery: string; // Free text search in entity data
}
```

**UI Components**:

- Date range picker (from/to dates)
- Multi-select dropdown for action types
- Multi-select dropdown for entity types
- User autocomplete search
- Global search input

#### 1.2 Change Diff Viewer

- Show before/after state for update actions
- Highlight changed fields in red (removed) and green (added)
- Format JSON changes for readability
- Support nested object diffs

**Example**:

```
Role: "Manager" updated by john@barq.com on 2025-11-22 14:30

- displayName: "Manager" → "Department Manager"
+ description: "Manages department resources" (added)
- permissions: [50 permissions] → [52 permissions]
  + tasks:manage (added)
  + assets:checkout (added)
```

#### 1.3 Export Functionality

- Export to CSV: Flat format for Excel analysis
- Export to JSON: Complete structured data
- Respect active filters (export only filtered results)
- Include pagination (max 10,000 records per export)

**Export Format (CSV)**:

```csv
Timestamp,User,Action,Entity Type,Entity ID,Entity Name,Changes
2025-11-22 14:30:15,john@barq.com,update,role,role_123,Manager,"displayName changed..."
```

**Files to Modify**:

- `src/app/(dashboard)/admin/audit-logs/page.tsx` (enhance with filters)
- Create `src/components/audit-logs/AuditLogFilters.tsx`
- Create `src/components/audit-logs/ChangeDiffViewer.tsx`
- Create `src/components/audit-logs/ExportButton.tsx`
- Add export server actions to controller

**Estimated Effort**: 12-16 hours

---

### 2. Bulk Operations

#### 2.1 Bulk Permission Assignment

**User Flow**:

1. Admin opens permission assignment page
2. Clicks "Bulk Mode" toggle
3. Selects multiple groups or individual permissions
4. Chooses action: "Add to Role" or "Remove from Role"
5. Confirms bulk operation
6. System applies changes atomically

**UI Changes**:

- Add bulk mode toggle to PermissionsManager
- Add multi-select state management
- Add bulk action buttons (Apply Selected, Clear Selection)
- Show selected count (15 permissions selected)

**Server-Side**:

- Existing `assignPermissionsToRoleAction` already supports bulk (array of permission IDs)
- No backend changes needed

**Files to Modify**:

- `src/components/roles/PermissionsManager.tsx` (add bulk mode)

**Estimated Effort**: 4-6 hours

#### 2.2 Bulk User Role Assignment

**User Flow**:

1. Admin opens users page (`/admin/users`)
2. Selects multiple users via checkboxes
3. Clicks "Assign Roles" button
4. Modal opens with role multi-select
5. Optionally set expiration date
6. Confirms assignment
7. System creates UserRole records for all selected users

**UI Components**:

- Add selection checkboxes to UserTable
- Create BulkRoleAssignmentModal component
- Add role multi-select with search
- Add optional expiration date picker

**Server Actions**:

```typescript
// New action needed
async function bulkAssignRolesToUsersAction({
  userIds: string[];
  roleIds: string[];
  expiresAt?: Date;
}): Promise<Result<{ assigned: number }>>
```

**Files to Create/Modify**:

- Modify `src/components/users/UserTable.tsx` (add checkboxes)
- Create `src/components/users/BulkRoleAssignmentModal.tsx`
- Add bulk assign use case to `src/core/use-cases/rbac/user-role/`
- Add controller action to `user-role.controller.ts`

**Estimated Effort**: 6-8 hours

---

### 3. Advanced User Management

**Current State**: Basic user list with minimal functionality

**Proposed Features**:

#### 3.1 Advanced Search & Filtering

```typescript
interface UserFilters {
  query: string; // Email, name
  roles: string[]; // Filter by assigned roles
  status: ("active" | "inactive")[]; // If user has isActive field
  dateJoined: { start: Date; end: Date } | null;
}
```

**UI Components**:

- Enhanced search input with autocomplete
- Role filter multi-select (e.g., "Show only users with Admin role")
- Date range picker for account creation date
- Active filter buttons (All / Active / Inactive)

#### 3.2 Inline Role Editing

- Display user roles as removable badges
- Click "+" to add new role without navigating away
- Remove role with confirmation
- Show role expiration dates inline

**UI Example**:

```
john@barq.com
Roles: [Admin] [Manager x] [+ Add Role]
```

#### 3.3 User Role History

- View all role assignments/removals for a user
- Show who made the change and when
- Useful for audits and troubleshooting

**Files to Modify**:

- `src/app/(dashboard)/admin/users/page.tsx` (add filters)
- `src/components/users/UserTable.tsx` (inline editing)
- Create `src/components/users/UserRoleHistory.tsx`
- Enhance user repository with filtering

**Estimated Effort**: 8-10 hours

---

### 4. Role Analytics Dashboard

**Proposed Metrics**:

#### 4.1 Usage Statistics

- **Role Usage**: Chart showing # of users per role
- **Permission Usage**: Most/least used permissions
- **Orphaned Roles**: Roles with 0 users assigned
- **Over-Privileged Users**: Users with multiple high-privilege roles

#### 4.2 Visualizations

- Bar chart: Users per role (descending)
- Heatmap: Permission usage across roles
- Timeline: Role assignments over time
- Table: Top 10 most/least used permissions

**UI Components**:

- Create `/admin/analytics` page
- Use Recharts for visualizations
- Real-time data from database queries

**Database Queries Needed**:

```sql
-- Users per role
SELECT r.name, r.displayName, COUNT(ur.userId) as userCount
FROM Role r
LEFT JOIN UserRole ur ON r.id = ur.roleId
GROUP BY r.id
ORDER BY userCount DESC;

-- Permission usage
SELECT p.name, COUNT(DISTINCT rp.roleId) as roleCount
FROM Permission p
LEFT JOIN RolePermission rp ON p.id = rp.permissionId
GROUP BY p.id
ORDER BY roleCount ASC;

-- Orphaned roles
SELECT r.* FROM Role r
WHERE r.id NOT IN (SELECT roleId FROM UserRole);
```

**Files to Create**:

- `src/app/(dashboard)/admin/analytics/page.tsx`
- `src/components/analytics/RoleUsageChart.tsx`
- `src/components/analytics/PermissionHeatmap.tsx`
- Add analytics use cases and controller actions

**Estimated Effort**: 10-12 hours

---

### 5. Time-Based Role Expiration

**Current State**: `UserRole.expiresAt` field exists but no UI or automation

**Proposed Features**:

#### 5.1 Expiration Date Picker

- When assigning role to user, optionally set expiration date
- Show expiration date in user role list
- Visual indicator for expiring soon (e.g., yellow badge for < 7 days)
- Extend expiration date without removing/re-adding role

**UI Changes**:

- Add date picker to user role assignment form
- Show expiration badges in UserTable
- Add "Extend" button for expiring roles

#### 5.2 Background Job

```typescript
// New background job
async function revokeExpiredRoles() {
  const now = new Date();
  const expiredRoles = await userRoleRepository.findExpired(now);

  for (const userRole of expiredRoles) {
    await removeUserRoleUseCase.execute({
      userId: userRole.userId,
      roleId: userRole.roleId,
    });

    // Log audit event
    await auditLog.create({
      action: "remove",
      entityType: "user_role",
      details: "Automatically removed due to expiration",
    });
  }
}
```

**Scheduling**:

- Run daily at 00:00 UTC via cron job or background worker
- Consider using BullMQ or similar for job scheduling

**Files to Create/Modify**:

- Modify user role assignment forms (add date picker)
- Create `src/infrastructure/jobs/revoke-expired-roles.job.ts`
- Add job scheduler configuration
- Add repository method `findExpired(date: Date)`

**Estimated Effort**: 6-8 hours

---

### 6. Permission Dependencies

**Business Logic**:

- Define required dependencies (e.g., `tasks:delete` requires `tasks:view`)
- Validate when assigning permissions to role
- Show warning if dependency is missing

**Configuration**:

```typescript
// src/lib/rbac/permission-dependencies.ts
export const PERMISSION_DEPENDENCIES: Record<PermissionKey, PermissionKey[]> = {
  [PERMISSIONS.TASKS_DELETE]: [PERMISSIONS.TASKS_VIEW],
  [PERMISSIONS.TASKS_UPDATE]: [PERMISSIONS.TASKS_VIEW],
  [PERMISSIONS.ASSETS_DELETE]: [PERMISSIONS.ASSETS_VIEW],
  [PERMISSIONS.ASSETS_CHECKOUT]: [
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_UPDATE,
  ],
  // ... more dependencies
};
```

**Validation Logic**:

```typescript
function validatePermissionDependencies(selectedPermissions: PermissionKey[]): {
  valid: boolean;
  missing: PermissionKey[];
} {
  const missing: PermissionKey[] = [];
  const selected = new Set(selectedPermissions);

  for (const perm of selectedPermissions) {
    const deps = PERMISSION_DEPENDENCIES[perm] ?? [];
    for (const dep of deps) {
      if (!selected.has(dep)) {
        missing.push(dep);
      }
    }
  }

  return { valid: missing.length === 0, missing };
}
```

**UI Changes**:

- Show warning banner in PermissionsManager if dependencies missing
- Suggest adding required permissions
- Allow saving anyway (warning, not error)

**Files to Create/Modify**:

- Create `src/lib/rbac/permission-dependencies.ts`
- Modify `src/components/roles/PermissionsManager.tsx` (add validation)

**Estimated Effort**: 4-6 hours

---

### 7. Role Conflict Detection

**Business Logic**:

- Define conflicting role pairs (e.g., Auditor + Administrator)
- Warn when user is assigned conflicting roles
- Admin can override with justification

**Configuration**:

```typescript
// src/lib/rbac/role-conflicts.ts
export const ROLE_CONFLICTS: Record<string, string[]> = {
  auditor: ["administrator", "developer"],
  administrator: ["auditor"],
  "finance-manager": ["procurement-manager"], // Segregation of duties
};
```

**Detection Logic**:

```typescript
function detectRoleConflicts(userRoles: string[]): {
  hasConflicts: boolean;
  conflicts: Array<{ role1: string; role2: string; reason: string }>;
} {
  const conflicts = [];

  for (let i = 0; i < userRoles.length; i++) {
    for (let j = i + 1; j < userRoles.length; j++) {
      const role1 = userRoles[i];
      const role2 = userRoles[j];

      if (ROLE_CONFLICTS[role1]?.includes(role2)) {
        conflicts.push({
          role1,
          role2,
          reason: "Segregation of duties violation",
        });
      }
    }
  }

  return { hasConflicts: conflicts.length > 0, conflicts };
}
```

**UI Changes**:

- Show conflict warning in user role assignment
- Display all conflicting roles
- Require justification to override (optional)

**Files to Create/Modify**:

- Create `src/lib/rbac/role-conflicts.ts`
- Modify user role assignment components (add conflict detection)
- Add justification field (optional enhancement)

**Estimated Effort**: 4-6 hours

---

### 8. Role Hierarchy/Inheritance

**Concept**:

- Roles can have parent roles
- Child roles inherit all permissions from parent
- Example: "Senior Manager" inherits from "Manager"

**Database Schema Changes**:

```prisma
model Role {
  // ... existing fields
  parentId    String?   @db.Text
  parent      Role?     @relation("RoleHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Role[]    @relation("RoleHierarchy")
}
```

**Permission Resolution**:

```typescript
function resolvePermissions(role: Role): PermissionKey[] {
  const permissions = new Set<PermissionKey>();

  // Add own permissions
  role.permissions.forEach((p) => permissions.add(p));

  // Recursively add parent permissions
  let currentRole = role;
  while (currentRole.parent) {
    currentRole.parent.permissions.forEach((p) => permissions.add(p));
    currentRole = currentRole.parent;
  }

  return Array.from(permissions);
}
```

**UI Changes**:

- Add parent role selector in role form
- Show inherited permissions (grayed out, non-editable)
- Display role hierarchy tree visualization

**Migration Strategy**:

1. Add `parentId` column to Role table
2. Update role repository to load parent relationships
3. Update permission checking logic to resolve hierarchy
4. Update UI to show inheritance
5. Add validation (no circular dependencies)

**Files to Modify**:

- Database schema (migration)
- Role repository (eager load parent)
- CheckPermission use case (resolve hierarchy)
- RoleForm component (add parent selector)
- PermissionsManager (show inherited permissions)

**Estimated Effort**: 12-16 hours

---

## Implementation Checklist

### Phase 2.1: Enhanced Audit Log UI

- [ ] Design filter UI (date range, action types, entity types, users)
- [ ] Implement filter state management
- [ ] Create filter components (DateRangePicker, MultiSelect, etc.)
- [ ] Implement change diff viewer component
- [ ] Add before/after state to audit log records (if not present)
- [ ] Create export functionality (CSV, JSON)
- [ ] Add pagination for large result sets
- [ ] Test with large datasets (10k+ records)

### Phase 2.2: Bulk Operations

- [ ] Add bulk mode toggle to PermissionsManager
- [ ] Implement multi-select state for bulk permission assignment
- [ ] Add bulk action buttons and confirmation dialogs
- [ ] Create UserTable checkboxes for bulk user selection
- [ ] Implement BulkRoleAssignmentModal component
- [ ] Create bulk assign use case and controller action
- [ ] Test bulk operations with edge cases (partial failures)

### Phase 2.3: Advanced User Management

- [ ] Design and implement UserFilters interface
- [ ] Create advanced search components
- [ ] Add role-based filtering to user list
- [ ] Implement inline role editing UI
- [ ] Create user role history viewer
- [ ] Enhance user repository with filtering queries
- [ ] Test performance with large user bases (1000+ users)

### Phase 2.4: Role Analytics Dashboard

- [ ] Design analytics page layout
- [ ] Implement database queries for metrics
- [ ] Create role usage chart component
- [ ] Create permission heatmap component
- [ ] Add orphaned roles detection
- [ ] Create analytics use cases and controller
- [ ] Add caching for expensive queries
- [ ] Test with production-scale data

### Phase 2.5: Time-Based Role Expiration

- [ ] Add expiration date picker to role assignment forms
- [ ] Display expiration dates in user role lists
- [ ] Add visual indicators for expiring roles (< 7 days)
- [ ] Implement "Extend" functionality
- [ ] Create background job for revoking expired roles
- [ ] Add job scheduling (cron or queue)
- [ ] Create repository method `findExpired(date)`
- [ ] Add audit logging for automatic revocations
- [ ] Test edge cases (timezone handling, concurrent access)

### Phase 2.6: Permission Dependencies

- [ ] Define permission dependencies configuration
- [ ] Create validation logic
- [ ] Update PermissionsManager with dependency warnings
- [ ] Add "Suggest Required" feature
- [ ] Test with complex dependency chains
- [ ] Document dependencies in admin guide

### Phase 2.7: Role Conflict Detection

- [ ] Define role conflict pairs
- [ ] Create conflict detection logic
- [ ] Add conflict warnings to role assignment UI
- [ ] Optionally add justification field
- [ ] Test with various conflict scenarios
- [ ] Document conflicts in admin guide

### Phase 2.8: Role Hierarchy/Inheritance

- [ ] Design database schema changes
- [ ] Create migration for `parentId` field
- [ ] Update role repository (eager load parents)
- [ ] Implement recursive permission resolution
- [ ] Add circular dependency validation
- [ ] Update CheckPermission use case
- [ ] Add parent role selector to RoleForm
- [ ] Show inherited permissions in PermissionsManager
- [ ] Create role hierarchy tree visualization
- [ ] Test with deep hierarchies (5+ levels)
- [ ] Performance test permission resolution

---

## Testing Strategy

### Unit Tests

- Permission dependency validation logic
- Role conflict detection algorithm
- Permission resolution with hierarchy
- Bulk operation use cases

### Integration Tests

- Audit log filtering with database queries
- Export functionality (CSV/JSON generation)
- Background job execution (expired role revocation)
- Bulk user role assignment

### End-to-End Tests

- Complete audit log workflow (filter → view → export)
- Bulk permission assignment flow
- Role cloning with hierarchy
- User role management with expiration

### Performance Tests

- Audit log filtering with 100k+ records
- Analytics queries with 10k+ users
- Permission resolution with 10-level hierarchy
- Bulk operations with 100+ users

---

## Risk & Considerations

### Risks

**Data Integrity**:

- Bulk operations could inadvertently modify many records
- Role hierarchy circular dependencies could break permission checks
- Expired role revocation must be atomic (no partial states)

**Performance**:

- Analytics queries could be slow with large datasets
- Deep role hierarchies (5+ levels) may impact permission checks
- Bulk operations on 1000+ users could timeout

**Usability**:

- Too many filters could overwhelm users
- Complex hierarchy may be confusing
- Conflict warnings could be ignored

### Mitigations

**Data Integrity**:

- Add confirmation dialogs for bulk operations
- Validate role hierarchy for cycles before saving
- Use database transactions for multi-step operations
- Add comprehensive audit logging

**Performance**:

- Cache analytics queries (5-15 min TTL)
- Limit role hierarchy depth (max 5 levels)
- Add pagination to bulk operations
- Use background jobs for long-running tasks

**Usability**:

- Provide sane defaults for filters
- Add "Clear All Filters" button
- Show hierarchy visualization for clarity
- Make conflict warnings prominent but not blocking

---

## Success Metrics

### Quantitative

- Audit log export usage (target: 10+ exports per month)
- Bulk operations save time (target: 50% reduction in admin time)
- Role analytics reduce orphaned roles (target: 80% cleanup)
- Expired roles automatically revoked (target: 100% compliance)

### Qualitative

- Admins can quickly audit RBAC changes
- Bulk operations reduce repetitive work
- Analytics provide actionable insights
- Expiration ensures time-bound access
- Dependencies prevent misconfiguration
- Conflicts enforce segregation of duties
- Hierarchy reduces permission duplication

---

## Dependencies

### External Dependencies

- None (all features use existing stack)

### Internal Dependencies

- Phase 1 must be complete (permission grouping, clone role)
- Analytics requires sufficient user/role data for meaningful insights
- Hierarchy may benefit from migration to support existing roles

---

## Future Enhancements (Phase 3+)

- **Approval Workflows**: Role assignments require manager approval
- **Role Recommendations**: AI-suggested roles based on job title/department
- **Permission Attestation**: Periodic review of user permissions
- **Compliance Reports**: Pre-built reports for SOC2, ISO27001
- **External Identity**: Integration with Azure AD, Okta for SSO
- **Risk Scoring**: Calculate risk score based on permission combinations

---

**Status**: Planned - Ready for implementation when prioritized
**Last Updated**: 2025-11-22
**Estimated Total Effort**: 40-60 hours across 8 sub-features
