#!/usr/bin/env npx tsx
/**
 * Prisma Import Migration Script
 *
 * Migrates imports from @/generated/prisma to @/generated/prisma/server
 * for files that need PrismaClient or Prisma namespace.
 *
 * Usage:
 *   npx tsx scripts/fix-prisma-imports.ts              # Run migration
 *   npx tsx scripts/fix-prisma-imports.ts --dry-run    # Preview changes
 *
 * What it does:
 * - Finds files importing PrismaClient or Prisma from @/generated/prisma
 * - Changes import path to @/generated/prisma/server
 * - Also handles @/generated/prisma/client -> @/generated/prisma/server
 */

import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";

// Imports that require server-only access
const SERVER_ONLY_IMPORTS = ["PrismaClient", "Prisma"];

interface FileChange {
  file: string;
  oldImport: string;
  newImport: string;
}

function processFile(filePath: string, dryRun: boolean): FileChange | null {
  const content = fs.readFileSync(filePath, "utf-8");

  // Skip files that don't import from prisma paths
  if (
    !content.includes('@/generated/prisma"') &&
    !content.includes("@/generated/prisma'")
  ) {
    return null;
  }

  // Skip files that already import from /server
  if (
    content.includes('@/generated/prisma/server"') ||
    content.includes("@/generated/prisma/server'")
  ) {
    return null;
  }

  let modified = content;
  let changed = false;
  let oldImport = "";
  let newImport = "";

  // Pattern 1: import { PrismaClient, ... } from "@/generated/prisma"
  // Pattern 2: import type { PrismaClient, ... } from "@/generated/prisma"
  const importRegex =
    /import\s+(type\s+)?\{([^}]+)\}\s+from\s+["']@\/generated\/prisma(\/client)?["'];?/g;

  modified = content.replace(importRegex, (match, typeKeyword, imports) => {
    const importList = imports.split(",").map((s: string) => s.trim());

    // Check if any import requires server-only access
    const needsServer = importList.some((imp: string) => {
      const cleanName = imp
        .split(" as ")[0]
        .replace(/^type\s+/, "")
        .trim();
      return SERVER_ONLY_IMPORTS.includes(cleanName);
    });

    if (needsServer) {
      changed = true;
      oldImport = match;
      const typePrefix = typeKeyword || "";
      newImport = `import ${typePrefix}{ ${importList.join(", ")} } from "@/generated/prisma/server"`;
      return newImport;
    }

    return match;
  });

  // Pattern 3: import * as Prisma from "@/generated/prisma"
  const namespaceRegex =
    /import\s+\*\s+as\s+(\w+)\s+from\s+["']@\/generated\/prisma(\/client)?["'];?/g;

  modified = modified.replace(namespaceRegex, (match, alias) => {
    changed = true;
    oldImport = match;
    newImport = `import * as ${alias} from "@/generated/prisma/server"`;
    return newImport;
  });

  if (changed && !dryRun) {
    fs.writeFileSync(filePath, modified, "utf-8");
  }

  return changed ? { file: filePath, oldImport, newImport } : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(`\n🔄 Prisma Import Migration ${dryRun ? "(DRY RUN)" : ""}\n`);
  console.log(
    "Scanning for files that need PrismaClient or Prisma imports...\n",
  );

  // Find all TypeScript files (excluding generated and node_modules)
  const patterns = ["src/**/*.ts", "src/**/*.tsx"];

  const ignorePatterns = ["**/node_modules/**", "**/generated/**", "**/*.d.ts"];

  const files = globSync(patterns, {
    ignore: ignorePatterns,
    absolute: true,
  });

  const changes: FileChange[] = [];

  for (const file of files) {
    const change = processFile(file, dryRun);
    if (change) {
      changes.push(change);
    }
  }

  if (changes.length === 0) {
    console.log("✅ No files need migration.\n");
    return;
  }

  console.log(
    `Found ${changes.length} file(s) to ${dryRun ? "update" : "updated"}:\n`,
  );

  for (const change of changes) {
    const relativePath = path.relative(process.cwd(), change.file);
    console.log(`  ${dryRun ? "Would update" : "Updated"}: ${relativePath}`);
  }

  console.log("");

  if (dryRun) {
    console.log("Run without --dry-run to apply changes.\n");
  } else {
    console.log("✅ Migration complete!\n");
    console.log("Next steps:");
    console.log("  1. Run 'npm run type-check' to verify no errors");
    console.log("  2. Run 'npm run validate' for full validation\n");
  }
}

main().catch(console.error);
