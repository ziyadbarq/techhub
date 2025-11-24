#!/usr/bin/env tsx
/**
 * Create System Administrator User Script
 *
 * Creates a System Administrator user with email/password credentials
 * directly via Prisma and assigns the system-administrator role.
 *
 * Default credentials:
 * - Email: admin@admin.com
 * - Password: admin123
 *
 * Usage:
 *   npx tsx scripts/create-admin-user.ts
 *   or
 *   npm run admin:create
 */

import "reflect-metadata";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Prisma v7: Use PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Hash password using bcrypt (same as Better Auth)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  👤 Create System Administrator User  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  const email = "admin@admin.com";
  const password = "admin123"; // Min 8 characters required by Better Auth
  const name = "Admin User";

  try {
    // Check if user already exists
    console.log("🔍 Checking if System Administrator user already exists...");
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (existingUser) {
      console.log(`⚠️  User ${email} already exists!`);
      console.log("");
      console.log("User details:");
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(
        `   Roles: ${existingUser.roles.map((r) => r.role.name).join(", ")}`,
      );
      console.log("");
      console.log("To reset this user:");
      console.log("   1. Delete from database:");
      console.log(
        `      psql $DATABASE_URL -c "DELETE FROM users WHERE email='${email}'"`,
      );
      console.log("   2. Run this script again");
      console.log("");
      process.exit(0);
    }

    // Get system admin role
    console.log("🔍 Finding System Administrator role...");
    const adminRole = await prisma.role.findUnique({
      where: { name: "system-administrator" },
    });

    if (!adminRole) {
      console.error("❌ System Administrator role not found!");
      console.log("");
      console.log("Please run the database seed first:");
      console.log("   npm run db:seed");
      console.log("");
      process.exit(1);
    }

    // Get or create default organization unit for Person creation
    console.log("🔍 Finding organization unit...");
    let orgUnit = await prisma.organizationUnit.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!orgUnit) {
      console.log("⚠️  No organization units found - creating default...");
      orgUnit = await prisma.organizationUnit.create({
        data: {
          name: "Barq",
          code: "BARQ",
          level: 1, // Company level
          unitType: "COMPANY",
          description: "Default organization unit for Barq",
          isActive: true,
        },
      });
      console.log(
        `   ✓ Created default organization unit: ${orgUnit.name} (${orgUnit.code})`,
      );
    }

    // Get viewer role for Person creation
    console.log("🔍 Finding viewer role...");
    const viewerRole = await prisma.role.findUnique({
      where: { name: "viewer" },
    });

    if (!viewerRole) {
      console.error("❌ Viewer role not found!");
      console.log("");
      console.log("Please run the database seed first:");
      console.log("   npm run db:seed");
      console.log("");
      process.exit(1);
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await hashPassword(password);

    // Parse name for Person entity
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Admin";
    const lastName = nameParts.slice(1).join(" ") || "User";

    // Create user, account, and person in a transaction
    console.log("👤 Creating System Administrator user...");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: new Date(), // Admin user has verified email - timestamp of verification
        accounts: {
          create: {
            type: "oauth", // Better Auth convention: all providers use "oauth"
            provider: "credential", // "credential" = email/password
            providerAccountId: email,
            password: hashedPassword,
          },
        },
        person: {
          create: {
            firstName,
            lastName,
            email,
            employeeId: "ADMIN-001",
            title: "System Administrator",
            department: "IT Operations",
            orgUnitId: orgUnit.id,
            primaryRoleId: viewerRole.id,
            isActive: true,
          },
        },
      },
      include: {
        person: true,
      },
    });

    console.log(`   ✓ User created: ${user.id}`);
    console.log(`   ✓ Account created with credentials`);
    console.log(`   ✓ Person entity created: ${user.person?.id}`);

    // Assign system admin role
    console.log("👑 Assigning System Administrator role...");
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        createdBy: "system",
      },
    });
    console.log(`   ✓ System Administrator role assigned`);

    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log("║  ✅ System Administrator User Created!║");
    console.log("╚════════════════════════════════════════╝");
    console.log("");
    console.log("Login credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Change the password after first login!");
    console.log("");
    console.log("You can now sign in at:");
    console.log(
      `   ${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/auth/sign-in`,
    );
    console.log("");
  } catch (error) {
    console.error("");
    console.error("❌ Failed to create admin user:", error);
    console.log("");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createAdminUser();
