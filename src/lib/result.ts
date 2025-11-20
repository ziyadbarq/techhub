/**
 * Result type for explicit success/error handling
 * Implements a discriminated union pattern for type-safe error handling
 * T - Success value type
 * E - Error type (defaults to Error)
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create a successful Result
 * @param value - The success value
 * @returns Result in success state
 */
export const success = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

/**
 * Create an error Result
 * @param error - The error object
 * @returns Result in error state
 */
export const error = <E extends Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
