/**
 * Pino Logger Service Implementation
 *
 * Production-ready logger implementation using Pino with:
 * - High-performance structured logging
 * - Pretty printing in development
 * - JSON format in production
 * - Configurable log levels
 * - Child logger support for contextual logging
 *
 * Architecture:
 * - Implements ILoggerService interface from core layer
 * - Uses Pino for actual logging (infrastructure concern)
 * - Configured via environment variables (LOG_LEVEL, NODE_ENV)
 * - Registered in DI container as singleton
 */

import { injectable } from "inversify";
import pino, { type Logger } from "pino";
import type {
  ILoggerService,
  PerformanceTimer,
  AuditLogEntry,
} from "@/core/services";
import { env } from "@/infrastructure/config/env";
import { serializeError } from "./error-serializer";

/**
 * Slow operation thresholds (in milliseconds)
 *
 * Operations exceeding these thresholds will be logged as warnings
 */
const SLOW_OPERATION_THRESHOLDS = {
  /**
   * Database queries slower than 1000ms
   */
  "database.query": 1000,
  /**
   * API calls slower than 3000ms
   */
  "api.call": 3000,
  /**
   * Default threshold for other operations: 5000ms
   */
  default: 5000,
} as const;

/**
 * Pino-based implementation of ILoggerService
 *
 * Uses Pino for high-performance structured logging with:
 * - Pretty printing in development mode
 * - JSON format in production
 * - Automatic timestamp and hostname
 * - Support for nested objects and arrays
 * - Performance timing and monitoring
 * - Audit logging support
 * - Enhanced error serialization
 */
@injectable()
export class PinoLoggerService implements ILoggerService {
  private readonly logger: Logger;

  constructor() {
    // Configure Pino based on environment
    const isDevelopment = env.NODE_ENV === "development";

    this.logger = pino({
      // Set log level from environment
      level: env.LOG_LEVEL as "debug" | "info" | "warn" | "error",

      // Add base context to all logs
      base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || "unknown",
        env: env.NODE_ENV,
      },

      // Pretty print in development, JSON in production
      transport: isDevelopment
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
              singleLine: false,
              messageFormat: "{msg}",
            },
          }
        : undefined,

      // Format timestamps as ISO 8601
      timestamp: pino.stdTimeFunctions.isoTime,

      // Redact sensitive fields (add more as needed)
      redact: {
        paths: [
          "password",
          "apiKey",
          "secret",
          "token",
          "authorization",
          "*.password",
          "*.apiKey",
          "*.secret",
          "*.token",
        ],
        remove: true,
      },

      // Serialize errors with enhanced serializer
      serializers: {
        error: (error: Error) => serializeError(error),
        err: (error: Error) => serializeError(error),
      },
    });

    // Log initialization only in development mode
    if (isDevelopment) {
      this.logger.debug(
        {
          logLevel: env.LOG_LEVEL,
          nodeEnv: env.NODE_ENV,
          prettyPrint: isDevelopment,
        },
        "Logger initialized",
      );
    }
  }

  /**
   * Log debug-level message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug(message);
    }
  }

  /**
   * Log info-level message
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.info(context, message);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Log warning-level message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Log error-level message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    // Combine error and context into a single object
    const logContext: Record<string, unknown> = { ...context };

    if (error) {
      // Pino will automatically serialize the error with stack trace
      logContext.err = error;
    }

    if (Object.keys(logContext).length > 0) {
      this.logger.error(logContext, message);
    } else {
      this.logger.error(message);
    }
  }

  /**
   * Create a child logger with persistent context
   *
   * The child logger inherits the parent's configuration but adds
   * persistent context that will be included in all subsequent logs.
   *
   * @param context - Persistent context for the child logger
   * @returns New logger instance with bound context
   */
  child(context: Record<string, unknown>): ILoggerService {
    const childLogger = this.logger.child(context);

    // Return a new PinoLoggerService instance wrapping the child logger
    return new PinoLoggerChildService(childLogger);
  }

  /**
   * Start a performance timer
   *
   * Returns a timer handle with high-resolution timestamp
   */
  startTimer(
    operation: string,
    context?: Record<string, unknown>,
  ): PerformanceTimer {
    return {
      startTime: performance.now(),
      operation,
      context,
    };
  }

  /**
   * End a performance timer and log the duration
   *
   * Automatically detects slow operations and logs at appropriate level
   */
  endTimer(
    timer: PerformanceTimer,
    additionalContext?: Record<string, unknown>,
  ): void {
    const duration = performance.now() - timer.startTime;
    const durationMs = Math.round(duration);

    // Determine slow operation threshold
    const threshold = this.getSlowOperationThreshold(timer.operation);
    const isSlow = durationMs > threshold;

    // Merge all context
    const context: Record<string, unknown> = {
      operation: timer.operation,
      durationMs,
      ...timer.context,
      ...additionalContext,
    };

    // Log at appropriate level
    if (isSlow) {
      this.logger.warn(
        context,
        `Slow operation detected: ${timer.operation} took ${durationMs}ms`,
      );
    } else {
      this.logger.debug(
        context,
        `Operation completed: ${timer.operation} in ${durationMs}ms`,
      );
    }
  }

  /**
   * Log an audit event
   *
   * Records security and compliance audit events
   */
  audit(entry: AuditLogEntry): void {
    this.logger.info(
      {
        audit: true,
        action: entry.action,
        userId: entry.userId,
        resource: entry.resource,
        result: entry.result,
        ...entry.metadata,
      },
      `Audit: ${entry.action} - ${entry.result}`,
    );
  }

  /**
   * Log with automatic performance tracking
   *
   * Wraps an async operation with automatic timing
   */
  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const timer = this.startTimer(operation, context);

    try {
      const result = await fn();
      this.endTimer(timer, { result: "success" });
      return result;
    } catch (error) {
      this.endTimer(timer, { result: "failure", error: serializeError(error) });
      throw error;
    }
  }

  /**
   * Get slow operation threshold for an operation
   *
   * @param operation - Operation name
   * @returns Threshold in milliseconds
   */
  private getSlowOperationThreshold(operation: string): number {
    // Check for exact match
    if (operation in SLOW_OPERATION_THRESHOLDS) {
      return SLOW_OPERATION_THRESHOLDS[
        operation as keyof typeof SLOW_OPERATION_THRESHOLDS
      ];
    }

    // Check for prefix match (e.g., "database.query.users" matches "database.query")
    for (const [key, value] of Object.entries(SLOW_OPERATION_THRESHOLDS)) {
      if (key !== "default" && operation.startsWith(key)) {
        return value;
      }
    }

    // Return default threshold
    return SLOW_OPERATION_THRESHOLDS.default;
  }
}

/**
 * Child Logger Service
 *
 * Internal implementation for child loggers created via logger.child().
 * This class wraps a Pino child logger and implements the same interface.
 */
class PinoLoggerChildService implements ILoggerService {
  constructor(private readonly logger: Logger) {}

  debug(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.info(context, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    const logContext: Record<string, unknown> = { ...context };

    if (error) {
      logContext.err = error;
    }

    if (Object.keys(logContext).length > 0) {
      this.logger.error(logContext, message);
    } else {
      this.logger.error(message);
    }
  }

  child(context: Record<string, unknown>): ILoggerService {
    const childLogger = this.logger.child(context);
    return new PinoLoggerChildService(childLogger);
  }

  startTimer(
    operation: string,
    context?: Record<string, unknown>,
  ): PerformanceTimer {
    return {
      startTime: performance.now(),
      operation,
      context,
    };
  }

  endTimer(
    timer: PerformanceTimer,
    additionalContext?: Record<string, unknown>,
  ): void {
    const duration = performance.now() - timer.startTime;
    const durationMs = Math.round(duration);

    const threshold = this.getSlowOperationThreshold(timer.operation);
    const isSlow = durationMs > threshold;

    const context: Record<string, unknown> = {
      operation: timer.operation,
      durationMs,
      ...timer.context,
      ...additionalContext,
    };

    if (isSlow) {
      this.logger.warn(
        context,
        `Slow operation detected: ${timer.operation} took ${durationMs}ms`,
      );
    } else {
      this.logger.debug(
        context,
        `Operation completed: ${timer.operation} in ${durationMs}ms`,
      );
    }
  }

  audit(entry: AuditLogEntry): void {
    this.logger.info(
      {
        audit: true,
        action: entry.action,
        userId: entry.userId,
        resource: entry.resource,
        result: entry.result,
        ...entry.metadata,
      },
      `Audit: ${entry.action} - ${entry.result}`,
    );
  }

  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const timer = this.startTimer(operation, context);

    try {
      const result = await fn();
      this.endTimer(timer, { result: "success" });
      return result;
    } catch (error) {
      this.endTimer(timer, { result: "failure", error: serializeError(error) });
      throw error;
    }
  }

  private getSlowOperationThreshold(operation: string): number {
    if (operation in SLOW_OPERATION_THRESHOLDS) {
      return SLOW_OPERATION_THRESHOLDS[
        operation as keyof typeof SLOW_OPERATION_THRESHOLDS
      ];
    }

    for (const [key, value] of Object.entries(SLOW_OPERATION_THRESHOLDS)) {
      if (key !== "default" && operation.startsWith(key)) {
        return value;
      }
    }

    return SLOW_OPERATION_THRESHOLDS.default;
  }
}
