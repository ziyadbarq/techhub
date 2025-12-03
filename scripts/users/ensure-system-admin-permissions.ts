#!/usr/bin/env tsx
/**
 * Ensure System Administrator has all permissions.
 *
 * - Upserts all permissions from SYSTEM_PERMISSIONS definitions
 * - Upserts the system-administrator role
 * - Grants every permission to system-administrator (idempotent)
 */

import "dotenv/config";
import { prisma } from "@/infrastructure/database/prisma/client";
import { SYSTEM_PERMISSIONS } from "@/infrastructure/database/prisma/seed-rbac-permissions";

async function main() {
  const roleName = "system-administrator";

  console.log("Upserting permissions...");
  const permissionIds: string[] = [];

  for (const perm of SYSTEM_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        isActive: true,
      },
      create: {
        name: perm.name,
        displayName: perm.displayName,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
        isSystem: true,
        isActive: true,
      },
    });
    permissionIds.push(record.id);
  }

  console.log(`Permissions ensured: ${permissionIds.length}`);

  console.log(`Upserting role "${roleName}"...`);
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {
      displayName: "System Administrator",
      description: "Full system access with all permissions",
      isSystem: true,
      isActive: true,
    },
    create: {
      name: roleName,
      displayName: "System Administrator",
      description: "Full system access with all permissions",
      isSystem: true,
      isActive: true,
    },
  });

  console.log("Assigning permissions to system-administrator (idempotent)...");
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: role.id,
      permissionId,
    })),
    skipDuplicates: true,
  });

  const assignedCount = await prisma.rolePermission.count({
    where: { roleId: role.id },
  });

  console.log(
    `System Administrator now has ${assignedCount} permissions (expected ${permissionIds.length}).`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to ensure permissions", error);
    await prisma.$disconnect();
    process.exit(1);
  });
