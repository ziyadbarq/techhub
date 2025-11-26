/**
 * Type-safe Environment Variables Configuration
 *
 * Uses T3 Env for runtime validation and type safety of environment variables.
 * This ensures environment variables are validated on application startup and
 * provides full TypeScript autocomplete and type checking.
 *
 * Architecture:
 * - Located in Infrastructure layer (external configuration)
 * - Validates all required environment variables at runtime
 * - Provides type-safe access throughout the application
 * - Supports both server-side and client-side variables
 *
 * Usage:
 * ```typescript
 * import { env } from '@/infrastructure/config/env';
 *
 * const apiKey = env.OPENAI_API_KEY;
 * const dbUrl = env.DATABASE_URL;
 * ```
 *
 * @see https://env.t3.gg/docs/nextjs
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   *
   * These variables are only available on the server and will never be exposed to the client.
   * Access them via `env.VARIABLE_NAME` in server-side code only.
   */
  server: {
    /**
     * Database connection string
     * @example "postgresql://user:password@localhost:5432/mydb?schema=public"
     */
    DATABASE_URL: z.url(),

    /**
     * Redis connection URL for background job queues (BullMQ)
     * Accepts both full URLs (redis://host:port) and host:port format
     * @example "redis://localhost:6379" or "localhost:6379"
     */
    REDIS_URL: z
      .string()
      .refine(
        (val) => val.startsWith("redis://") || /^[\w.-]+:\d+$/.test(val),
        {
          message:
            "Must be a Redis URL (redis://host:port) or host:port format",
        },
      ),

    /**
     * OpenAI API key for AI services
     * @example "sk-..."
     */
    OPENAI_API_KEY: z.string().min(1),

    /**
     * Node environment
     * Defaults to "development" if not set
     */
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    /**
     * Log level for application logging
     * Controls verbosity of logs
     * Defaults to "info" in production, "debug" in development
     */
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .default(process.env.NODE_ENV === "production" ? "info" : "debug"),

    /**
     * AI Debug Mode (optional)
     * When enabled, writes detailed debug traces to .ai-debug/ directory
     * @example "true" | "false"
     */
    AI_DEBUG_MODE: z
      .enum(["true", "false", "1", "0"])
      .optional()
      .transform((val) => val === "true" || val === "1"),
  },

  /**
   * Client-side environment variables schema
   *
   * These variables are exposed to the browser and must be prefixed with NEXT_PUBLIC_
   * Access them via `env.NEXT_PUBLIC_VARIABLE_NAME` in both client and server code.
   */
  client: {
    // Add client-side env vars here when needed
    // Example:
    // NEXT_PUBLIC_API_URL: z.string().url(),
  },

  /**
   * Runtime environment variables mapping
   *
   * Maps the schema keys to actual environment variable names.
   * This allows for custom naming or conditional loading.
   */
  runtimeEnv: {
    // Server-side variables
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    AI_DEBUG_MODE: process.env.AI_DEBUG_MODE,

    // Client-side variables (when added)
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  /**
   * Skip validation in specific contexts
   *
   * Automatically skips during Next.js build phases (NEXT_PHASE is set by Next.js CLI).
   * Can also be manually skipped via SKIP_ENV_VALIDATION=true for edge runtime or middleware.
   */
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export",

  /**
   * Makes `process.env` empty object when building to ensure all env variables are accessed via `env`
   * This helps catch accidental usage of process.env instead of the type-safe env object
   */
  emptyStringAsUndefined: true,
});

/**
 * Type helper to extract the type of the env object
 * Useful for dependency injection and testing
 */
export type Env = typeof env;
