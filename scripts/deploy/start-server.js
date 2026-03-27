#!/usr/bin/env node

/**
 * Production Server Startup Script
 *
 * Starts the Next.js production server with proper error handling and graceful shutdown.
 *
 * Usage:
 *   npm run start              # Start server only (requires existing build)
 *   npm run start -- --deploy  # Full deployment: build → migrate → seed (if needed) → start
 *
 * Flags:
 *   --deploy       Run full deployment pipeline (build, migrate, seed, clear cache, start)
 *   --force-build  Force rebuild even if .next exists (use with --deploy)
 *   --skip-seed    Skip seeding even if DB is empty (use with --deploy)
 *   --skip-worker  Don't start the background worker
 *
 * Features:
 *   - Graceful shutdown on SIGTERM/SIGINT
 *   - Environment validation (PORT, DATABASE_URL, REDIS_URL)
 *   - Database and Redis connectivity checks
 *   - Smart seeding (only seeds if DB is empty)
 *   - Parallel worker process management
 */

import { spawn, execSync } from "child_process";
import { createRequire } from "module";
import Redis from "ioredis";
import pg from "pg";
import { loadScriptEnv } from "../utils/load-env.js";

const require = createRequire(import.meta.url);
const fs = require("fs");
const { Pool } = pg;

// Preserve shell env vars, then apply file precedence: .env < .env.production < .env.local
loadScriptEnv();

const IS_PM2 = Boolean(process.env.pm_id || process.env.PM2_HOME || process.env.PM2_USAGE);

// Process references
let serverProcess = null;
let workerProcess = null;

// Parse CLI flags
const args = process.argv.slice(2);
const FLAGS = {
  deploy: args.includes("--deploy"),
  forceBuild: args.includes("--force-build"),
  skipSeed: args.includes("--skip-seed"),
  skipWorker: args.includes("--skip-worker"),
};

// ========================================
// Utility Functions
// ========================================

function log(emoji, message) {
  console.log(`${emoji}  ${message}`);
}

function logStep(step, total, message) {
  console.log(`\n[${step}/${total}] ${message}`);
  console.log("─".repeat(50));
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

/**
 * Execute a command synchronously with output
 */
function runCommand(command, description) {
  log("🔄", description);
  try {
    execSync(command, { stdio: "inherit" });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed`);
    throw error;
  }
}

/**
 * Check if a file/directory exists
 */
function exists(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill any process using the specified port (macOS/Linux)
 * @param {string|number} port - The port number to check
 * @returns {{ killed: boolean, pid?: string }}
 */
function killProcessOnPort(port) {
  try {
    // Get PID of process using the port
    const pid = execSync(`lsof -ti :${port}`, { encoding: "utf-8" }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`);
      return { killed: true, pid };
    }
  } catch {
    // No process on port or command failed - that's fine
  }
  return { killed: false };
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validates and returns the port number
 */
function getValidatedPort() {
  const portEnv = process.env.PORT?.trim();

  if (!portEnv) {
    return "3000";
  }

  const port = parseInt(portEnv, 10);

  if (isNaN(port)) {
    logError(`Invalid PORT: "${portEnv}" is not a number`);
    process.exit(1);
  }

  if (port < 1 || port > 65535) {
    logError(`Invalid PORT: ${port} must be between 1 and 65535`);
    process.exit(1);
  }

  if (port < 1024) {
    logWarning(`PORT ${port} requires root/admin privileges`);
  }

  return portEnv;
}

/**
 * Validates required environment variables
 */
function validateEnvironment() {
  log("🔍", "Validating environment...");

  const required = ["DATABASE_URL", "REDIS_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  logSuccess("Environment variables validated");
}

/**
 * Validates PostgreSQL connection
 */
async function validateDatabase() {
  log("🔍", "Checking PostgreSQL connection...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    await client.query("SELECT 1 as connected");
    client.release();
    await pool.end();
    logSuccess("PostgreSQL connection successful");
    return true;
  } catch (error) {
    logError(`PostgreSQL connection failed: ${error.message}`);
    console.log("💡 Check your DATABASE_URL and ensure PostgreSQL is running");
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

/**
 * Validates Redis connection
 */
async function validateRedis() {
  log("🔍", "Checking Redis connection...");

  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    await redis.ping();
    await redis.quit();
    logSuccess("Redis connection successful");
    return true;
  } catch (error) {
    logError(`Redis connection failed: ${error.message}`);
    console.log("💡 Check your REDIS_URL and ensure Redis is running");
    await redis.quit().catch(() => {});
    process.exit(1);
  }
}

/**
 * Check if build artifacts exist
 */
function validateBuildExists() {
  if (!exists(".next")) {
    logError("Build artifacts not found (.next directory is missing)");
    console.log("💡 Run 'npm run build' or use '--deploy' flag");
    process.exit(1);
  }
  logSuccess("Build artifacts found");
}

// ========================================
// Deployment Functions
// ========================================

/**
 * Check if database needs seeding (empty Role table = fresh DB)
 */
async function isDatabaseEmpty() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();

    // Check if Role table exists and has data
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Role'
      ) as table_exists
    `);

    if (!result.rows[0].table_exists) {
      client.release();
      await pool.end();
      return true; // Table doesn't exist, DB needs setup
    }

    // Check if Role table has any records
    const countResult = await client.query("SELECT COUNT(*) as count FROM \"Role\"");
    const isEmpty = parseInt(countResult.rows[0].count, 10) === 0;

    client.release();
    await pool.end();
    return isEmpty;
  } catch (_error) {
    await pool.end().catch(() => {});
    // If we can't check, assume it needs seeding
    return true;
  }
}

/**
 * Clear Redis cache
 */
async function clearRedisCache() {
  log("🧹", "Clearing Redis cache...");

  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    await redis.flushdb();
    await redis.quit();
    logSuccess("Redis cache cleared");
  } catch (error) {
    logWarning(`Redis cache clear failed: ${error.message} (non-critical)`);
    await redis.quit().catch(() => {});
  }
}

/**
 * Run the full deployment pipeline
 */
async function runDeployment() {
  console.log("\n" + "═".repeat(60));
  console.log("  🚀 PRODUCTION DEPLOYMENT PIPELINE");
  console.log("═".repeat(60));

  const steps = FLAGS.skipWorker ? 6 : 6; // Same count, worker starts in parallel
  let currentStep = 0;

  // Step 1: Build
  currentStep++;
  logStep(currentStep, steps, "BUILD");

  const buildExists = exists(".next");
  if (buildExists && !FLAGS.forceBuild) {
    log("⏭️", "Build exists, skipping (use --force-build to rebuild)");
  } else {
    if (FLAGS.forceBuild && buildExists) {
      log("🗑️", "Removing existing build...");
      fs.rmSync(".next", { recursive: true, force: true });
    }
    runCommand("npm run build", "Building application");
  }

  // Step 2: Generate Prisma Client
  currentStep++;
  logStep(currentStep, steps, "PRISMA GENERATE");
  runCommand("npm run db:generate", "Generating Prisma client");

  // Step 3: Run Migrations
  currentStep++;
  logStep(currentStep, steps, "DATABASE MIGRATIONS");
  runCommand("npx prisma migrate deploy", "Applying database migrations");

  // Step 4: Smart Seed
  currentStep++;
  logStep(currentStep, steps, "DATABASE SEEDING");

  if (FLAGS.skipSeed) {
    log("⏭️", "Seeding skipped (--skip-seed flag)");
  } else {
    const needsSeed = await isDatabaseEmpty();
    if (needsSeed) {
      log("📊", "Database is empty, seeding required");
      runCommand(
        "npx tsx src/infrastructure/database/prisma/seed.ts production",
        "Seeding database"
      );
    } else {
      log("⏭️", "Database already seeded, skipping");
    }
  }

  // Step 5: Clear Cache
  currentStep++;
  logStep(currentStep, steps, "CLEAR CACHE");
  await clearRedisCache();

  // Step 6: Start Server (and Worker)
  currentStep++;
  logStep(currentStep, steps, "START SERVICES");

  console.log("\n" + "═".repeat(60));
  console.log("  ✅ DEPLOYMENT COMPLETE - STARTING SERVICES");
  console.log("═".repeat(60) + "\n");
}

// ========================================
// Server & Worker Management
// ========================================

/**
 * Start the background worker process
 */
function startWorker() {
  if (FLAGS.skipWorker) {
    log("⏭️", "Worker skipped (--skip-worker flag)");
    return;
  }

  log("👷", "Starting background worker...");

  workerProcess = spawn(
    "node",
    ["--import", "tsx", "src/infrastructure/services/queue/worker.ts"],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || "production",
      },
    }
  );

  // Prefix worker output
  workerProcess.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) console.log(`[worker] ${line}`);
    });
  });

  workerProcess.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) console.error(`[worker] ${line}`);
    });
  });

  workerProcess.on("error", (error) => {
    logError(`Worker failed to start: ${error.message}`);
  });

  workerProcess.on("exit", (code, signal) => {
    if (signal) {
      log("⚠️", `Worker killed by signal: ${signal}`);
    } else if (code !== 0) {
      logError(`Worker exited with code: ${code}`);
    }
  });

  logSuccess("Background worker started");
}

/**
 * Start the Next.js production server
 */
function startServer() {
  log("🚀", "Starting Next.js server...");

  const port = getValidatedPort();

  // Kill any existing process on the port
  const { killed, pid } = killProcessOnPort(port);
  if (killed) {
    logWarning(`Killed previous process on port ${port} (PID: ${pid})`);
  }

  serverProcess = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
      PORT: port,
    },
  });

  serverProcess.on("error", (error) => {
    logError(`Server failed to start: ${error.message}`);
    process.exit(1);
  });

  serverProcess.on("exit", (code, signal) => {
    if (signal) {
      log("⚠️", `Server killed by signal: ${signal}`);
    } else if (code !== 0) {
      logError(`Server exited with code: ${code}`);
      process.exit(code);
    }
  });

  console.log("");
  console.log("═".repeat(60));
  console.log(`  🌐 Server running at http://localhost:${port}`);
  if (!FLAGS.skipWorker) {
    console.log("  👷 Background worker running");
  }
  console.log("  📝 Press Ctrl+C to stop");
  console.log("═".repeat(60));
  console.log("");
}

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal) {
  console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);

  const processes = [];
  if (serverProcess) processes.push({ name: "server", proc: serverProcess });
  if (workerProcess) processes.push({ name: "worker", proc: workerProcess });

  if (processes.length === 0) {
    logSuccess("No processes to shut down");
    process.exit(0);
  }

  // Kill all processes
  processes.forEach(({ name, proc }) => {
    log("🛑", `Stopping ${name}...`);
    proc.kill(signal);
  });

  // Force kill after timeout
  const shutdownTimeout = setTimeout(() => {
    logWarning("Processes didn't shut down in time, forcing...");
    processes.forEach(({ proc }) => proc.kill("SIGKILL"));
    process.exit(1);
  }, 10000);

  // Track exits
  let exited = 0;
  processes.forEach(({ name, proc }) => {
    proc.on("exit", () => {
      logSuccess(`${name} stopped`);
      exited++;
      if (exited === processes.length) {
        clearTimeout(shutdownTimeout);
        logSuccess("Shutdown complete");
        process.exit(0);
      }
    });
  });
}

// ========================================
// Main Execution
// ========================================

// Register shutdown handlers
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  handleShutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logError(`Unhandled Rejection: ${reason}`);
  handleShutdown("SIGTERM");
});

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("  🏭 BARQ ASSETS - PRODUCTION SERVER");
  console.log("═".repeat(60));
  console.log(`  📦 Node: ${process.version}`);
  console.log(`  📍 Directory: ${process.cwd()}`);
  console.log(`  🏷️  Mode: ${FLAGS.deploy ? "Full Deployment" : "Server Only"}`);
  console.log("═".repeat(60) + "\n");

  // Stop any existing processes to ensure clean start
  if (IS_PM2) {
    log("⏭️", "Running under PM2 - skipping stop-services to avoid self-termination");
  } else {
    log("🛑", "Stopping existing processes...");
    try {
      execSync("bash scripts/dev/stop-services.sh --force", { stdio: "inherit" });
    } catch (_error) {
      // Ignore errors - processes may not be running
    }
    console.log("");
  }

  // Validate environment first
  validateEnvironment();

  // Run deployment if --deploy flag
  if (FLAGS.deploy) {
    await validateDatabase();
    await validateRedis();
    await runDeployment();
  } else {
    // Standard start: validate and go
    validateBuildExists();
    await validateDatabase();
    await validateRedis();
  }

  // Start services
  startWorker();
  startServer();
}

main().catch((error) => {
  logError(`Startup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
