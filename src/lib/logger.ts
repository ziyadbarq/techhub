/**
 * Logger Utility - Backward Compatible Wrapper
 *
 * This file provides backward compatibility for existing code that uses the old logger.
 * It wraps the new DI-based logger service with a similar API to the old implementation.
 *
 * MIGRATION GUIDE:
 * - Old code can continue using this file without changes
 * - New code should inject ILoggerService via DI instead
 * - Gradually migrate to DI-based logging for better testability
 *
 * Architecture:
 * - This is a utility/adapter in the lib layer
 * - Delegates to the actual PinoLoggerService via DI container (server-side only)
 * - Falls back to console logging on client side
 * - Provides convenience exports for common use cases
 *
 * @deprecated For new code, inject ILoggerService via DI instead
 */

import type { ILoggerService } from "@/core/services";

/**
 * LogContext for backward compatibility with old logger API
 */
export interface LogContext {
  module: string;
  function: string;
  [key: string]: unknown;
}

/**
 * Create a simple console-based logger (used on client side and as fallback)
 */
function createClientLogger(
  baseContext?: Record<string, unknown>,
): ILoggerService {
  const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 } as const;
  const envLevel = (process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "test" ? "error" : undefined)) as
    | keyof typeof levelOrder
    | undefined;
  const currentLevel: keyof typeof levelOrder = envLevel ?? "info";
  const shouldLog = (level: keyof typeof levelOrder) =>
    levelOrder[level] >= levelOrder[currentLevel];

  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      if (shouldLog("debug")) {
        console.debug(message, { ...baseContext, ...context });
      }
    },
    info: (message: string, context?: Record<string, unknown>) => {
      if (shouldLog("info")) {
        console.info(message, { ...baseContext, ...context });
      }
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      if (shouldLog("warn")) {
        console.warn(message, { ...baseContext, ...context });
      }
    },
    error: (
      message: string,
      error?: Error,
      context?: Record<string, unknown>,
    ) => {
      if (shouldLog("error")) {
        console.error(message, error, { ...baseContext, ...context });
      }
    },
    child: (context: Record<string, unknown>) => {
      return createClientLogger({ ...baseContext, ...context });
    },
    startTimer: (operation: string, context?: Record<string, unknown>) => {
      return {
        startTime: performance.now(),
        operation,
        context: { ...baseContext, ...context },
      };
    },
    endTimer: (timer, additionalContext?: Record<string, unknown>) => {
      if (shouldLog("debug")) {
        const duration = performance.now() - timer.startTime;
        console.debug(
          `[TIMER] ${timer.operation} completed in ${duration.toFixed(2)}ms`,
          { ...timer.context, ...additionalContext },
        );
      }
    },
    audit: (entry) => {
      if (shouldLog("info")) {
        console.info("[AUDIT]", entry);
      }
    },
    withTiming: async <T>(
      operation: string,
      fn: () => Promise<T>,
      context?: Record<string, unknown>,
    ) => {
      if (!shouldLog("debug")) {
        return fn();
      }

      const timer = {
        startTime: performance.now(),
        operation,
        context: { ...baseContext, ...context },
      };
      try {
        const result = await fn();
        const duration = performance.now() - timer.startTime;
        console.debug(
          `[TIMING] ${operation} completed in ${duration.toFixed(2)}ms`,
          timer.context,
        );
        return result;
      } catch (error) {
        const duration = performance.now() - timer.startTime;
        console.error(
          `[TIMING] ${operation} failed after ${duration.toFixed(2)}ms`,
          error,
        );
        throw error;
      }
    },
  };
}

/**
 * Get logger instance from DI container (server-side only)
 *
 * This function lazily retrieves the logger from the DI container.
 * It's cached after first access for performance.
 * On the client side, returns a console-based fallback logger.
 *
 * IMPORTANT: During container initialization, this returns a console logger
 * to avoid circular dependency (container needs logger, logger needs container).
 */
let cachedLogger: ILoggerService | null = null;
let containerInitialized = false;

function getLogger(): ILoggerService {
  // Check if we're on the client side
  if (typeof window !== "undefined") {
    return createClientLogger();
  }

  // Server-side: use DI container (lazy import to avoid bundling in client)
  if (!cachedLogger && containerInitialized) {
    try {
      // Dynamic require to avoid bundling in client
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getContainer } = require("@/di/container");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DI_TOKENS } = require("@/di/types");
      const container = getContainer();
      // Use type assertion since dynamic require() doesn't preserve types
      cachedLogger = container.get(DI_TOKENS.ILoggerService) as ILoggerService;
    } catch (_error) {
      // Fallback to console logger if DI container initialization fails
      // This can happen during build time or in edge cases
      return createClientLogger();
    }
  }

  // Return cached logger if available, otherwise use console logger
  // (console logger is used during container initialization to avoid circular dependency)
  return cachedLogger ?? createClientLogger();
}

/**
 * Mark container as initialized so logger can start using DI
 * This should be called after container initialization is complete
 */
export function markContainerInitialized(): void {
  containerInitialized = true;
  // Clear cached logger so it will be re-fetched from DI container on next use
  cachedLogger = null;
}

/**
 * Reset logger state (for testing)
 * This should be called when the DI container is reset
 */
export function resetLoggerState(): void {
  containerInitialized = false;
  cachedLogger = null;
}

/**
 * Adapter class to provide old logger API
 *
 * This class wraps the new ILoggerService and adapts it to the old API
 * that used LogContext as the first parameter.
 */
class LoggerAdapter {
  /**
   * Debug log with context
   */
  debug(context: LogContext, message: string, data?: Record<string, unknown>) {
    const logger = getLogger();
    const { module: mod, function: func, ...rest } = context;
    const fullContext = {
      module: mod,
      function: func,
      ...rest,
      ...data,
    };
    logger.debug(message, fullContext);
  }

  /**
   * Info log with context
   */
  info(context: LogContext, message: string, data?: Record<string, unknown>) {
    const logger = getLogger();
    const { module: mod, function: func, ...rest } = context;
    const fullContext = {
      module: mod,
      function: func,
      ...rest,
      ...data,
    };
    logger.info(message, fullContext);
  }

  /**
   * Warning log with context
   */
  warn(context: LogContext, message: string, data?: Record<string, unknown>) {
    const logger = getLogger();
    const { module: mod, function: func, ...rest } = context;
    const fullContext = {
      module: mod,
      function: func,
      ...rest,
      ...data,
    };
    logger.warn(message, fullContext);
  }

  /**
   * Error log with context
   */
  error(
    context: LogContext,
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ) {
    const logger = getLogger();
    const { module: mod, function: func, ...rest } = context;
    const fullContext = {
      module: mod,
      function: func,
      ...rest,
      ...data,
    };

    const errorObj = error instanceof Error ? error : undefined;
    logger.error(message, errorObj, fullContext);
  }

  /**
   * Start a timer for performance tracking
   */
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  /**
   * Log with duration measurement
   */
  timed(
    context: LogContext,
    message: string,
    duration: number,
    data?: Record<string, unknown>,
  ) {
    const logger = getLogger();
    const { module: mod, function: func, ...rest } = context;
    const fullContext = {
      module: mod,
      function: func,
      duration,
      ...rest,
      ...data,
    };
    logger.info(message, fullContext);
  }

  /**
   * Create a scoped logger for a specific module
   */
  scope(module: string) {
    return {
      debug: (fn: string, message: string, data?: Record<string, unknown>) =>
        this.debug({ module, function: fn }, message, data),
      info: (fn: string, message: string, data?: Record<string, unknown>) =>
        this.info({ module, function: fn }, message, data),
      warn: (fn: string, message: string, data?: Record<string, unknown>) =>
        this.warn({ module, function: fn }, message, data),
      error: (
        fn: string,
        message: string,
        error?: Error | unknown,
        data?: Record<string, unknown>,
      ) => this.error({ module, function: fn }, message, error, data),
      timed: (
        fn: string,
        message: string,
        duration: number,
        data?: Record<string, unknown>,
      ) => this.timed({ module, function: fn }, message, duration, data),
      startTimer: () => this.startTimer(),
    };
  }
}

/**
 * Export singleton logger instance for backward compatibility
 */
export const logger = new LoggerAdapter();

/**
 * Convenience exports for common modules
 * These provide scoped loggers that automatically include module context
 */
export const aiLogger = logger.scope("AI");
export const controllerLogger = logger.scope("Controller");
export const useCaseLogger = logger.scope("UseCase");
export const serviceLogger = logger.scope("Service");
export const componentLogger = logger.scope("Component");

/**
 * Export types for backward compatibility
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * MIGRATION EXAMPLES:
 *
 * Old way (still works):
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info({ module: 'MyModule', function: 'myFunction' }, 'Message', { data: 'value' });
 * ```
 *
 * New way (recommended for new code):
 * ```typescript
 * @injectable()
 * export class MyService {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService)
 *     private logger: ILoggerService
 *   ) {}
 *
 *   myMethod() {
 *     this.logger.info('Message', { data: 'value' });
 *   }
 * }
 * ```
 */
