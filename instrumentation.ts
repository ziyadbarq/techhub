/**
 * Next.js Instrumentation Hook
 *
 * Runs once at server startup (Node.js runtime only).
 * Used to load configuration from Spring Cloud Config Server before application initialization.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  // Only run in Node.js runtime (skip Edge runtime and build phases)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Import cloud config initialization (runs top-level await to load config)
    await import("./src/infrastructure/config/cloud-config-init");
  }
}
