#!/usr/bin/env node

/**
 * Production Server Startup Script
 *
 * Starts the Next.js production server with proper error handling and graceful shutdown.
 * Features:
 * - Graceful shutdown on SIGTERM/SIGINT
 * - Process exit code handling
 * - Environment validation
 * - Proper cleanup
 */

import { spawn } from "child_process";
import { createRequire } from "module";
import { config as loadEnv } from "dotenv";
import Redis from "ioredis";
import pg from "pg";

const require = createRequire(import.meta.url);
const { Pool } = pg;

// Load environment variables from local files so validation reflects Next.js runtime
loadEnv({ path: ".env.production" });
loadEnv({ path: ".env.local" });
loadEnv();

// Server process reference
let serverProcess = null;

/**
 * Validates and returns the port number
 * @returns {string} Valid port number
 */
function getValidatedPort() {
  const portEnv = process.env.PORT?.trim();

  if (!portEnv) {
    return "3000"; // Default port
  }

  const port = parseInt(portEnv, 10);

  if (isNaN(port)) {
    console.error(`❌ Invalid PORT: "${portEnv}" is not a number`);
    process.exit(1);
  }

  if (port < 1 || port > 65535) {
    console.error(`❌ Invalid PORT: ${port} must be between 1 and 65535`);
    process.exit(1);
  }

  if (port < 1024) {
    console.warn(`⚠️  Warning: PORT ${port} requires root/admin privileges`);
  }

  return portEnv;
}

/**
 * Starts the Next.js production server
 */
function startServer() {
  console.log("🚀 Starting production server...");
  console.log(`📦 Node Environment: ${process.env.NODE_ENV || "production"}`);
  console.log(`📍 Working Directory: ${process.cwd()}`);
  console.log("");

  const port = getValidatedPort();

  // Spawn next start process
  serverProcess = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
      PORT: port,
    },
  });

  // Handle server process errors
  serverProcess.on("error", (error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });

  // Handle server process exit
  serverProcess.on("exit", (code, signal) => {
    if (signal) {
      console.log(`\n⚠️  Server process killed by signal: ${signal}`);
    } else if (code !== 0) {
      console.error(`\n❌ Server process exited with code: ${code}`);
      process.exit(code);
    } else {
      console.log("\n✅ Server process exited cleanly");
    }
  });

  console.log("✅ Server started successfully");
  console.log(`🔗 Server should be running on http://localhost:${port}`);
  console.log("📝 Press Ctrl+C to stop the server");
  console.log("");
}

/**
 * Handles graceful shutdown
 */
function handleShutdown(signal) {
  console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);

  if (serverProcess) {
    // Forward the signal to the server process
    serverProcess.kill(signal);

    // Give the server 10 seconds to shut down gracefully
    const shutdownTimeout = setTimeout(() => {
      console.log("⚠️  Server didn't shut down in time, forcing shutdown...");
      serverProcess.kill("SIGKILL");
    }, 10000);

    // Clear timeout if server exits gracefully
    serverProcess.on("exit", () => {
      clearTimeout(shutdownTimeout);
      console.log("✅ Shutdown complete");
      process.exit(0);
    });
  } else {
    console.log("✅ No server process to shut down");
    process.exit(0);
  }
}

/**
 * Validates environment before starting
 */
function validateEnvironment() {
  // Check if .next directory exists (build artifacts)
  try {
    require("fs").accessSync(".next", require("fs").constants.F_OK);
  } catch (_error) {
    console.error("❌ Build artifacts not found (.next directory is missing)");
    console.error("💡 Run 'npm run build' before starting the production server");
    process.exit(1);
  }

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  if (!process.env.REDIS_URL) {
    console.error("❌ REDIS_URL is not set");
    process.exit(1);
  }

  console.log("✅ Environment variables validated\n");
}

/**
 * Validates PostgreSQL connection
 * @returns {Promise<void>}
 */
async function validateDatabase() {
  console.log("🔍 Checking PostgreSQL connection...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query("SELECT 1 as connected");

    if (result.rows[0]?.connected === 1) {
      console.log("✅ PostgreSQL connection successful\n");
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    console.error("💡 Check your DATABASE_URL and ensure PostgreSQL is running");
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

/**
 * Validates Redis connection
 * @returns {Promise<void>}
 */
async function validateRedis() {
  console.log("🔍 Checking Redis connection...");

  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const pong = await redis.ping();

    if (pong === "PONG") {
      console.log("✅ Redis connection successful\n");
    }

    await redis.quit();
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    console.error("💡 Check your REDIS_URL and ensure Redis is running");
    await redis.quit().catch(() => {});
    process.exit(1);
  }
}

// ========================================
// Main Execution
// ========================================

// Register shutdown handlers
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  handleShutdown("SIGTERM");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  handleShutdown("SIGTERM");
});

// Validate and start
async function main() {
  validateEnvironment();
  await validateDatabase();
  await validateRedis();
  startServer();
}

main().catch((error) => {
  console.error("❌ Startup failed:", error);
  process.exit(1);
});
