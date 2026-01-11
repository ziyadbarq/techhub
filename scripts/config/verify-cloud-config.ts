/**
 * Spring Cloud Config Server Verification Script
 *
 * Tests connection to Spring Cloud Config Server and validates configuration loading.
 * Run this script to diagnose config server issues before deploying.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts
 *   dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profile=prod
 */

import { loadCloudConfig } from "../../src/infrastructure/config/cloud-config-loader";

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Verification checks
 */
const checks: Array<() => Promise<VerificationResult>> = [
  // Check 1: CONFIG_SERVER_URL is set
  async () => {
    const url = process.env.CONFIG_SERVER_URL;
    return {
      passed: !!url,
      message: "CONFIG_SERVER_URL environment variable",
      details: { url: url || "NOT SET" },
    };
  },

  // Check 2: CONFIG_SERVER_URL is valid URL
  async () => {
    const url = process.env.CONFIG_SERVER_URL;
    if (!url) {
      return {
        passed: false,
        message: "CONFIG_SERVER_URL is not set",
      };
    }

    try {
      new URL(url);
      return {
        passed: true,
        message: "CONFIG_SERVER_URL is valid URL",
        details: { url },
      };
    } catch {
      return {
        passed: false,
        message: "CONFIG_SERVER_URL is not a valid URL",
        details: { url },
      };
    }
  },

  // Check 3: Can connect to config server
  async () => {
    const url = process.env.CONFIG_SERVER_URL;
    if (!url) {
      return { passed: false, message: "Skipped - CONFIG_SERVER_URL not set" };
    }

    try {
      const response = await fetch(`${url}/actuator/health`, {
        signal: AbortSignal.timeout(5000),
      });

      return {
        passed: response.ok,
        message: "Config server health check",
        details: {
          status: response.status,
          statusText: response.statusText,
          endpoint: `${url}/actuator/health`,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: "Failed to connect to config server",
        details: {
          error: error instanceof Error ? error.message : String(error),
          endpoint: `${url}/actuator/health`,
        },
      };
    }
  },

  // Check 4: Can load configuration for detected profile
  async () => {
    const url = process.env.CONFIG_SERVER_URL;
    if (!url) {
      return { passed: false, message: "Skipped - CONFIG_SERVER_URL not set" };
    }

    // Determine profile (same logic as cloud-config-init.ts)
    const getProfile = () => {
      if (process.env.SPRING_PROFILE) return process.env.SPRING_PROFILE;
      switch (process.env.NODE_ENV) {
        case "production":
          return "prod";
        case "development":
        case "test":
        default:
          return "dev";
      }
    };

    // Allow override via command line: --profile=prod
    const cliProfile = process.argv
      .find((arg) => arg.startsWith("--profile="))
      ?.split("=")[1];
    const profile = cliProfile || getProfile();

    const result = await loadCloudConfig({
      endpoint: url,
      name: "techhub",
      profiles: [profile],
      timeout: 5000,
      retries: 3,
    });

    return {
      passed: result.success,
      message: `Load configuration for profile '${profile}'`,
      details: {
        success: result.success,
        source: result.source,
        keysLoaded: Object.keys(result.config).length,
        profile: result.metadata.profile,
        retryAttempts: result.metadata.retryAttempts,
        error: result.metadata.error,
      },
    };
  },

  // Check 5: Critical environment variables are present in loaded config
  async () => {
    const url = process.env.CONFIG_SERVER_URL;
    if (!url) {
      return { passed: false, message: "Skipped - CONFIG_SERVER_URL not set" };
    }

    const getProfile = () => {
      if (process.env.SPRING_PROFILE) return process.env.SPRING_PROFILE;
      switch (process.env.NODE_ENV) {
        case "production":
          return "prod";
        case "development":
        case "test":
        default:
          return "dev";
      }
    };

    const cliProfile = process.argv
      .find((arg) => arg.startsWith("--profile="))
      ?.split("=")[1];
    const profile = cliProfile || getProfile();

    const result = await loadCloudConfig({
      endpoint: url,
      name: "techhub",
      profiles: [profile],
      timeout: 5000,
      retries: 1, // Single attempt for this check
    });

    if (!result.success) {
      return {
        passed: false,
        message: "Cannot check critical variables - config load failed",
      };
    }

    // Define critical environment variables (adjust as needed)
    const criticalVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_SECRET",
    ];

    const missingVars = criticalVars.filter(
      (varName) => !result.config[varName],
    );
    const foundVars = criticalVars.filter((varName) => result.config[varName]);

    return {
      passed: missingVars.length === 0,
      message: "Critical environment variables present in config",
      details: {
        total: criticalVars.length,
        found: foundVars.length,
        missing: missingVars.length,
        foundVars,
        missingVars,
      },
    };
  },
];

/**
 * Run all verification checks
 */
async function runVerification(): Promise<void> {
  console.log("\n=== Spring Cloud Config Server Verification ===\n");

  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < checks.length; i++) {
    const checkNum = i + 1;
    console.log(`[${checkNum}/${checks.length}] Running check...`);

    try {
      const result = await checks[i]!();

      if (result.passed) {
        console.log(`✅ PASS: ${result.message}`);
        passedCount++;
      } else {
        console.log(`❌ FAIL: ${result.message}`);
        failedCount++;
      }

      if (result.details) {
        console.log(
          `   Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, "\n   ")}`,
        );
      }
    } catch (error) {
      console.log(`❌ ERROR: Check ${checkNum} threw an exception`);
      console.log(
        `   ${error instanceof Error ? error.message : String(error)}`,
      );
      failedCount++;
    }

    console.log(""); // Blank line between checks
  }

  console.log("=== Verification Summary ===");
  console.log(`✅ Passed: ${passedCount}/${checks.length}`);
  console.log(`❌ Failed: ${failedCount}/${checks.length}`);

  if (failedCount > 0) {
    console.log(
      "\n⚠️  Some checks failed. Review the details above to diagnose issues.",
    );
    process.exit(1);
  } else {
    console.log(
      "\n✅ All checks passed! Spring Cloud Config Server is working correctly.",
    );
    process.exit(0);
  }
}

// Execute verification
runVerification().catch((error) => {
  console.error("\n❌ Verification script failed:");
  console.error(error);
  process.exit(1);
});
