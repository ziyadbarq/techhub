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

  // Foundation: Organization Units
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_VIEW,
    displayName: "View Organization Units",
    description: "View organization unit list and details",
    resource: "organization-units",
    action: "view",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_CREATE,
    displayName: "Create Organization Units",
    description: "Create new organization units",
    resource: "organization-units",
    action: "create",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_UPDATE,
    displayName: "Update Organization Units",
    description: "Edit organization unit information",
    resource: "organization-units",
    action: "update",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_DELETE,
    displayName: "Delete Organization Units",
    description: "Remove organization units",
    resource: "organization-units",
    action: "delete",
  },
  {
    name: PERMISSIONS.ORGANIZATION_UNITS_MANAGE,
    displayName: "Manage Organization Units",
    description: "Full organization unit management access",
    resource: "organization-units",
    action: "manage",
  },

  // Foundation: Persons
  {
    name: PERMISSIONS.PERSONS_VIEW,
    displayName: "View Persons",
    description: "View person list and details",
    resource: "persons",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSONS_CREATE,
    displayName: "Create Persons",
    description: "Create new person records",
    resource: "persons",
    action: "create",
  },
  {
    name: PERMISSIONS.PERSONS_UPDATE,
    displayName: "Update Persons",
    description: "Edit person information",
    resource: "persons",
    action: "update",
  },
  {
    name: PERMISSIONS.PERSONS_DELETE,
    displayName: "Delete Persons",
    description: "Remove person records",
    resource: "persons",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERSONS_MANAGE,
    displayName: "Manage Persons",
    description: "Full person management access",
    resource: "persons",
    action: "manage",
  },

  // Foundation: Person Roles
  {
    name: PERMISSIONS.PERSON_ROLES_VIEW,
    displayName: "View Person Roles",
    description: "View person role assignments",
    resource: "person-roles",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_ASSIGN,
    displayName: "Assign Person Roles",
    description: "Assign roles to persons",
    resource: "person-roles",
    action: "assign",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_REMOVE,
    displayName: "Remove Person Roles",
    description: "Remove role assignments from persons",
    resource: "person-roles",
    action: "remove",
  },
  {
    name: PERMISSIONS.PERSON_ROLES_MANAGE,
    displayName: "Manage Person Roles",
    description: "Full person role management access",
    resource: "person-roles",
    action: "manage",
  },

  // Foundation: Person Role Assignments
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW,
    displayName: "View Person Role Assignments",
    description: "View role assignment details",
    resource: "person-role-assignments",
    action: "view",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_CREATE,
    displayName: "Create Person Role Assignments",
    description: "Create new role assignments",
    resource: "person-role-assignments",
    action: "create",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_UPDATE,
    displayName: "Update Person Role Assignments",
    description: "Edit role assignment information",
    resource: "person-role-assignments",
    action: "update",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_DELETE,
    displayName: "Delete Person Role Assignments",
    description: "Remove role assignments",
    resource: "person-role-assignments",
    action: "delete",
  },
  {
    name: PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_MANAGE,
    displayName: "Manage Person Role Assignments",
    description: "Full role assignment management access",
    resource: "person-role-assignments",
    action: "manage",
  },

  // Foundation: Locations
  {
    name: PERMISSIONS.LOCATIONS_VIEW,
    displayName: "View Locations",
    description: "View location list and details",
    resource: "locations",
    action: "view",
  },
  {
    name: PERMISSIONS.LOCATIONS_CREATE,
    displayName: "Create Locations",
    description: "Create new locations",
    resource: "locations",
    action: "create",
  },
  {
    name: PERMISSIONS.LOCATIONS_UPDATE,
    displayName: "Update Locations",
    description: "Edit location information",
    resource: "locations",
    action: "update",
  },
  {
    name: PERMISSIONS.LOCATIONS_DELETE,
    displayName: "Delete Locations",
    description: "Remove locations",
    resource: "locations",
    action: "delete",
  },
  {
    name: PERMISSIONS.LOCATIONS_MANAGE,
    displayName: "Manage Locations",
    description: "Full location management access",
    resource: "locations",
    action: "manage",
  },

  // Foundation: Vendors
  {
    name: PERMISSIONS.VENDORS_VIEW,
    displayName: "View Vendors",
    description: "View vendor list and details",
    resource: "vendors",
    action: "view",
  },
  {
    name: PERMISSIONS.VENDORS_CREATE,
    displayName: "Create Vendors",
    description: "Create new vendors",
    resource: "vendors",
    action: "create",
  },
  {
    name: PERMISSIONS.VENDORS_UPDATE,
    displayName: "Update Vendors",
    description: "Edit vendor information",
    resource: "vendors",
    action: "update",
  },
  {
    name: PERMISSIONS.VENDORS_DELETE,
    displayName: "Delete Vendors",
    description: "Remove vendors",
    resource: "vendors",
    action: "delete",
  },
  {
    name: PERMISSIONS.VENDORS_MANAGE,
    displayName: "Manage Vendors",
    description: "Full vendor management access",
    resource: "vendors",
    action: "manage",
  },

  // Foundation: Vendor Contacts
  {
    name: PERMISSIONS.VENDOR_CONTACTS_VIEW,
    displayName: "View Vendor Contacts",
    description: "View vendor contact list and details",
    resource: "vendor-contacts",
    action: "view",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_CREATE,
    displayName: "Create Vendor Contacts",
    description: "Create new vendor contacts",
    resource: "vendor-contacts",
    action: "create",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_UPDATE,
    displayName: "Update Vendor Contacts",
    description: "Edit vendor contact information",
    resource: "vendor-contacts",
    action: "update",
  },
  {
    name: PERMISSIONS.VENDOR_CONTACTS_DELETE,
    displayName: "Delete Vendor Contacts",
    description: "Remove vendor contacts",
    resource: "vendor-contacts",
    action: "delete",
  },

  // Foundation: Lifecycle Models
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_VIEW,
    displayName: "View Lifecycle Models",
    description: "View lifecycle model list and details",
    resource: "lifecycle-models",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_CREATE,
    displayName: "Create Lifecycle Models",
    description: "Create new lifecycle models",
    resource: "lifecycle-models",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_UPDATE,
    displayName: "Update Lifecycle Models",
    description: "Edit lifecycle model information",
    resource: "lifecycle-models",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_DELETE,
    displayName: "Delete Lifecycle Models",
    description: "Remove lifecycle models",
    resource: "lifecycle-models",
    action: "delete",
  },
  {
    name: PERMISSIONS.LIFECYCLE_MODELS_MANAGE,
    displayName: "Manage Lifecycle Models",
    description: "Full lifecycle model management access",
    resource: "lifecycle-models",
    action: "manage",
  },

  // Foundation: Lifecycle States
  {
    name: PERMISSIONS.LIFECYCLE_STATES_VIEW,
    displayName: "View Lifecycle States",
    description: "View lifecycle state list and details",
    resource: "lifecycle-states",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_CREATE,
    displayName: "Create Lifecycle States",
    description: "Create new lifecycle states",
    resource: "lifecycle-states",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_UPDATE,
    displayName: "Update Lifecycle States",
    description: "Edit lifecycle state information",
    resource: "lifecycle-states",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_STATES_DELETE,
    displayName: "Delete Lifecycle States",
    description: "Remove lifecycle states",
    resource: "lifecycle-states",
    action: "delete",
  },

  // Foundation: Lifecycle Transitions
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_VIEW,
    displayName: "View Lifecycle Transitions",
    description: "View lifecycle transition list and details",
    resource: "lifecycle-transitions",
    action: "view",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_CREATE,
    displayName: "Create Lifecycle Transitions",
    description: "Create new lifecycle transitions",
    resource: "lifecycle-transitions",
    action: "create",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_UPDATE,
    displayName: "Update Lifecycle Transitions",
    description: "Edit lifecycle transition information",
    resource: "lifecycle-transitions",
    action: "update",
  },
  {
    name: PERMISSIONS.LIFECYCLE_TRANSITIONS_DELETE,
    displayName: "Delete Lifecycle Transitions",
    description: "Remove lifecycle transitions",
    resource: "lifecycle-transitions",
    action: "delete",
  },

  // Foundation: Field Definitions
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_VIEW,
    displayName: "View Field Definitions",
    description: "View field definition list and details",
    resource: "field-definitions",
    action: "view",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_CREATE,
    displayName: "Create Field Definitions",
    description: "Create new field definitions",
    resource: "field-definitions",
    action: "create",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_UPDATE,
    displayName: "Update Field Definitions",
    description: "Edit field definition information",
    resource: "field-definitions",
    action: "update",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_DELETE,
    displayName: "Delete Field Definitions",
    description: "Remove field definitions",
    resource: "field-definitions",
    action: "delete",
  },
  {
    name: PERMISSIONS.FIELD_DEFINITIONS_MANAGE,
    displayName: "Manage Field Definitions",
    description: "Full field definition management access",
    resource: "field-definitions",
    action: "manage",
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
