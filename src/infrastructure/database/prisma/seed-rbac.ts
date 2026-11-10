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

import type { PrismaClient } from "@/generated/prisma/server";
import { prisma as prismaSingleton } from "./client";
import { logSection, logStep, logSuccess, logWarning } from "./seed-utils";
import { SYSTEM_PERMISSIONS } from "./seed-rbac-permissions";
import { SYSTEM_ROLES } from "./seed-rbac-roles";
import { SYSTEM_ADMIN_ROLE_NAME } from "@/core/domain/value-objects/system-role-policy";

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

    for (const roleData of Object.values(SYSTEM_ROLES)) {
      const isSystemAdministrator = roleData.name === SYSTEM_ADMIN_ROLE_NAME;
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
        select: { id: true },
      });

      // Only the system administrator is protected. Other seeded roles
      // become editable and keep their custom names, status and permissions.
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: isSystemAdministrator
          ? {
              displayName: roleData.displayName,
              description: roleData.description,
              isSystem: true,
              isActive: true,
            }
          : { isSystem: false },
        create: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: isSystemAdministrator,
          isActive: true,
        },
      });

      // Never replace a user's permission customizations on a regular role.
      // New roles receive their preset permissions exactly once. The protected
      // administrator is always resynced to ALL available permissions.
      if (existingRole && !isSystemAdministrator) {
        logSuccess(`Editable role "${role.name}" preserved with its current permissions`);
        continue;
      }

      if (isSystemAdministrator) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: role.id },
        });
      }

      const permissionAssignments = roleData.permissions
        .map((permName) => {
          const permId = createdPermissions.get(permName);
          if (!permId) {
            logWarning(`Permission not found: ${permName}`);
            return null;
          }
          return { roleId: role.id, permissionId: permId };
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
        `Role "${role.displayName}" initialized with ${permissionAssignments.length} permissions`,
      );
    }

    logSuccess("RBAC seed completed successfully!");
    console.log("\nSummary:");
    console.log(`   - ${SYSTEM_PERMISSIONS.length} permissions created`);
    console.log(`   - ${Object.keys(SYSTEM_ROLES).length} roles created`);
    console.log("\nCreate Admin Account:");
    console.log(
      "   Register a user via /register, then promote to system-administrator via Prisma Studio or SQL",
    );
    console.log("\nNext steps:");
    console.log("   1. Register first user at /register");
    console.log(
      "   2. Promote that user to the system-administrator role in the UserRole table",
    );
    console.log("   3. Login at /login with the new admin account");
    console.log("   4. Register additional users at /register");
    console.log("   5. Assign roles via admin UI (/admin/users)");
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
