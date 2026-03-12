/**
 * Next.js Instrumentation Hook
 *
 * Runs once at server startup (Node.js runtime only).
 * Loads cloud config then bootstraps the DI container so Pino is live immediately.
 *
 * NOTE: This file MUST be in src/ (not project root) for Next.js standalone builds.
 * See: https://github.com/vercel/next.js/issues/81050
 */
export async function register() {
  console.log(
    `[instrumentation] register() called | NEXT_RUNTIME=${process.env.NEXT_RUNTIME}`,
  );

  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      await import("./infrastructure/config/cloud-config-init");
      console.log("[instrumentation] cloud-config loaded, initializing DI container...");
      const { initContainer } = await import("./di/container");
      await initContainer();
      console.log("[instrumentation] DI container ready, Pino logger active");
    } catch (error) {
      console.error("[instrumentation] startup failed:", error);
    }
  }
}
