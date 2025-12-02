/**
 * Application environment configuration (server-only).
 *
 * This re-exports the validated env object from infrastructure while keeping the
 * import path in the shared config namespace so outer layers don't couple to infrastructure.
 */
export { env } from "@/infrastructure/config/env";
