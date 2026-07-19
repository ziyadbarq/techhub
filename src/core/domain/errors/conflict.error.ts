/**
 * Conflict Error
 *
 * Thrown when an operation conflicts with current state: duplicate unique
 * values (name/code already exists), invalid state transitions (already
 * active, already voided), or overlapping resources.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
