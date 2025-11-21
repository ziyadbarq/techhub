# RBAC Implementation Plan

## Full Role-Based Access Control System for Next.js 16

**Project**: barq-assets
**Stack**: Next.js 16, Better Auth, Prisma (PostgreSQL), TypeScript, Clean Architecture
**Goal**: Dynamic, database-driven RBAC with centralized admin UI and multi-layer enforcement

---

## Overview

This plan implements a production-ready RBAC system with:

- ✅ **Better Auth** integration (cloned from email-task-manager)
- ✅ **Dynamic permissions** managed via admin UI
- ✅ **Multi-layer enforcement** (UI, Route, Server Action, Use Case, Repository)
- ✅ **Context-aware permissions** (ownership, resource-level)
- ✅ **Single tenant** with global roles
- ✅ **Type-safe** permission checking across all layers

---

## Phase 1: Better Auth Integration & Setup

### 1.1 Clone Authentication System

**Goal**: Migrate Better Auth from email-task-manager to barq-assets

**Tasks**:

- [ ] Install Better Auth dependencies
  - `better-auth@^1.0.9`
  - Update `next.config.ts` with `serverExternalPackages`
- [ ] Copy authentication files from email-task-manager:
  - `src/lib/auth/better-auth.ts` → Configure Better Auth with Prisma
  - `src/lib/auth/client.ts` → Client-side auth utilities
  - `src/lib/auth/session.ts` → Server-side session helpers
  - `src/lib/auth/encryption.ts` → Token encryption (AES-256-GCM)
  - `src/lib/auth/index.ts` → Central exports
- [ ] Create API route handler
  - `src/app/api/auth/[...all]/route.ts`
- [ ] Update proxy for route protection
  - `proxy.ts` → Session validation and redirects
- [ ] Add environment variables to `.env.local`:

  ```bash
  # Better Auth
  AUTH_SECRET="generate-with-openssl-rand-base64-32"
  BETTER_AUTH_URL="http://localhost:3000"

  # Microsoft OAuth (if using OAuth)
  MICROSOFT_CLIENT_ID=""
  MICROSOFT_CLIENT_SECRET=""
  MICROSOFT_TENANT_ID="common"

  # Token Encryption
  ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
  ```

**Files Created/Modified**:

- `src/lib/auth/` (5 files)
- `src/app/api/auth/[...all]/route.ts`
- `proxy.ts`
- `.env.local`
- `next.config.ts`

---

## Phase 2: Database Schema for RBAC

### 2.1 Extend Prisma Schema

**Goal**: Add database models for roles, permissions, and audit logging

**Tasks**:

- [ ] Update Better Auth models (User, Account, Session, Verification)
- [ ] Add RBAC models to `src/infrastructure/database/prisma/schema.prisma`:

```prisma
// ============================================================================
// RBAC MODELS
// ============================================================================

model Role {
  id          String   @id @default(cuid())
  name        String   @unique // "admin", "manager", "editor", "viewer"
  displayName String   // "Administrator", "Manager", etc.
  description String?
  isSystem    Boolean  @default(false) // Prevent deletion of system roles
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?

  // Relations
  permissions RolePermission[]
  users       UserRole[]

  @@index([name])
  @@index([isActive])
  @@map("roles")
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique // "users:create", "tasks:delete", "reports:view"
  displayName String   // "Create Users", "Delete Tasks", etc.
  description String?
  resource    String   // "users", "tasks", "reports", "settings"
  action      String   // "create", "read", "update", "delete", "manage"
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  roles       RolePermission[]

  @@index([resource, action])
  @@index([isActive])
  @@map("permissions")
}

model RolePermission {
  id           String @id @default(cuid())
  roleId       String
  permissionId String

  createdAt    DateTime @default(now())

  // Relations
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String

  // Optional: Role expiration
  expiresAt DateTime?

  createdAt DateTime @default(now())
  createdBy String?  // Admin who assigned the role

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?

  // Event details
  action     String   // "role:assign", "permission:grant", "user:create", etc.
  entityType String   // "role", "permission", "user", "task"
  entityId   String?

  // Change tracking
  changes    Json?    // { before: {...}, after: {...} }
  metadata   Json?    // { ipAddress, userAgent, resource, etc. }

  // Request context
  ipAddress  String?
  userAgent  String?

  createdAt  DateTime @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([entityType, entityId])
  @@index([action])
  @@map("audit_logs")
}

// Update User model to add relation
model User {
  // ... existing fields
  roles UserRole[]
}
```

- [ ] Generate Prisma client and Zod schemas
  ```bash
  npm run db:generate
  ```
- [ ] Create and run migration
  ```bash
  npm run db:migrate
  # Or for development:
  npm run db:push
  ```
- [ ] Create seed data for system roles and permissions
  - `src/infrastructure/database/prisma/seed-rbac.ts`

**Files Created/Modified**:

- `src/infrastructure/database/prisma/schema.prisma`
- `src/infrastructure/database/prisma/seed-rbac.ts`

---

## Phase 3: Core RBAC Infrastructure (Clean Architecture)

### 3.1 Domain Layer

**Goal**: Define RBAC entities and business rules

**Tasks**:

- [ ] Create domain entities:
  - `src/core/domain/entities/role.entity.ts`
  - `src/core/domain/entities/permission.entity.ts`
  - `src/core/domain/entities/user-role.entity.ts`
- [ ] Create value objects:
  - `src/core/domain/value-objects/permission-key.ts` (e.g., "users:create")
- [ ] Define domain errors:
  - `src/core/domain/errors/rbac-errors.ts`
    - `InsufficientPermissionsError`
    - `RoleNotFoundError`
    - `PermissionDeniedError`

**Files Created**:

- `src/core/domain/entities/role.entity.ts`
- `src/core/domain/entities/permission.entity.ts`
- `src/core/domain/entities/user-role.entity.ts`
- `src/core/domain/value-objects/permission-key.ts`
- `src/core/domain/errors/rbac-errors.ts`

### 3.2 Repository Layer

**Goal**: Define repository interfaces for RBAC

**Tasks**:

- [ ] Create repository interfaces:
  - `src/core/repositories/role-repository.interface.ts`
  - `src/core/repositories/permission-repository.interface.ts`
  - `src/core/repositories/user-role-repository.interface.ts`
  - `src/core/repositories/audit-log-repository.interface.ts`

**Files Created**:

- `src/core/repositories/role-repository.interface.ts`
- `src/core/repositories/permission-repository.interface.ts`
- `src/core/repositories/user-role-repository.interface.ts`
- `src/core/repositories/audit-log-repository.interface.ts`

### 3.3 Use Cases Layer

**Goal**: Implement business logic for RBAC operations

**Tasks**:

- [ ] Role management use cases:
  - `src/core/use-cases/rbac/create-role.use-case.ts`
  - `src/core/use-cases/rbac/update-role.use-case.ts`
  - `src/core/use-cases/rbac/delete-role.use-case.ts`
  - `src/core/use-cases/rbac/list-roles.use-case.ts`
  - `src/core/use-cases/rbac/get-role.use-case.ts`
- [ ] Permission management use cases:
  - `src/core/use-cases/rbac/create-permission.use-case.ts`
  - `src/core/use-cases/rbac/update-permission.use-case.ts`
  - `src/core/use-cases/rbac/delete-permission.use-case.ts`
  - `src/core/use-cases/rbac/list-permissions.use-case.ts`
  - `src/core/use-cases/rbac/assign-permissions-to-role.use-case.ts`
- [ ] User role management use cases:
  - `src/core/use-cases/rbac/assign-role-to-user.use-case.ts`
  - `src/core/use-cases/rbac/revoke-role-from-user.use-case.ts`
  - `src/core/use-cases/rbac/get-user-permissions.use-case.ts`
  - `src/core/use-cases/rbac/check-permission.use-case.ts`

**Files Created**:

- `src/core/use-cases/rbac/` (14+ files)

### 3.4 Infrastructure Layer

**Goal**: Implement Prisma repositories for RBAC

**Tasks**:

- [ ] Create Prisma repositories:
  - `src/infrastructure/repositories/prisma-role.repository.ts`
  - `src/infrastructure/repositories/prisma-permission.repository.ts`
  - `src/infrastructure/repositories/prisma-user-role.repository.ts`
  - `src/infrastructure/repositories/prisma-audit-log.repository.ts`
- [ ] Add structured logging to all repositories

**Files Created**:

- `src/infrastructure/repositories/prisma-role.repository.ts`
- `src/infrastructure/repositories/prisma-permission.repository.ts`
- `src/infrastructure/repositories/prisma-user-role.repository.ts`
- `src/infrastructure/repositories/prisma-audit-log.repository.ts`

### 3.5 Dependency Injection

**Goal**: Register RBAC services in DI container

**Tasks**:

- [ ] Add RBAC tokens to `src/di/types.ts`:

  ```typescript
  // Repositories
  RoleRepository: Symbol.for("RoleRepository"),
  PermissionRepository: Symbol.for("PermissionRepository"),
  UserRoleRepository: Symbol.for("UserRoleRepository"),
  AuditLogRepository: Symbol.for("AuditLogRepository"),

  // Use Cases
  CreateRoleUseCase: Symbol.for("CreateRoleUseCase"),
  AssignRoleToUserUseCase: Symbol.for("AssignRoleToUserUseCase"),
  CheckPermissionUseCase: Symbol.for("CheckPermissionUseCase"),
  // ... all other use cases
  ```

- [ ] Bind RBAC services in `src/di/container.ts`

**Files Modified**:

- `src/di/types.ts`
- `src/di/container.ts`

---

## Phase 4: Permission Checking System

### 4.1 Permission Checking Utilities

**Goal**: Create centralized permission validation

**Tasks**:

- [ ] Create permission utilities:
  - `src/lib/permissions/check-permission.ts` - Core permission checker
  - `src/lib/permissions/permission-keys.ts` - Type-safe permission constants
  - `src/lib/permissions/context.ts` - Permission context (userId, resourceId, etc.)
- [ ] Create server-side permission helpers:
  - `src/lib/permissions/server.ts`:
    - `requirePermission()` - Throw error if no permission
    - `hasPermission()` - Return boolean
    - `requireRole()` - Check role membership
- [ ] Create client-side hooks:
  - `src/hooks/use-permissions.ts` - React hook for permission checking
  - `src/hooks/use-has-permission.ts` - Simple boolean hook

**Example Permission Keys**:

```typescript
// src/lib/permissions/permission-keys.ts
export const PERMISSIONS = {
  // Users
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  // Tasks
  TASKS_VIEW: "tasks:view",
  TASKS_CREATE: "tasks:create",
  TASKS_UPDATE: "tasks:update",
  TASKS_DELETE: "tasks:delete",
  TASKS_UPDATE_OWN: "tasks:update:own", // Context-aware

  // Roles & Permissions
  ROLES_VIEW: "roles:view",
  ROLES_MANAGE: "roles:manage",
  PERMISSIONS_MANAGE: "permissions:manage",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
```

**Files Created**:

- `src/lib/permissions/check-permission.ts`
- `src/lib/permissions/permission-keys.ts`
- `src/lib/permissions/context.ts`
- `src/lib/permissions/server.ts`
- `src/hooks/use-permissions.ts`
- `src/hooks/use-has-permission.ts`

### 4.2 Context-Aware Permissions

**Goal**: Support ownership-based permissions (e.g., "can edit own tasks")

**Tasks**:

- [ ] Create permission context system:
  - User can edit their own resources
  - Managers can edit team resources
  - Admins can edit all resources
- [ ] Implement in `check-permission.ts`:

  ```typescript
  interface PermissionContext {
    userId: string;
    resourceOwnerId?: string;
    departmentId?: string;
    // ... other context
  }

  async function checkPermission(
    userId: string,
    permission: PermissionKey,
    context?: PermissionContext,
  ): Promise<boolean>;
  ```

**Files Modified**:

- `src/lib/permissions/check-permission.ts`
- `src/lib/permissions/context.ts`

---

## Phase 5: Middleware & Route Protection

### 5.1 Enhanced Middleware

**Goal**: Add RBAC enforcement to Next.js proxy

**Tasks**:

- [ ] Update `proxy.ts`:
  - Session validation (already done from Better Auth)
  - Add role-based route protection
  - Add permission-based route protection
- [ ] Create route configuration:
  - `src/config/protected-routes.ts`:
    ```typescript
    export const PROTECTED_ROUTES = {
      "/admin": {
        requiredPermissions: [PERMISSIONS.ROLES_MANAGE],
      },
      "/admin/roles": {
        requiredPermissions: [PERMISSIONS.ROLES_MANAGE],
      },
      "/admin/users": {
        requiredPermissions: [PERMISSIONS.USERS_MANAGE],
      },
      "/tasks": {
        requiredPermissions: [PERMISSIONS.TASKS_VIEW],
      },
    };
    ```

**Note**: For Next.js 16, proxy permissions should be lightweight (role checks only). Full permission validation should happen in server actions and use cases.

**Files Modified**:

- `proxy.ts`
- `src/config/protected-routes.ts` (new)

### 5.2 Server Action Protection

**Goal**: Protect all server actions with permission checks

**Tasks**:

- [ ] Create permission decorator/wrapper:
  - `src/interface-adapters/decorators/require-permission.ts`
- [ ] Update all existing controllers to use permission checks
- [ ] Pattern for server actions:

  ```typescript
  // src/interface-adapters/controllers/task.controller.ts
  "use server";

  import { requirePermission } from "@/lib/permissions/server";
  import { PERMISSIONS } from "@/lib/permissions/permission-keys";

  export async function deleteTaskAction(formData: FormData) {
    // Check permission before executing use case
    await requirePermission(PERMISSIONS.TASKS_DELETE);

    // ... rest of controller logic
  }
  ```

**Files Created/Modified**:

- `src/interface-adapters/decorators/require-permission.ts`
- All controllers in `src/interface-adapters/controllers/`

---

## Phase 6: UI Components & Admin Dashboard

### 6.1 Permission Guard Components

**Goal**: Create reusable components for permission-based rendering

**Tasks**:

- [ ] Create UI guard components:
  - `src/components/auth/PermissionGuard.tsx`:
    ```tsx
    interface PermissionGuardProps {
      permission: PermissionKey;
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }
    ```
  - `src/components/auth/RoleGuard.tsx`:
    ```tsx
    interface RoleGuardProps {
      roles: string[];
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }
    ```
  - `src/components/auth/PermissionButton.tsx` - Button that auto-hides without permission
  - `src/components/auth/PermissionLink.tsx` - Link that auto-hides without permission

**Usage Example**:

```tsx
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions/permission-keys";

export function TaskList() {
  return (
    <div>
      <PermissionGuard permission={PERMISSIONS.TASKS_CREATE}>
        <Button>Create Task</Button>
      </PermissionGuard>

      <PermissionGuard
        permission={PERMISSIONS.TASKS_DELETE}
        fallback={<p>You cannot delete tasks</p>}
      >
        <Button variant="destructive">Delete Task</Button>
      </PermissionGuard>
    </div>
  );
}
```

**Files Created**:

- `src/components/auth/PermissionGuard.tsx`
- `src/components/auth/RoleGuard.tsx`
- `src/components/auth/PermissionButton.tsx`
- `src/components/auth/PermissionLink.tsx`

### 6.2 Admin Dashboard - Roles Management

**Goal**: Build admin UI for creating and managing roles

**Tasks**:

- [ ] Create admin layout:
  - `src/app/admin/layout.tsx` - Admin shell with permission check
- [ ] Roles management pages:
  - `src/app/admin/roles/page.tsx` - List all roles (TanStack Table)
  - `src/app/admin/roles/new/page.tsx` - Create new role
  - `src/app/admin/roles/[id]/page.tsx` - Edit role details
  - `src/app/admin/roles/[id]/permissions/page.tsx` - Assign permissions to role
- [ ] Create role components:
  - `src/components/admin/roles/RoleTable.tsx` - Data table with actions
  - `src/components/admin/roles/RoleForm.tsx` - Create/edit role form (React Hook Form + Zod)
  - `src/components/admin/roles/PermissionAssignment.tsx` - Multi-select permission UI
- [ ] Create role controllers:
  - `src/interface-adapters/controllers/role.controller.ts`
- [ ] Create role DTOs:
  - `src/interface-adapters/dtos/role.dto.ts`

**Files Created**:

- `src/app/admin/layout.tsx`
- `src/app/admin/roles/` (4+ pages)
- `src/components/admin/roles/` (3+ components)
- `src/interface-adapters/controllers/role.controller.ts`
- `src/interface-adapters/dtos/role.dto.ts`

### 6.3 Admin Dashboard - Permissions Management

**Goal**: Build admin UI for creating and managing permissions

**Tasks**:

- [ ] Permissions management pages:
  - `src/app/admin/permissions/page.tsx` - List all permissions
  - `src/app/admin/permissions/new/page.tsx` - Create new permission
  - `src/app/admin/permissions/[id]/page.tsx` - Edit permission
- [ ] Create permission components:
  - `src/components/admin/permissions/PermissionTable.tsx`
  - `src/components/admin/permissions/PermissionForm.tsx`
  - `src/components/admin/permissions/ResourceSelector.tsx` - Select resource type
  - `src/components/admin/permissions/ActionSelector.tsx` - Select action type
- [ ] Create permission controllers:
  - `src/interface-adapters/controllers/permission.controller.ts`
- [ ] Create permission DTOs:
  - `src/interface-adapters/dtos/permission.dto.ts`

**Files Created**:

- `src/app/admin/permissions/` (3+ pages)
- `src/components/admin/permissions/` (4+ components)
- `src/interface-adapters/controllers/permission.controller.ts`
- `src/interface-adapters/dtos/permission.dto.ts`

### 6.4 Admin Dashboard - User Role Assignment

**Goal**: Build admin UI for assigning roles to users

**Tasks**:

- [ ] User management pages:
  - `src/app/admin/users/page.tsx` - List all users with roles
  - `src/app/admin/users/[id]/page.tsx` - View user details
  - `src/app/admin/users/[id]/roles/page.tsx` - Assign/revoke roles
- [ ] Create user role components:
  - `src/components/admin/users/UserTable.tsx` - Users with role badges
  - `src/components/admin/users/RoleAssignment.tsx` - Multi-select role UI
  - `src/components/admin/users/UserRoleHistory.tsx` - Show role changes over time
- [ ] Create user role controllers:
  - `src/interface-adapters/controllers/user-role.controller.ts`
- [ ] Create user role DTOs:
  - `src/interface-adapters/dtos/user-role.dto.ts`

**Files Created**:

- `src/app/admin/users/` (3+ pages)
- `src/components/admin/users/` (3+ components)
- `src/interface-adapters/controllers/user-role.controller.ts`
- `src/interface-adapters/dtos/user-role.dto.ts`

### 6.5 Admin Dashboard - Audit Logs

**Goal**: Build audit log viewer for tracking RBAC changes

**Tasks**:

- [ ] Audit log pages:
  - `src/app/admin/audit-logs/page.tsx` - List all audit logs (filterable)
- [ ] Create audit log components:
  - `src/components/admin/audit/AuditLogTable.tsx` - TanStack Table with filters
  - `src/components/admin/audit/AuditLogFilters.tsx` - Filter by user, action, date
  - `src/components/admin/audit/AuditLogDetails.tsx` - Expandable row with JSON diff
- [ ] Create audit log controller:
  - `src/interface-adapters/controllers/audit-log.controller.ts`

**Files Created**:

- `src/app/admin/audit-logs/page.tsx`
- `src/components/admin/audit/` (3+ components)
- `src/interface-adapters/controllers/audit-log.controller.ts`

---

## Phase 7: Navigation & Sidebar Integration

### 7.1 Update Navigation Configuration

**Goal**: Replace mock permissions with real RBAC

**Tasks**:

- [ ] Update `src/config/navigation.ts`:
  - Replace mock permission checks with real permission keys
  - Add permission-based navigation filtering
- [ ] Update `src/components/layout/Sidebar.tsx`:
  - Remove mock permission system from `src/lib/permissions.ts`
  - Integrate with `usePermissions()` hook
  - Filter navigation items based on user permissions
- [ ] Update badge system:
  - Connect `use-badge-updates.ts` to real notification counts from database

**Example Navigation Config**:

```typescript
// src/config/navigation.ts
import { PERMISSIONS } from "@/lib/permissions/permission-keys";

export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        permission: PERMISSIONS.TASKS_VIEW,
      },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    permission: PERMISSIONS.ROLES_VIEW, // Group-level permission
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        title: "Roles",
        href: "/admin/roles",
        icon: Shield,
        permission: PERMISSIONS.ROLES_MANAGE,
      },
      {
        title: "Permissions",
        href: "/admin/permissions",
        icon: Lock,
        permission: PERMISSIONS.PERMISSIONS_MANAGE,
      },
      {
        title: "Audit Logs",
        href: "/admin/audit-logs",
        icon: FileText,
        permission: PERMISSIONS.AUDIT_LOGS_VIEW,
      },
    ],
  },
];
```

**Files Modified**:

- `src/config/navigation.ts`
- `src/components/layout/Sidebar.tsx`
- `src/lib/permissions.ts` (delete mock system)

---

## Phase 8: Existing Feature Integration

### 8.1 Protect Existing Features

**Goal**: Add RBAC to existing Task CRUD operations

**Tasks**:

- [ ] Update task controllers:
  - `src/interface-adapters/controllers/task.controller.ts`
    - Add permission checks to all actions
    - Support context-aware permissions (own vs all tasks)
- [ ] Update task use cases:
  - `src/core/use-cases/task/create-task.use-case.ts` - Check TASKS_CREATE
  - `src/core/use-cases/task/update-task.use-case.ts` - Check TASKS_UPDATE or TASKS_UPDATE_OWN
  - `src/core/use-cases/task/delete-task.use-case.ts` - Check TASKS_DELETE
- [ ] Update task UI components:
  - `src/components/tasks/` - Add PermissionGuard to buttons
- [ ] Update task pages:
  - `src/app/tasks/` - Add permission checks

**Files Modified**:

- `src/interface-adapters/controllers/task.controller.ts`
- `src/core/use-cases/task/*.use-case.ts`
- `src/components/tasks/*`
- `src/app/tasks/*`

### 8.2 AI Services Permission (Future)

**Goal**: Protect AI services module when enabled

**Tasks**:

- [ ] Add AI-related permissions:
  - `AI_PROMPTS_VIEW`
  - `AI_PROMPTS_MANAGE`
  - `AI_DEBUG_MODE_ACCESS`
- [ ] Update AI service use cases with permission checks
- [ ] Protect AI admin routes

**Note**: Only implement when AI services module is uncommented in DI container.

---

## Phase 9: Seed Data & Initial Setup

### 9.1 Create System Roles & Permissions

**Goal**: Seed database with default RBAC configuration

**Tasks**:

- [ ] Create seed script: `src/infrastructure/database/prisma/seed-rbac.ts`
- [ ] Define system roles:
  ```typescript
  const systemRoles = [
    {
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      isSystem: true,
    },
    {
      name: "manager",
      displayName: "Manager",
      description: "Team management access",
      isSystem: true,
    },
    {
      name: "editor",
      displayName: "Editor",
      description: "Content editing access",
      isSystem: true,
    },
    {
      name: "viewer",
      displayName: "Viewer",
      description: "Read-only access",
      isSystem: true,
    },
  ];
  ```
- [ ] Define system permissions (resource:action pattern):

  ```typescript
  const systemPermissions = [
    // Users
    { name: "users:view", resource: "users", action: "view" },
    { name: "users:create", resource: "users", action: "create" },
    { name: "users:update", resource: "users", action: "update" },
    { name: "users:delete", resource: "users", action: "delete" },

    // Tasks
    { name: "tasks:view", resource: "tasks", action: "view" },
    { name: "tasks:create", resource: "tasks", action: "create" },
    { name: "tasks:update", resource: "tasks", action: "update" },
    { name: "tasks:update:own", resource: "tasks", action: "update:own" },
    { name: "tasks:delete", resource: "tasks", action: "delete" },

    // Roles & Permissions
    { name: "roles:view", resource: "roles", action: "view" },
    { name: "roles:manage", resource: "roles", action: "manage" },
    { name: "permissions:manage", resource: "permissions", action: "manage" },

    // Audit Logs
    { name: "audit-logs:view", resource: "audit-logs", action: "view" },
  ];
  ```

- [ ] Assign permissions to roles:
  - Admin: All permissions
  - Manager: All except role/permission management
  - Editor: CRUD on tasks, view users
  - Viewer: Read-only access
- [ ] Run seed:
  ```bash
  npm run db:seed
  ```

**Files Created**:

- `src/infrastructure/database/prisma/seed-rbac.ts`

### 9.2 First Admin User Setup

**Goal**: Assign admin role to initial user

**Tasks**:

- [ ] Create setup script or UI wizard:
  - `src/app/setup/page.tsx` - One-time setup wizard
  - Assign admin role to first authenticated user
  - Show only if no admin users exist
- [ ] Alternative: Manual assignment via Prisma Studio

  ```sql
  -- Find your user ID
  SELECT id, email FROM users;

  -- Assign admin role
  INSERT INTO user_roles (user_id, role_id)
  SELECT 'your-user-id', id FROM roles WHERE name = 'admin';
  ```

**Files Created** (optional):

- `src/app/setup/page.tsx`

---

## Phase 10: Testing & Validation

### 10.1 Unit Tests

**Goal**: Test RBAC business logic

**Tasks**:

- [ ] Test permission checking logic:
  - `src/lib/permissions/__tests__/check-permission.test.ts`
- [ ] Test use cases:
  - `src/core/use-cases/rbac/__tests__/*.test.ts`
- [ ] Test context-aware permissions:
  - Ownership checks
  - Resource-level permissions

**Files Created**:

- Test files in `__tests__` directories

### 10.2 Integration Tests

**Goal**: Test RBAC with database and API

**Tasks**:

- [ ] Test role assignment:
  - Create role → Assign permissions → Assign to user → Verify access
- [ ] Test permission enforcement:
  - User without permission → Action blocked
  - User with permission → Action allowed
- [ ] Test audit logging:
  - Verify all RBAC changes are logged

### 10.3 Manual Testing Checklist

**Goal**: Verify RBAC works end-to-end

**Tasks**:

- [ ] Admin Role Testing:
  - [ ] Can access all admin pages
  - [ ] Can create/edit/delete roles
  - [ ] Can create/edit/delete permissions
  - [ ] Can assign roles to users
  - [ ] Can view audit logs
- [ ] Manager Role Testing:
  - [ ] Can view tasks
  - [ ] Can manage team tasks
  - [ ] Cannot access admin pages
  - [ ] Cannot manage roles/permissions
- [ ] Editor Role Testing:
  - [ ] Can create/edit/delete own tasks
  - [ ] Cannot edit other users' tasks (unless context allows)
  - [ ] Cannot access admin pages
- [ ] Viewer Role Testing:
  - [ ] Can view tasks (read-only)
  - [ ] Cannot create/edit/delete tasks
  - [ ] Cannot access admin pages
- [ ] UI Testing:
  - [ ] Buttons/links hidden when user lacks permission
  - [ ] Navigation items filtered based on permissions
  - [ ] Permission guards work correctly
  - [ ] Proper error messages when access denied
- [ ] Server Action Testing:
  - [ ] All server actions check permissions
  - [ ] Proper 403 errors returned
  - [ ] Audit logs capture all changes

---

## Phase 11: Documentation

### 11.1 Developer Documentation

**Goal**: Document RBAC system for developers

**Tasks**:

- [ ] Create RBAC architecture guide:
  - `docs/architecture/RBAC_ARCHITECTURE.md`
  - Document permission model
  - Document role hierarchy
  - Document context-aware permissions
- [ ] Create RBAC developer guide:
  - `docs/guides/RBAC_DEVELOPER_GUIDE.md`
  - How to add new permissions
  - How to protect new routes/actions
  - How to use PermissionGuard components
  - How to implement context-aware permissions
- [ ] Update existing documentation:
  - Update `CLAUDE.md` with RBAC patterns
  - Update `docs/README.md` with RBAC links

**Files Created**:

- `docs/architecture/RBAC_ARCHITECTURE.md`
- `docs/guides/RBAC_DEVELOPER_GUIDE.md`

**Files Modified**:

- `CLAUDE.md`
- `docs/README.md`

### 11.2 Admin User Guide

**Goal**: Document RBAC for admin users

**Tasks**:

- [ ] Create admin user guide:
  - `docs/guides/RBAC_ADMIN_GUIDE.md`
  - How to create roles
  - How to create permissions
  - How to assign roles to users
  - How to view audit logs
  - Best practices for permission naming

**Files Created**:

- `docs/guides/RBAC_ADMIN_GUIDE.md`

---

## Phase 12: Performance & Optimization

### 12.1 Permission Caching

**Goal**: Cache user permissions for performance

**Tasks**:

- [ ] Implement permission caching:
  - Cache user permissions in session
  - Cache role permissions in memory
  - Invalidate cache on role/permission changes
- [ ] Add cache to `check-permission.ts`:
  ```typescript
  // Cache permissions in session for 5 minutes
  const userPermissions = await getCachedUserPermissions(userId);
  ```

**Files Modified**:

- `src/lib/permissions/check-permission.ts`
- `src/lib/auth/session.ts`

### 12.2 Database Optimization

**Goal**: Optimize RBAC queries

**Tasks**:

- [ ] Add database indexes (already in schema):
  - Role name index
  - Permission resource+action index
  - UserRole userId+roleId index
- [ ] Optimize permission checking queries:
  - Single query to fetch all user permissions
  - Use Prisma `include` to reduce round trips
- [ ] Add query logging to identify slow queries

**Files Modified**:

- `src/infrastructure/repositories/prisma-user-role.repository.ts`

---

## Success Criteria

### Functional Requirements

- ✅ Admin can create/edit/delete roles via UI
- ✅ Admin can create/edit/delete permissions via UI
- ✅ Admin can assign roles to users via UI
- ✅ Permissions are enforced at all layers (UI, Route, Server Action, Use Case)
- ✅ Users see only UI elements they have permission to access
- ✅ Context-aware permissions work (e.g., edit own vs all)
- ✅ All RBAC changes are logged in audit log
- ✅ System roles cannot be deleted

### Non-Functional Requirements

- ✅ Type-safe permission keys throughout application
- ✅ Permission checks have < 50ms latency (with caching)
- ✅ RBAC system integrates with existing Clean Architecture
- ✅ All RBAC code follows existing patterns (DI, repositories, use cases)
- ✅ Comprehensive documentation for developers and admins
- ✅ Minimal friction for adding new permissions

---

## Tech Stack Summary

**Authentication**: Better Auth v1.0.9
**Database**: PostgreSQL + Prisma
**Framework**: Next.js 16 + React 19 + TypeScript
**Architecture**: Clean Architecture (5 layers)
**DI**: InversifyJS
**Validation**: Zod
**UI Components**: shadcn/ui
**Tables**: TanStack Table v9
**Forms**: React Hook Form
**State**: Zustand (local state)
**Logging**: Pino (structured logs)

---

## Key Design Decisions

1. **Database-Driven Permissions**: All roles and permissions stored in PostgreSQL for runtime management via admin UI
2. **Resource:Action Pattern**: Permission naming follows `resource:action` format (e.g., `tasks:create`, `users:delete`)
3. **Context-Aware Permissions**: Support ownership and resource-level permissions (e.g., `tasks:update:own`)
4. **Multi-Layer Enforcement**: Permissions checked at UI, Route, Server Action, Use Case layers
5. **System vs Custom**: System roles/permissions cannot be deleted, custom ones can
6. **Audit Everything**: All RBAC changes logged with before/after state
7. **Type-Safe**: Permission keys defined as TypeScript constants, not magic strings
8. **Clean Architecture Integration**: RBAC follows same pattern as existing features (entities, use cases, repositories)

---

## Migration from Mock System

The existing sidebar has a mock permission system in `src/lib/permissions.ts`. Migration plan:

1. **Phase 7.1** removes the mock system
2. Navigation permissions are replaced with real database-driven permissions
3. Mock `hasPermission()` function is replaced with real permission checking
4. No breaking changes to navigation config structure
5. Badge updates remain the same, just connect to real data

---

## Future Enhancements (Post-MVP)

These features can be added after the core RBAC system is complete:

- [ ] **Permission Groups**: Group related permissions (e.g., "Task Management" group)
- [ ] **Temporary Permissions**: Time-limited permission grants
- [ ] **Permission Delegation**: Users can grant subset of their permissions to others
- [ ] **Resource-Level Permissions**: Per-resource permission overrides (e.g., "can edit Task #123")
- [ ] **Department/Team Scopes**: Multi-tenant-like permission scoping
- [ ] **API Key Permissions**: RBAC for API key-based access
- [ ] **Permission Templates**: Quick-start permission sets for common roles
- [ ] **Bulk Operations**: Assign roles/permissions to multiple users at once
- [ ] **Permission Analytics**: Track which permissions are most used
- [ ] **Approval Workflows**: Require approval for sensitive permission grants

---

## References

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Clerk RBAC Tutorial](https://clerk.com/blog/nextjs-role-based-access-control)
- [Building Scalable RBAC in Next.js](https://medium.com/@muhebollah.diu/building-a-scalable-role-based-access-control-rbac-system-in-next-js)
- [RBAC Best Practices 2025](https://commt.co/blog/rbac-in-nextjs-and-nextauth)

---

**Last Updated**: {{ current_date }}
**Status**: Planning Phase
**Next Step**: Begin Phase 1 - Better Auth Integration
