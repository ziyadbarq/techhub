# RBAC Architecture

**Role-Based Access Control (RBAC)** - Complete architecture documentation for the barq-app-boilerplate permission system.

## Table of Contents

1. [Overview](#overview)
2. [Permission Model](#permission-model)
3. [Role Hierarchy](#role-hierarchy)
4. [Database Schema](#database-schema)
5. [Multi-Layer Enforcement](#multi-layer-enforcement)
6. [Caching Strategy](#caching-strategy)
7. [Audit Logging](#audit-logging)
8. [Context-Aware Permissions](#context-aware-permissions)
9. [Security Considerations](#security-considerations)

---

## Overview

The RBAC system provides **fine-grained access control** with multi-layer enforcement, caching, and comprehensive audit logging. It follows Clean Architecture principles with dependency injection and type-safe permission checking.

### Core Features

- **Type-Safe Permissions** - All permissions defined as TypeScript constants
- **Resource:Action Pattern** - Intuitive permission naming (e.g., `tasks:create`, `users:view`)
- **Context-Aware** - Ownership-based permissions with `:own` suffix
- **Multi-Layer Enforcement** - UI, Route, Server Action, and Use Case layers
- **Performance Optimized** - In-memory caching with 5-minute TTL
- **Audit Trail** - Complete logging of all RBAC changes
- **System Protection** - System roles/permissions cannot be deleted

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   1. PERMISSION MODEL                   │    │
│  │                                                          │    │
│  │  • resource:action pattern (e.g., tasks:create)        │    │
│  │  • :own suffix for ownership (tasks:update:own)        │    │
│  │  • System vs. Custom permissions                        │    │
│  │  • Active/Inactive status                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   2. ROLE HIERARCHY                     │    │
│  │                                                          │    │
│  │  admin     → All permissions                           │    │
│  │  manager   → Team + content management                 │    │
│  │  editor    → Content editing                           │    │
│  │  viewer    → Read-only + own updates                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  3. PERMISSION CACHE                    │    │
│  │                                                          │    │
│  │  • In-memory Map<userId, permissions[]>                │    │
│  │  • 5-minute TTL                                         │    │
│  │  • Max 1000 users                                       │    │
│  │  • Invalidation on role/permission changes             │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │               4. MULTI-LAYER ENFORCEMENT                │    │
│  │                                                          │    │
│  │  UI Layer        → PermissionGuard, PermissionButton   │    │
│  │  Route Layer     → Middleware (optional)               │    │
│  │  Action Layer    → requirePermission() in controllers  │    │
│  │  Use Case Layer  → CheckPermissionUseCase              │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   5. AUDIT LOGGING                      │    │
│  │                                                          │    │
│  │  • Role creation/modification/deletion                 │    │
│  │  • Permission creation/modification/deletion           │    │
│  │  • User role assignment/removal                        │    │
│  │  • Permission checks (debug level)                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Model

### Naming Convention

All permissions follow the **resource:action** pattern:

```typescript
// Format: resource:action[:modifier]
"users:view"; // View all users
"users:create"; // Create new users
"tasks:update"; // Update any task
"tasks:update:own"; // Update only own tasks
"audit-logs:export"; // Export audit logs
```

### Permission Structure

**Location**: `src/core/domain/value-objects/permission-key.ts`

```typescript
export const PERMISSIONS = {
  // Users
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",

  // Tasks
  TASKS_VIEW: "tasks:view",
  TASKS_CREATE: "tasks:create",
  TASKS_UPDATE: "tasks:update",
  TASKS_UPDATE_OWN: "tasks:update:own", // Context-aware
  TASKS_DELETE: "tasks:delete",
  TASKS_DELETE_OWN: "tasks:delete:own", // Context-aware

  // Roles
  ROLES_VIEW: "roles:view",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_MANAGE: "roles:manage",

  // Permissions
  PERMISSIONS_VIEW: "permissions:view",
  PERMISSIONS_CREATE: "permissions:create",
  PERMISSIONS_UPDATE: "permissions:update",
  PERMISSIONS_DELETE: "permissions:delete",
  PERMISSIONS_MANAGE: "permissions:manage",

  // Audit Logs
  AUDIT_LOGS_VIEW: "audit-logs:view",
  AUDIT_LOGS_EXPORT: "audit-logs:export",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
```

### Permission Granularity

| Level          | Example               | Use Case                     |
| -------------- | --------------------- | ---------------------------- |
| **View**       | `users:view`          | Read-only access to resource |
| **Create**     | `users:create`        | Create new resources         |
| **Update**     | `users:update`        | Modify any resource          |
| **Update Own** | `tasks:update:own`    | Modify only owned resources  |
| **Delete**     | `users:delete`        | Delete any resource          |
| **Delete Own** | `tasks:delete:own`    | Delete only owned resources  |
| **Manage**     | `users:manage`        | Full CRUD + special actions  |
| **Export**     | `audit-logs:export`   | Export/download data         |
| **Analytics**  | `dashboard:analytics` | View analytics/reports       |

---

## Role Hierarchy

### System Roles

The system comes with 4 predefined roles that cannot be deleted:

**Location**: `src/infrastructure/database/prisma/seed-rbac.ts`

```typescript
const SYSTEM_ROLES = {
  admin: {
    name: "admin",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    permissions: Object.values(PERMISSIONS), // All permissions
  },
  manager: {
    name: "manager",
    displayName: "Manager",
    description: "Team management and content oversight",
    permissions: [
      // Users (read-only)
      PERMISSIONS.USERS_VIEW,
      // Tasks (full access)
      PERMISSIONS.TASKS_VIEW,
      PERMISSIONS.TASKS_CREATE,
      PERMISSIONS.TASKS_UPDATE,
      PERMISSIONS.TASKS_DELETE,
      // Roles & Permissions (read-only)
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.PERMISSIONS_VIEW,
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.DASHBOARD_ANALYTICS,
      // Settings (view only)
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  editor: {
    name: "editor",
    displayName: "Editor",
    description: "Content editing and task management",
    permissions: [
      // Tasks (full access)
      PERMISSIONS.TASKS_VIEW,
      PERMISSIONS.TASKS_CREATE,
      PERMISSIONS.TASKS_UPDATE,
      PERMISSIONS.TASKS_DELETE,
      // Dashboard (view only)
      PERMISSIONS.DASHBOARD_VIEW,
      // Settings (view only)
      PERMISSIONS.SETTINGS_VIEW,
    ],
  },
  viewer: {
    name: "viewer",
    displayName: "Viewer",
    description: "Read-only access to content",
    permissions: [
      // Tasks (read-only + own updates)
      PERMISSIONS.TASKS_VIEW,
      PERMISSIONS.TASKS_UPDATE_OWN,
      // Dashboard (view only)
      PERMISSIONS.DASHBOARD_VIEW,
    ],
  },
};
```

### Role Comparison Matrix

| Feature         | Admin         | Manager   | Editor    | Viewer          |
| --------------- | ------------- | --------- | --------- | --------------- |
| **Users**       | Full CRUD     | View only | ✗         | ✗               |
| **Tasks**       | Full CRUD     | Full CRUD | Full CRUD | View + Edit own |
| **Roles**       | Full CRUD     | View only | ✗         | ✗               |
| **Permissions** | Full CRUD     | View only | ✗         | ✗               |
| **Audit Logs**  | View + Export | ✗         | ✗         | ✗               |
| **Dashboard**   | Analytics     | Analytics | View only | View only       |
| **Settings**    | Manage        | View only | View only | ✗               |

### Custom Roles

Admins can create custom roles with any combination of permissions:

- Cannot delete system roles (admin, manager, editor, viewer)
- Cannot modify system role permissions directly
- Can clone system roles and modify the clone
- Custom roles can be deleted if not assigned to users

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│    User     │       │   UserRole   │       │     Role     │
├─────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)     │◄─────┤│ userId (FK)  │      ┌┤│ id (PK)      │
│ email       │       │ roleId (FK)  │─────►││ name         │
│ name        │       │ expiresAt    │      │││ displayName  │
│ ...         │       │ createdAt    │      │││ description  │
└─────────────┘       │ createdBy    │      │││ isSystem     │
                      └──────────────┘      │││ isActive     │
                                             ││└──────────────┘
                                             ││
                      ┌──────────────────┐  ││
                      │ RolePermission   │  ││
                      ├──────────────────┤  ││
                      │ roleId (FK)      │──┘│
                      │ permissionId(FK) │───┘
                      │ createdAt        │
                      └──────────────────┘
                                │
                                ▼
                      ┌──────────────┐
                      │  Permission  │
                      ├──────────────┤
                      │ id (PK)      │
                      │ name         │
                      │ displayName  │
                      │ description  │
                      │ resource     │
                      │ action       │
                      │ isSystem     │
                      │ isActive     │
                      └──────────────┘
```

### Prisma Schema

**Location**: `src/infrastructure/database/prisma/schema.prisma`

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  description String?
  isSystem    Boolean  @default(false)  // Cannot be deleted
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?

  permissions RolePermission[]
  users       UserRole[]

  @@index([name])
  @@index([isActive])
  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique           // e.g., "tasks:create"
  displayName String                     // e.g., "Create Tasks"
  description String?
  resource    String                     // e.g., "tasks"
  action      String                     // e.g., "create"
  isSystem    Boolean  @default(false)   // Cannot be deleted
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles RolePermission[]

  @@index([resource, action])
  @@index([isActive])
  @@map("permissions")
}

model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime @default(now())

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}

model UserRole {
  id        String    @id @default(cuid())
  userId    String
  roleId    String
  expiresAt DateTime?  // Optional expiration date
  createdAt DateTime  @default(now())
  createdBy String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String                      // e.g., "role.create", "permission.delete"
  entityType String                      // e.g., "Role", "Permission"
  entityId   String?
  changes    Json?                       // Before/after snapshots
  metadata   Json?                       // Additional context
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([entityType, entityId])
  @@index([action])
  @@map("audit_logs")
}
```

### Database Indexes

Optimized for common query patterns:

- `roles(name)` - Fast role lookup by name
- `roles(isActive)` - Filter active roles
- `permissions(resource, action)` - Fast permission lookup
- `permissions(isActive)` - Filter active permissions
- `user_roles(userId)` - Get all roles for a user
- `user_roles(roleId)` - Get all users with a role
- `role_permissions(roleId)` - Get all permissions for a role
- `audit_logs(userId, createdAt DESC)` - User audit trail
- `audit_logs(entityType, entityId)` - Entity-specific audit logs

---

## Multi-Layer Enforcement

Permissions are enforced at **4 layers** for defense in depth:

### Layer 1: UI Components

**Location**: `src/components/auth/`

Client-side components hide/disable UI elements based on permissions.

```tsx
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// Hide entire sections
<PermissionGuard permission={PERMISSIONS.TASKS_CREATE}>
  <CreateTaskButton />
</PermissionGuard>

// Disable buttons
<PermissionButton
  permission={PERMISSIONS.TASKS_DELETE}
  onClick={handleDelete}
>
  Delete Task
</PermissionButton>
```

**Note**: UI enforcement is for UX only - not security. Always enforce on server.

### Layer 2: Route Middleware (Optional)

**Location**: `src/middleware.ts`, `src/config/protected-routes.ts`

Next.js middleware can check basic authentication, but full permission checks should happen in server actions/use cases for performance.

```typescript
// Protected routes configuration
export const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  "/admin/roles": {
    requiredPermissions: [PERMISSIONS.ROLES_VIEW],
    description: "Role management",
  },
  "/admin/users": {
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    description: "User management",
  },
};
```

### Layer 3: Server Actions

**Location**: `src/interface-adapters/controllers/`

Server actions validate permissions before executing business logic.

```typescript
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function deleteTaskAction(taskId: string) {
  // Get current user and check permission
  await requirePermission(PERMISSIONS.TASKS_DELETE);

  // Execute business logic
  const container = getContainer();
  const deleteTask = container.get<DeleteTaskUseCase>(
    DI_TOKENS.DeleteTaskUseCase,
  );

  return deleteTask.execute({ taskId });
}
```

### Layer 4: Use Cases

**Location**: `src/core/use-cases/rbac/check-permission.use-case.ts`

Core permission checking logic with caching and context awareness.

```typescript
@injectable()
export class CheckPermissionUseCase {
  async execute(request: CheckPermissionRequest): Promise<boolean> {
    const { userId, permission, context } = request;

    // Try cache first
    let userPermissions = permissionCache.get(userId);

    if (!userPermissions) {
      // Fetch from database
      userPermissions =
        await this.userRoleRepository.getUserPermissions(userId);
      permissionCache.set(userId, userPermissions);
    }

    // Check exact permission match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Handle :own permissions with context
    if (permission.endsWith(":own") && context?.resourceOwnerId) {
      return context.resourceOwnerId === userId;
    }

    return false;
  }
}
```

### Permission Check Flow

```
┌────────────────────────────────────────────────────────────────┐
│                  Permission Check Sequence                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User clicks "Delete Task" button                           │
│     ↓                                                           │
│  2. UI Layer: PermissionButton checks client-side permission   │
│     • If no permission → button hidden/disabled                │
│     • If has permission → onClick handler fires                │
│     ↓                                                           │
│  3. Server Action: deleteTaskAction(taskId)                    │
│     • requirePermission(PERMISSIONS.TASKS_DELETE)              │
│     • Throws InsufficientPermissionsError if denied            │
│     ↓                                                           │
│  4. Use Case: DeleteTaskUseCase.execute()                      │
│     • CheckPermissionUseCase.execute()                         │
│     • Checks cache first (5-min TTL)                           │
│     • Fetches from DB if cache miss                            │
│     • Handles :own context awareness                           │
│     • Returns boolean result                                   │
│     ↓                                                           │
│  5. Database: user_roles → role_permissions → permissions      │
│     • Join tables to get user's effective permissions          │
│     • Filter by isActive status                                │
│     • Check for expiration (UserRole.expiresAt)                │
│     ↓                                                           │
│  6. Result: Permission granted or denied                       │
│     • Granted → execute business logic                         │
│     • Denied → throw error, log attempt                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### In-Memory Permission Cache

**Location**: `src/lib/permissions/cache.ts`

```typescript
interface CachedPermissions {
  permissions: PermissionKey[];
  timestamp: number;
  expiresAt: number;
}

class PermissionCache {
  private cache = new Map<string, CachedPermissions>();

  // Configuration
  TTL = 5 * 60 * 1000; // 5 minutes
  MAX_SIZE = 1000; // 1000 users max

  get(userId: string): PermissionKey[] | null {
    const cached = this.cache.get(userId);

    if (!cached || Date.now() > cached.expiresAt) {
      return null; // Cache miss or expired
    }

    return cached.permissions;
  }

  set(userId: string, permissions: PermissionKey[]): void {
    // LRU eviction if cache full
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(userId, {
      permissions,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.TTL,
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
```

### Cache Invalidation

**When to invalidate**:

```typescript
// Invalidate specific user when their roles change
permissionCache.invalidate(userId);

// Invalidate all users when role/permission definitions change
permissionCache.invalidateAll();
```

**Automatic invalidation**:

- Role assignment/removal for user → `invalidate(userId)`
- Permission added/removed from role → `invalidateAll()`
- Role created/deleted → `invalidateAll()`
- Permission created/deleted → `invalidateAll()`

### Performance Metrics

| Metric             | Value                |
| ------------------ | -------------------- |
| Cache hit latency  | ~1ms                 |
| Cache miss latency | ~50-100ms (DB query) |
| TTL                | 5 minutes            |
| Max cache size     | 1000 users           |
| Cleanup interval   | 1 minute             |

---

## Audit Logging

### Audit Log Structure

All RBAC mutations are logged to the `audit_logs` table:

```typescript
interface AuditLogEntry {
  id: string;
  userId: string | null; // Who performed the action
  action: string; // e.g., "role.create", "permission.delete"
  entityType: string; // e.g., "Role", "Permission", "UserRole"
  entityId: string | null; // ID of affected entity
  changes: Json | null; // Before/after snapshots
  metadata: Json | null; // Additional context
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: DateTime;
}
```

### Audited Actions

| Action                   | Entity Type    | Changes Logged          |
| ------------------------ | -------------- | ----------------------- |
| `role.create`            | Role           | New role data           |
| `role.update`            | Role           | Before/after diff       |
| `role.delete`            | Role           | Deleted role data       |
| `permission.create`      | Permission     | New permission data     |
| `permission.update`      | Permission     | Before/after diff       |
| `permission.delete`      | Permission     | Deleted permission data |
| `user_role.assign`       | UserRole       | User ID, Role ID        |
| `user_role.remove`       | UserRole       | User ID, Role ID        |
| `role_permission.assign` | RolePermission | Role ID, Permission ID  |
| `role_permission.remove` | RolePermission | Role ID, Permission ID  |

### Viewing Audit Logs

Admin users can view audit logs at `/admin/audit-logs`:

- Filter by user, action, entity type, date range
- Export to CSV/JSON
- View detailed change diff
- Search by entity ID

---

## Context-Aware Permissions

### Ownership-Based Permissions

Permissions ending with `:own` are **context-aware** - they check resource ownership:

```typescript
// Permission definitions
TASKS_UPDATE: "tasks:update",          // Update any task
TASKS_UPDATE_OWN: "tasks:update:own",  // Update only own tasks
TASKS_DELETE: "tasks:delete",          // Delete any task
TASKS_DELETE_OWN: "tasks:delete:own",  // Delete only own tasks
```

### Context Interface

```typescript
export interface PermissionContext {
  resourceOwnerId?: string; // ID of resource owner
  [key: string]: unknown; // Additional context
}
```

### Usage Example

```typescript
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function updateTaskAction(taskId: string, data: UpdateTaskDTO) {
  // Get current user
  const userId = await getCurrentUserId();

  // Get task to check ownership
  const task = await getTask(taskId);

  // Check permission with ownership context
  await requirePermission(PERMISSIONS.TASKS_UPDATE, {
    resourceOwnerId: task.createdBy,
  });

  // Execute update
  return updateTask(taskId, data);
}
```

### Permission Resolution Logic

```typescript
// In CheckPermissionUseCase
async execute(request: CheckPermissionRequest): Promise<boolean> {
  const { userId, permission, context } = request;

  // Get user's permissions from cache/DB
  const userPermissions = await this.getUserPermissions(userId);

  // 1. Check exact permission match
  if (userPermissions.includes(permission)) {
    return true;
  }

  // 2. Handle :own permissions
  if (permission.endsWith(":own") && context?.resourceOwnerId) {
    // User has base permission (tasks:update) OR specific :own permission
    const basePermission = permission.replace(":own", "");

    if (userPermissions.includes(basePermission) ||
        userPermissions.includes(permission)) {
      // Check ownership
      return context.resourceOwnerId === userId;
    }
  }

  return false;
}
```

### Common Ownership Patterns

| Scenario                   | Permission Check      | Context                                 |
| -------------------------- | --------------------- | --------------------------------------- |
| User edits own task        | `tasks:update:own`    | `{ resourceOwnerId: task.createdBy }`   |
| Admin edits any task       | `tasks:update`        | No context needed                       |
| User deletes own comment   | `comments:delete:own` | `{ resourceOwnerId: comment.authorId }` |
| Manager views team reports | `reports:view:team`   | `{ teamId: user.teamId }`               |

---

## Security Considerations

### System Protection

**System roles and permissions cannot be deleted**:

```typescript
// Attempting to delete system role
if (role.isSystem) {
  throw new SystemRoleModificationError(role.name);
}

// Attempting to delete system permission
if (permission.isSystem) {
  throw new SystemPermissionModificationError(permission.name);
}
```

System entities (created during seed):

- Roles: `admin`, `manager`, `editor`, `viewer`
- All permissions in `PERMISSIONS` constant

### First User Admin Assignment

The first user to sign in automatically receives the admin role via Better Auth hook.

**See**: [docs/guides/FIRST_USER_ADMIN.md](../guides/FIRST_USER_ADMIN.md)

### Permission Denial Errors

```typescript
export class InsufficientPermissionsError extends RBACError {
  constructor(
    public readonly requiredPermission: string,
    public readonly userId?: string,
  ) {
    super(`Insufficient permissions: ${requiredPermission} required`);
    this.name = "InsufficientPermissionsError";
  }
}
```

**Handling**:

```typescript
try {
  await requirePermission(PERMISSIONS.TASKS_DELETE);
} catch (error) {
  if (error instanceof InsufficientPermissionsError) {
    return {
      success: false,
      error: "You don't have permission to delete tasks",
    };
  }
  throw error;
}
```

### Best Practices

1. **Never trust client-side checks** - Always validate on server
2. **Use type-safe permission constants** - Import from `permission-key.ts`
3. **Invalidate cache on mutations** - Call `permissionCache.invalidateAll()`
4. **Log permission denials** - Use structured logging with context
5. **Provide user-friendly errors** - Don't expose internal permission keys
6. **Use context for ownership** - Pass `resourceOwnerId` when checking `:own` permissions
7. **Audit all RBAC changes** - Every role/permission mutation should create audit log
8. **Expire temporary access** - Use `UserRole.expiresAt` for time-limited roles
9. **Test permission logic** - Unit test use cases with mocked repositories
10. **Monitor cache performance** - Track hit rate and invalidation frequency

---

## Related Documentation

- [RBAC Developer Guide](../guides/RBAC_DEVELOPER_GUIDE.md) - How to add permissions and protect routes
- [RBAC Admin Guide](../guides/RBAC_ADMIN_GUIDE.md) - User guide for managing roles and permissions
- [First User Admin](../guides/FIRST_USER_ADMIN.md) - First-time setup wizard
- [Audit Logging](../guides/LOGGING.md) - Complete logging documentation
- [Clean Architecture](./ARCHITECTURE.md) - Overall system architecture

---

## Summary

The RBAC system provides:

- **Type-safe** - All permissions defined as TypeScript constants
- **Performant** - In-memory caching with 5-minute TTL
- **Secure** - Multi-layer enforcement (UI, Route, Action, Use Case)
- **Auditable** - Complete trail of all RBAC changes
- **Flexible** - Custom roles with any permission combination
- **Context-aware** - Ownership-based permissions with `:own` suffix
- **Protected** - System roles/permissions cannot be deleted
- **Scalable** - Clean Architecture with dependency injection
