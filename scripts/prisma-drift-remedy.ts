#!/usr/bin/env tsx
/**
 * Dev-only helper that rebuilds a migration for a drifted local database without wiping data.
 * It diff's the current database against migration history, generates an idempotent
 * reconciliation migration, and saves both the raw diff and migration SQL.
 *
 * Usage:
 *   npm run db:drift-remedy
 *
 * Requirements:
 *   - DATABASE_URL must point to a local Postgres instance
 *   - Prisma CLI available (dev dependency)
 *   - pg client available (already a dependency)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { config } from "dotenv";

const envPath = fs.existsSync(".env.local") ? ".env.local" : ".env";
config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Create .env.local from .env.example first.",
  );
  process.exit(1);
}

const SHADOW_DATABASE_URL =
  process.env.SHADOW_DATABASE_URL ||
  (() => {
    const derived = new URL(DATABASE_URL);
    const dbName = derived.pathname.replace(/^\//, "");
    derived.pathname = `/${dbName}_shadow`;
    return derived.toString();
  })();

// Ensure prisma.config.ts sees the derived value even if the user did not set it explicitly
if (!process.env.SHADOW_DATABASE_URL) {
  process.env.SHADOW_DATABASE_URL = SHADOW_DATABASE_URL;
}

if (!SHADOW_DATABASE_URL) {
  console.error(
    "Could not derive SHADOW_DATABASE_URL. Please set it in your env.",
  );
  process.exit(1);
}

const parsedDbUrl = new URL(DATABASE_URL);
if (parsedDbUrl.hostname !== "localhost") {
  console.error(
    "Drift remedy is dev-only. Refusing to run because DATABASE_URL is not localhost.",
  );
  process.exit(1);
}

const repoRoot = path.resolve(path.join(import.meta.dirname, ".."));
const migrationsDir = path.join(
  repoRoot,
  "src/infrastructure/database/prisma/schema/migrations",
);
const backupDir = path.join(repoRoot, "local/backups/drift-remedy");

function timestamp(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function run(command: string): string {
  return execSync(command, {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
}

function hasMeaningfulDiff(sql: string): boolean {
  const cleaned = sql
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("--"))
    .join(" ")
    .trim();
  return cleaned.length > 0;
}

function toIdempotent(sql: string, dbSchema = "public"): string {
  const statements = sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  const patchCreateType = (stmt: string): string => {
    const match = stmt.match(
      /^CREATE TYPE\s+"?([A-Za-z0-9_]+)"?\s+AS\s+ENUM\s*\(([\s\S]+)\)$/i,
    );
    if (!match) return "";
    const [, typeName, values] = match;
    return [
      "DO $$",
      "BEGIN",
      `  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName.toLowerCase()}') THEN`,
      `    CREATE TYPE "${typeName}" AS ENUM (${values});`,
      "  END IF;",
      "END $$;",
    ].join("\n");
  };

  const patchAddColumn = (stmt: string): string => {
    const match = stmt.match(/^ALTER TABLE\s+"?([A-Za-z0-9_]+)"?\s+(.*)$/is);
    if (!match) return "";
    const [, tableName, rest] = match;
    const additions = rest
      .replace(/\s+/g, " ")
      .split(/ADD COLUMN\s+/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.replace(/,$/, "").trim())
      .filter(Boolean);

    return additions
      .map((addition) => {
        const columnMatch = addition.match(/^"([^"]+)"/);
        const columnName = columnMatch?.[1];
        const columnCheck = columnName
          ? `SELECT 1 FROM information_schema.columns WHERE table_schema = '${dbSchema}' AND table_name = '${tableName.toLowerCase()}' AND column_name = '${columnName.toLowerCase()}'`
          : "SELECT 1";
        return [
          "DO $$",
          "BEGIN",
          `  IF NOT EXISTS (${columnCheck}) THEN`,
          `    ALTER TABLE "${tableName}" ADD COLUMN ${addition};`,
          "  END IF;",
          "END $$;",
        ].join("\n");
      })
      .join("\n\n");
  };

  const patchCreateIndex = (stmt: string): string => {
    if (/^CREATE\s+UNIQUE\s+INDEX/i.test(stmt)) {
      return (
        stmt.replace(
          /^CREATE\s+UNIQUE\s+INDEX/i,
          "CREATE UNIQUE INDEX IF NOT EXISTS",
        ) + ";"
      );
    }
    return stmt.replace(/^CREATE\s+INDEX/i, "CREATE INDEX IF NOT EXISTS") + ";";
  };

  const wrapWithRescue = (stmt: string): string =>
    [
      "DO $$",
      "BEGIN",
      `  ${stmt.endsWith(";") ? stmt.slice(0, -1) : stmt};`,
      "EXCEPTION",
      "  WHEN duplicate_object THEN NULL;",
      "  WHEN duplicate_column THEN NULL;",
      "  WHEN duplicate_table THEN NULL;",
      "  WHEN undefined_column THEN NULL;",
      "END $$;",
    ].join("\n");

  const patched = statements.flatMap((stmt) => {
    if (!stmt || stmt.startsWith("--")) {
      return [];
    }

    if (/^CREATE TYPE/i.test(stmt)) {
      return [patchCreateType(stmt)];
    }

    if (/^ALTER TABLE/i.test(stmt) && /ADD COLUMN/i.test(stmt)) {
      return [patchAddColumn(stmt)];
    }

    if (/^CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt)) {
      return [patchCreateIndex(stmt)];
    }

    return [wrapWithRescue(stmt)];
  });

  return [
    "-- Drift reconciliation migration (dev-only)",
    `-- Generated by scripts/prisma-drift-remedy.ts on ${new Date().toISOString()}`,
    `-- Target database: ${parsedDbUrl.host}${parsedDbUrl.pathname}`,
    "",
    patched.filter(Boolean).join("\n\n"),
    "",
  ].join("\n");
}

console.log("🔍 Checking for drift against migration history...");
const rawDiff = run(
  [
    "npx prisma migrate diff",
    `--from-migrations "${migrationsDir}"`,
    "--to-config-datasource",
    "--config prisma.config.ts",
    "--script",
  ].join(" "),
);

if (!hasMeaningfulDiff(rawDiff)) {
  console.log("✅ No drift detected. Nothing to do.");
  process.exit(0);
}

fs.mkdirSync(backupDir, { recursive: true });
const stamp = timestamp();
const rawDiffPath = path.join(backupDir, `${stamp}_raw_diff.sql`);
fs.writeFileSync(rawDiffPath, rawDiff, "utf8");
console.log(`📄 Saved raw diff to ${path.relative(repoRoot, rawDiffPath)}`);

const migrationName = `${stamp}_drift_reconciliation`;
const migrationPath = path.join(migrationsDir, migrationName);
fs.mkdirSync(migrationPath, { recursive: true });
const migrationSql = toIdempotent(rawDiff);
fs.writeFileSync(
  path.join(migrationPath, "migration.sql"),
  migrationSql,
  "utf8",
);
console.log(
  `📝 Created reconciliation migration at ${path.relative(repoRoot, migrationPath)}`,
);

console.log("");
console.log("Next steps:");
console.log(
  "  1) Review the generated migration.sql to confirm the statements look correct.",
);
console.log(
  "  2) Run npm run db:migrate to record the migration (should be no-op on drifted DB).",
);
console.log(
  "  3) Once applied, you can keep using migrate dev normally without needing db:push.",
);
