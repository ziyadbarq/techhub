/**
 * Verify Migration Drift
 *
 * Detects drift between Prisma migration history and actual database schema.
 * Compares expected migrations against recorded migrations and database state.
 *
 * Exit Codes:
 *   0 - No drift detected (everything in sync)
 *   1 - Drift detected: missing schema changes (migrations not applied)
 *   2 - Drift detected: schema already applied (migrations not recorded)
 *   3 - Fatal error (connection, permissions, etc.)
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/verify-migration-drift.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/verify-migration-drift.ts --warn-only
 *   npx dotenv -e .env.local -- npx tsx scripts/verify-migration-drift.ts --verbose
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "../src/infrastructure/database/prisma/client.js";

const WARN_ONLY = process.argv.includes("--warn-only");
const VERBOSE = process.argv.includes("--verbose");

interface MigrationRecord {
  migrationName: string;
  checksum: string;
  finishedAt: Date | null;
  logs: string | null;
}

interface DriftFinding {
  migrationName: string;
  verdict: "IN_SYNC" | "ALREADY_APPLIED" | "MISSING" | "PARTIAL";
  expectedChanges: string[];
  details: string;
}

async function getRecordedMigrations(): Promise<Set<string>> {
  const recorded = await prisma.$queryRaw<MigrationRecord[]>`
    SELECT migration_name as "migrationName"
    FROM _prisma_migrations
    ORDER BY finished_at ASC
  `;

  return new Set(recorded.map((m) => m.migrationName));
}

async function getAllMigrationFolders(): Promise<string[]> {
  const migrationsPath = join(
    process.cwd(),
    "src",
    "infrastructure",
    "database",
    "prisma",
    "schema",
    "migrations",
  );

  const entries = await readdir(migrationsPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
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

async function verifyColumnsExist(
  table: string,
  columns: string[],
): Promise<{ exists: string[]; missing: string[] }> {
  if (columns.length === 0) return { exists: [], missing: [] };

  const result = await prisma.$queryRaw<{ columnName: string }[]>`
    SELECT column_name as "columnName"
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ${table}
    AND column_name = ANY(${columns}::text[])
  `;

  const found = new Set(result.map((r) => r.columnName));
  const exists = columns.filter((c) => found.has(c));
  const missing = columns.filter((c) => !found.has(c));

  return { exists, missing };
}

async function verifyIndexesExist(
  table: string,
  indexes: string[],
): Promise<{ exists: string[]; missing: string[] }> {
  if (indexes.length === 0) return { exists: [], missing: [] };

  const result = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = ${table}
    AND indexname = ANY(${indexes}::text[])
  `;

  const found = new Set(result.map((r) => r.indexname));
  const exists = indexes.filter((idx) => found.has(idx));
  const missing = indexes.filter((idx) => !found.has(idx));

  return { exists, missing };
}

async function verifyEnumExists(
  enumName: string,
  expectedValues: string[],
): Promise<{ exists: boolean; values: string[] }> {
  try {
    const result = await prisma.$queryRaw<{ enumlabel: string }[]>`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = ${enumName}
      ORDER BY e.enumsortorder
    `;

    const values = result.map((r) => r.enumlabel);
    const exists = expectedValues.every((v) => values.includes(v));

    return { exists, values };
  } catch {
    return { exists: false, values: [] };
  }
}

function parseExpectedChanges(sql: string): {
  tables: Map<string, string[]>;
  indexes: Map<string, string[]>;
  enums: Map<string, string[]>;
} {
  const tables = new Map<string, string[]>();
  const indexes = new Map<string, string[]>();
  const enums = new Map<string, string[]>();

  // Parse CREATE TYPE ... AS ENUM
  const enumRegex = /CREATE TYPE "(\w+)" AS ENUM \(([^)]+)\)/g;
  let match;
  while ((match = enumRegex.exec(sql)) !== null) {
    const enumName = match[1];
    const values = match[2].split(",").map((v) => v.trim().replace(/'/g, ""));
    enums.set(enumName, values);
  }

  // Parse ALTER TABLE ... ADD COLUMN
  const alterTableRegex = /ALTER TABLE "(\w+)"[\s\S]*?ADD COLUMN\s+"(\w+)"/g;
  while ((match = alterTableRegex.exec(sql)) !== null) {
    const table = match[1];
    const column = match[2];
    if (!tables.has(table)) {
      tables.set(table, []);
    }
    tables.get(table)!.push(column);
  }

  // Parse CREATE INDEX
  const indexRegex = /CREATE INDEX "(\w+)" ON "(\w+)"/g;
  while ((match = indexRegex.exec(sql)) !== null) {
    const indexName = match[1];
    const table = match[2];
    if (!indexes.has(table)) {
      indexes.set(table, []);
    }
    indexes.get(table)!.push(indexName);
  }

  return { tables, indexes, enums };
}

async function verifyMigration(migrationName: string): Promise<DriftFinding> {
  const sql = await readMigrationSQL(migrationName);
  const { tables, indexes, enums } = parseExpectedChanges(sql);

  const expectedChanges: string[] = [];
  const missingChanges: string[] = [];

  // Verify enums
  for (const [enumName, expectedValues] of enums.entries()) {
    expectedChanges.push(`ENUM ${enumName} (${expectedValues.length} values)`);
    const { exists, values } = await verifyEnumExists(enumName, expectedValues);

    if (!exists) {
      missingChanges.push(
        `ENUM ${enumName} (found ${values.length}, expected ${expectedValues.length})`,
      );
    }
  }

  // Verify columns
  for (const [table, columns] of tables.entries()) {
    expectedChanges.push(`${table}: ${columns.length} columns`);
    const { missing } = await verifyColumnsExist(table, columns);

    if (missing.length > 0) {
      missingChanges.push(`${table}: missing columns ${missing.join(", ")}`);
    }
  }

  // Verify indexes
  for (const [table, idxNames] of indexes.entries()) {
    expectedChanges.push(`${table}: ${idxNames.length} indexes`);
    const { missing } = await verifyIndexesExist(table, idxNames);

    if (missing.length > 0) {
      missingChanges.push(`${table}: missing indexes ${missing.join(", ")}`);
    }
  }

  // Determine verdict
  let verdict: DriftFinding["verdict"];
  let details: string;

  if (missingChanges.length === 0) {
    verdict = "ALREADY_APPLIED";
    details = "All schema changes exist in database";
  } else if (missingChanges.length === expectedChanges.length) {
    verdict = "MISSING";
    details = "None of the schema changes exist";
  } else {
    verdict = "PARTIAL";
    details = `${missingChanges.length}/${expectedChanges.length} changes missing`;
  }

  return {
    migrationName,
    verdict,
    expectedChanges,
    details: missingChanges.length > 0 ? missingChanges.join(", ") : details,
  };
}

async function main() {
  console.log("🔍 Verifying migration drift...\n");

  try {
    const [recorded, all] = await Promise.all([
      getRecordedMigrations(),
      getAllMigrationFolders(),
    ]);

    const unrecorded = all.filter((m) => !recorded.has(m));

    if (unrecorded.length === 0) {
      console.log("✅ No drift detected");
      console.log(`   All ${all.length} migrations are recorded\n`);
      process.exit(0);
    }

    console.log(
      `⚠️  Drift detected: ${unrecorded.length} unrecorded migration(s)\n`,
    );

    const findings: DriftFinding[] = [];

    for (const migration of unrecorded) {
      console.log(`📋 Analyzing: ${migration}`);
      const finding = await verifyMigration(migration);
      findings.push(finding);

      if (VERBOSE) {
        console.log(
          `   Expected changes: ${finding.expectedChanges.join(", ")}`,
        );
      }
      console.log(`   Status: ${finding.verdict}`);
      console.log(`   Details: ${finding.details}\n`);
    }

    // Determine exit code based on findings
    const allAlreadyApplied = findings.every(
      (f) => f.verdict === "ALREADY_APPLIED",
    );
    const anyMissing = findings.some(
      (f) => f.verdict === "MISSING" || f.verdict === "PARTIAL",
    );

    if (allAlreadyApplied) {
      console.log(
        "📌 Summary: Schema changes already applied but not recorded",
      );
      console.log(
        "   Resolution: Run fix-migration-drift.ts to register migrations\n",
      );

      if (WARN_ONLY) {
        console.log("⚠️  WARNING MODE: Drift detected but not blocking");
        process.exit(0);
      }

      process.exit(2);
    } else if (anyMissing) {
      console.log("❌ Summary: Some schema changes are missing from database");
      console.log(
        "   Resolution: Run npx prisma migrate dev to apply migrations\n",
      );
      process.exit(1);
    } else {
      console.log("✅ No significant drift detected\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

main();
