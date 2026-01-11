/**
 * Cloud Config Initialization
 *
 * Auto-executes on import to load configuration from Spring Cloud Config Server
 * before the application starts.
 *
 * Execution flow:
 * 1. Check if CONFIG_SERVER_URL is set (feature flag)
 * 2. Determine Spring profile from NODE_ENV or SPRING_PROFILE
 * 3. Load config from server with retry logic
 * 4. Merge config into process.env (server values override local)
 * 5. T3 Env validation runs on merged config (existing behavior)
 *
 * This file uses top-level await and runs BEFORE:
 * - T3 Env validation (/src/infrastructure/config/env.ts)
 * - DI container initialization (/src/di/container.ts)
 * - Application code
 */

import { loadCloudConfig } from "./cloud-config-loader";

/**
 * Determines Spring profile from environment variables
 *
 * Priority:
 * 1. SPRING_PROFILE (explicit override)
 * 2. NODE_ENV mapping (production → prod, development/test → dev)
 *
 * @returns Spring profile name (dev, uat, prod)
 */
function getSpringProfile(): string {
  // Explicit override via SPRING_PROFILE env var
  if (process.env.SPRING_PROFILE) {
    return process.env.SPRING_PROFILE;
  }

  // Map NODE_ENV to Spring profile
  switch (process.env.NODE_ENV) {
    case "production":
      return "prod";
    case "development":
    case "test":
    default:
      return "dev";
  }
}

/**
 * Initialize cloud config loading
 * Uses top-level await to block application startup until config is loaded
 */
async function initializeCloudConfig(): Promise<void> {
  const configServerUrl = process.env.CONFIG_SERVER_URL;

  // Feature flag: Only load from config server if CONFIG_SERVER_URL is set
  if (!configServerUrl) {
    console.log("ℹ️  CONFIG_SERVER_URL not set, using local .env files only");
    return;
  }

  console.log("\n=== Spring Cloud Config Integration ===");

  const profile = getSpringProfile();
  console.log(`📦 Application: techhub`);
  console.log(`🏷️  Profile: ${profile}`);
  console.log(`🌐 Config Server: ${configServerUrl}`);

  // Load config from Spring Cloud Config Server
  const result = await loadCloudConfig({
    endpoint: configServerUrl,
    name: "techhub",
    profiles: [profile],
    timeout: 5000,
    retries: 3,
  });

  if (result.success) {
    // Merge config into process.env (server values override local .env)
    const configKeys = Object.keys(result.config);
    Object.assign(process.env, result.config);

    console.log(
      `✅ Config loaded from ${result.source}: ${configKeys.length} keys loaded`,
    );
    console.log(`   Profile: ${result.metadata.profile}`);
    console.log(`   Retry attempts: ${result.metadata.retryAttempts}`);
    console.log(`   Loaded at: ${result.metadata.loadedAt}`);

    // Log sample keys (first 5) for debugging
    if (configKeys.length > 0) {
      const sampleKeys = configKeys.slice(0, 5);
      console.log(
        `   Sample keys: ${sampleKeys.join(", ")}${configKeys.length > 5 ? "..." : ""}`,
      );
    }

    // Validate critical environment variables are present
    const criticalVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_SECRET",
    ];
    const missingCriticalVars = criticalVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingCriticalVars.length > 0) {
      console.warn(
        `⚠️  Warning: ${missingCriticalVars.length} critical environment variables are missing:`,
      );
      console.warn(`   ${missingCriticalVars.join(", ")}`);
      console.warn(
        `   These should be present in either config server or local .env`,
      );
    } else {
      console.log(`✅ All critical environment variables are present`);
    }
  } else {
    // Fallback to local .env files (already loaded by Next.js)
    console.warn(
      `⚠️  Config server unavailable, using local .env files as fallback`,
    );
    console.warn(`   Error: ${result.metadata.error}`);
    console.warn(`   Retry attempts: ${result.metadata.retryAttempts}`);

    // Validate critical variables exist in local .env
    const criticalVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_SECRET",
    ];
    const missingCriticalVars = criticalVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingCriticalVars.length > 0) {
      console.error(
        `❌ CRITICAL: ${missingCriticalVars.length} required environment variables are missing:`,
      );
      console.error(`   ${missingCriticalVars.join(", ")}`);
      console.error(
        `   Application will fail to start. Check your .env.local file.`,
      );
    } else {
      console.log(`✅ All critical environment variables found in local .env`);
    }
  }

  console.log("=======================================\n");
}

// Auto-execute initialization using top-level await
// This blocks the instrumentation hook until config is loaded
await initializeCloudConfig();
