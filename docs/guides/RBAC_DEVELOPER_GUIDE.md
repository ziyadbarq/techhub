# RBAC Developer Guide

**Complete developer guide** for implementing Role-Based Access Control (RBAC) in the barq-assets.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Adding New Permissions](#adding-new-permissions)
3. [Protecting Routes](#protecting-routes)
4. [Protecting Server Actions](#protecting-server-actions)
5. [Protecting UI Components](#protecting-ui-components)
6. [Context-Aware Permissions](#context-aware-permissions)
7. [Client-Side Hooks](#client-side-hooks)
8. [Cache Invalidation](#cache-invalidation)
9. [Testing Permissions](#testing-permissions)
10. [Common Patterns](#common-patterns)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Understanding the Permission System

Every permission follows the **resource:action[:modifier]** pattern:

```typescript
"tasks:view"; // View all tasks
"tasks:create"; // Create new tasks
"tasks:update"; // Update any task
"tasks:update:own"; // Update only own tasks (ownership-based)
```

### Permission Check Workflow

```
User Action → UI Guard → Server Action → Use Case → Database → Cache
     ↓            ↓            ↓             ↓          ↓         ↓
  Click     PermissionButton  requirePermission  CheckPermission  5-min TTL
```

**Rule of thumb**: Always enforce permissions on the server, use UI guards for UX only.

---

## Adding New Permissions

### Step 1: Define Permission Constant

**Location**: `src/core/domain/value-objects/permission-key.ts`

```typescript
export const PERMISSIONS = {
  // ... existing permissions

  // Add your new permissions here
  PROJECTS_VIEW: "projects:view",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_UPDATE: "projects:update",
  PROJECTS_UPDATE_OWN: "projects:update:own", // Context-aware
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_DELETE_OWN: "projects:delete:own", // Context-aware
  PROJECTS_MANAGE: "projects:manage",
} as const;
```

**Naming conventions**:

- Use SCREAMING_SNAKE_CASE for constant names
- Use kebab-case for resource names in permission string
- Use lowercase for action names
- Add `_OWN` suffix to constant for ownership-based permissions
- Add `:own` suffix to permission string for ownership-based permissions

### Step 2: Create Database Seed Entry

**Location**: `src/infrastructure/database/prisma/seed-rbac.ts`

```typescript
const SYSTEM_PERMISSIONS = [
  // ... existing permissions

  // Projects
  {
    name: PERMISSIONS.PROJECTS_VIEW,
    displayName: "View Projects",
    description: "View project list and details",
    resource: "projects",
    action: "view",
  },
  {
    name: PERMISSIONS.PROJECTS_CREATE,
    displayName: "Create Projects",
    description: "Create new projects",
    resource: "projects",
    action: "create",
  },
  {
    name: PERMISSIONS.PROJECTS_UPDATE,
    displayName: "Update Projects",
    description: "Edit any project",
    resource: "projects",
    action: "update",
  },
  {
    name: PERMISSIONS.PROJECTS_UPDATE_OWN,
    displayName: "Update Own Projects",
    description: "Edit projects you own",
    resource: "projects",
    action: "update:own",
  },
  {
    name: PERMISSIONS.PROJECTS_DELETE,
    displayName: "Delete Projects",
    description: "Delete any project",
    resource: "projects",
    action: "delete",
  },
  {
    name: PERMISSIONS.PROJECTS_DELETE_OWN,
    displayName: "Delete Own Projects",
    description: "Delete projects you own",
    resource: "projects",
    action: "delete:own",
  },
  {
    name: PERMISSIONS.PROJECTS_MANAGE,
    displayName: "Manage Projects",
    description: "Full project management access",
    resource: "projects",
    action: "manage",
  },
];
```

### Step 3: Assign to Roles

```typescript
const SYSTEM_ROLES = {
  admin: {
    // ... existing config
    permissions: Object.values(PERMISSIONS), // Gets all permissions including new ones
  },
  manager: {
    // ... existing config
    permissions: [
      // ... existing permissions
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.PROJECTS_CREATE,
      PERMISSIONS.PROJECTS_UPDATE,
      PERMISSIONS.PROJECTS_DELETE,
    ],
  },
  editor: {
    // ... existing config
    permissions: [
      // ... existing permissions
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.PROJECTS_CREATE,
      PERMISSIONS.PROJECTS_UPDATE_OWN,
      PERMISSIONS.PROJECTS_DELETE_OWN,
    ],
  },
  viewer: {
    // ... existing config
    permissions: [
      // ... existing permissions
      PERMISSIONS.PROJECTS_VIEW,
    ],
  },
};
```

### Step 4: Run Database Seed

```bash
# Reset and reseed database (development only)
npm run reset

# Or just run seed (preserves existing data)
npm run db:seed
```

**Note**: Seeding is idempotent - safe to run multiple times. It upserts permissions and reassigns role permissions.

---

## Protecting Routes

### Method 1: Route Configuration (Declarative)

**Location**: `src/config/protected-routes.ts`

```typescript
export const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  // ... existing routes

  // Projects routes
  "/projects": {
    requiredPermissions: [PERMISSIONS.PROJECTS_VIEW],
    description: "Project list",
  },

  "/projects/new": {
    requiredPermissions: [PERMISSIONS.PROJECTS_CREATE],
    description: "Create new project",
  },

  "/projects/[id]": {
    requiredPermissions: [PERMISSIONS.PROJECTS_VIEW],
    description: "View project details (ownership checks apply for editing)",
  },

  "/projects/[id]/edit": {
    requiredPermissions: [PERMISSIONS.PROJECTS_UPDATE],
    description: "Edit project",
  },

  // Multiple permissions (OR logic - user needs ANY)
  "/admin/projects": {
    requiredPermissions: [
      PERMISSIONS.PROJECTS_MANAGE,
      PERMISSIONS.PROJECTS_DELETE,
    ],
    description: "Admin project management",
  },

  // Multiple permissions (AND logic - user needs ALL)
  "/projects/bulk-operations": {
    requiredAllPermissions: [
      PERMISSIONS.PROJECTS_UPDATE,
      PERMISSIONS.PROJECTS_DELETE,
    ],
    description: "Bulk project operations",
  },
};
```

### Method 2: Server Component Check

**Location**: `src/app/projects/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default async function ProjectsPage() {
  // Check permission in server component
  const canViewProjects = await hasPermission(PERMISSIONS.PROJECTS_VIEW);

  if (!canViewProjects) {
    redirect("/unauthorized");
  }

  // Render page
  return (
    <div>
      <h1>Projects</h1>
      {/* ... */}
    </div>
  );
}
```

### Method 3: Page-Level Permission Guard

```typescript
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default function ProjectsPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.PROJECTS_VIEW}
      fallback={<UnauthorizedPage />}
    >
      <ProjectsList />
    </PermissionGuard>
  );
}
```

---

## Protecting Server Actions

### Basic Permission Check

**Location**: `src/interface-adapters/controllers/project.controller.ts`

```typescript
"use server";

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { ActionResponse } from "./types";

export async function createProjectAction(
  data: CreateProjectDTO,
): Promise<ActionResponse<ProjectDTO>> {
  try {
    // Check permission (throws InsufficientPermissionsError if denied)
    await requirePermission(PERMISSIONS.PROJECTS_CREATE);

    // Get use case from DI container
    const container = getContainer();
    const createProject = container.get<CreateProjectUseCase>(
      DI_TOKENS.CreateProjectUseCase,
    );

    // Execute business logic
    const project = await createProject.execute(data);

    return {
      success: true,
      data: ProjectPresenter.toDTO(project),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createProjectAction" },
      "Failed to create project",
    );
  }
}
```

### With Ownership Context

```typescript
export async function updateProjectAction(
  projectId: string,
  data: UpdateProjectDTO,
): Promise<ActionResponse<ProjectDTO>> {
  try {
    // Get current user
    const userId = await getCurrentUserId();

    // Get project to check ownership
    const getProject = container.get<GetProjectUseCase>(
      DI_TOKENS.GetProjectUseCase,
    );
    const project = await getProject.execute({ projectId });

    // Check permission with ownership context
    await requirePermission(PERMISSIONS.PROJECTS_UPDATE, {
      resourceOwnerId: project.createdBy,
    });

    // Execute update
    const updateProject = container.get<UpdateProjectUseCase>(
      DI_TOKENS.UpdateProjectUseCase,
    );
    const updated = await updateProject.execute({ projectId, ...data });

    return {
      success: true,
      data: ProjectPresenter.toDTO(updated),
    };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to update project");
  }
}
```

### Multiple Permission Checks

```typescript
import { hasAll, hasAny } from "@/lib/permissions/server";

export async function bulkDeleteProjectsAction(
  projectIds: string[],
): Promise<ActionResponse<void>> {
  try {
    // User must have ALL of these permissions
    const hasAllPermissions = await hasAll([
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.PROJECTS_DELETE,
    ]);

    if (!hasAllPermissions) {
      throw new InsufficientPermissionsError("projects:bulk-delete");
    }

    // Execute deletion
    // ...

    return { success: true, data: undefined };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to bulk delete projects");
  }
}

export async function viewProjectAnalyticsAction(
  projectId: string,
): Promise<ActionResponse<AnalyticsDTO>> {
  try {
    // User must have ANY of these permissions (OR logic)
    const hasAnyPermission = await hasAny([
      PERMISSIONS.PROJECTS_MANAGE,
      PERMISSIONS.DASHBOARD_ANALYTICS,
    ]);

    if (!hasAnyPermission) {
      throw new InsufficientPermissionsError("analytics access");
    }

    // Execute analytics query
    // ...

    return { success: true, data: analytics };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to fetch analytics");
  }
}
```

---

## Protecting UI Components

### Component-Level Guards

**Location**: `src/components/projects/ProjectActions.tsx`

```typescript
"use client";

import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export function ProjectActions({ project }: { project: Project }) {
  return (
    <div className="flex gap-2">
      {/* Show/hide entire button */}
      <PermissionGuard permission={PERMISSIONS.PROJECTS_CREATE}>
        <Button onClick={handleCreate}>Create New Project</Button>
      </PermissionGuard>

      {/* Auto-hide button if no permission */}
      <PermissionButton
        permission={PERMISSIONS.PROJECTS_DELETE}
        variant="destructive"
        onClick={() => handleDelete(project.id)}
      >
        Delete
      </PermissionButton>

      {/* Disable button instead of hiding */}
      <PermissionButton
        permission={PERMISSIONS.PROJECTS_UPDATE}
        disableInsteadOfHide
        disabledMessage="You don't have permission to edit projects"
        onClick={() => handleEdit(project.id)}
      >
        Edit
      </PermissionButton>
    </div>
  );
}
```

### Multiple Permission Guards

```typescript
import {
  AllPermissionsGuard,
  AnyPermissionGuard,
} from "@/components/auth/PermissionGuard";

export function AdminProjectPanel() {
  return (
    <>
      {/* User must have ALL permissions (AND logic) */}
      <AllPermissionsGuard
        permissions={[
          PERMISSIONS.PROJECTS_VIEW,
          PERMISSIONS.PROJECTS_DELETE,
        ]}
      >
        <BulkDeleteButton />
      </AllPermissionsGuard>

      {/* User must have ANY permission (OR logic) */}
      <AnyPermissionGuard
        permissions={[
          PERMISSIONS.PROJECTS_MANAGE,
          PERMISSIONS.DASHBOARD_ANALYTICS,
        ]}
      >
        <AnalyticsPanel />
      </AnyPermissionGuard>
    </>
  );
}
```

### Permission-Aware Links

```typescript
import { PermissionLink } from "@/components/auth/PermissionLink";

export function ProjectNavigation() {
  return (
    <nav>
      <PermissionLink
        permission={PERMISSIONS.PROJECTS_VIEW}
        href="/projects"
      >
        All Projects
      </PermissionLink>

      <PermissionLink
        permission={PERMISSIONS.PROJECTS_CREATE}
        href="/projects/new"
      >
        Create Project
      </PermissionLink>

      {/* Disable link instead of hiding */}
      <PermissionLink
        permission={PERMISSIONS.PROJECTS_MANAGE}
        href="/admin/projects"
        disableInsteadOfHide
      >
        Admin Panel
      </PermissionLink>
    </nav>
  );
}
```

### Conditional Rendering with Fallback

```typescript
export function ProjectCard({ project }: { project: Project }) {
  return (
    <PermissionGuard
      permission={PERMISSIONS.PROJECTS_VIEW}
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view projects.
            </CardDescription>
          </CardHeader>
        </Card>
      }
      loading={<Skeleton className="h-40 w-full" />}
    >
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
      </Card>
    </PermissionGuard>
  );
}
```

---

## Context-Aware Permissions

### Ownership-Based Permissions

Context-aware permissions use the `:own` suffix to check resource ownership.

#### Step 1: Define Permission with :own

```typescript
export const PERMISSIONS = {
  PROJECTS_UPDATE: "projects:update", // Update any project
  PROJECTS_UPDATE_OWN: "projects:update:own", // Update only own projects
  PROJECTS_DELETE: "projects:delete", // Delete any project
  PROJECTS_DELETE_OWN: "projects:delete:own", // Delete only own projects
} as const;
```

#### Step 2: Store Owner ID in Database

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdBy   String?  // User ID of project owner
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdBy])
  @@map("projects")
}
```

#### Step 3: Check Permission with Context

```typescript
export async function updateProjectAction(
  projectId: string,
  data: UpdateProjectDTO,
): Promise<ActionResponse<ProjectDTO>> {
  try {
    const userId = await getCurrentUserId();

    // Get project to check ownership
    const project = await getProject(projectId);

    // Check permission with ownership context
    // This will check:
    // 1. If user has PROJECTS_UPDATE (can edit any project) → Allow
    // 2. If user has PROJECTS_UPDATE_OWN → Check if project.createdBy === userId
    await requirePermission(PERMISSIONS.PROJECTS_UPDATE, {
      resourceOwnerId: project.createdBy,
    });

    // Execute update
    const updated = await updateProject(projectId, data);

    return { success: true, data: ProjectPresenter.toDTO(updated) };
  } catch (error) {
    return handleControllerError(error, {}, "Failed to update project");
  }
}
```

#### Step 4: UI Shows/Hides Based on Ownership

```typescript
"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export function ProjectCard({ project, currentUserId }: Props) {
  const { hasPermission } = usePermissions();

  // Check if user can edit this specific project
  const canEdit =
    hasPermission(PERMISSIONS.PROJECTS_UPDATE) || // Can edit any project
    (hasPermission(PERMISSIONS.PROJECTS_UPDATE_OWN) &&
      project.createdBy === currentUserId); // Can edit own project

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardFooter>
        {canEdit && (
          <Button onClick={() => handleEdit(project.id)}>Edit</Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

### Advanced Context Examples

#### Team-Based Permissions

```typescript
// Permission: "reports:view:team"
export async function viewTeamReportsAction(
  reportId: string,
): Promise<ActionResponse<ReportDTO>> {
  const userId = await getCurrentUserId();
  const user = await getUser(userId);
  const report = await getReport(reportId);

  await requirePermission(PERMISSIONS.REPORTS_VIEW_TEAM, {
    resourceOwnerId: report.teamId,
    userTeamId: user.teamId,
  });

  // Custom context logic in CheckPermissionUseCase:
  // if (permission === "reports:view:team") {
  //   return context.resourceOwnerId === context.userTeamId;
  // }

  return { success: true, data: ReportPresenter.toDTO(report) };
}
```

#### Time-Based Permissions

```typescript
// Permission: "documents:view:archived"
export async function viewArchivedDocumentAction(
  documentId: string,
): Promise<ActionResponse<DocumentDTO>> {
  const document = await getDocument(documentId);

  await requirePermission(PERMISSIONS.DOCUMENTS_VIEW_ARCHIVED, {
    isArchived: document.isArchived,
    archivedAt: document.archivedAt,
  });

  return { success: true, data: DocumentPresenter.toDTO(document) };
}
```

---

## Client-Side Hooks

### usePermissions Hook

**Location**: `src/hooks/use-permissions.ts`

```typescript
"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export function MyComponent() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    isLoading,
  } = usePermissions();

  if (isLoading) {
    return <Skeleton />;
  }

  const canCreateProject = hasPermission(PERMISSIONS.PROJECTS_CREATE);
  const canManageOrView = hasAnyPermission([
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.PROJECTS_VIEW,
  ]);
  const canBulkDelete = hasAllPermissions([
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_DELETE,
  ]);

  return (
    <div>
      {canCreateProject && <CreateButton />}
      {canManageOrView && <ProjectsList />}
      {canBulkDelete && <BulkDeleteButton />}

      <div>
        You have {permissions.length} permissions:
        <ul>
          {permissions.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### useRoles Hook

```typescript
"use client";

import { useRoles } from "@/components/auth/RoleGuard";

export function MyComponent() {
  const { roles, hasRole, hasAnyRole, hasAllRoles, isLoading } = useRoles();

  if (isLoading) {
    return <Skeleton />;
  }

  const isAdmin = hasRole("admin");
  const isManagerOrEditor = hasAnyRole(["manager", "editor"]);
  const hasMultipleRoles = hasAllRoles(["editor", "viewer"]);

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {isManagerOrEditor && <ContentEditor />}

      <div>
        Your roles: {roles.join(", ")}
      </div>
    </div>
  );
}
```

---

## Cache Invalidation

### When to Invalidate

**Location**: `src/lib/permissions/cache.ts`

```typescript
import { invalidatePermissionCache } from "@/lib/permissions/cache";

// Invalidate specific user when their roles change
export async function assignRoleToUserAction(userId: string, roleId: string) {
  // ... assign role logic

  // Invalidate cache for this user only
  invalidatePermissionCache("user", userId);

  return { success: true };
}

// Invalidate all users when role/permission definitions change
export async function updateRolePermissionsAction(
  roleId: string,
  permissionIds: string[],
) {
  // ... update role permissions logic

  // Invalidate cache for ALL users (role definition changed)
  invalidatePermissionCache("all");

  return { success: true };
}
```

### Invalidation Rules

| Action                       | Scope  | Reason                          |
| ---------------------------- | ------ | ------------------------------- |
| User assigned role           | `user` | User's permissions changed      |
| User removed from role       | `user` | User's permissions changed      |
| Permission added to role     | `all`  | Role definition changed         |
| Permission removed from role | `all`  | Role definition changed         |
| Permission created           | `all`  | New permission available        |
| Permission deleted           | `all`  | Permission no longer valid      |
| Permission updated           | `all`  | Permission definition changed   |
| Role created                 | `none` | No users have it yet            |
| Role deleted                 | `all`  | Users may have lost permissions |

### Automatic Invalidation

The cache automatically cleans up expired entries every 1 minute:

```typescript
// In cache.ts
setInterval(() => {
  permissionCache.cleanup();
}, 60 * 1000); // 1 minute
```

---

## Testing Permissions

### Unit Testing Use Cases

```typescript
import { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

describe("CheckPermissionUseCase", () => {
  let checkPermission: CheckPermissionUseCase;
  let mockUserRoleRepository: jest.Mocked<IUserRoleRepository>;

  beforeEach(() => {
    mockUserRoleRepository = {
      getUserPermissions: jest.fn(),
    } as any;

    checkPermission = new CheckPermissionUseCase(
      mockUserRoleRepository,
      mockLogger,
    );
  });

  it("should grant permission when user has exact permission", async () => {
    mockUserRoleRepository.getUserPermissions.mockResolvedValue([
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.PROJECTS_CREATE,
    ]);

    const result = await checkPermission.execute({
      userId: "user-1",
      permission: PERMISSIONS.PROJECTS_CREATE,
    });

    expect(result).toBe(true);
  });

  it("should grant :own permission when user owns resource", async () => {
    mockUserRoleRepository.getUserPermissions.mockResolvedValue([
      PERMISSIONS.PROJECTS_UPDATE_OWN,
    ]);

    const result = await checkPermission.execute({
      userId: "user-1",
      permission: PERMISSIONS.PROJECTS_UPDATE,
      context: { resourceOwnerId: "user-1" },
    });

    expect(result).toBe(true);
  });

  it("should deny :own permission when user doesn't own resource", async () => {
    mockUserRoleRepository.getUserPermissions.mockResolvedValue([
      PERMISSIONS.PROJECTS_UPDATE_OWN,
    ]);

    const result = await checkPermission.execute({
      userId: "user-1",
      permission: PERMISSIONS.PROJECTS_UPDATE,
      context: { resourceOwnerId: "user-2" },
    });

    expect(result).toBe(false);
  });
});
```

### Integration Testing Controllers

```typescript
import { createProjectAction } from "@/interface-adapters/controllers/project.controller";

describe("Project Controller", () => {
  it("should allow creating project with PROJECTS_CREATE permission", async () => {
    // Mock auth to return user with permission
    jest.mocked(getCurrentUserId).mockResolvedValue("user-1");
    jest.mocked(hasPermission).mockResolvedValue(true);

    const result = await createProjectAction({
      name: "Test Project",
      description: "Test",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: "Test Project",
    });
  });

  it("should deny creating project without permission", async () => {
    jest.mocked(getCurrentUserId).mockResolvedValue("user-1");
    jest.mocked(hasPermission).mockResolvedValue(false);

    const result = await createProjectAction({
      name: "Test Project",
      description: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient permissions");
  });
});
```

### E2E Testing with Playwright

```typescript
import { test, expect } from "@playwright/test";

test("admin can create projects", async ({ page }) => {
  // Login as admin
  await page.goto("/login");
  await page.click('text="Sign in as Admin"');

  // Navigate to projects
  await page.goto("/projects");

  // Create button should be visible
  await expect(page.locator('button:has-text("Create Project")')).toBeVisible();

  // Click create
  await page.click('text="Create Project"');
  await page.fill('input[name="name"]', "E2E Test Project");
  await page.click('button[type="submit"]');

  // Should succeed
  await expect(
    page.locator('text="Project created successfully"'),
  ).toBeVisible();
});

test("viewer cannot create projects", async ({ page }) => {
  // Login as viewer
  await page.goto("/login");
  await page.click('text="Sign in as Viewer"');

  // Navigate to projects
  await page.goto("/projects");

  // Create button should NOT be visible
  await expect(
    page.locator('button:has-text("Create Project")'),
  ).not.toBeVisible();
});
```

---

## Common Patterns

### Pattern 1: Feature Flag with Permissions

```typescript
// Combine feature flags with permissions
export function ExperimentalFeature() {
  const { hasPermission } = usePermissions();
  const isFeatureEnabled = useFeatureFlag("experimental-projects");

  if (!isFeatureEnabled || !hasPermission(PERMISSIONS.PROJECTS_MANAGE)) {
    return null;
  }

  return <ExperimentalProjectPanel />;
}
```

### Pattern 2: Progressive Disclosure

```typescript
// Show basic view to all, advanced features to privileged users
export function ProjectDashboard() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {/* Everyone sees basic dashboard */}
      <BasicDashboard />

      {/* Only managers see analytics */}
      <PermissionGuard permission={PERMISSIONS.DASHBOARD_ANALYTICS}>
        <AnalyticsPanel />
      </PermissionGuard>

      {/* Only admins see admin tools */}
      <PermissionGuard permission={PERMISSIONS.PROJECTS_MANAGE}>
        <AdminToolsPanel />
      </PermissionGuard>
    </div>
  );
}
```

### Pattern 3: Conditional Form Fields

```typescript
export function ProjectForm() {
  const { hasPermission } = usePermissions();
  const canSetPriority = hasPermission(PERMISSIONS.PROJECTS_MANAGE);

  return (
    <Form>
      <Input name="name" label="Project Name" required />
      <Textarea name="description" label="Description" />

      {/* Only managers can set priority */}
      {canSetPriority && (
        <Select name="priority" label="Priority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      )}

      <Button type="submit">Create Project</Button>
    </Form>
  );
}
```

### Pattern 4: Cascading Permissions

```typescript
// Parent permission implies child permissions
export function canAccessFeature(
  permission: PermissionKey,
  userPermissions: PermissionKey[],
): boolean {
  // Direct permission
  if (userPermissions.includes(permission)) {
    return true;
  }

  // Manage permission implies all sub-permissions
  const [resource] = permission.split(":");
  const managePermission = `${resource}:manage` as PermissionKey;

  if (userPermissions.includes(managePermission)) {
    return true;
  }

  return false;
}
```

### Pattern 5: Permission-Based Rendering

```typescript
export function DataTable({ data }: { data: Project[] }) {
  const { hasPermission } = usePermissions();

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },

    // Only show actions column if user can perform actions
    ...(hasPermission(PERMISSIONS.PROJECTS_UPDATE) ||
    hasPermission(PERMISSIONS.PROJECTS_DELETE)
      ? [{ key: "actions", label: "Actions" }]
      : []),
  ];

  return <Table columns={columns} data={data} />;
}
```

---

## Troubleshooting

### Permission Always Denied

**Problem**: `requirePermission()` always throws even though user should have permission.

**Solutions**:

1. **Check permission constant spelling**:

   ```typescript
   // Wrong (typo)
   await requirePermission("projects:craete");

   // Correct
   await requirePermission(PERMISSIONS.PROJECTS_CREATE);
   ```

2. **Verify permission is seeded**:

   ```bash
   npm run db:seed
   ```

3. **Check user has role with permission**:

   ```sql
   SELECT u.email, r.name as role, p.name as permission
   FROM users u
   JOIN user_roles ur ON u.id = ur."userId"
   JOIN roles r ON ur."roleId" = r.id
   JOIN role_permissions rp ON r.id = rp."roleId"
   JOIN permissions p ON rp."permissionId" = p.id
   WHERE u.email = 'your-email@example.com';
   ```

4. **Clear permission cache**:
   ```typescript
   import { permissionCache } from "@/lib/permissions/cache";
   permissionCache.invalidateAll();
   ```

### Permission Check Too Slow

**Problem**: Permission checks take 100ms+ on every request.

**Solutions**:

1. **Verify cache is working**:

   ```typescript
   import { permissionCache } from "@/lib/permissions/cache";
   console.log(permissionCache.getStats());
   // Should show high validEntries count
   ```

2. **Check cache hit rate in logs**:

   ```typescript
   this.logger.debug("Permission check", {
     userId,
     permission,
     cacheHit, // Should be true most of the time
   });
   ```

3. **Increase TTL if appropriate**:
   ```typescript
   // In cache.ts
   const CACHE_CONFIG = {
     TTL: 10 * 60 * 1000, // 10 minutes instead of 5
   };
   ```

### Ownership Permissions Not Working

**Problem**: `:own` permissions not checking ownership correctly.

**Solutions**:

1. **Ensure context is passed**:

   ```typescript
   // Wrong
   await requirePermission(PERMISSIONS.PROJECTS_UPDATE);

   // Correct
   await requirePermission(PERMISSIONS.PROJECTS_UPDATE, {
     resourceOwnerId: project.createdBy,
   });
   ```

2. **Verify createdBy field exists**:

   ```prisma
   model Project {
     // ...
     createdBy String? // Must be present
   }
   ```

3. **Check permission name has :own suffix**:
   ```typescript
   // In permission-key.ts
   PROJECTS_UPDATE_OWN: "projects:update:own", // Must end with :own
   ```

### UI Shows Element But Server Denies

**Problem**: Button visible in UI but server action throws permission error.

**Solutions**:

1. **Client-side permission state may be stale**:

   ```typescript
   // Force refresh permissions
   const { refetch } = usePermissions();
   await refetch();
   ```

2. **Server-side is source of truth**:

   ```typescript
   // Always enforce on server, even if UI check passes
   await requirePermission(PERMISSIONS.PROJECTS_DELETE);
   ```

3. **Check for client/server permission mismatch**:

   ```typescript
   // Client
   const { hasPermission } = usePermissions();
   hasPermission(PERMISSIONS.PROJECTS_CREATE); // false

   // Server (might be cached differently)
   await hasPermission(PERMISSIONS.PROJECTS_CREATE); // true
   ```

### Cache Never Invalidates

**Problem**: Permission changes don't take effect until app restart.

**Solutions**:

1. **Call invalidation in mutation actions**:

   ```typescript
   export async function updateRolePermissionsAction(...) {
     // ... update logic
     invalidatePermissionCache("all");
     return result;
   }
   ```

2. **Check invalidation is called**:

   ```typescript
   this.logger.info("Cache invalidated", { scope: "all" });
   ```

3. **Verify cleanup is running**:
   ```typescript
   // Should log every minute
   permissionCache.cleanup();
   console.log("Cache cleaned", permissionCache.getStats());
   ```

---

## Related Documentation

- [RBAC Architecture](../architecture/RBAC_ARCHITECTURE.md) - Complete architecture overview
- [RBAC Admin Guide](./RBAC_ADMIN_GUIDE.md) - User guide for managing roles/permissions
- [Clean Architecture](../architecture/ARCHITECTURE.md) - Overall system architecture
- [Logging Guide](./LOGGING.md) - Structured logging with DI logger

---

## Quick Reference

### Import Statements

```typescript
// Permission constants
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// Server-side checking
import {
  requirePermission,
  hasPermission,
  hasAll,
  hasAny,
} from "@/lib/permissions/server";

// Client-side hooks
import { usePermissions } from "@/hooks/use-permissions";
import { useRoles } from "@/components/auth/RoleGuard";

// UI components
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { PermissionLink } from "@/components/auth/PermissionLink";
import { RoleGuard } from "@/components/auth/RoleGuard";

// Cache invalidation
import { invalidatePermissionCache } from "@/lib/permissions/cache";

// Error handling
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";
```

### Common Commands

```bash
# Seed RBAC data
npm run db:seed

# Reset database
npm run reset

# Assign first admin
npm run db:assign-admin

# Open Prisma Studio
npx prisma studio
```
