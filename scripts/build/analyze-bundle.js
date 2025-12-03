#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 *
 * Manual bundle analysis tool for Turbopack builds.
 * Works around the limitation that @next/bundle-analyzer requires Webpack.
 */

import { readdir, stat } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const files = await readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      const filePath = join(dirPath, file.name);

      if (file.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await stat(filePath);
        totalSize += stats.size;
      }
    }
  } catch (_error) {
    // Directory doesn't exist
    return 0;
  }

  return totalSize;
}

async function analyzeChunks(chunksPath) {
  const chunks = [];

  try {
    const files = await readdir(chunksPath, { withFileTypes: true });

    for (const file of files) {
      if (!file.isDirectory() && file.name.endsWith(".js")) {
        const filePath = join(chunksPath, file.name);
        const stats = await stat(filePath);
        chunks.push({
          name: file.name,
          size: stats.size,
        });
      }
    }
  } catch (_error) {
    return [];
  }

  return chunks.sort((a, b) => b.size - a.size);
}

async function main() {
  const nextDir = join(__dirname, "..", ".next");

  log("\n╭────────────────────────────────────────╮", colors.cyan);
  log("│  📊 Bundle Size Analysis               │", colors.cyan);
  log("╰────────────────────────────────────────╯\n", colors.cyan);

  // Check if build exists
  try {
    await stat(nextDir);
  } catch (_error) {
    log(
      `${colors.red}✗ No build found. Run ${colors.bright}npm run build${colors.red} first.${colors.reset}\n`,
    );
    process.exit(1);
  }

  // Analyze sizes
  log(`${colors.bright}Build Directory Sizes${colors.reset}`, colors.blue);
  log("─".repeat(45), colors.dim);

  const totalSize = await getDirectorySize(nextDir);
  const staticSize = await getDirectorySize(join(nextDir, "static"));
  const chunksSize = await getDirectorySize(
    join(nextDir, "static", "chunks"),
  );

  log(`  Total build:        ${formatBytes(totalSize)}`);
  log(
    `  Static assets:      ${formatBytes(staticSize)} ${colors.dim}(downloaded by users)${colors.reset}`,
  );
  log(`  JavaScript chunks:  ${formatBytes(chunksSize)}\n`);

  // Size recommendations
  if (staticSize > 5 * 1024 * 1024) {
    log(
      `${colors.yellow}⚠ Static bundle is large (>${formatBytes(5 * 1024 * 1024)}). Consider code splitting.${colors.reset}\n`,
    );
  } else if (staticSize > 2 * 1024 * 1024) {
    log(
      `${colors.yellow}ℹ Static bundle is moderate. Monitor size as you add features.${colors.reset}\n`,
    );
  } else {
    log(
      `${colors.green}✓ Static bundle size is good!${colors.reset}\n`,
    );
  }

  // Analyze top chunks
  log(`${colors.bright}Top 10 Largest Chunks${colors.reset}`, colors.blue);
  log("─".repeat(45), colors.dim);

  const chunks = await analyzeChunks(join(nextDir, "static", "chunks"));

  if (chunks.length === 0) {
    log(`  ${colors.dim}No chunk files found${colors.reset}\n`);
  } else {
    chunks.slice(0, 10).forEach((chunk, index) => {
      const sizeColor =
        chunk.size > 200 * 1024
          ? colors.red
          : chunk.size > 100 * 1024
            ? colors.yellow
            : colors.reset;
      log(
        `  ${index + 1}. ${chunk.name} ${colors.dim}─${colors.reset} ${sizeColor}${formatBytes(chunk.size)}${colors.reset}`,
      );
    });
    log("");
  }

  // Recommendations
  log(`${colors.bright}Optimization Tips${colors.reset}`, colors.blue);
  log("─".repeat(45), colors.dim);
  log(`  • Use dynamic imports for heavy components`);
  log(`  • Check ${colors.bright}serverExternalPackages${colors.reset} in next.config.ts`);
  log(`  • Lazy load routes with large dependencies`);
  log(`  • Review Radix UI imports (use specific packages)`);
  log(
    `  • Run ${colors.bright}npx depcheck${colors.reset} to find unused dependencies\n`,
  );

  log(
    `${colors.dim}Note: Full interactive bundle analysis will be available when Next.js${colors.reset}`,
  );
  log(
    `${colors.dim}bundle analyzer supports Turbopack builds.${colors.reset}\n`,
  );
}

main().catch(console.error);
