#!/usr/bin/env tsx
/**
 * Migrate User Preferences from Redis to Database
 *
 * This script:
 * 1. Scans all user:preferences:* keys in Redis
 * 2. Parses the JSON data
 * 3. Creates UserPreferences records in the database
 * 4. Validates the migration
 * 5. Optionally clears Redis keys after confirmation
 *
 * Usage:
 * ```bash
 * dotenv -e .env.local -- tsx scripts/users/migrate-preferences-to-db.ts
 * ```
 */

import "dotenv/config";
import { confirm } from "@inquirer/prompts";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getRedis } from "@/lib/redis";

interface RedisPreferences {
  timezone?: string;
  dateFormat?: string;
  currencyDisplay?: string;
  notifications?: {
    emailNotifications?: boolean;
    teamsNotifications?: boolean;
    whatsappNotifications?: boolean;
    weeklyDigest?: boolean;
    assetAlerts?: boolean;
    approvalAlerts?: boolean;
    warrantyAlerts?: boolean;
  };
}

const defaultNotifications = {
  emailNotifications: true,
  teamsNotifications: false,
  whatsappNotifications: false,
  weeklyDigest: true,
  assetAlerts: true,
  approvalAlerts: true,
  warrantyAlerts: true,
};

async function main() {
  console.log("========================================");
  console.log("User Preferences Migration: Redis → Database");
  console.log("========================================\n");

  const redis = getRedis();

  // Step 1: Find all user preferences keys in Redis
  console.log("Step 1: Scanning Redis for user:preferences:* keys...");
  const keys = await redis.keys("user:preferences:*");
  console.log(`Found ${keys.length} preferences keys in Redis\n`);

  if (keys.length === 0) {
    console.log("No preferences found in Redis. Nothing to migrate.");
    return;
  }

  // Step 2: Read and parse all preferences
  console.log("Step 2: Reading preferences from Redis...");
  const preferencesToMigrate: Array<{
    userId: string;
    data: RedisPreferences;
  }> = [];

  for (const key of keys) {
    const userId = key.replace("user:preferences:", "");
    const raw = await redis.get(key);

    if (!raw) {
      console.log(`  Skipping empty key: ${key}`);
      continue;
    }

    try {
      const data = JSON.parse(raw) as RedisPreferences;
      preferencesToMigrate.push({ userId, data });
      console.log(`  ✓ Read preferences for user: ${userId}`);
    } catch (error) {
      console.error(
        `  ✗ Failed to parse preferences for user ${userId}:`,
        error,
      );
    }
  }

  console.log(
    `\nSuccessfully parsed ${preferencesToMigrate.length} preference records\n`,
  );

  if (preferencesToMigrate.length === 0) {
    console.log("No valid preferences to migrate. Exiting.");
    return;
  }

  // Step 3: Check for existing database records
  console.log("Step 3: Checking for existing database records...");
  const userIds = preferencesToMigrate.map((p) => p.userId);
  const existingPreferences = await prisma.userPreferences.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
  });

  const existingUserIds = new Set(existingPreferences.map((p) => p.userId));
  const newRecords = preferencesToMigrate.filter(
    (p) => !existingUserIds.has(p.userId),
  );
  const existingRecords = preferencesToMigrate.filter((p) =>
    existingUserIds.has(p.userId),
  );

  console.log(`  - New records to create: ${newRecords.length}`);
  console.log(`  - Existing records (will skip): ${existingRecords.length}\n`);

  if (newRecords.length === 0) {
    console.log(
      "All preferences already exist in database. Nothing to migrate.",
    );

    const shouldClearRedis = await confirm({
      message:
        "Do you want to clear Redis keys since they're already in the database?",
      default: false,
    });

    if (shouldClearRedis) {
      console.log("\nClearing Redis keys...");
      await redis.del(...keys);
      console.log("✓ Redis keys cleared");
    }

    return;
  }

  // Step 4: Show migration preview
  console.log("Migration Preview:");
  console.log("==================");
  for (const { userId, data } of newRecords.slice(0, 3)) {
    console.log(`\nUser ID: ${userId}`);
    console.log(`  Timezone: ${data.timezone ?? "Asia/Riyadh"}`);
    console.log(`  Date Format: ${data.dateFormat ?? "dd/MM/yyyy"}`);
    console.log(`  Currency Display: ${data.currencyDisplay ?? "dual"}`);
    console.log(
      `  Email Notifications: ${data.notifications?.emailNotifications ?? true}`,
    );
  }

  if (newRecords.length > 3) {
    console.log(`\n... and ${newRecords.length - 3} more records\n`);
  }

  // Step 5: Confirm migration
  const shouldMigrate = await confirm({
    message: `Proceed with migrating ${newRecords.length} preference records to the database?`,
    default: true,
  });

  if (!shouldMigrate) {
    console.log("\nMigration cancelled by user.");
    return;
  }

  // Step 6: Perform migration
  console.log("\nStep 4: Migrating preferences to database...");
  let successCount = 0;
  let errorCount = 0;

  for (const { userId, data } of newRecords) {
    try {
      await prisma.userPreferences.create({
        data: {
          userId,
          timezone: data.timezone ?? "Asia/Riyadh",
          dateFormat: data.dateFormat ?? "dd/MM/yyyy",
          currencyDisplay: data.currencyDisplay ?? "dual",
          notifications: {
            ...defaultNotifications,
            ...(data.notifications ?? {}),
          },
        },
      });
      successCount++;
      process.stdout.write(
        `\r  Migrated: ${successCount}/${newRecords.length}`,
      );
    } catch (error) {
      errorCount++;
      console.error(
        `\n  ✗ Failed to migrate preferences for user ${userId}:`,
        error,
      );
    }
  }

  console.log(`\n\nMigration completed:`);
  console.log(`  ✓ Successfully migrated: ${successCount}`);
  console.log(`  ✗ Failed: ${errorCount}\n`);

  // Step 7: Validate migration
  console.log("Step 5: Validating migration...");
  const migratedCount = await prisma.userPreferences.count({
    where: { userId: { in: userIds } },
  });

  console.log(`  Database now contains ${migratedCount} preference records`);
  console.log(`  Expected: ${existingRecords.length + successCount}`);

  if (migratedCount === existingRecords.length + successCount) {
    console.log("  ✓ Migration validation successful\n");
  } else {
    console.log("  ⚠ Warning: Count mismatch detected\n");
  }

  // Step 8: Optional Redis cleanup
  const shouldClearRedis = await confirm({
    message:
      "Migration successful! Do you want to clear the Redis keys? (Recommended)",
    default: false,
  });

  if (shouldClearRedis) {
    console.log("\nClearing Redis keys...");
    const deleted = await redis.del(...keys);
    console.log(`✓ Deleted ${deleted} Redis keys\n`);
  } else {
    console.log(
      "\nRedis keys retained. You can manually clear them later if needed.\n",
    );
  }

  console.log("========================================");
  console.log("Migration completed successfully!");
  console.log("========================================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("\n❌ Migration failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
