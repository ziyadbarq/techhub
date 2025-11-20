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

const require = createRequire(import.meta.url);

// Server process reference
let serverProcess = null;

/**
 * Starts the Next.js production server
 */
function startServer() {
  console.log("🚀 Starting production server...");
  console.log(`📦 Node Environment: ${process.env.NODE_ENV || "production"}`);
  console.log(`📍 Working Directory: ${process.cwd()}`);
  console.log("");

  // Spawn next start process
  serverProcess = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
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
  console.log("🔗 Server should be running on http://localhost:3000");
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
    console.warn("⚠️  Warning: DATABASE_URL is not set");
  }

  if (!process.env.REDIS_URL) {
    console.warn("⚠️  Warning: REDIS_URL is not set (background jobs may not work)");
  }

  console.log("✅ Environment validation passed\n");
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
validateEnvironment();
startServer();
