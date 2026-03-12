/**
 * Cloud Config Loader
 *
 * Loads configuration from Spring Cloud Config Server using plain fetch().
 * No external dependencies -- just calls the config server REST API directly.
 *
 * Spring Cloud Config REST API:
 *   GET /{application}/{profile}
 *   Returns JSON with propertySources[].source containing key-value pairs.
 *
 * This is the same API that all Spring Boot apps use via their built-in client.
 */

import type {
  CloudConfigLoaderOptions,
  CloudConfigLoaderResult,
} from "./cloud-config.types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Spring Cloud Config Server response shape
 */
interface SpringConfigResponse {
  name: string;
  profiles: string[];
  label: string | null;
  version: string | null;
  propertySources: Array<{
    name: string;
    source: Record<string, unknown>;
  }>;
}

/**
 * Extract flat key-value env vars from Spring Cloud Config response.
 * Property sources are ordered by priority (first = highest),
 * so later sources don't override earlier ones.
 */
function extractProperties(
  response: SpringConfigResponse,
): Record<string, string> {
  const result: Record<string, string> = {};

  // Reverse so highest-priority source wins (first source in array = highest priority)
  const sources = [...response.propertySources].reverse();
  for (const ps of sources) {
    for (const [key, value] of Object.entries(ps.source)) {
      if (value !== null && value !== undefined) {
        result[key] = String(value);
      }
    }
  }

  return result;
}

/**
 * Loads configuration from Spring Cloud Config Server.
 * Uses Node.js built-in fetch() -- no npm dependencies needed.
 */
export async function loadCloudConfig(
  options: CloudConfigLoaderOptions,
): Promise<CloudConfigLoaderResult> {
  const { endpoint, name, profiles, timeout = 5000, retries = 3 } = options;

  const profile = profiles[0] || "default";
  const loadedAt = new Date().toISOString();
  let lastError: Error | null = null;

  // Spring Cloud Config REST API: GET /{application}/{profile}
  const url = `${endpoint.replace(/\/+$/, "")}/${name}/${profile}`;

  console.log(`🔧 Loading config: GET ${url}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${retries}...`);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as SpringConfigResponse;
      const config = extractProperties(data);

      console.log(
        `✅ Config loaded: ${Object.keys(config).length} keys from ${data.propertySources.length} source(s)`,
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

      if (attempt < retries) {
        const backoffMs = 100 * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  console.error(
    `❌ Failed to load config after ${retries} attempts. Using local fallback.`,
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
