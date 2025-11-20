/**
 * Retry Helper with Exponential Backoff
 *
 * Provides intelligent retry logic for API calls with:
 * - Exponential backoff with jitter
 * - Configurable retry attempts
 * - Selective retry based on error type
 * - Comprehensive logging
 */

import { AIGenerationError } from "@/core/domain/errors/ai.errors";
import { serviceLogger } from "@/lib/logger";

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds (default: 1000ms)
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds (default: 30000ms = 30s)
   */
  maxDelay?: number;

  /**
   * Backoff multiplier (default: 2 for exponential backoff)
   */
  backoffMultiplier?: number;

  /**
   * Add random jitter to prevent thundering herd (default: true)
   */
  useJitter?: number;

  /**
   * Custom function to determine if an error should be retried
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Custom function called before each retry
   */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  useJitter: 0.1, // 10% jitter
  shouldRetry: (error: Error) => {
    // By default, only retry AIGenerationError with retryable flag
    if (error instanceof AIGenerationError) {
      return error.retryable;
    }
    return false;
  },
  onRetry: () => {}, // No-op by default
};

/**
 * Calculate delay with exponential backoff and jitter
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param options - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>,
): number {
  // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay =
    options.baseDelay * Math.pow(options.backoffMultiplier, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

  // Add jitter: random value between (1 - jitter) and (1 + jitter)
  const jitterRange = cappedDelay * options.useJitter;
  const jitter = Math.random() * jitterRange * 2 - jitterRange;
  const delayWithJitter = cappedDelay + jitter;

  // Ensure delay is positive
  return Math.max(0, Math.round(delayWithJitter));
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @param context - Context string for logging (e.g., "generateOutline")
 * @returns Promise resolving to the function's result
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     return await openai.chat.completions.create({...});
 *   },
 *   { maxRetries: 3, baseDelay: 1000 },
 *   "generateOutline"
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  context: string = "operation",
): Promise<T> {
  // Merge with defaults
  const config: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Log attempt
      if (attempt > 0) {
        serviceLogger.info(
          "RetryHelper",
          `🔄 Retry attempt ${attempt}/${config.maxRetries}`,
          { context, attempt, maxRetries: config.maxRetries },
        );
      }

      // Execute the function
      const result = await fn();

      // Success! Log if this was a retry
      if (attempt > 0) {
        serviceLogger.info(
          "RetryHelper",
          `✅ Retry successful after ${attempt} attempt(s)`,
          { context, attempts: attempt },
        );
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = config.shouldRetry(lastError, attempt);
      const attemptsRemaining = config.maxRetries - attempt;

      // Log the error
      serviceLogger.warn(
        "RetryHelper",
        `❌ Attempt ${attempt + 1} failed${shouldRetry && attemptsRemaining > 0 ? ", will retry" : ""}`,
        {
          context,
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          attemptsRemaining,
          errorCode:
            lastError instanceof AIGenerationError ? lastError.code : "UNKNOWN",
          errorMessage: lastError.message,
          retryable: shouldRetry,
        },
      );

      // If this is the last attempt or error is not retryable, throw
      if (attempt >= config.maxRetries || !shouldRetry) {
        serviceLogger.error(
          "RetryHelper",
          `💥 All retry attempts exhausted for ${context}`,
          lastError,
          {
            context,
            totalAttempts: attempt + 1,
            maxRetries: config.maxRetries,
          },
        );
        throw lastError;
      }

      // Calculate delay
      const delayMs = calculateDelay(attempt, config);

      // Call onRetry callback
      config.onRetry(lastError, attempt, delayMs);

      // Log delay
      serviceLogger.info(
        "RetryHelper",
        `⏳ Waiting ${delayMs}ms before retry ${attempt + 1}`,
        {
          context,
          delayMs,
          nextAttempt: attempt + 2,
        },
      );

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Retry failed with unknown error");
}

/**
 * Retry with custom backoff schedule
 *
 * @param fn - Async function to execute
 * @param delays - Array of delays in milliseconds for each retry
 * @param context - Context string for logging
 * @returns Promise resolving to the function's result
 *
 * @example
 * ```typescript
 * // Retry with custom delays: 1s, 2s, 5s, 10s
 * const result = await retryWithSchedule(
 *   async () => await apiCall(),
 *   [1000, 2000, 5000, 10000],
 *   "apiCall"
 * );
 * ```
 */
export async function retryWithSchedule<T>(
  fn: () => Promise<T>,
  delays: number[],
  context: string = "operation",
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      if (attempt > 0) {
        serviceLogger.info(
          "RetryHelper",
          `🔄 Retry attempt ${attempt}/${delays.length}`,
          { context, attempt },
        );
      }

      const result = await fn();

      if (attempt > 0) {
        serviceLogger.info(
          "RetryHelper",
          `✅ Retry successful after ${attempt} attempt(s)`,
          { context, attempts: attempt },
        );
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= delays.length) {
        serviceLogger.error(
          "RetryHelper",
          `💥 All retry attempts exhausted for ${context}`,
          lastError,
          { context, totalAttempts: attempt + 1 },
        );
        throw lastError;
      }

      const delayMs = delays[attempt];
      serviceLogger.info(
        "RetryHelper",
        `⏳ Waiting ${delayMs}ms before retry ${attempt + 1}`,
        { context, delayMs, nextAttempt: attempt + 2 },
      );

      await sleep(delayMs);
    }
  }

  throw lastError || new Error("Retry failed with unknown error");
}
