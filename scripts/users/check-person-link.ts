#!/usr/bin/env tsx
/**
 * Check if a Person record is linked to a User account
 */

import { prisma } from "../../src/infrastructure/database/prisma/client";

async function main() {
  const email = process.argv[2] || "abdullah@alzuwayed.net";

  console.log(`\nChecking Person record for: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`❌ No User found with email: ${email}`);
    return;
  }

  console.log(`✅ User found:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.name || "N/A"}`);

  // Check for Person linked by userId
  const personByUserId = await prisma.person.findFirst({
    where: { userId: user.id },
  });

  console.log(`\n🔍 Person linked by userId:`);
  if (personByUserId) {
    console.log(`   ✅ Found: ${personByUserId.id}`);
    console.log(
      `   Name: ${personByUserId.firstName} ${personByUserId.lastName}`,
    );
    console.log(`   Email: ${personByUserId.email}`);
  } else {
    console.log(`   ❌ No Person record with userId="${user.id}"`);
  }

  // Check for Person with same email
  const personByEmail = await prisma.person.findUnique({
    where: { email },
  });

  console.log(`\n🔍 Person with email ${email}:`);
  if (personByEmail) {
    console.log(`   ✅ Found: ${personByEmail.id}`);
    console.log(
      `   Name: ${personByEmail.firstName} ${personByEmail.lastName}`,
    );
    console.log(`   Linked userId: ${personByEmail.userId || "❌ NOT LINKED"}`);
  } else {
    console.log(`   ❌ No Person record with this email`);
  }

  console.log("\n📋 Summary:");
  if (!personByUserId && !personByEmail) {
    console.log("   ❌ No Person record exists for this user");
    console.log(
      "   💡 Solution: Create a Person record or link existing Person to User",
    );
  } else if (personByEmail && !personByEmail.userId) {
    console.log("   ⚠️  Person exists but not linked to User");
    console.log(
      `   💡 Solution: Update Person ${personByEmail.id} with userId="${user.id}"`,
    );
  } else if (personByUserId) {
    console.log("   ✅ User properly linked to Person record");
  }

  console.log("");
  await prisma.$disconnect();
}

main().catch(console.error);
