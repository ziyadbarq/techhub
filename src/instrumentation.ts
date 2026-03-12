/**
 * Next.js Instrumentation Hook
 *
 * Runs once at server startup (Node.js runtime only).
 * Used to load configuration from Spring Cloud Config Server before application initialization.
 *
 * NOTE: This file MUST be in src/ (not project root) for Next.js standalone builds.
 * See: https://github.com/vercel/next.js/issues/81050
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  console.log(
    `[instrumentation] register() called | NEXT_RUNTIME=${process.env.NEXT_RUNTIME}`,
  );

  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      await import("./infrastructure/config/cloud-config-init");
    } catch (error) {
      console.error("[instrumentation] FAILED to load cloud-config-init:", error);
    }
  }
}
