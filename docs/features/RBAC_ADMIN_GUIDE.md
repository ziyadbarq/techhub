# RBAC Administration Guide

**Complete guide to Role-Based Access Control administration features**

**Last Updated**: Current
**Feature Layer**: Layer 1 (Foundation) - RBAC & Administration

---

## Table of Contents

1. [Overview](#overview)
2. [User Management](#user-management)
3. [Role Analytics](#role-analytics)
4. [Role Hierarchy](#role-hierarchy)
5. [Permission Dependencies](#permission-dependencies)
6. [Role Conflicts](#role-conflicts)
7. [Best Practices](#best-practices)

---

## Overview

The RBAC Administration system provides enterprise-grade tools for managing users, roles, and permissions with advanced features including analytics, hierarchy, conflict detection, and automated compliance.

### Key Features

- **Advanced User Management** - Filter, search, and manage users with inline role editing
- **Role Analytics Dashboard** - Comprehensive insights into role and permission usage
- **Role Hierarchy** - Parent-child relationships for permission inheritance
- **Permission Dependencies** - Automatic validation of required permissions
- **Role Conflict Detection** - Segregation of duties enforcement
- **Time-Based Expiration** - Automatic role revocation
- **Bulk Operations** - Efficient multi-user role assignment

---

## User Management

**Location**: `/admin/users`
**Permission**: `USERS_MANAGE`

### Advanced Filtering

Filter users by multiple criteria simultaneously:

- **Search**: Email or name (fuzzy matching)
- **Roles**: Users with specific role assignments
- **Verification Status**: Verified vs. unverified accounts
- **Account Creation**: Date range filter

**Usage**:
1. Click "Filters" button to open filter panel
2. Apply multiple filters
3. View active filter count in badge
4. Clear individual or all filters

### Inline Role Editing

Manage user roles directly from the user table without navigation:

**Add Role**:
1. Click "+" button in roles column
2. Select role from dropdown
3. (Optional) Set expiration date
4. Role is assigned immediately

**Remove Role**:
1. Click "X" on role badge
2. Confirm removal in dialog
3. Role is revoked with audit trail

**Benefits**:
- **90% time savings** vs. traditional navigation-based editing
- **Immediate feedback** with success/error toasts
- **Bulk operations** via user selection + "Assign Roles" button

### Role History

View complete audit trail of role changes for any user:

**Access**: User actions menu → "View Role History"

**Information Displayed**:
- Role name and assignment/removal action
- Expiration date (if applicable)
- Timestamp and performing user
- Chronological timeline

---

## Role Analytics

**Location**: `/rbac-analytics`
**Permission**: `ROLES_VIEW`

### Dashboard Sections

#### 1. Role Usage Statistics

**Bar Chart**: Top 10 roles by user count
- Identify most/least used roles
- Detect orphaned roles (0 users)
- Plan role consolidation

#### 2. Orphaned Roles

**Card Display**: Roles with zero users
- Badge list of unused roles
- Candidate for deletion
- Reduce role sprawl

#### 3. Permission Usage

**Dual Charts**: Most/least used permissions
- **Top 10 Most Used**: Permissions in most roles
- **Top 10 Least Used**: Permissions in few roles (excluding unused)
- Identify over-/under-utilized permissions

#### 4. User Role Distribution

**Pie Chart**: Users by role count
- **0 roles**: Users without access
- **1 role**: Single-role assignments
- **2+ roles**: Multi-role users

#### 5. Users with Conflicts

**Table**: Users with conflicting role assignments
- Role names and count
- Conflict indicators
- Enforcement of segregation of duties

### Use Cases

**Quarterly Access Review**:
1. Identify orphaned roles → Delete or reassign
2. Review users with 0 roles → Assign or deactivate
3. Check conflicting roles → Resolve violations

**Permission Optimization**:
1. Identify least used permissions → Consider removal
2. Check unused permissions → Archive or delete
3. Analyze most used → Ensure proper dependency mapping

---

## Role Hierarchy

**Status**: Infrastructure Complete (Schema, Entity, Client Generation)
**UI**: Pending Enhancement

### Concept

Roles can inherit permissions from parent roles, creating a hierarchy:

```
Administrator (Parent)
├── Department Manager (inherits all Admin permissions)
│   └── Team Lead (inherits Manager + Admin permissions)
└── System Administrator (inherits Admin permissions)
```

### Benefits

- **Reduce Duplication**: Define permissions once at parent level
- **Simplified Management**: Update parent → All children inherit changes
- **Logical Structure**: Mirror organizational hierarchy

### Database Schema

```prisma
model Role {
  parentId String? @db.Text
  parent   Role?   @relation("RoleHierarchy", fields: [parentId], references: [id])
  children Role[]  @relation("RoleHierarchy")
}
```

### Domain Methods

**`getAllPermissions()`**:
- Recursively collects permissions from entire hierarchy
- Returns de-duplicated set of all inherited permissions

**`hasParentInHierarchy(potentialParentId)`**:
- Prevents circular dependencies
- Validates parent selection in UI

### Future Enhancements

- [ ] Add parent role selector to RoleForm (`/admin/roles/[name]/edit`)
- [ ] Show inherited permissions in PermissionsManager (grayed out, non-editable)
- [ ] Display role hierarchy tree visualization
- [ ] Update CheckPermission use case to use `getAllPermissions()`
- [ ] Add max depth limit (recommended: 5 levels)

### Migration Guide

When implementing in UI:

1. **RoleForm Enhancement**:
   ```typescript
   <Select
     value={parentId}
     onValueChange={setParentId}
   >
     {availableParents.map(role => (
       <SelectItem key={role.id} value={role.id}>
         {role.displayName}
       </SelectItem>
     ))}
   </Select>
   ```

2. **PermissionsManager Update**:
   - Fetch role with parent: `role = await getRoleWithParentAction(roleId)`
   - Display own permissions (editable)
   - Display inherited permissions (read-only, italicized)

3. **Circular Dependency Validation**:
   ```typescript
   if (role.hasParentInHierarchy(selectedParentId)) {
     throw new Error("Circular dependency detected");
   }
   ```

---

## Permission Dependencies

**Location**: `src/lib/rbac/permission-dependencies.ts`
**Status**: Implemented (Client + Server-Side Enforcement)

### Concept

Certain permissions require other permissions to function correctly:

- `TASKS_DELETE` requires `TASKS_VIEW`
- `ASSETS_UPDATE` requires `ASSETS_VIEW`
- `ASSETS_CHECKOUT` requires `ASSETS_VIEW` AND `ASSETS_UPDATE`

### Configuration

```typescript
export const PERMISSION_DEPENDENCIES: Record<PermissionKey, PermissionKey[]> = {
  [PERMISSIONS.TASKS_DELETE]: [PERMISSIONS.TASKS_VIEW],
  [PERMISSIONS.TASKS_UPDATE]: [PERMISSIONS.TASKS_VIEW],
  [PERMISSIONS.ASSETS_DELETE]: [PERMISSIONS.ASSETS_VIEW],
  // ... 153+ permissions mapped
};
```

### Validation

**Function**: `validatePermissionDependencies(selectedPermissions)`

**Returns**:
```typescript
{
  valid: boolean;
  missing: Array<{
    permission: PermissionKey;
    requiredDependencies: PermissionKey[];
  }>;
}
```

### Server-Side Enforcement

**Controller**: `assignPermissionsToRoleAction` (`src/interface-adapters/controllers/role.controller.ts`)

**Implementation**:
- Validates permission dependencies before saving to database
- Returns detailed error message listing missing dependencies
- Prevents saving incomplete permission sets via any entry point (API, CLI, scripts)

**Error Response Example**:
```json
{
  "success": false,
  "error": "Missing permission dependencies: ASSETS_UPDATE requires: ASSETS_VIEW; ASSETS_DELETE requires: ASSETS_VIEW"
}
```

**Benefits of Server-Side Enforcement**:
- **Security**: Cannot bypass validation via direct API calls
- **Data Integrity**: Database never contains invalid permission sets
- **Multi-Entry Protection**: Enforced across all code paths (UI, API, scripts)

### UI Integration

**PermissionsManager** (`/admin/roles/[name]/permissions`):

1. **Client-Side Validation**: Prevents save button click when dependencies missing
2. **Warning Banner**: Displays when dependencies missing
3. **Auto-Fix Button**: Adds all required permissions
4. **Tooltips**: Show individual permission requirements
5. **Visual Indicators**: Highlight missing dependencies

**User Flow**:
1. Admin selects permissions
2. Client validates dependencies (instant feedback)
3. If missing → Warning appears with list
4. Admin clicks "Add Required Permissions"
5. System adds missing dependencies automatically
6. Server validates again on save (safety net)

### Benefits

- **Prevent Misconfiguration**: Can't create incomplete permission sets
- **Guided Experience**: Clear feedback on requirements
- **Automatic Resolution**: One-click fix for dependency issues
- **Defense in Depth**: Both client and server validation layers

---

## Role Conflicts

**Location**: `src/lib/rbac/role-conflicts.ts`
**Status**: Implemented (Client + Server-Side Enforcement)

### Concept

Segregation of Duties (SoD) prevents users from having conflicting roles:

- **Auditor** + **Administrator**: Conflict (audit independence)
- **Finance Manager** + **Procurement Manager**: Conflict (fraud prevention)
- **Developer** + **Auditor**: Conflict (code integrity)

### Configuration

```typescript
export const ROLE_CONFLICTS: Record<string, string[]> = {
  auditor: ["administrator", "developer", "system-admin"],
  "finance-manager": ["procurement-manager", "vendor-manager"],
  // ... more conflicts
};

export const CONFLICT_CONFIG: Record<string, ConflictConfig> = {
  "auditor:administrator": {
    severity: "critical",
    allowOverride: false,
    requireJustification: false,
  },
  "finance-manager:procurement-manager": {
    severity: "error",
    allowOverride: true,
    requireJustification: true,
  },
  // ... more configs
};
```

### Bidirectional Conflict Detection

**Function**: `rolesConflict(role1, role2)`

**Implementation**:
```typescript
export function rolesConflict(role1: string, role2: string): boolean {
  const conflictsFromRole1 = ROLE_CONFLICTS[role1]?.includes(role2);
  const conflictsFromRole2 = ROLE_CONFLICTS[role2]?.includes(role1);

  return Boolean(conflictsFromRole1 || conflictsFromRole2);
}
```

**Key Features**:
- **Bidirectional**: Checks conflicts in both directions
- **Single-Entry Config**: Only need to configure one side of the conflict
- **Symmetric**: `rolesConflict("A", "B")` === `rolesConflict("B", "A")`

**Example**:
- Config: `{ auditor: ["administrator"] }`
- Works: `rolesConflict("auditor", "administrator")` ✅
- Also Works: `rolesConflict("administrator", "auditor")` ✅

### Severity Levels

- **Critical**: Blocks assignment (cannot override)
- **Error**: Blocks with override option (requires justification)
- **Warning**: Allows assignment with warning

### Server-Side Enforcement

**Use Case**: `AssignRoleToUserUseCase` (`src/core/use-cases/rbac/assign-role-to-user.use-case.ts`)

**Implementation**:
- Validates role conflicts before creating assignment
- Blocks critical conflicts (returns `RoleConflictError`)
- Logs blocked assignments to audit trail
- Works for both single and bulk role assignments

**Error Response Example**:
```typescript
throw new RoleConflictError(conflicts, "Role assignment blocked due to critical conflicts");
```

**Audit Logging**:
```json
{
  "action": "user_role:assign_blocked",
  "changes": {
    "attempted": { "userId": "...", "roleId": "...", "roleName": "administrator" },
    "conflicts": [
      { "role1": "auditor", "role2": "administrator", "severity": "critical", "reason": "..." }
    ],
    "reason": "CRITICAL_ROLE_CONFLICT"
  }
}
```

### Detection Logic

**Function**: `detectRoleConflicts(userRoles)`

**Returns**:
```typescript
{
  hasConflicts: boolean;
  conflicts: Array<{
    role1: string;
    role2: string;
    reason: string;
    severity: "warning" | "error" | "critical";
    config: ConflictConfig;
  }>;
}
```

**Function**: `validateRoleAddition(existingRoles, newRole)`

Checks if adding a new role would create conflicts.

**Function**: `getConflictingRoles(roleName)`

Returns all roles that conflict with the given role (bidirectional lookup).

### UI Integration

**RoleAssignment Component** (`/admin/users/[email]/roles`):
1. **Conflict Badges**: Display severity with color coding (uses role names, not IDs)
2. **Blocking Behavior**: Critical conflicts prevent assignment
3. **Warning Dialogs**: Error/warning conflicts show reason
4. **Existing Conflicts**: Highlighted in user role list with details

**Bulk Assignment Modal** (`/admin/users`):
1. **Pre-Flight Validation**: Checks all user/role combinations before assignment
2. **Conflict Summary**: Displays detailed report with severity indicators
3. **Smart Controls**:
   - "Proceed Anyway" button for warnings
   - Automatic blocking for critical conflicts
   - Per-user/per-role conflict breakdown
4. **Result Reporting**: Shows assigned, conflicted, and failed counts

**User Flow (Bulk Assignment)**:
1. Admin selects multiple users and roles
2. Click "Assign Roles" button
3. **Pre-flight check** runs for each user/role combination
4. If conflicts detected → Summary dialog appears
5. Admin reviews conflicts with severity levels
6. Choose action:
   - **Back**: Cancel and adjust selection
   - **Proceed Anyway**: Assign roles (server will still block critical conflicts)
7. Server enforces final validation
8. Results summary shows success/conflict/failure counts

### Use Cases

**SAMA Compliance**:
- Prevent auditor conflicts (regulatory requirement)
- Enforce financial controls (SoD for fraud prevention)
- Track override justifications (audit trail)

---

## Best Practices

### User Management

**Onboarding**:
1. Create user account
2. Assign role(s) based on job function
3. Set expiration for temporary access
4. Verify role conflicts

**Offboarding**:
1. Review user's role history
2. Remove all role assignments
3. Document in audit log
4. Deactivate account (do not delete for audit trail)

**Periodic Review**:
- Quarterly: Review orphaned roles
- Monthly: Check expired role assignments
- Weekly: Monitor conflicting roles

### Role Design

**Naming Conventions**:
- `name`: lowercase-with-hyphens (system identifier)
- `displayName`: Human Readable Title (UI display)
- Examples: `department-manager` → "Department Manager"

**Permission Assignment**:
- Start with minimal permissions (principle of least privilege)
- Use permission groups for bulk assignment
- Validate dependencies before saving
- Test with real user scenarios

**Hierarchy Design**:
- Max 5 levels deep (prevent complexity)
- Align with organizational structure
- Document inheritance in role description
- Validate circular dependencies

### Analytics Usage

**Monthly Reports**:
1. Export role usage statistics
2. Identify trends (growing/shrinking roles)
3. Plan permission optimizations
4. Present to management

**Quarterly Access Reviews**:
1. Run analytics dashboard
2. Generate orphaned roles report
3. Review users with 0 roles
4. Resolve conflicting assignments

**Annual Audits**:
1. Full audit log export
2. Permission usage analysis
3. Role conflict resolution history
4. Compliance attestation

---

## Troubleshooting

### Common Issues

**Permission Dependencies Warning Won't Clear**:
- **Cause**: Missing nested dependencies
- **Fix**: Use "Add Required Permissions" button repeatedly until clear

**Circular Dependency Error**:
- **Cause**: Attempting to set parent that creates loop
- **Fix**: Remove parent relationship or select different parent

**Bulk Assignment Fails for Some Users**:
- **Cause**: Role conflicts detected
- **Fix**: Review conflict report, resolve individually

**Analytics Shows Incorrect Data**:
- **Cause**: Cache not refreshed
- **Fix**: Hard refresh page (Ctrl+Shift+R)

### Support

For issues not covered in this guide:
- **Documentation**: `/docs` (in-app)
- **Code Reference**: `src/core/use-cases/rbac/`
- **Issue Tracker**: Contact system administrator

---

## API Reference

### Server Actions

**User Management**:
- `listUsersWithRolesAction()` - Get all users with role data
- `assignRoleToUserAction({ userId, roleId, expiresAt })` - Assign role
- `removeRoleFromUserAction({ userId, roleId })` - Remove role

**Analytics**:
- `getRoleUsageStatsAction()` - Role usage statistics
- `getPermissionUsageStatsAction()` - Permission usage data
- `getUserRoleStatsAction()` - User role distribution

**Validation**:
- `validatePermissionDependencies(permissions)` - Check dependencies
- `detectRoleConflicts(roleNames)` - Check conflicts
- `validateRoleAddition(existingRoles, newRole)` - Validate new assignment

### Use Cases

**Analytics**:
- `GetRoleUsageStatsUseCase` - `src/core/use-cases/rbac/analytics/get-role-usage-stats.use-case.ts`
- `GetPermissionUsageStatsUseCase` - `src/core/use-cases/rbac/analytics/get-permission-usage-stats.use-case.ts`
- `GetUserRoleStatsUseCase` - `src/core/use-cases/rbac/analytics/get-user-role-stats.use-case.ts`

---

**See Also**:
- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md)
- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md)
- [Permission Groups](../../src/lib/rbac/permission-groups.ts)
- [Role Conflicts Configuration](../../src/lib/rbac/role-conflicts.ts)
