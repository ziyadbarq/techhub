#!/usr/bin/env tsx
/**
 * Clear All Caches Script
 *
 * Clears all cache and build artifacts:
 * - Next.js build cache (.next)
 * - Turbopack cache
 * - Node modules cache (node_modules/.cache)
 * - Test coverage cache
 * - TypeScript build info
 * - ESLint cache
 * - Prisma generated client (optional regeneration)
 *
 * Usage:
 *   npx tsx scripts/clear-cache.ts
 *   or
 *   npm run cache:clear
 */

import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execSync } from "child_process";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, "..");

// All cache directories and files to clear
const CACHE_TARGETS = [
  // Next.js and Turbopack
  ".next",
  ".turbo",

  // Test coverage
  "coverage",

  // Node modules cache
  "node_modules/.cache",

  // TypeScript
  "tsconfig.tsbuildinfo",
  ".tsbuildinfo",

  // ESLint
  ".eslintcache",

  // Vitest
  ".vitest",

  // OS-specific
  ".DS_Store",
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
    const stats = await fs.stat(dir);
    if (stats.isFile()) {
      return stats.size;
    }

    const files = await fs.readdir(dir, { withFileTypes: true });
    const sizes = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          return getDirectorySize(filePath);
        }
        const fileStats = await fs.stat(filePath);
        return fileStats.size;
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
 * Clear a cache target (file or directory)
 */
async function clearCacheTarget(target: string): Promise<boolean> {
  const fullPath = path.join(PROJECT_ROOT, target);
  if (await fileExists(fullPath)) {
    await fs.rm(fullPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * Main cache clearing function
 */
async function clearCache() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  🧹 Clear All Caches                  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  // Calculate total cache size
  console.log("📊 Calculating cache size...");
  let totalSize = 0;
  const existingTargets: string[] = [];

  for (const target of CACHE_TARGETS) {
    const fullPath = path.join(PROJECT_ROOT, target);
    if (await fileExists(fullPath)) {
      const size = await getDirectorySize(fullPath);
      if (size > 0) {
        totalSize += size;
        existingTargets.push(target);
        console.log(`   → ${target}: ${formatBytes(size)}`);
      }
    }
  }

  if (existingTargets.length === 0) {
    console.log("");
    console.log("✨ No caches found - everything is clean!");
    console.log("");
    return;
  }

  console.log("");
  console.log(`📦 Total cache size: ${formatBytes(totalSize)}`);
  console.log(`🗑️  Targets to clear: ${existingTargets.length}`);
  console.log("");

  // Clear caches
  console.log("🧹 Clearing caches...");
  let clearedCount = 0;

  for (const target of CACHE_TARGETS) {
    if (await clearCacheTarget(target)) {
      console.log(`   ✓ Cleared ${target}`);
      clearedCount++;
    }
  }

  console.log("");

  // Regenerate Prisma client
  console.log("🔄 Regenerating Prisma client...");
  try {
    execSync("npm run db:generate", {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    });
    console.log("   ✓ Prisma client regenerated");
  } catch (_error) {
    console.warn("   ⚠️  Prisma client regeneration failed (non-critical)");
  }

  console.log("");

  // Success
  console.log("╔════════════════════════════════════════╗");
  console.log("║  ✅ Cache Cleared!                    ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");
  console.log(`Cleared ${clearedCount} cache target(s)`);
  console.log(`Freed up ${formatBytes(totalSize)}`);
  console.log("");
  console.log("💡 Tip: Restart your dev server to use fresh builds");
  console.log("   Run: npm run dev:restart");
  console.log("");
}

// Run
clearCache().catch((error) => {
  console.error("");
  console.error("❌ Cache clearing failed:", error);
  process.exit(1);
});
