/**
 * Cloud Config Loader
 *
 * Loads configuration from Spring Cloud Config Server with retry logic,
 * timeout handling, and graceful fallback.
 */

import { load, type Config } from "cloud-config-client";
import type {
  CloudConfigLoaderOptions,
  CloudConfigLoaderResult,
} from "./cloud-config.types";

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts Config object to flat key-value pairs in environment variable format
 *
 * Uses the Config.toObject() method which properly handles property sources
 * and returns all resolved properties as a flat object.
 *
 * Example output: { "database.url": "postgres://...", "redis.url": "redis://..." }
 */
function flattenConfig(configData: Config): Record<string, string> {
  // Use Config.toObject() to get all resolved properties
  const properties = configData.toObject();

  // Convert dot notation to environment variable format
  // e.g., "database.url" -> "DATABASE_URL"
  const envFormatted: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Keep original key if already uppercase with underscores (e.g., DATABASE_URL)
    if (key === key.toUpperCase() && key.includes("_")) {
      envFormatted[key] = String(value);
    } else {
      // Convert dot notation to uppercase with underscores
      const envKey = key.replace(/\./g, "_").toUpperCase();
      envFormatted[envKey] = String(value);
    }
  }

  return envFormatted;
}

/**
 * Loads configuration from Spring Cloud Config Server
 *
 * Features:
 * - Retry logic with exponential backoff (3 attempts by default)
 * - Configurable timeout per attempt (5s by default)
 * - Graceful fallback (returns empty config instead of throwing)
 * - Structured error logging
 *
 * @param options Configuration options
 * @returns Promise resolving to config result (never throws)
 */
export async function loadCloudConfig(
  options: CloudConfigLoaderOptions,
): Promise<CloudConfigLoaderResult> {
  const { endpoint, name, profiles, timeout = 5000, retries = 3 } = options;

  const profile = profiles[0] || "default";
  const loadedAt = new Date().toISOString();
  let lastError: Error | null = null;

  // Log config load attempt
  console.log(
    `🔧 Loading config from Spring Cloud Config Server: ${endpoint}/${name}/${profile}`,
  );

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${retries}...`);

      // Load config from Spring Cloud Config Server
      const configData = await load({
        endpoint,
        name,
        profiles,
        // @ts-expect-error - cloud-config-client types don't include timeout, but it's supported
        timeout,
      });

      // Convert Spring format to flat key-value
      const config = flattenConfig(configData);

      console.log(
        `✅ Config loaded successfully from config server (${Object.keys(config).length} keys)`,
      );

      return {
        success: true,
        config,
        source: "config-server",
        metadata: {
          profile,
          endpoint,
          loadedAt,
          retryAttempts: attempt,
        },
      };
    } catch (error) {
      lastError = error as Error;

      console.warn(
        `   ⚠️  Attempt ${attempt}/${retries} failed: ${lastError.message}`,
      );

      // Wait before retry (exponential backoff: 100ms, 200ms, 400ms)
      if (attempt < retries) {
        const backoffMs = 100 * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  // All retries failed - return fallback result
  console.error(
    `❌ Failed to load config from server after ${retries} attempts. Using local .env fallback.`,
  );
  console.error(`   Last error: ${lastError?.message}`);

  return {
    success: false,
    config: {},
    source: "local-fallback",
    metadata: {
      profile,
      endpoint,
      loadedAt,
      retryAttempts: retries,
      error: lastError?.message || "Unknown error",
    },
  };
}
