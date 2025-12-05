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

/// <reference types="node" />

import process from "node:process";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

type ServerEnvKeys =
  | "DATABASE_URL"
  | "REDIS_URL"
  | "OPENAI_API_KEY"
  | "NODE_ENV"
  | "LOG_LEVEL"
  | "AI_DEBUG_MODE"
  | "ENCRYPTION_KEY"
  | "BACKUP_STORAGE_PATH"
  | "PG_DUMP_PATH"
  | "PG_DUMP_FLAGS"
  | "PSQL_PATH"
  | "PSQL_FLAGS"
  | "BACKUP_VERIFY_TEMP_DB"
  | "SKIP_TYPE_CHECK"
  | "ANALYZE";

type ClientEnvKeys =
  | "NEXT_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL"
  | "NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION"
  | "NEXT_PUBLIC_ENABLE_MS_AUTH";

type RuntimeEnvKeys = ServerEnvKeys | ClientEnvKeys;

const isTestEnv = process.env.NODE_ENV === "test";

const testEnvFallbacks: Partial<Record<RuntimeEnvKeys, string>> = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/test?schema=public",
  REDIS_URL: "redis://localhost:6379",
  OPENAI_API_KEY: "sk-test",
  ENCRYPTION_KEY:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

const resolveEnv = (key: RuntimeEnvKeys): string | undefined => {
  const value = process.env[key];
  if (value && value.length > 0) {
    return value;
  }
  if (isTestEnv) {
    return testEnvFallbacks[key];
  }
  return undefined;
};

const runtimeEnv = {
  // Server-side variables
  DATABASE_URL: resolveEnv("DATABASE_URL"),
  REDIS_URL: resolveEnv("REDIS_URL"),
  OPENAI_API_KEY: resolveEnv("OPENAI_API_KEY"),
  NODE_ENV: resolveEnv("NODE_ENV"),
  LOG_LEVEL: resolveEnv("LOG_LEVEL"),
  AI_DEBUG_MODE: resolveEnv("AI_DEBUG_MODE"),
  ENCRYPTION_KEY: resolveEnv("ENCRYPTION_KEY"),
  BACKUP_STORAGE_PATH: resolveEnv("BACKUP_STORAGE_PATH"),
  PG_DUMP_PATH: resolveEnv("PG_DUMP_PATH"),
  PG_DUMP_FLAGS: resolveEnv("PG_DUMP_FLAGS"),
  PSQL_PATH: resolveEnv("PSQL_PATH"),
  PSQL_FLAGS: resolveEnv("PSQL_FLAGS"),
  BACKUP_VERIFY_TEMP_DB: resolveEnv("BACKUP_VERIFY_TEMP_DB"),
  SKIP_TYPE_CHECK: resolveEnv("SKIP_TYPE_CHECK"),
  ANALYZE: resolveEnv("ANALYZE"),

  // Client-side variables
  NEXT_PUBLIC_APP_URL: resolveEnv("NEXT_PUBLIC_APP_URL"),
  NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL: resolveEnv(
    "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL",
  ),
  NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION: resolveEnv(
    "NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION",
  ),
  NEXT_PUBLIC_ENABLE_MS_AUTH: resolveEnv("NEXT_PUBLIC_ENABLE_MS_AUTH"),
} satisfies Record<RuntimeEnvKeys, string | undefined>;

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
     * Defaults to "production" if not set
     */
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("production"),

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

    /**
     * AES-256-GCM encryption key for OAuth tokens (REQUIRED for Microsoft SSO)
     * Must be exactly 64 hex characters (32 bytes)
     * Generate with: openssl rand -hex 32
     * @example "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
     */
    ENCRYPTION_KEY: z
      .string()
      .length(64, "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)")
      .regex(
        /^[0-9a-f]{64}$/,
        "ENCRYPTION_KEY must contain only lowercase hex characters (0-9, a-f)",
      ),

    /**
     * Database Backup Configuration (optional)
     */
    BACKUP_STORAGE_PATH: z.string().optional(),
    PG_DUMP_PATH: z.string().optional(),
    PG_DUMP_FLAGS: z.string().optional(),
    PSQL_PATH: z.string().optional(),
    PSQL_FLAGS: z.string().optional(),
    BACKUP_VERIFY_TEMP_DB: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),

    /**
     * Build Optimization (optional)
     */
    SKIP_TYPE_CHECK: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
  },

  /**
   * Client-side environment variables schema
   *
   * These variables are exposed to the browser and must be prefixed with NEXT_PUBLIC_
   * Access them via `env.NEXT_PUBLIC_VARIABLE_NAME` in both client and server code.
   */
  client: {
    /**
     * Public application URL
     * Used for generating links in emails, webhooks, etc.
     * @example "https://yourdomain.com"
     */
    NEXT_PUBLIC_APP_URL: z.string().url(),

    /**
     * Feature flags polling interval in milliseconds
     * Set to 0 to disable automatic polling (only fetches when tab becomes visible)
     * @default 30000 (30 seconds)
     */
    NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL: z.coerce.number().default(30000),

    /**
     * Enable/disable email/password registration UI
     * @default "true"
     */
    NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION: z
      .enum(["true", "false"])
      .default("true")
      .transform((val) => val === "true"),

    /**
     * Enable/disable Microsoft OAuth (both login and registration)
     * @default "true"
     */
    NEXT_PUBLIC_ENABLE_MS_AUTH: z
      .enum(["true", "false"])
      .default("true")
      .transform((val) => val === "true"),
  },

  /**
   * Runtime environment variables mapping
   *
   * Maps the schema keys to actual environment variable names.
   * This allows for custom naming or conditional loading.
   */
  runtimeEnv,

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
