#!/usr/bin/env tsx
/**
 * Reset Development Environment Script
 *
 * This script completely resets the local development environment:
 * - Clears build and cache directories (.next, coverage)
 * - Resets database schema and re-seeds with default data
 *
 * WARNING: This operation is DESTRUCTIVE and cannot be undone!
 *
 * Usage:
 *   npx tsx scripts/reset-dev-environment.ts
 *   or
 *   npm run reset
 */

import "reflect-metadata";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execSync } from "child_process";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Directories to clear
const CACHE_DIRECTORIES = [
  path.join(PROJECT_ROOT, ".next"),
  path.join(PROJECT_ROOT, "coverage"),
  path.join(PROJECT_ROOT, "node_modules/.cache"),
];

/**
 * Helper: Check if file or directory exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper: Get directory size in bytes
 */
async function getDirectorySize(dir: string): Promise<number> {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const sizes = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          return getDirectorySize(filePath);
        }
        const stats = await fs.stat(filePath);
        return stats.size;
      }),
    );
    return sizes.reduce((acc, size) => acc + size, 0);
  } catch {
    return 0;
  }
}

/**
 * Helper: Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Helper: Prompt user for confirmation
 */
function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Clear a directory
 */
async function clearDirectory(dir: string): Promise<void> {
  if (await fileExists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
    console.log(`   ✓ Cleared ${path.basename(dir)}`);
  }
}

/**
 * Main reset function
 */
async function reset() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  🔄 Reset Development Environment     ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  // Show what will be cleared
  console.log("This will:");
  console.log("  1. Clear build caches (.next, coverage)");
  console.log("  2. Reset database (drop all data)");
  console.log("  3. Push database schema");
  console.log("");

  // Calculate sizes
  let totalSize = 0;
  for (const dir of CACHE_DIRECTORIES) {
    if (await fileExists(dir)) {
      const size = await getDirectorySize(dir);
      totalSize += size;
      console.log(`   → ${path.basename(dir)}: ${formatBytes(size)}`);
    }
  }

  if (totalSize > 0) {
    console.log(`   Total cache size: ${formatBytes(totalSize)}`);
  }
  console.log("");

  // Confirm
  console.log("⚠️  WARNING: This action is DESTRUCTIVE and CANNOT be undone!");
  console.log("");

  const confirmed = await promptConfirmation(
    "Are you sure you want to continue? (y/N): ",
  );

  if (!confirmed) {
    console.log("");
    console.log("❌ Reset cancelled");
    process.exit(0);
  }

  console.log("");
  console.log("🚀 Starting reset...");
  console.log("");

  // Step 1: Clear cache directories
  console.log("📁 Step 1: Clearing cache directories...");
  for (const dir of CACHE_DIRECTORIES) {
    await clearDirectory(dir);
  }
  console.log("");

  // Step 2: Reset database
  console.log("🗄️  Step 2: Resetting database...");
  try {
    // Use pg Pool directly instead of Prisma for schema operations
    // Prisma may wrap operations in transactions that don't commit properly
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Drop all data
    console.log("   → Dropping all tables...");
    await pool.query("DROP SCHEMA public CASCADE;");
    await pool.query("CREATE SCHEMA public;");

    await pool.end();
    console.log("   ✓ Database reset");
  } catch (error) {
    console.error("   ✗ Database reset failed:", error);
    process.exit(1);
  }
  console.log("");

  // Step 3: Push schema
  console.log("📊 Step 3: Pushing database schema...");
  try {
    execSync("npm run db:push", {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });
    console.log("   ✓ Schema pushed");
  } catch (_error) {
    console.error("   ✗ Schema push failed");
    process.exit(1);
  }
  console.log("");

  // Success
  console.log("╔════════════════════════════════════════╗");
  console.log("║  ✅ Reset Complete!                   ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");
  console.log("Your development environment has been reset.");
  console.log("Database seeding will run next...");
  console.log("");
}

// Run
reset().catch((error) => {
  console.error("");
  console.error("❌ Reset failed:", error);
  process.exit(1);
});
