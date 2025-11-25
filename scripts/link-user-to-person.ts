import { prisma } from "../src/infrastructure/database/prisma/client";
import { createId } from "@paralleldrive/cuid2";

/**
 * Manually link Users without Persons
 *
 * This script creates Person records for Users that don't have them linked.
 * Useful for fixing issues where the Better Auth hook didn't fire during registration.
 */

async function linkUsersToPersons() {
  try {
    console.log("Finding users without linked Persons...\n");

    const usersWithoutPerson = await prisma.user.findMany({
      where: { person: null },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (usersWithoutPerson.length === 0) {
      console.log("✅ All users have linked Persons!");
      return;
    }

    console.log(
      `Found ${usersWithoutPerson.length} user(s) without Person linkage:\n`,
    );
    usersWithoutPerson.forEach((u) => {
      console.log(`  - ${u.email} (${u.name || "No name"})`);
    });
    console.log("");

    // Get defaults for Person creation
    const orgUnit = await prisma.organizationUnit.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!orgUnit) {
      console.error("❌ Error: No organization units found in database.");
      console.error("   Please run: npm run db:seed");
      return;
    }

    const viewerRole = await prisma.role.findUnique({
      where: { name: "viewer" },
    });

    if (!viewerRole) {
      console.error("❌ Error: Viewer role not found in database.");
      console.error("   Please run: npm run db:seed");
      return;
    }

    console.log("Creating Person records and linking...\n");

    for (const user of usersWithoutPerson) {
      const normalizedEmail = user.email?.toLowerCase() ?? null;

      // Parse name
      const parseName = (name?: string | null) => {
        if (!name) return { firstName: "New", lastName: "User" };
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
          return { firstName: parts[0] || "New", lastName: "User" };
        }
        const [first, ...rest] = parts;
        return {
          firstName: first || "New",
          lastName: rest.join(" ") || "User",
        };
      };

      const { firstName, lastName } = parseName(user.name ?? user.email);
      const email = normalizedEmail ?? `${user.id}@local.barq`;

      // Check if Person already exists with this email (unlinked)
      const existingPerson = await prisma.person.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          userId: null,
        },
      });

      if (existingPerson) {
        // Link existing Person to User
        await prisma.person.update({
          where: { id: existingPerson.id },
          data: { userId: user.id },
        });

        console.log(
          `  ✅ Linked existing Person "${existingPerson.firstName} ${existingPerson.lastName}" to user ${user.email}`,
        );
      } else {
        // Create new Person
        const createdPerson = await prisma.person.create({
          data: {
            id: createId(),
            userId: user.id,
            firstName,
            lastName,
            email,
            orgUnitId: orgUnit.id,
            primaryRoleId: viewerRole.id,
            isActive: true,
          },
        });

        console.log(
          `  ✅ Created and linked Person "${createdPerson.firstName} ${createdPerson.lastName}" for user ${user.email}`,
        );
      }

      // Ensure UserRole assignment (viewer)
      const existingViewerRole = await prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: viewerRole.id,
          },
        },
      });

      if (!existingViewerRole) {
        await prisma.userRole.create({
          data: {
            id: createId(),
            userId: user.id,
            roleId: viewerRole.id,
            createdAt: new Date(),
          },
        });

        console.log(`    ↳ Assigned 'viewer' role`);
      }
    }

    console.log("\n✅ Done! All users now have linked Persons.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

linkUsersToPersons();
