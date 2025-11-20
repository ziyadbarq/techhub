/**
 * RBAC Seed Data
 * Seeds roles, permissions, and role-permission assignments
 */

import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// Prisma v7: Use PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * System roles with their permissions
 */
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
      // Roles (read-only)
      PERMISSIONS.ROLES_VIEW,
      // Permissions (read-only)
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

/**
 * All system permissions with metadata
 */
const SYSTEM_PERMISSIONS = [
  // Users
  {
    name: PERMISSIONS.USERS_VIEW,
    displayName: "View Users",
    description: "View user list and details",
    resource: "users",
    action: "view",
  },
  {
    name: PERMISSIONS.USERS_CREATE,
    displayName: "Create Users",
    description: "Create new user accounts",
    resource: "users",
    action: "create",
  },
  {
    name: PERMISSIONS.USERS_UPDATE,
    displayName: "Update Users",
    description: "Edit user information",
    resource: "users",
    action: "update",
  },
  {
    name: PERMISSIONS.USERS_DELETE,
    displayName: "Delete Users",
    description: "Remove user accounts",
    resource: "users",
    action: "delete",
  },
  {
    name: PERMISSIONS.USERS_MANAGE,
    displayName: "Manage Users",
    description: "Full user management access",
    resource: "users",
    action: "manage",
  },

  // Tasks
  {
    name: PERMISSIONS.TASKS_VIEW,
    displayName: "View Tasks",
    description: "View all tasks",
    resource: "tasks",
    action: "view",
  },
  {
    name: PERMISSIONS.TASKS_CREATE,
    displayName: "Create Tasks",
    description: "Create new tasks",
    resource: "tasks",
    action: "create",
  },
  {
    name: PERMISSIONS.TASKS_UPDATE,
    displayName: "Update Tasks",
    description: "Edit any task",
    resource: "tasks",
    action: "update",
  },
  {
    name: PERMISSIONS.TASKS_UPDATE_OWN,
    displayName: "Update Own Tasks",
    description: "Edit tasks created by you",
    resource: "tasks",
    action: "update:own",
  },
  {
    name: PERMISSIONS.TASKS_DELETE,
    displayName: "Delete Tasks",
    description: "Delete any task",
    resource: "tasks",
    action: "delete",
  },
  {
    name: PERMISSIONS.TASKS_DELETE_OWN,
    displayName: "Delete Own Tasks",
    description: "Delete tasks created by you",
    resource: "tasks",
    action: "delete:own",
  },

  // Roles
  {
    name: PERMISSIONS.ROLES_VIEW,
    displayName: "View Roles",
    description: "View role list and details",
    resource: "roles",
    action: "view",
  },
  {
    name: PERMISSIONS.ROLES_CREATE,
    displayName: "Create Roles",
    description: "Create new roles",
    resource: "roles",
    action: "create",
  },
  {
    name: PERMISSIONS.ROLES_UPDATE,
    displayName: "Update Roles",
    description: "Edit role information",
    resource: "roles",
    action: "update",
  },
  {
    name: PERMISSIONS.ROLES_DELETE,
    displayName: "Delete Roles",
    description: "Remove roles",
    resource: "roles",
    action: "delete",
  },
  {
    name: PERMISSIONS.ROLES_MANAGE,
    displayName: "Manage Roles",
    description: "Full role management access",
    resource: "roles",
    action: "manage",
  },

  // Permissions
  {
    name: PERMISSIONS.PERMISSIONS_VIEW,
    displayName: "View Permissions",
    description: "View permission list",
    resource: "permissions",
    action: "view",
  },
  {
    name: PERMISSIONS.PERMISSIONS_CREATE,
    displayName: "Create Permissions",
    description: "Create new permissions",
    resource: "permissions",
    action: "create",
  },
  {
    name: PERMISSIONS.PERMISSIONS_UPDATE,
    displayName: "Update Permissions",
    description: "Edit permissions",
    resource: "permissions",
    action: "update",
  },
  {
    name: PERMISSIONS.PERMISSIONS_DELETE,
    displayName: "Delete Permissions",
    description: "Remove permissions",
    resource: "permissions",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERMISSIONS_MANAGE,
    displayName: "Manage Permissions",
    description: "Full permission management",
    resource: "permissions",
    action: "manage",
  },

  // Audit Logs
  {
    name: PERMISSIONS.AUDIT_LOGS_VIEW,
    displayName: "View Audit Logs",
    description: "Access audit trail",
    resource: "audit-logs",
    action: "view",
  },
  {
    name: PERMISSIONS.AUDIT_LOGS_EXPORT,
    displayName: "Export Audit Logs",
    description: "Export audit data",
    resource: "audit-logs",
    action: "export",
  },

  // Settings
  {
    name: PERMISSIONS.SETTINGS_VIEW,
    displayName: "View Settings",
    description: "View application settings",
    resource: "settings",
    action: "view",
  },
  {
    name: PERMISSIONS.SETTINGS_MANAGE,
    displayName: "Manage Settings",
    description: "Modify application settings",
    resource: "settings",
    action: "manage",
  },

  // Dashboard
  {
    name: PERMISSIONS.DASHBOARD_VIEW,
    displayName: "View Dashboard",
    description: "Access main dashboard",
    resource: "dashboard",
    action: "view",
  },
  {
    name: PERMISSIONS.DASHBOARD_ANALYTICS,
    displayName: "View Analytics",
    description: "Access analytics and reports",
    resource: "dashboard",
    action: "analytics",
  },
];

/**
 * Main seed function
 */
async function seedRBAC() {
  console.log("🌱 Starting RBAC seed...");

  try {
    // 1. Create all permissions
    console.log("📋 Creating permissions...");
    const createdPermissions = new Map<string, string>();

    for (const permData of SYSTEM_PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: { name: permData.name },
        update: {
          displayName: permData.displayName,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: permData.name,
          displayName: permData.displayName,
          description: permData.description,
          resource: permData.resource,
          action: permData.action,
          isSystem: true,
          isActive: true,
        },
      });

      createdPermissions.set(permission.name, permission.id);
    }

    console.log(`   ✅ Created ${createdPermissions.size} permissions`);

    // 2. Create roles and assign permissions
    console.log("👥 Creating roles...");

    for (const [_roleName, roleData] of Object.entries(SYSTEM_ROLES)) {
      // Create role
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: true,
          isActive: true,
        },
      });

      // Delete existing permissions for role (clean slate)
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Assign permissions to role
      const permissionAssignments = roleData.permissions
        .map((permName) => {
          const permId = createdPermissions.get(permName);
          if (!permId) {
            console.warn(`   ⚠️  Permission not found: ${permName}`);
            return null;
          }
          return {
            roleId: role.id,
            permissionId: permId,
          };
        })
        .filter(
          (p): p is { roleId: string; permissionId: string } => p !== null,
        );

      if (permissionAssignments.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionAssignments,
          skipDuplicates: true,
        });
      }

      console.log(
        `   ✅ Role "${roleData.displayName}" with ${permissionAssignments.length} permissions`,
      );
    }

    console.log("\n✅ RBAC seed completed successfully!");
    console.log("\nSummary:");
    console.log(`   - ${SYSTEM_PERMISSIONS.length} permissions created`);
    console.log(`   - ${Object.keys(SYSTEM_ROLES).length} roles created`);
    console.log("\nAutomatic Admin Assignment:");
    console.log(
      "   - The first user to sign in will automatically receive the admin role",
    );
    console.log(
      "   - To manually assign admin to first user: npm run db:assign-admin",
    );
    console.log("\nNext steps:");
    console.log(
      "   1. Sign in with Microsoft OAuth - first user gets admin automatically",
    );
    console.log("   2. Assign additional roles via admin UI (/admin/users)");
    console.log("   3. Test permission-based access control");
  } catch (error) {
    console.error("❌ RBAC seed failed:", error);
    throw error;
  }
}

/**
 * Run seed if called directly
 */
// ES module check: if this file is being run directly (not imported)
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;

if (isMainModule) {
  seedRBAC()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedRBAC };
