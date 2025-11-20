#!/usr/bin/env node

/**
 * Enhanced Build Script
 *
 * Provides better DX with:
 * - Build time tracking
 * - Progress indicators
 * - Colored output
 * - Build statistics
 */

import { spawn } from "child_process";
import { performance } from "perf_hooks";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function printHeader() {
  log("\n╭─────────────────────────────────────────╮", colors.cyan);
  log("│  🚀 Building Production Application     │", colors.cyan);
  log("╰─────────────────────────────────────────╯\n", colors.cyan);
}

function printSeparator() {
  log("─".repeat(45), colors.dim);
}

async function runCommand(command, args, stepName) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    log(`\n${colors.bright}${stepName}${colors.reset}`, colors.blue);
    printSeparator();

    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      const duration = performance.now() - startTime;
      if (code === 0) {
        log(
          `${colors.green}✓${colors.reset} ${stepName} ${colors.dim}(${formatTime(duration)})${colors.reset}`,
        );
        resolve({ success: true, duration });
      } else {
        log(`${colors.red}✗${colors.reset} ${stepName} failed`, colors.red);
        reject(new Error(`${stepName} failed with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  const totalStartTime = performance.now();
  const timings = {};

  printHeader();

  try {
    // Step 1: Run Next.js build
    const buildResult = await runCommand(
      "next",
      ["build"],
      "📦 Building Application",
    );
    timings.build = buildResult.duration;

    // Print summary
    const totalDuration = performance.now() - totalStartTime;
    printSeparator();
    log(`\n${colors.bright}Build Summary${colors.reset}`, colors.green);
    printSeparator();
    log(
      `  Total time:     ${colors.bright}${formatTime(totalDuration)}${colors.reset}`,
    );
    log(`  Build:          ${formatTime(timings.build)}`);
    log(
      `\n${colors.green}✓ Production build complete!${colors.reset}\n`,
      colors.bright,
    );

    log(
      `${colors.dim}Tip: Run ${colors.bright}npm run build:analyze${colors.dim} to analyze bundle size${colors.reset}\n`,
    );
  } catch (_error) {
    log(`\n${colors.red}✗ Build failed${colors.reset}\n`, colors.bright);
    process.exit(1);
  }
}

main();
