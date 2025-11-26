#!/usr/bin/env node

/**
 * Production Deployment Script
 *
 * Orchestrates the full deployment pipeline and starts services via PM2.
 *
 * Usage:
 *   npm run deploy              # Standard deployment (builds if needed)
 *   npm run deploy:full         # Full deployment (npm install + force rebuild)
 *
 * Flags:
 *   --install       Force npm install (auto-runs if node_modules missing)
 *   --force-build   Force rebuild even if .next exists
 *   --skip-seed     Skip seeding even if DB is empty
 *   --skip-worker   Don't start the worker process in PM2
 *
 * Pipeline:
 *   1. Validate environment
 *   2. npm install (if needed)
 *   3. Prisma generate
 *   4. Build (if needed)
 *   5. Database migrations
 *   6. Smart seed (if DB empty)
 *   7. Clear Redis cache
 *   8. Start PM2 processes
 */

import { execSync } from "child_process";
import { createRequire } from "module";
import { config as loadEnv } from "dotenv";
import Redis from "ioredis";
import pg from "pg";

const require = createRequire(import.meta.url);
const fs = require("fs");
const path = require("path");
const { Pool } = pg;

// Load environment variables
loadEnv({ path: ".env.production" });
loadEnv({ path: ".env.local" });
loadEnv();

// Parse CLI flags
const args = process.argv.slice(2);
const FLAGS = {
  install: args.includes("--install"),
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
  console.log(`\n[${"=".repeat(step)}${"-".repeat(total - step)}] Step ${step}/${total}: ${message}`);
  console.log("-".repeat(60));
}

function logSuccess(message) {
  console.log(`   ✅ ${message}`);
}

function logError(message) {
  console.error(`   ❌ ${message}`);
}

function logWarning(message) {
  console.warn(`   ⚠️  ${message}`);
}

function logSkip(message) {
  console.log(`   ⏭️  ${message}`);
}

/**
 * Execute a command synchronously with output
 */
function runCommand(command, description, options = {}) {
  log("🔄", description);
  try {
    execSync(command, {
      stdio: options.silent ? "pipe" : "inherit",
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    if (options.allowFailure) {
      logWarning(`${description} failed (non-critical)`);
      return false;
    }
    logError(`${description} failed`);
    throw error;
  }
}

/**
 * Check if a file/directory exists
 */
function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ========================================
// Validation Functions
// ========================================

/**
 * Validates required environment variables
 */
function validateEnvironment() {
  log("🔍", "Validating environment variables...");

  const required = ["DATABASE_URL", "REDIS_URL"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(", ")}`);
    console.log("\n💡 Create a .env.local file with:");
    missing.forEach((key) => console.log(`   ${key}=your_value`));
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
    connectionTimeoutMillis: 10000,
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
    console.log("   brew services start postgresql@16");
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
    connectTimeout: 10000,
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
    console.log("   brew services start redis");
    await redis.quit().catch(() => {});
    process.exit(1);
  }
}

// ========================================
// Deployment Steps
// ========================================

/**
 * Step 1: npm install
 */
function runInstall() {
  const nodeModulesExists = exists("node_modules");

  if (!nodeModulesExists) {
    log("📦", "node_modules not found, installing dependencies...");
    runCommand("npm install", "Installing dependencies");
  } else if (FLAGS.install) {
    runCommand("npm install", "Installing dependencies (forced)");
  } else {
    logSkip("Dependencies already installed (use --install to force)");
  }
}

/**
 * Step 2: Prisma generate
 */
function runPrismaGenerate() {
  runCommand("npx prisma generate", "Generating Prisma client");
}

/**
 * Step 3: Build
 */
function runBuild() {
  const buildExists = exists(".next");

  if (buildExists && !FLAGS.forceBuild) {
    logSkip("Build exists (use --force-build to rebuild)");
    return;
  }

  if (FLAGS.forceBuild && buildExists) {
    log("🗑️", "Removing existing build...");
    fs.rmSync(".next", { recursive: true, force: true });
  }

  runCommand("npm run build", "Building application");
}

/**
 * Step 4: Database migrations
 */
function runMigrations() {
  runCommand(
    "npx dotenv -e .env.local -- prisma migrate deploy",
    "Applying database migrations"
  );
}

/**
 * Step 5: Smart seed
 */
async function runSmartSeed() {
  if (FLAGS.skipSeed) {
    logSkip("Seeding skipped (--skip-seed flag)");
    return;
  }

  log("🔍", "Checking if database needs seeding...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();

    // Check if Role table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Role'
      ) as table_exists
    `);

    if (!tableCheck.rows[0].table_exists) {
      client.release();
      await pool.end();
      log("📊", "Database tables not found, seeding required");
      runCommand(
        'npx dotenv -e .env.local -- npx tsx src/infrastructure/database/prisma/seed.ts production',
        "Seeding database"
      );
      return;
    }

    // Check if Role table has data
    const countResult = await client.query('SELECT COUNT(*) as count FROM "Role"');
    const isEmpty = parseInt(countResult.rows[0].count, 10) === 0;

    client.release();
    await pool.end();

    if (isEmpty) {
      log("📊", "Database is empty, seeding required");
      runCommand(
        'npx dotenv -e .env.local -- npx tsx src/infrastructure/database/prisma/seed.ts production',
        "Seeding database"
      );
    } else {
      logSkip("Database already seeded");
    }
  } catch (error) {
    await pool.end().catch(() => {});
    logWarning(`Could not check database state: ${error.message}`);
    logSkip("Skipping seed check (run manually if needed: npm run db:seed)");
  }
}

/**
 * Step 6: Clear Redis cache
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
 * Step 7: Start PM2 processes
 */
function startPM2() {
  // Check if PM2 is installed
  try {
    execSync("pm2 --version", { stdio: "pipe" });
  } catch {
    logError("PM2 is not installed");
    console.log("💡 Install PM2 globally: npm install -g pm2");
    process.exit(1);
  }

  // Check if ecosystem config exists
  const ecosystemPath = path.join(process.cwd(), "ecosystem.config.cjs");
  if (!exists(ecosystemPath)) {
    logError("ecosystem.config.cjs not found");
    process.exit(1);
  }

  // Stop existing processes gracefully
  log("🛑", "Stopping existing PM2 processes...");
  try {
    execSync("pm2 stop all", { stdio: "pipe" });
    logSuccess("Existing processes stopped");
  } catch {
    logSkip("No existing processes to stop");
  }

  // Delete old processes to ensure clean start
  try {
    execSync("pm2 delete all", { stdio: "pipe" });
  } catch {
    // Ignore if nothing to delete
  }

  // Start processes
  if (FLAGS.skipWorker) {
    log("🚀", "Starting web server only (--skip-worker)...");
    runCommand(
      "pm2 start ecosystem.config.cjs --only barq-web --env production",
      "Starting PM2 (web only)"
    );
  } else {
    log("🚀", "Starting all services...");
    runCommand(
      "pm2 start ecosystem.config.cjs --env production",
      "Starting PM2 (web + worker)"
    );
  }

  // Save PM2 process list
  try {
    execSync("pm2 save", { stdio: "pipe" });
  } catch {
    // Non-critical
  }
}

// ========================================
// Main Execution
// ========================================

async function main() {
  const startTime = Date.now();

  console.log("\n" + "═".repeat(60));
  console.log("  🚀 BARQ ASSETS - PRODUCTION DEPLOYMENT");
  console.log("═".repeat(60));
  console.log(`  📦 Node: ${process.version}`);
  console.log(`  📍 Directory: ${process.cwd()}`);
  console.log(`  🏷️  Flags: ${Object.entries(FLAGS).filter(([, v]) => v).map(([k]) => `--${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`).join(" ") || "(none)"}`);
  console.log("═".repeat(60));

  const totalSteps = 7;

  // Step 1: Validate environment
  logStep(1, totalSteps, "VALIDATE ENVIRONMENT");
  validateEnvironment();
  await validateDatabase();
  await validateRedis();

  // Step 2: Install dependencies
  logStep(2, totalSteps, "INSTALL DEPENDENCIES");
  runInstall();

  // Step 3: Generate Prisma client
  logStep(3, totalSteps, "PRISMA GENERATE");
  runPrismaGenerate();

  // Step 4: Build application
  logStep(4, totalSteps, "BUILD APPLICATION");
  runBuild();

  // Step 5: Run migrations
  logStep(5, totalSteps, "DATABASE MIGRATIONS");
  runMigrations();

  // Step 6: Smart seed
  logStep(6, totalSteps, "DATABASE SEEDING");
  await runSmartSeed();

  // Step 7: Clear cache & start services
  logStep(7, totalSteps, "START SERVICES");
  await clearRedisCache();
  startPM2();

  // Done!
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "═".repeat(60));
  console.log("  ✅ DEPLOYMENT COMPLETE");
  console.log("═".repeat(60));
  console.log(`  ⏱️  Duration: ${duration}s`);
  console.log(`  🌐 Web server: barq-web`);
  if (!FLAGS.skipWorker) {
    console.log(`  👷 Worker: barq-worker`);
  }
  console.log("");
  console.log("  📊 View status:  npm run pm2:status");
  console.log("  📝 View logs:    npm run pm2:logs");
  console.log("  🔄 Restart:      npm run pm2:restart");
  console.log("  🛑 Stop:         npm run pm2:stop");
  console.log("═".repeat(60) + "\n");
}

main().catch((error) => {
  logError(`Deployment failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
