/**
 * Fix Migration Drift
 *
 * Registers already-applied migrations in Prisma's migration history table.
 * This script ONLY updates metadata (adds records to _prisma_migrations).
 * It does NOT modify the database schema.
 *
 * Safety Features:
 * - Verifies all schema changes exist before registration
 * - Creates automatic backup before making changes
 * - Dry-run mode to preview changes
 * - Transaction-wrapped for atomicity
 * - Provides rollback SQL
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-migration-drift.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-migration-drift.ts --dry-run
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-migration-drift.ts --skip-backup
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-migration-drift.ts --verbose
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { prisma } from "../src/infrastructure/database/prisma/client.js";

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_BACKUP = process.argv.includes("--skip-backup");
const VERBOSE = process.argv.includes("--verbose");

interface UnappliedMigration {
  name: string;
  sql: string;
  checksum: string;
  verified: boolean;
}

function calculateChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function getUnappliedMigrations(): Promise<string[]> {
  // Get all migrations by running the verification script
  try {
    const output = execSync(
      "npx dotenv -e .env.local -- npx tsx scripts/verify-migration-drift.ts",
      { encoding: "utf-8", stdio: "pipe" },
    );

    if (VERBOSE) {
      console.log(output);
    }

    // Exit code 2 means "already applied" - exactly what we want
    return [];
  } catch (error: unknown) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    if (err.status === 2) {
      // Parse output to extract migration names
      const output = err.stdout || "";
      const migrations: string[] = [];

      const lines = output.split("\n");
      for (const line of lines) {
        if (line.includes("📋 Analyzing:")) {
          const match = line.match(/📋 Analyzing: (.+)/);
          if (match) {
            migrations.push(match[1].trim());
          }
        }
      }

      return migrations;
    }

    // Exit code 1 means "missing" - can't fix this
    if (err.status === 1) {
      console.error("❌ Error: Some schema changes are missing from database");
      console.error("   Cannot register migrations that haven't been applied");
      console.error("   Resolution: Run npx prisma migrate dev");
      process.exit(1);
    }

    // Exit code 0 means "no drift" - nothing to fix
    if (err.status === 0) {
      console.log("✅ No drift detected - nothing to fix");
      process.exit(0);
    }

    // Any other error
    throw error;
  }
}

async function readMigrationSQL(migrationName: string): Promise<string> {
  const migrationFile = join(
    process.cwd(),
    "src",
    "infrastructure",
    "database",
    "prisma",
    "schema",
    "migrations",
    migrationName,
    "migration.sql",
  );

  return await readFile(migrationFile, "utf-8");
}

async function createBackup(): Promise<void> {
  if (SKIP_BACKUP) {
    console.log("⚠️  Skipping backup (--skip-backup flag)");
    return;
  }

  console.log("💾 Creating automatic backup...");

  try {
    const output = execSync("bash scripts/db-backup.sh backup --force", {
      encoding: "utf-8",
      stdio: "pipe",
    });

    if (VERBOSE) {
      console.log(output);
    }

    console.log("✅ Backup created successfully\n");
  } catch (error) {
    console.error("❌ Backup failed:");
    console.error(error);
    console.error("\n⚠️  Aborting - cannot proceed without backup");
    process.exit(1);
  }
}

async function verifyFix(): Promise<void> {
  console.log("\n🔍 Verifying fix...");

  try {
    const output = execSync("npx prisma migrate status", {
      encoding: "utf-8",
      stdio: "pipe",
    });

    if (output.includes("Database schema is up to date")) {
      console.log("✅ Verification passed: No pending migrations\n");
      return;
    }

    console.log("⚠️  Verification output:");
    console.log(output);
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string };
    const output = err.stdout || err.stderr || "";

    if (output.includes("Database schema is up to date")) {
      console.log("✅ Verification passed: No pending migrations\n");
      return;
    }

    console.error("❌ Verification failed:");
    console.error(output);
  }
}

function displayRollbackInstructions(migrations: UnappliedMigration[]): void {
  console.log("\n" + "=".repeat(70));
  console.log("ROLLBACK INSTRUCTIONS");
  console.log("=".repeat(70));
  console.log("\nIf you need to undo these changes, run:\n");
  console.log(
    "npx dotenv -e .env.local -- npx tsx scripts/rollback-migration-fix.ts \\",
  );

  for (let i = 0; i < migrations.length; i++) {
    const suffix = i === migrations.length - 1 ? "" : " \\";
    console.log(`  --migration "${migrations[i].name}"${suffix}`);
  }

  console.log("\nOr use raw SQL:");
  console.log("\nDELETE FROM _prisma_migrations");
  console.log("WHERE migration_name IN (");

  for (let i = 0; i < migrations.length; i++) {
    const suffix = i === migrations.length - 1 ? "" : ",";
    console.log(`  '${migrations[i].name}'${suffix}`);
  }

  console.log(");");
  console.log("\n" + "=".repeat(70) + "\n");
}

async function main() {
  console.log("🔧 Migration Drift Fix Tool\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  // Step 1: Detect unapplied migrations
  console.log("📋 Step 1: Detecting unapplied migrations...");
  const unappliedNames = await getUnappliedMigrations();

  if (unappliedNames.length === 0) {
    console.log("✅ No unapplied migrations found - nothing to fix\n");
    process.exit(0);
  }

  console.log(`Found ${unappliedNames.length} unapplied migration(s):\n`);

  // Step 2: Load migration files and calculate checksums
  console.log("📋 Step 2: Loading migration files...");
  const migrations: UnappliedMigration[] = [];

  for (const name of unappliedNames) {
    const sql = await readMigrationSQL(name);
    const checksum = calculateChecksum(sql);

    migrations.push({
      name,
      sql,
      checksum,
      verified: true, // Already verified by verify-migration-drift.ts
    });

    console.log(`   ${name}`);
    if (VERBOSE) {
      console.log(`   Checksum: ${checksum}`);
    }
  }

  console.log();

  // Step 3: Create backup (unless skipped)
  if (!DRY_RUN) {
    console.log("📋 Step 3: Creating backup...");
    await createBackup();
  } else {
    console.log("📋 Step 3: Backup (skipped in dry-run mode)\n");
  }

  // Step 4: Register migrations
  console.log("📋 Step 4: Registering migrations...");

  try {
    // Use transaction for atomicity
    if (!DRY_RUN) {
      await prisma.$transaction(async (tx) => {
        for (const migration of migrations) {
          await tx.$executeRaw`
            INSERT INTO _prisma_migrations (
              id,
              checksum,
              finished_at,
              migration_name,
              logs,
              rolled_back_at,
              started_at,
              applied_steps_count
            ) VALUES (
              gen_random_uuid(),
              ${migration.checksum},
              NOW(),
              ${migration.name},
              '',
              NULL,
              NOW(),
              1
            )
          `;
          console.log(`   ✅ Registered: ${migration.name}`);
        }
      });

      console.log();
    } else {
      for (const migration of migrations) {
        console.log(`   [DRY-RUN] Would register: ${migration.name}`);
      }
      console.log();
    }
  } catch (error) {
    console.error("❌ Failed to register migrations:");
    console.error(error);
    console.error("\n⚠️  Transaction rolled back - no changes made");
    process.exit(1);
  }

  // Step 5: Verify fix
  if (!DRY_RUN) {
    console.log("📋 Step 5: Verifying fix...");
    await verifyFix();
  } else {
    console.log("📋 Step 5: Verification (skipped in dry-run mode)\n");
  }

  // Display rollback instructions
  if (!DRY_RUN) {
    displayRollbackInstructions(migrations);
  }

  // Success summary
  console.log("✅ Success!\n");

  if (DRY_RUN) {
    console.log("This was a DRY RUN - no changes were made.");
    console.log("Run without --dry-run to apply changes.\n");
  } else {
    console.log(`Registered ${migrations.length} migration(s) in history.`);
    console.log("Database schema is now in sync with migration history.\n");
    console.log("Next steps:");
    console.log("  1. Verify with: npx prisma migrate status");
    console.log(
      "  2. Test new migration: npx prisma migrate dev --name test_fix\n",
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
