/**
 * Rollback Migration Fix
 *
 * Removes migration records from _prisma_migrations table.
 * Use this if fix-migration-drift.ts caused issues.
 *
 * This script ONLY removes metadata (deletes from _prisma_migrations).
 * It does NOT modify the database schema.
 *
 * Usage:
 *   # Rollback specific migrations
 *   npx dotenv -e .env.local -- npx tsx scripts/rollback-migration-fix.ts \
 *     --migration "20251201152454_add_service_url_support_fields" \
 *     --migration "20251202084549_add_assignment_source_and_conflict_tracking"
 *
 *   # Dry run
 *   npx dotenv -e .env.local -- npx tsx scripts/rollback-migration-fix.ts \
 *     --migration "20251201152454_add_service_url_support_fields" \
 *     --dry-run
 */

import { prisma } from "../src/infrastructure/database/prisma/client.js";

const DRY_RUN = process.argv.includes("--dry-run");

function parseMigrationArgs(): string[] {
  const migrations: string[] = [];
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--migration" && args[i + 1]) {
      migrations.push(args[i + 1]);
      i++; // Skip the migration name in next iteration
    }
  }

  return migrations;
}

async function verifyMigrationsExist(
  migrations: string[],
): Promise<{ exists: string[]; missing: string[] }> {
  const result = await prisma.$queryRaw<{ migrationName: string }[]>`
    SELECT migration_name as "migrationName"
    FROM _prisma_migrations
    WHERE migration_name = ANY(${migrations}::text[])
  `;

  const found = new Set(result.map((r) => r.migrationName));
  const exists = migrations.filter((m) => found.has(m));
  const missing = migrations.filter((m) => !found.has(m));

  return { exists, missing };
}

async function rollbackMigrations(migrations: string[]): Promise<number> {
  if (DRY_RUN) {
    console.log("[DRY-RUN] Would delete migration records:");
    for (const migration of migrations) {
      console.log(`  - ${migration}`);
    }
    return migrations.length;
  }

  const result = await prisma.$executeRaw`
    DELETE FROM _prisma_migrations
    WHERE migration_name = ANY(${migrations}::text[])
  `;

  return Number(result);
}

async function main() {
  console.log("🔄 Migration Fix Rollback Tool\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  // Parse arguments
  const migrations = parseMigrationArgs();

  if (migrations.length === 0) {
    console.error("❌ Error: No migrations specified");
    console.error("\nUsage:");
    console.error(
      "  npx dotenv -e .env.local -- npx tsx scripts/rollback-migration-fix.ts \\",
    );
    console.error('    --migration "MIGRATION_NAME" \\');
    console.error('    --migration "ANOTHER_MIGRATION"');
    console.error("\nOptions:");
    console.error("  --dry-run  Preview changes without applying");
    process.exit(1);
  }

  console.log(`📋 Step 1: Verifying ${migrations.length} migration(s)...`);

  for (const migration of migrations) {
    console.log(`   - ${migration}`);
  }

  console.log();

  // Verify migrations exist in database
  const { exists, missing } = await verifyMigrationsExist(migrations);

  if (missing.length > 0) {
    console.log(
      "⚠️  Warning: The following migrations are NOT in the database:",
    );
    for (const migration of missing) {
      console.log(`   - ${migration}`);
    }
    console.log("\nThey may have already been rolled back or never existed.");
    console.log();
  }

  if (exists.length === 0) {
    console.log(
      "✅ No migrations to rollback - all specified migrations are already removed\n",
    );
    process.exit(0);
  }

  console.log(`📋 Step 2: Removing ${exists.length} migration record(s)...`);

  // Rollback migrations
  try {
    const deleted = await rollbackMigrations(exists);

    if (DRY_RUN) {
      console.log(`\n[DRY-RUN] Would remove ${exists.length} record(s)\n`);
    } else {
      console.log(`\n✅ Removed ${deleted} migration record(s)\n`);
    }
  } catch (error) {
    console.error("❌ Failed to rollback migrations:");
    console.error(error);
    process.exit(1);
  }

  // Display next steps
  console.log("Next steps:");

  if (DRY_RUN) {
    console.log("  1. Remove --dry-run flag to apply changes");
  } else {
    console.log("  1. Verify with: npx prisma migrate status");
    console.log("  2. If needed, restore database backup:");
    console.log("     bash scripts/db-backup.sh restore");
  }

  console.log();

  // Success
  if (DRY_RUN) {
    console.log("ℹ️  This was a DRY RUN - no changes were made.\n");
  } else {
    console.log("✅ Rollback complete!\n");
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
