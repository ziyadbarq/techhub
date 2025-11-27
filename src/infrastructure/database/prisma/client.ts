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

import type { Prisma } from "@/generated/prisma/server";
import { PrismaClient } from "@/generated/prisma/server";
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

// Create PostgreSQL connection pool (reused across entire application)
// Pool configuration uses pg defaults:
// - max: 10 connections
// - idleTimeoutMillis: 10000 (10 seconds)
// - connectionTimeoutMillis: 0 (no timeout)
// Override via connection string: ?connection_limit=20&pool_timeout=5
export const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: isBuildPhase
      ? "postgresql://build:build@localhost:5432/build"
      : process.env.DATABASE_URL,
  });

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
