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
import { calculateTiming, formatTimingMessage } from "./timing-utils";
import { getRequestContext } from "@/lib/request-context";

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
 * - Automatic request context injection (requestId, userId, path, method)
 */
@injectable()
export class PinoLoggerService implements ILoggerService {
  private readonly logger: Logger;

  constructor() {
    // Configure Pino based on environment
    const isDevelopment = env.NODE_ENV === "development";

    // Safe fallback for LOG_LEVEL during build (when env validation is skipped)
    // Pattern: env.LOG_LEVEL → environment-based default → hard default
    // Use || instead of ?? to catch empty strings
    const logLevel = env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

    this.logger = pino({
      // Set log level with safe fallback
      level: logLevel,

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
          logLevel: logLevel,
          logLevelSource: env.LOG_LEVEL ? "env" : "default",
          nodeEnv: env.NODE_ENV,
          prettyPrint: isDevelopment,
        },
        "Logger initialized",
      );
    }
  }

  /**
   * Enrich context with request information from AsyncLocalStorage
   *
   * Automatically injects request context (requestId, userId, path, method)
   * into all log entries if available from AsyncLocalStorage.
   *
   * @param context - User-provided context
   * @returns Enriched context with request information
   */
  private enrichContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> {
    const requestContext = getRequestContext();

    if (!requestContext) {
      return context || {};
    }

    // Merge request context with user context (user context can override)
    return {
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      userId: requestContext.userId,
      path: requestContext.path,
      method: requestContext.method,
      ...context, // User context can override defaults
    };
  }

  /**
   * Log debug-level message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.debug(enriched, message);
    } else {
      this.logger.debug(message);
    }
  }

  /**
   * Log info-level message
   */
  info(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.info(enriched, message);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Log warning-level message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.warn(enriched, message);
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
    // Enrich with request context
    const enriched = this.enrichContext(context);

    if (error) {
      // Pino will automatically serialize the error with stack trace
      enriched.err = error;
    }

    if (Object.keys(enriched).length > 0) {
      this.logger.error(enriched, message);
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
    // Use shared timing utilities
    const timing = calculateTiming(timer.startTime, timer.operation);

    // Merge all context
    const context: Record<string, unknown> = {
      operation: timing.operation,
      durationMs: timing.durationMs,
      threshold: timing.threshold,
      ...timer.context,
      ...additionalContext,
    };

    // Log at appropriate level
    const message = formatTimingMessage(timing);
    if (timing.isSlow) {
      this.logger.warn(context, message);
    } else {
      this.logger.debug(context, message);
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
}

/**
 * Child Logger Service - Uses Composition to Avoid Duplication
 *
 * Internal implementation for child loggers created via logger.child().
 * Uses composition pattern to delegate complex operations to shared utilities
 * instead of duplicating logic from the parent class.
 *
 * Benefits:
 * - Eliminates 150+ lines of duplicated code
 * - Single source of truth for timing/threshold logic
 * - Easier to maintain and test
 * - Automatically inherits request context enrichment
 */
class PinoLoggerChildService implements ILoggerService {
  constructor(private readonly logger: Logger) {}

  /**
   * Enrich context with request information (same as parent)
   */
  private enrichContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> {
    const requestContext = getRequestContext();

    if (!requestContext) {
      return context || {};
    }

    return {
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      userId: requestContext.userId,
      path: requestContext.path,
      method: requestContext.method,
      ...context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.debug(enriched, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.info(enriched, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.warn(enriched, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    const enriched = this.enrichContext(context);

    if (error) {
      enriched.err = error;
    }

    if (Object.keys(enriched).length > 0) {
      this.logger.error(enriched, message);
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
    // Use shared timing utilities (eliminates duplication)
    const timing = calculateTiming(timer.startTime, timer.operation);

    const context: Record<string, unknown> = {
      operation: timing.operation,
      durationMs: timing.durationMs,
      threshold: timing.threshold,
      ...timer.context,
      ...additionalContext,
    };

    const message = formatTimingMessage(timing);
    if (timing.isSlow) {
      this.logger.warn(context, message);
    } else {
      this.logger.debug(context, message);
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
}
