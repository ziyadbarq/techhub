/**
 * Timing Utilities for Logger Service
 *
 * Extracted from PinoLoggerService to eliminate duplication between
 * parent and child logger classes.
 *
 * Provides:
 * - Slow operation threshold configuration
 * - Timing calculation utilities
 * - Threshold lookup with prefix matching
 */

/**
 * Slow operation thresholds (in milliseconds)
 *
 * Operations exceeding these thresholds will be logged as warnings.
 * Supports prefix matching (e.g., "database.query.users" matches "database.query").
 */
export const SLOW_OPERATION_THRESHOLDS = {
  /**
   * Database queries slower than 1000ms
   */
  "database.query": 1000,

  /**
   * Database queries for reports can be slower (5000ms)
   */
  "database.query.reports": 5000,

  /**
   * API calls slower than 3000ms
   */
  "api.call": 3000,

  /**
   * Analytics API calls can be slower (10000ms)
   */
  "api.call.analytics": 10000,

  /**
   * Default threshold for other operations: 5000ms
   */
  default: 5000,
} as const;

/**
 * Timing context with calculated values
 */
export interface TimingContext {
  /** Operation name */
  operation: string;

  /** Duration in milliseconds (rounded) */
  durationMs: number;

  /** Applicable threshold in milliseconds */
  threshold: number;

  /** Whether the operation exceeded the threshold */
  isSlow: boolean;
}

/**
 * Get slow operation threshold for a given operation
 *
 * Supports exact match and prefix matching for hierarchical operation names.
 *
 * @param operation - Operation name (e.g., "database.query", "database.query.users")
 * @returns Threshold in milliseconds
 *
 * @example
 * ```typescript
 * getSlowOperationThreshold('database.query'); // 1000
 * getSlowOperationThreshold('database.query.users'); // 1000 (prefix match)
 * getSlowOperationThreshold('database.query.reports'); // 5000 (exact match)
 * getSlowOperationThreshold('custom.operation'); // 5000 (default)
 * ```
 */
export function getSlowOperationThreshold(operation: string): number {
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

/**
 * Calculate timing context from start time and operation
 *
 * Determines duration, applicable threshold, and whether the operation is slow.
 *
 * @param startTime - High-resolution timestamp from performance.now()
 * @param operation - Operation name
 * @returns Timing context with calculated values
 *
 * @example
 * ```typescript
 * const startTime = performance.now();
 * // ... operation executes
 * const timing = calculateTiming(startTime, 'database.query');
 * // timing.durationMs = 1500, timing.isSlow = true
 * ```
 */
export function calculateTiming(
  startTime: number,
  operation: string,
): TimingContext {
  const duration = performance.now() - startTime;
  const durationMs = Math.round(duration);
  const threshold = getSlowOperationThreshold(operation);
  const isSlow = durationMs > threshold;

  return {
    operation,
    durationMs,
    threshold,
    isSlow,
  };
}

/**
 * Format timing message for logging
 *
 * @param timing - Timing context
 * @returns Formatted log message
 */
export function formatTimingMessage(timing: TimingContext): string {
  if (timing.isSlow) {
    return `Slow operation detected: ${timing.operation} took ${timing.durationMs}ms (threshold: ${timing.threshold}ms)`;
  }
  return `Operation completed: ${timing.operation} in ${timing.durationMs}ms`;
}
