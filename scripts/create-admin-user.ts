#!/usr/bin/env tsx
/**
 * Create Admin User Script
 *
 * Creates an admin user with email/password credentials
 * directly via Prisma and assigns the admin role.
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
  console.log("║  👤 Create Admin User                 ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  const email = "admin@admin.com";
  const password = "admin123"; // Min 8 characters required by Better Auth
  const name = "Admin User";

  try {
    // Check if user already exists
    console.log("🔍 Checking if admin user already exists...");
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

    // Get admin role
    console.log("🔍 Finding admin role...");
    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    if (!adminRole) {
      console.error("❌ Admin role not found!");
      console.log("");
      console.log("Please run the database seed first:");
      console.log("   npm run db:seed");
      console.log("");
      process.exit(1);
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await hashPassword(password);

    // Create user and account in a transaction
    console.log("👤 Creating admin user...");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: new Date(), // Admin user has verified email - timestamp of verification
        accounts: {
          create: {
            type: "email",
            provider: "credential",
            providerAccountId: email,
            password: hashedPassword,
          },
        },
      },
    });

    console.log(`   ✓ User created: ${user.id}`);
    console.log(`   ✓ Account created with credentials`);

    // Assign admin role
    console.log("👑 Assigning admin role...");
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        createdBy: "system",
      },
    });
    console.log(`   ✓ Admin role assigned`);

    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log("║  ✅ Admin User Created!               ║");
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
