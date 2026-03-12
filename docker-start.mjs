/**
 * Docker entry point — runs BEFORE Next.js server.js
 *
 * Fetches config from Spring Cloud Config Server and sets process.env,
 * then starts the Next.js standalone server.
 *
 * This replaces the broken instrumentation.ts approach (not loaded in standalone mode).
 */

const CONFIG_SERVER_URL = process.env.CONFIG_SERVER_URL;
const APP_NAME = process.env.APPLICATION_NAME || "techhub";
const PROFILE = process.env.ENVIRONMENT_NAME || process.env.SPRING_PROFILE || "dev";

async function loadConfig() {
  if (!CONFIG_SERVER_URL) {
    console.log("[config] CONFIG_SERVER_URL not set, using env vars only");
    return;
  }

  const url = `${CONFIG_SERVER_URL.replace(/\/+$/, "")}/${APP_NAME}/${PROFILE}`;
  console.log(`[config] Fetching: GET ${url}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[config] Attempt ${attempt}/3...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      let count = 0;

      // Spring Cloud Config response: propertySources[].source has key-value pairs
      // Reverse so first source (highest priority) wins
      const sources = [...(data.propertySources || [])].reverse();
      for (const ps of sources) {
        for (const [key, value] of Object.entries(ps.source || {})) {
          if (value !== null && value !== undefined) {
            process.env[key] = String(value);
            count++;
          }
        }
      }

      console.log(`[config] Loaded ${count} keys from ${sources.length} source(s)`);
      console.log(`[config] Profile: ${PROFILE}`);

      // Show which critical vars are set (no values, just presence)
      const critical = ["DATABASE_URL", "REDIS_URL", "ENCRYPTION_KEY", "NEXT_PUBLIC_APP_URL"];
      for (const k of critical) {
        console.log(`[config]   ${k}: ${process.env[k] ? "SET" : "MISSING"}`);
      }
      return;
    } catch (err) {
      console.warn(`[config] Attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
    }
  }

  console.error("[config] All attempts failed. Using env vars from deployment.");
}

// --- Main ---
console.log(`[TechHub] NODE_ENV=${process.env.NODE_ENV} | LOG_LEVEL=${process.env.LOG_LEVEL ?? "default"} | config=${CONFIG_SERVER_URL ? "config-server" : "local"}`);

await loadConfig();

console.log("[TechHub] Starting Next.js server...");
await import("./server.js");
