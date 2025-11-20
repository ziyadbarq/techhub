/**
 * Not Found Error
 *
 * Thrown when a requested entity is not found in the repository
 */
export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly entityName?: string,
    public readonly entityId?: string,
  ) {
    super(message);
    this.name = "NotFoundError";

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
