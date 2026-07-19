/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client is created during development.
 * Prevents connection exhaustion in development mode with hot reloading.
 *
 * Prisma v7: Uses new Rust-free client with PostgreSQL adapter
 *
 * IMPORTANT: Always import this singleton to avoid creating multiple connection pools!
 * - Import: `import { prisma, pool } from '@/infrastructure/database/prisma/client'`
 * - DO NOT create new Pool() or PrismaClient() elsewhere
 */

import type { Prisma } from "@/generated/prisma/client";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient<Prisma.LogLevel> | undefined;
  pgPool: Pool | undefined;
};

// Detect Next.js build phase to provide a placeholder connection string
// During build, no actual database connection is needed
const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// Create PostgreSQL connection pool (reused across entire application)
// connectionTimeoutMillis must be non-zero: with the pg default of 0,
// requests wait forever when the pool is exhausted instead of failing fast.
const createPool = () => {
  const newPool = new Pool({
    connectionString: isBuildPhase
      ? "postgresql://build:build@localhost:5432/build"
      : process.env.DATABASE_URL,
    max: parsePositiveInt(process.env.DATABASE_POOL_MAX, 20),
    connectionTimeoutMillis: parsePositiveInt(
      process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
      5000,
    ),
    idleTimeoutMillis: parsePositiveInt(
      process.env.DATABASE_POOL_IDLE_TIMEOUT_MS,
      30000,
    ),
  });

  // Idle clients can emit errors (e.g. backend restart); without a handler
  // the process crashes with an unhandled 'error' event.
  newPool.on("error", (error) => {
    console.error("[Prisma][pool] Unexpected error on idle client", {
      message: error.message,
    });
  });

  return newPool;
};

export const pool = globalForPrisma.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prismaInstance =
  globalForPrisma.prisma ??
  (new PrismaClient({
    adapter,
    log:
      process.env.PRISMA_VERBOSE_LOGS === "true"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
  }) as PrismaClient<Prisma.LogLevel>);

export const prisma: PrismaClient<Prisma.LogLevel> = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}

const shouldLogVerbosePrisma = process.env.PRISMA_VERBOSE_LOGS === "true";

const sanitizeParams = (params?: string) => {
  if (!params) return params;
  try {
    const sensitiveKeys = ["password", "token", "secret", "authorization"];
    const redact = (value: unknown, parentKey?: string): unknown => {
      if (value === null) return value;
      if (Array.isArray(value)) {
        return value.map((item) => redact(item, parentKey));
      }
      if (typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, val]) => [key, redact(val, key)]),
        );
      }
      if (
        typeof value === "string" &&
        parentKey &&
        sensitiveKeys.includes(parentKey.toLowerCase())
      ) {
        return "[REDACTED]";
      }
      return value;
    };

    const parsed = JSON.parse(params);
    return JSON.stringify(redact(parsed));
  } catch {
    return params;
  }
};

if (shouldLogVerbosePrisma) {
  prisma.$on("query", (event: Prisma.QueryEvent) => {
    console.info("[Prisma][query]", {
      durationMs: event.duration,
      params: sanitizeParams(event.params),
      query: event.query,
      target: event.target,
    });
  });

  prisma.$on("warn", (event: Prisma.LogEvent) => {
    console.warn("[Prisma][warn]", {
      message: event.message,
      target: event.target,
    });
  });

  prisma.$on("error", (event: Prisma.LogEvent) => {
    console.error("[Prisma][error]", {
      message: event.message,
      target: event.target,
    });
  });
}
