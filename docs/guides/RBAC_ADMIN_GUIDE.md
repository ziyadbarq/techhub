# RBAC Admin Guide

**Administrator's guide** for managing roles, permissions, and user access in the barq-assets.

## Table of Contents

1. [Getting Started](#getting-started)
2. [First-Time Setup](#first-time-setup)
3. [Managing Roles](#managing-roles)
4. [Managing Permissions](#managing-permissions)
5. [Assigning Roles to Users](#assigning-roles-to-users)
6. [Viewing Audit Logs](#viewing-audit-logs)
7. [Best Practices](#best-practices)
8. [Permission Reference](#permission-reference)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Dashboard

1. Sign in to your account
2. Navigate to `/admin` in your browser
3. If you don't see the admin menu, you may not have admin permissions

**Required Permission**: Any of the following:

- `users:manage`
- `roles:view`
- `permissions:view`

### Admin Dashboard Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Users      │  │    Roles     │  │ Permissions  │ │
│  │   Management │  │  Management  │  │ Management   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Audit Logs                         │  │
│  │   View all RBAC changes and user actions        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## First-Time Setup

### Setup Wizard

When you first access the application with no administrators:

1. Navigate to `/setup`
2. Click "Become Administrator"
3. Confirm the action
4. You'll be redirected to the admin dashboard

**Important**: This can only be done once. The first user to complete this becomes the administrator.

**Alternative Setup**: If you missed the setup wizard, run:

```bash
npm run db:assign-admin
```

This will assign the admin role to the first user in the database.

### Initial Configuration

After becoming admin:

1. **Review System Roles**: Navigate to `/admin/roles`
   - 4 system roles are pre-configured (admin, manager, editor, viewer)
   - These cannot be deleted but you can view their permissions

2. **Review System Permissions**: Navigate to `/admin/permissions`
   - All permissions are pre-seeded from the database seed
   - System permissions cannot be deleted

3. **Invite Team Members**: Navigate to `/admin/users`
   - Users sign in via Microsoft OAuth
   - Assign appropriate roles to each user

### System Roles Overview

| Role        | Description                 | Default Permissions                                                                      |
| ----------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| **Admin**   | Full system access          | All permissions                                                                          |
| **Manager** | Team and content management | Users (view), Tasks (full), Roles (view), Permissions (view), Dashboard, Settings (view) |
| **Editor**  | Content editing             | Tasks (full), Dashboard (view), Settings (view)                                          |
| **Viewer**  | Read-only access            | Tasks (view + edit own), Dashboard (view)                                                |

---

## Managing Roles

### Viewing Roles

1. Navigate to `/admin/roles`
2. See list of all roles with:
   - Role name and display name
   - Number of assigned users
   - Number of permissions
   - System role indicator (cannot be deleted)
   - Active/Inactive status

### Creating a New Role

1. Click "Create Role" button
2. Fill in the form:
   - **Name**: Internal identifier (lowercase, no spaces) - e.g., `content-moderator`
   - **Display Name**: User-friendly name - e.g., `Content Moderator`
   - **Description**: Purpose of this role - e.g., `Moderates user-generated content`
3. Click "Create"
4. Assign permissions to the new role (see [Assigning Permissions to Roles](#assigning-permissions-to-roles))

**Example Custom Roles**:

| Role Name           | Display Name          | Use Case                            |
| ------------------- | --------------------- | ----------------------------------- |
| `billing-admin`     | Billing Administrator | Manage billing and subscriptions    |
| `content-moderator` | Content Moderator     | Review and moderate user content    |
| `support-agent`     | Support Agent         | View and respond to support tickets |
| `analytics-viewer`  | Analytics Viewer      | Read-only access to analytics       |

### Editing a Role

1. Click on a role in the list
2. Update the display name or description
3. Click "Save Changes"

**Note**: You cannot edit system roles (admin, manager, editor, viewer).

### Assigning Permissions to Roles

1. Navigate to `/admin/roles`
2. Click on a role
3. Click "Manage Permissions" tab
4. Check/uncheck permissions
5. Click "Save Permissions"

**Permission Organization**:

Permissions are grouped by resource:

- **Users**: User management permissions
- **Tasks**: Task management permissions
- **Roles**: Role management permissions
- **Permissions**: Permission management permissions
- **Audit Logs**: Audit log access
- **Settings**: Application settings
- **Dashboard**: Dashboard and analytics

### Deactivating a Role

1. Navigate to `/admin/roles`
2. Click on a role
3. Click "Deactivate Role"
4. Confirm the action

**What happens**:

- Role remains in database
- Users keep the role assignment
- Permissions from this role no longer apply
- Can be reactivated later

### Deleting a Role

1. Navigate to `/admin/roles`
2. Click on a role (must not be a system role)
3. Click "Delete Role"
4. Confirm the action

**Requirements**:

- Cannot delete system roles (admin, manager, editor, viewer)
- Role must not be assigned to any users
- Must have `roles:delete` permission

**Warning**: This action cannot be undone. Consider deactivating instead.

---

## Managing Permissions

### Viewing Permissions

1. Navigate to `/admin/permissions`
2. See list of all permissions with:
   - Permission key (e.g., `tasks:create`)
   - Display name (e.g., `Create Tasks`)
   - Resource and action
   - Number of roles with this permission
   - System permission indicator
   - Active/Inactive status

### Permission Naming Convention

All permissions follow the **resource:action[:modifier]** pattern:

```
resource:action[:modifier]
   ↓      ↓         ↓
tasks  : create
tasks  : update  : own
users  : delete
```

**Examples**:

| Permission Key     | Display Name     | Description                   |
| ------------------ | ---------------- | ----------------------------- |
| `tasks:view`       | View Tasks       | View all tasks                |
| `tasks:create`     | Create Tasks     | Create new tasks              |
| `tasks:update`     | Update Tasks     | Edit any task                 |
| `tasks:update:own` | Update Own Tasks | Edit only tasks you created   |
| `tasks:delete`     | Delete Tasks     | Delete any task               |
| `tasks:delete:own` | Delete Own Tasks | Delete only tasks you created |

### Creating a New Permission

**Note**: In most cases, you don't need to create custom permissions. The system comes with a comprehensive set of pre-defined permissions.

If you need a custom permission:

1. Navigate to `/admin/permissions`
2. Click "Create Permission"
3. Fill in the form:
   - **Name**: Permission key - e.g., `invoices:export`
   - **Display Name**: Human-readable name - e.g., `Export Invoices`
   - **Description**: What this permission allows - e.g., `Export invoice data to CSV`
   - **Resource**: Resource name - e.g., `invoices`
   - **Action**: Action name - e.g., `export`
4. Click "Create"

**Best Practices**:

- Use kebab-case for resource names: `audit-logs`, `user-profiles`
- Use lowercase for action names: `view`, `create`, `update`, `delete`
- Add `:own` suffix for ownership-based permissions: `tasks:update:own`
- Use descriptive display names: "View Analytics Dashboard" not "View Dashboard"
- Include helpful descriptions for complex permissions

### Editing a Permission

1. Navigate to `/admin/permissions`
2. Click on a permission
3. Update display name or description
4. Click "Save Changes"

**Note**: You cannot edit system permissions' name, resource, or action fields.

### Deactivating a Permission

1. Navigate to `/admin/permissions`
2. Click on a permission
3. Click "Deactivate Permission"
4. Confirm the action

**What happens**:

- Permission remains in database
- Roles keep the permission assignment
- Permission checks for this permission will fail
- Can be reactivated later

### Deleting a Permission

1. Navigate to `/admin/permissions`
2. Click on a permission (must not be a system permission)
3. Click "Delete Permission"
4. Confirm the action

**Requirements**:

- Cannot delete system permissions
- Permission must not be assigned to any roles
- Must have `permissions:delete` permission

**Warning**: This action cannot be undone. Consider deactivating instead.

---

## Assigning Roles to Users

### Viewing Users

1. Navigate to `/admin/users`
2. See list of all users with:
   - Email and name
   - Assigned roles (badges)
   - Account creation date
   - Last sign-in time

### Assigning a Role to a User

1. Navigate to `/admin/users`
2. Click on a user
3. Click "Assign Role"
4. Select role from dropdown
5. (Optional) Set expiration date
6. Click "Assign"

**Role Expiration**:

You can assign roles with an expiration date:

- **Use case**: Temporary access for contractors, trial periods, seasonal staff
- **Example**: Assign "editor" role that expires in 30 days
- **Behavior**: User automatically loses role after expiration date
- **Notifications**: User is not notified when role expires (you should notify them manually)

### Removing a Role from a User

1. Navigate to `/admin/users`
2. Click on a user
3. Find the role in their roles list
4. Click "Remove" button
5. Confirm the action

**What happens**:

- User immediately loses all permissions from that role
- User's permission cache is invalidated
- Action is logged in audit logs

### Viewing User Permissions

1. Navigate to `/admin/users`
2. Click on a user
3. Click "Permissions" tab
4. See list of all effective permissions (aggregated from all roles)

**Note**: Permissions are computed from all assigned roles. A user's effective permissions are the union of all permissions from their roles.

### Bulk Role Assignment

**Currently not available in UI**. For bulk operations, use the API or database directly:

```sql
-- Assign role to multiple users by email pattern
INSERT INTO user_roles (id, "userId", "roleId", "createdAt", "createdBy")
SELECT gen_random_uuid(), u.id, r.id, NOW(), 'admin'
FROM users u, roles r
WHERE u.email LIKE '%@yourcompany.com'
  AND r.name = 'editor'
ON CONFLICT DO NOTHING;
```

---

## Viewing Audit Logs

### Accessing Audit Logs

1. Navigate to `/admin/audit-logs`
2. View complete audit trail of all RBAC changes

**Required Permission**: `audit-logs:view`

### Audit Log Entries

Each audit log entry shows:

- **Timestamp**: When the action occurred
- **User**: Who performed the action
- **Action**: Type of action (e.g., `role.create`, `user_role.assign`)
- **Entity**: What was changed (e.g., Role, Permission, UserRole)
- **Changes**: Before/after comparison (JSON diff)
- **Metadata**: Additional context (IP address, user agent)

### Filtering Audit Logs

Use filters to narrow down results:

- **By User**: See all actions by a specific user
- **By Action Type**: Filter by action (create, update, delete, assign, remove)
- **By Entity Type**: Filter by entity (Role, Permission, UserRole)
- **By Date Range**: Select start and end dates

### Exporting Audit Logs

1. Apply desired filters
2. Click "Export" button
3. Choose format:
   - **CSV**: For spreadsheet analysis
   - **JSON**: For programmatic processing
4. Download file

**Required Permission**: `audit-logs:export`

### Audited Actions

| Action                   | Description                  | Example                                         |
| ------------------------ | ---------------------------- | ----------------------------------------------- |
| `role.create`            | New role created             | Admin created "billing-admin" role              |
| `role.update`            | Role modified                | Admin renamed "editor" to "content-editor"      |
| `role.delete`            | Role deleted                 | Admin deleted "temp-role"                       |
| `permission.create`      | New permission created       | Admin created "invoices:export"                 |
| `permission.update`      | Permission modified          | Admin updated description                       |
| `permission.delete`      | Permission deleted           | Admin deleted "old-permission"                  |
| `user_role.assign`       | Role assigned to user        | Admin assigned "manager" to user@example.com    |
| `user_role.remove`       | Role removed from user       | Admin removed "editor" from user@example.com    |
| `role_permission.assign` | Permission added to role     | Admin added "tasks:delete" to "manager" role    |
| `role_permission.remove` | Permission removed from role | Admin removed "users:delete" from "editor" role |

### Viewing Change Diff

1. Click on an audit log entry
2. See detailed before/after comparison
3. Highlighted changes show what was modified

**Example**:

```json
{
  "before": {
    "displayName": "Editor",
    "description": "Content editing"
  },
  "after": {
    "displayName": "Content Editor",
    "description": "Content editing and moderation"
  }
}
```

---

## Best Practices

### Role Design

1. **Keep roles focused** - Each role should have a clear purpose
   - Good: "billing-admin" with only billing permissions
   - Bad: "super-user" with random permissions

2. **Follow the principle of least privilege**
   - Grant minimum permissions needed for the job
   - Start with viewer role and add permissions as needed

3. **Use descriptive names**
   - Display Name: "Content Moderator" not "Moderator"
   - Description: "Moderates user-generated content and handles reports" not "Moderation"

4. **Consider role hierarchy**

   ```
   Admin → Manager → Editor → Viewer
     ↓        ↓        ↓        ↓
   All    Manage   Create   Read-only
   ```

5. **Don't modify system roles**
   - Clone and customize instead
   - System roles serve as templates

### Permission Management

1. **Use semantic permission names**
   - `tasks:view` not `task-list-access`
   - `users:manage` not `user-admin`

2. **Group related permissions**
   - All task permissions start with `tasks:`
   - All user permissions start with `users:`

3. **Use :own for ownership**
   - `tasks:update:own` - User can edit their own tasks
   - `tasks:delete:own` - User can delete their own tasks

4. **Document custom permissions**
   - Add clear descriptions
   - Explain when permission is needed
   - Document any special behavior

### User Access Management

1. **Assign roles, not individual permissions**
   - Don't grant permissions directly to users
   - Create/use appropriate roles instead

2. **Review access regularly**
   - Quarterly access review
   - Remove roles from inactive users
   - Check for expired role assignments

3. **Use role expiration for temporary access**
   - Contractors: Set expiration to contract end date
   - Trial periods: Set expiration to trial end
   - Seasonal staff: Set expiration to season end

4. **Monitor the audit log**
   - Review weekly for unusual activity
   - Check for bulk permission changes
   - Investigate unexpected role assignments

### Security Best Practices

1. **Protect system roles and permissions**
   - Never delete system roles
   - Don't deactivate core permissions
   - Test changes in development first

2. **Limit admin access**
   - Only assign admin role to trusted users
   - Use manager or custom roles when possible
   - Review admin list regularly

3. **Document role assignments**
   - Add notes when assigning roles
   - Document why user needs specific access
   - Keep records of approval (if required)

4. **Enable notifications**
   - Monitor audit logs for sensitive actions
   - Alert on admin role assignments
   - Track permission changes

---

## Permission Reference

### Complete Permission List

#### Users

| Permission     | Display Name | Description                 |
| -------------- | ------------ | --------------------------- |
| `users:view`   | View Users   | View user list and details  |
| `users:create` | Create Users | Create new user accounts    |
| `users:update` | Update Users | Edit user information       |
| `users:delete` | Delete Users | Remove user accounts        |
| `users:manage` | Manage Users | Full user management access |

#### Tasks

| Permission         | Display Name     | Description              |
| ------------------ | ---------------- | ------------------------ |
| `tasks:view`       | View Tasks       | View all tasks           |
| `tasks:create`     | Create Tasks     | Create new tasks         |
| `tasks:update`     | Update Tasks     | Edit any task            |
| `tasks:update:own` | Update Own Tasks | Edit tasks you created   |
| `tasks:delete`     | Delete Tasks     | Delete any task          |
| `tasks:delete:own` | Delete Own Tasks | Delete tasks you created |

#### Roles

| Permission     | Display Name | Description                 |
| -------------- | ------------ | --------------------------- |
| `roles:view`   | View Roles   | View role list and details  |
| `roles:create` | Create Roles | Create new roles            |
| `roles:update` | Update Roles | Edit role information       |
| `roles:delete` | Delete Roles | Remove roles                |
| `roles:manage` | Manage Roles | Full role management access |

#### Permissions

| Permission           | Display Name       | Description                |
| -------------------- | ------------------ | -------------------------- |
| `permissions:view`   | View Permissions   | View permission list       |
| `permissions:create` | Create Permissions | Create new permissions     |
| `permissions:update` | Update Permissions | Edit permissions           |
| `permissions:delete` | Delete Permissions | Remove permissions         |
| `permissions:manage` | Manage Permissions | Full permission management |

#### Audit Logs

| Permission          | Display Name      | Description        |
| ------------------- | ----------------- | ------------------ |
| `audit-logs:view`   | View Audit Logs   | Access audit trail |
| `audit-logs:export` | Export Audit Logs | Export audit data  |

#### Settings

| Permission        | Display Name    | Description                 |
| ----------------- | --------------- | --------------------------- |
| `settings:view`   | View Settings   | View application settings   |
| `settings:manage` | Manage Settings | Modify application settings |

#### Dashboard

| Permission            | Display Name   | Description                  |
| --------------------- | -------------- | ---------------------------- |
| `dashboard:view`      | View Dashboard | Access main dashboard        |
| `dashboard:analytics` | View Analytics | Access analytics and reports |

### Permission Hierarchy

Some permissions imply others:

- `users:manage` → Includes view, create, update, delete
- `roles:manage` → Includes view, create, update, delete
- `permissions:manage` → Includes view, create, update, delete
- `tasks:update` → Includes tasks:update:own (can edit any task)
- `tasks:delete` → Includes tasks:delete:own (can delete any task)

**Note**: The `:manage` permission is a superset that includes all CRUD operations for that resource.

---

## Troubleshooting

### Can't Access Admin Dashboard

**Problem**: `/admin` shows "Access Denied" or redirects to home.

**Solutions**:

1. **Check if you have admin role**:
   - Ask existing admin to check your roles
   - Run: `npm run db:assign-admin` if you're the first user

2. **Verify you have required permissions**:
   - Need at least one of: `users:manage`, `roles:view`, `permissions:view`

3. **Check session**:
   - Sign out and sign back in
   - Clear browser cookies
   - Try incognito/private window

### Changes Not Taking Effect

**Problem**: Assigned role/permission but user still can't access feature.

**Solutions**:

1. **Permission cache may be stale**:
   - User should sign out and sign back in
   - Wait up to 5 minutes for cache to expire
   - Contact developer to manually invalidate cache

2. **Check role is active**:
   - Navigate to `/admin/roles`
   - Ensure role's "Active" status is ON

3. **Check permission is active**:
   - Navigate to `/admin/permissions`
   - Ensure permission's "Active" status is ON

4. **Verify permission is assigned to role**:
   - Click on role
   - Check "Permissions" tab
   - Ensure specific permission is checked

### Can't Delete Role

**Problem**: "Delete Role" button is disabled or action fails.

**Reasons**:

1. **System role** - Cannot delete admin, manager, editor, viewer
   - Clone the role and modify the clone instead

2. **Role assigned to users** - Must remove role from all users first
   - Navigate to role details
   - See "Assigned Users" count
   - Remove role from each user
   - Try delete again

3. **Missing permission** - Need `roles:delete` permission
   - Check your own roles and permissions
   - Ask admin to grant permission

### Can't See Audit Logs

**Problem**: `/admin/audit-logs` shows empty or access denied.

**Solutions**:

1. **Check permission**:
   - Need `audit-logs:view` permission
   - Ask admin to assign role with this permission

2. **Audit logs may be empty**:
   - Only shows RBAC changes (roles, permissions, assignments)
   - If no changes yet, logs will be empty
   - Try creating a test role to generate logs

3. **Date filter too narrow**:
   - Check date range filter
   - Reset to "All Time"
   - Expand date range

### Role Assignment Not Working

**Problem**: Assigned role to user but they still don't have permissions.

**Solutions**:

1. **Verify role has permissions**:
   - Navigate to `/admin/roles`
   - Click on the role
   - Check "Permissions" tab
   - Ensure permissions are assigned

2. **Check role expiration**:
   - If you set expiration date, verify it's in the future
   - User loses role automatically after expiration

3. **User needs to re-login**:
   - Permission cache may be stale
   - User should sign out and sign back in

4. **Check audit log**:
   - Navigate to `/admin/audit-logs`
   - Filter by action: `user_role.assign`
   - Verify assignment was recorded

### System Permissions Missing

**Problem**: Expected system permissions don't exist.

**Solutions**:

1. **Run database seed**:

   ```bash
   npm run db:seed
   ```

2. **Check database migration**:

   ```bash
   npx prisma migrate status
   npx prisma migrate deploy
   ```

3. **Reset database (development only)**:
   ```bash
   npm run reset
   ```

---

## Related Documentation

- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md) - Technical architecture overview
- [RBAC Developer Guide](./RBAC_DEVELOPER_GUIDE.md) - Developer implementation guide
- [First User Admin Setup](./FIRST_USER_ADMIN.md) - Initial admin setup guide
- [Logging Guide](./LOGGING.md) - Audit logging system

---

## Summary

As an administrator, you have powerful tools to control access to your application:

- **Roles**: Logical groupings of permissions (admin, manager, editor, viewer, custom)
- **Permissions**: Granular access controls (resource:action pattern)
- **User Assignment**: Give users specific roles with optional expiration
- **Audit Logs**: Complete trail of all RBAC changes

**Key Principles**:

1. **Least Privilege** - Grant minimum permissions needed
2. **Role-Based** - Assign roles, not individual permissions
3. **Monitor Access** - Regular audit log reviews
4. **Document Changes** - Record why access was granted
5. **Protect System Entities** - Don't delete system roles/permissions

**Getting Help**:

- Check the [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md) for technical details
- Review [Developer Guide](./RBAC_DEVELOPER_GUIDE.md) for custom implementations
- Contact your development team for custom permissions or roles
