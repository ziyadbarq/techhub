/**
 * Prisma Logging Middleware
 *
 * Provides comprehensive query logging and performance tracking for Prisma operations.
 * This middleware automatically logs all database queries with:
 * - Query duration timing
 * - Query parameters (sanitized)
 * - Affected rows count
 * - Slow query detection
 * - Error tracking
 *
 * Architecture:
 * - Applied to PrismaClient during initialization
 * - Intercepts all Prisma queries via middleware hook
 * - Uses structured logger for consistent formatting
 * - Integrates with performance monitoring
 *
 * Usage:
 * ```typescript
 * const prisma = new PrismaClient();
 * prisma.$use(createLoggingMiddleware(logger));
 * ```
 */

// Prisma types no longer needed since middleware is deprecated
// import type { Prisma } from "@/generated/prisma";
import type { ILoggerService } from "@/core/services";

// Prisma Middleware types (deprecated in Prisma 5+, defined manually for backwards compatibility)
type MiddlewareParams = {
  model?: string;
  action: string;
  args: unknown;
  dataPath: string[];
  runInTransaction: boolean;
};

type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;

type PrismaMiddleware = (
  params: MiddlewareParams,
  next: MiddlewareNext,
) => Promise<unknown>;

/**
 * Slow query threshold in milliseconds
 *
 * Queries slower than this will be logged as warnings
 */
const SLOW_QUERY_THRESHOLD_MS = 1000;

/**
 * Query actions that modify data
 *
 * Used to differentiate read vs write operations in logs
 */
const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "queryRaw",
]);

/**
 * Create Prisma logging middleware
 *
 * Returns a middleware function that logs all Prisma operations
 * with performance tracking and slow query detection.
 *
 * @param logger - Logger service instance
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * import { container } from '@/di/container';
 * import { DI_TOKENS } from '@/di/types';
 *
 * const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
 * const prisma = new PrismaClient();
 * prisma.$use(createLoggingMiddleware(logger));
 * ```
 */
export function createLoggingMiddleware(
  logger: ILoggerService,
): PrismaMiddleware {
  // Create a child logger with database context
  const dbLogger = logger.child({ component: "Prisma" });

  return async (params, next) => {
    // Start timing
    const startTime = performance.now();

    try {
      // Execute the query
      const result = await next(params);

      // Calculate duration
      const duration = performance.now() - startTime;
      const durationMs = Math.round(duration);

      // Determine if this is a slow query
      const isSlow = durationMs > SLOW_QUERY_THRESHOLD_MS;

      // Determine if this is a write operation
      const isWrite = WRITE_ACTIONS.has(params.action);

      // Build log context
      const context: Record<string, unknown> = {
        model: params.model,
        action: params.action,
        durationMs,
        isWrite,
      };

      // Add result metadata if available
      if (result && typeof result === "object") {
        // For array results (findMany, etc.)
        if (Array.isArray(result)) {
          context.rowCount = result.length;
        }
        // For count and batch operations
        else if ("count" in result && typeof result.count === "number") {
          context.rowCount = result.count;
          context.affectedRows = result.count;
        }
      }

      // Add sanitized query args (for debugging)
      // Be careful not to log sensitive data
      if (params.args && typeof params.args === "object") {
        const args = params.args as Record<string, unknown>;
        context.hasWhere = "where" in args;
        context.hasData = "data" in args;

        // Log selection fields if present
        if ("select" in args) {
          context.select = args.select;
        }

        // Log included relations
        if ("include" in args) {
          context.include = Object.keys((args.include as object) || {});
        }
      }

      // Log at appropriate level
      if (isSlow) {
        dbLogger.warn(
          `Slow query detected: ${params.model}.${params.action}`,
          context,
        );
      } else {
        dbLogger.debug(
          `Query executed: ${params.model}.${params.action}`,
          context,
        );
      }

      return result;
    } catch (error) {
      // Calculate duration even for failed queries
      const duration = performance.now() - startTime;
      const durationMs = Math.round(duration);

      // Log the error with context
      dbLogger.error(
        `Query failed: ${params.model}.${params.action}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          model: params.model,
          action: params.action,
          durationMs,
          hasWhere:
            params.args &&
            typeof params.args === "object" &&
            "where" in (params.args as Record<string, unknown>),
        },
      );

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Create a lightweight logging middleware for production
 *
 * Logs only slow queries and errors to reduce noise in production.
 * Regular queries are not logged unless they exceed the threshold.
 *
 * @param logger - Logger service instance
 * @param threshold - Slow query threshold in milliseconds (default: 1000ms)
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient();
 * prisma.$use(createProductionLoggingMiddleware(logger, 500)); // Log queries >500ms
 * ```
 */
export function createProductionLoggingMiddleware(
  logger: ILoggerService,
  threshold: number = SLOW_QUERY_THRESHOLD_MS,
): PrismaMiddleware {
  const dbLogger = logger.child({ component: "Prisma" });

  return async (params, next) => {
    const startTime = performance.now();

    try {
      const result = await next(params);
      const durationMs = Math.round(performance.now() - startTime);

      // Only log if slow
      if (durationMs > threshold) {
        const isWrite = WRITE_ACTIONS.has(params.action);

        dbLogger.warn(
          `Slow query: ${params.model}.${params.action} (${durationMs}ms)`,
          {
            model: params.model,
            action: params.action,
            durationMs,
            isWrite,
            threshold,
          },
        );
      }

      return result;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);

      dbLogger.error(
        `Query error: ${params.model}.${params.action}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          model: params.model,
          action: params.action,
          durationMs,
        },
      );

      throw error;
    }
  };
}

/**
 * Create a query metrics collector middleware
 *
 * Tracks query metrics without logging each query individually.
 * Useful for aggregating performance data.
 *
 * @param logger - Logger service instance
 * @param reportIntervalMs - How often to report metrics (default: 60000ms / 1 minute)
 * @returns Prisma middleware function
 *
 * @example
 * ```typescript
 * const prisma = new PrismaClient();
 * prisma.$use(createMetricsMiddleware(logger, 30000)); // Report every 30s
 * ```
 */
export function createMetricsMiddleware(
  logger: ILoggerService,
  reportIntervalMs: number = 60000,
): PrismaMiddleware {
  const dbLogger = logger.child({ component: "PrismaMetrics" });

  // Metrics storage
  const metrics = {
    queryCount: 0,
    slowQueryCount: 0,
    errorCount: 0,
    totalDuration: 0,
    byModel: new Map<string, { count: number; totalDuration: number }>(),
    byAction: new Map<string, { count: number; totalDuration: number }>(),
  };

  // Report metrics periodically
  setInterval(() => {
    if (metrics.queryCount === 0) return;

    const avgDuration = Math.round(metrics.totalDuration / metrics.queryCount);

    dbLogger.info("Database metrics report", {
      queryCount: metrics.queryCount,
      slowQueryCount: metrics.slowQueryCount,
      errorCount: metrics.errorCount,
      avgDurationMs: avgDuration,
      topModels: Array.from(metrics.byModel.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([model, stats]) => ({
          model,
          count: stats.count,
          avgDuration: Math.round(stats.totalDuration / stats.count),
        })),
    });

    // Reset metrics
    metrics.queryCount = 0;
    metrics.slowQueryCount = 0;
    metrics.errorCount = 0;
    metrics.totalDuration = 0;
    metrics.byModel.clear();
    metrics.byAction.clear();
  }, reportIntervalMs);

  return async (params, next) => {
    const startTime = performance.now();

    try {
      const result = await next(params);
      const duration = performance.now() - startTime;

      // Update metrics
      metrics.queryCount++;
      metrics.totalDuration += duration;

      if (duration > SLOW_QUERY_THRESHOLD_MS) {
        metrics.slowQueryCount++;
      }

      // Track by model
      const modelStats = metrics.byModel.get(params.model || "unknown") || {
        count: 0,
        totalDuration: 0,
      };
      modelStats.count++;
      modelStats.totalDuration += duration;
      metrics.byModel.set(params.model || "unknown", modelStats);

      // Track by action
      const actionStats = metrics.byAction.get(params.action) || {
        count: 0,
        totalDuration: 0,
      };
      actionStats.count++;
      actionStats.totalDuration += duration;
      metrics.byAction.set(params.action, actionStats);

      return result;
    } catch (error) {
      metrics.errorCount++;
      throw error;
    }
  };
}
