/**
 * RBAC Seed Data
 * Seeds roles, permissions, and role-permission assignments
 *
 * Refactored for maintainability:
 * - Permission definitions extracted to seed-rbac-permissions.ts
 * - Role definitions extracted to seed-rbac-roles.ts
 * - This file contains only the seeding logic
 *
 * Can accept a Prisma client instance or use the singleton for standalone execution
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { prisma as prismaSingleton } from "./client.js";
import { logSection, logStep, logSuccess, logWarning } from "./seed-utils.js";
import { SYSTEM_PERMISSIONS } from "./seed-rbac-permissions.js";
import { SYSTEM_ROLES } from "./seed-rbac-roles.js";

/**
 * Main seed function
 */
async function seedRBAC(prismaClient?: PrismaClient) {
  const prisma = prismaClient ?? prismaSingleton;
  logSection("RBAC System");

  try {
    // 1. Create all permissions
    logStep("📋", "Creating permissions...");
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

    logSuccess(`Created ${createdPermissions.size} permissions`);

    // 2. Create roles and assign permissions
    logStep("👥", "Creating roles and assigning permissions...");

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
            logWarning(`Permission not found: ${permName}`);
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

      logSuccess(
        `Role "${roleData.displayName}" created with ${permissionAssignments.length} permissions`,
      );
    }

    logSuccess("RBAC seed completed successfully!");
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
      await prismaSingleton.$disconnect();
    });
}

export { seedRBAC };
