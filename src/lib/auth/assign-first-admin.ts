/**
 * First User System Administrator Assignment Utility
 *
 * Ensures the first user in the database gets system administrator role.
 * This runs automatically via Better Auth hooks, but can also
 * be called manually if needed.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma v7: Use PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SYSTEM_ADMIN_ROLE_NAME = "system-administrator";

/**
 * Assign system administrator role to the first user if they don't have it
 * Safe to call multiple times - idempotent operation
 *
 * @returns true if system admin role was assigned, false if not needed or failed
 */
export async function assignAdminToFirstUser(): Promise<boolean> {
  try {
    // Get the first user (by creation date)
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        roles: true,
      },
    });

    if (!firstUser) {
      console.log("No users in database yet");
      return false;
    }

    // Check if user already has system admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: SYSTEM_ADMIN_ROLE_NAME },
    });

    if (!adminRole) {
      console.error(
        "❌ System Administrator role not found. Run seed-rbac.ts first.",
      );
      return false;
    }

    // Check if user already has system admin role assigned
    const hasAdminRole = firstUser.roles.some(
      (userRole) => userRole.roleId === adminRole.id,
    );

    if (hasAdminRole) {
      console.log(
        `✅ First user ${firstUser.email} already has System Administrator role`,
      );
      return false;
    }

    // Assign system admin role to first user
    await prisma.userRole.create({
      data: {
        userId: firstUser.id,
        roleId: adminRole.id,
        createdBy: "system",
      },
    });

    console.log(
      `✅ System Administrator role assigned to first user: ${firstUser.email}`,
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to assign System Administrator role to first user:",
      error,
    );
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * CLI script to manually assign admin to first user
 * Run with: npx tsx src/lib/auth/assign-first-admin.ts
 */
if (require.main === module) {
  assignAdminToFirstUser()
    .then((assigned) => {
      if (assigned) {
        console.log("✅ Operation completed successfully");
      } else {
        console.log("ℹ️  No action needed");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Operation failed:", error);
      process.exit(1);
    });
}
