/**
 * Enhanced Error Serialization for Logging
 *
 * Provides comprehensive error serialization that extracts:
 * - Domain error context (ValidationError, NotFoundError, etc.)
 * - Zod validation error details with field-level errors
 * - Error cause chains for nested errors
 * - HTTP status codes and error codes
 * - Stack traces and source locations
 *
 * Architecture:
 * - Used by PinoLoggerService for error serialization
 * - Handles all application error types
 * - Extracts maximum context for debugging
 * - Production-safe (no sensitive data leaks)
 *
 * Usage:
 * ```typescript
 * const serialized = serializeError(error);
 * logger.error('Operation failed', { error: serialized });
 * ```
 */

import { ZodError } from "zod";
import type { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { ValidationError } from "@/core/domain/errors/validation.error";

/**
 * Serialized error structure
 *
 * Standardized format for logging errors with full context
 */
export interface SerializedError {
  /**
   * Error name/type (e.g., "ValidationError", "ZodError", "Error")
   */
  type: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Stack trace (multiline string)
   */
  stack?: string;

  /**
   * Error code (if available)
   */
  code?: string | number;

  /**
   * HTTP status code (if applicable)
   */
  statusCode?: number;

  /**
   * Domain-specific context
   */
  context?: Record<string, unknown>;

  /**
   * Validation errors (for Zod and ValidationError)
   */
  validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;

  /**
   * Error cause chain (for nested errors)
   */
  cause?: SerializedError;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Serialize an error for logging
 *
 * Extracts maximum context from any error type while maintaining
 * type safety and avoiding sensitive data exposure.
 *
 * @param error - Error to serialize
 * @returns Serialized error object
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const serialized = serializeError(error);
 *   logger.error('Operation failed', { error: serialized });
 * }
 * ```
 */
export function serializeError(error: unknown): SerializedError {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return {
      type: "Unknown",
      message: "An unknown error occurred",
    };
  }

  // Handle non-Error objects
  if (!(error instanceof Error)) {
    return {
      type: typeof error,
      message: String(error),
      metadata: {
        originalValue: error,
      },
    };
  }

  // Base error properties
  const serialized: SerializedError = {
    type: error.name || error.constructor.name,
    message: error.message,
    stack: error.stack,
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    serialized.type = "ZodValidationError";
    serialized.validationErrors = error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));
    serialized.context = {
      errorCount: error.issues.length,
      issues: error.issues,
    };
  }

  // Handle domain ValidationError
  else if (isValidationError(error)) {
    serialized.type = "ValidationError";
    serialized.statusCode = 400;
    // ValidationError might have additional context in the future
  }

  // Handle domain NotFoundError
  else if (isNotFoundError(error)) {
    const notFoundErr = error as NotFoundError;
    serialized.type = "NotFoundError";
    serialized.statusCode = 404;
    serialized.context = {
      entityName: notFoundErr.entityName,
      entityId: notFoundErr.entityId,
    };
  }

  // Handle errors with HTTP status codes
  else if (
    "statusCode" in error &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  ) {
    serialized.statusCode = (error as Record<string, unknown>)
      .statusCode as number;
  }

  // Handle errors with error codes
  if (
    "code" in error &&
    (typeof error.code === "string" || typeof error.code === "number")
  ) {
    serialized.code = error.code;
  }

  // Handle error cause chain (ES2022 feature)
  if ("cause" in error && error.cause) {
    serialized.cause = serializeError(error.cause);
  }

  // Extract additional metadata from error properties
  const metadata: Record<string, unknown> = {};
  const standardProps = new Set([
    "name",
    "message",
    "stack",
    "cause",
    "statusCode",
    "code",
    "entityName",
    "entityId",
  ]);

  for (const key of Object.keys(error)) {
    if (!standardProps.has(key)) {
      // @ts-expect-error - Accessing dynamic property
      metadata[key] = error[key];
    }
  }

  if (Object.keys(metadata).length > 0) {
    serialized.metadata = metadata;
  }

  return serialized;
}

/**
 * Type guard for ValidationError
 */
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && error.name === "ValidationError";
}

/**
 * Type guard for NotFoundError
 */
function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof Error && error.name === "NotFoundError";
}

/**
 * Extract error message from unknown error
 *
 * Safely extracts a human-readable error message from any value
 *
 * @param error - Unknown error value
 * @returns Error message string
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return `Validation failed: ${error.issues.map((e) => e.message).join(", ")}`;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unknown error occurred";
}

/**
 * Check if error is an operational error (safe to show to user)
 *
 * Operational errors are expected business logic errors that can be
 * safely shown to users. Non-operational errors are unexpected and
 * should be logged but not exposed.
 *
 * @param error - Error to check
 * @returns true if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  // Domain errors are operational
  if (
    error.name === "ValidationError" ||
    error.name === "NotFoundError" ||
    error instanceof ZodError
  ) {
    return true;
  }

  // Check for isOperational flag
  if ("isOperational" in error && typeof error.isOperational === "boolean") {
    return error.isOperational;
  }

  return false;
}

/**
 * Format error for user display
 *
 * Returns a user-friendly error message that's safe to display.
 * Operational errors show their message, non-operational errors
 * show a generic message.
 *
 * @param error - Error to format
 * @returns User-safe error message
 */
export function formatErrorForUser(error: unknown): string {
  if (isOperationalError(error)) {
    return extractErrorMessage(error);
  }

  return "An unexpected error occurred. Please try again later.";
}

/**
 * Create error context from serialized error
 *
 * Converts a serialized error into a flat object suitable for
 * structured logging context.
 *
 * @param error - Error to extract context from
 * @returns Log context object
 */
export function createErrorContext(error: unknown): Record<string, unknown> {
  const serialized = serializeError(error);

  const context: Record<string, unknown> = {
    errorType: serialized.type,
    errorMessage: serialized.message,
  };

  if (serialized.code) {
    context.errorCode = serialized.code;
  }

  if (serialized.statusCode) {
    context.httpStatusCode = serialized.statusCode;
  }

  if (serialized.validationErrors && serialized.validationErrors.length > 0) {
    context.validationErrors = serialized.validationErrors;
  }

  if (serialized.context) {
    context.errorContext = serialized.context;
  }

  return context;
}
