/**
 * Domain Error Type Guards
 *
 * Provides type guard functions for identifying domain errors
 */

import { ValidationError } from "./validation.error";
import { NotFoundError } from "./not-found.error";

/**
 * Base domain errors that should be handled gracefully in controllers
 */
export type DomainError = ValidationError | NotFoundError;

/**
 * Type guard to check if an error is a domain error
 *
 * Domain errors are expected business logic errors that should be
 * handled gracefully and returned to the user with appropriate messages.
 *
 * @param error - Error to check
 * @returns true if error is a domain error
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof ValidationError || error instanceof NotFoundError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
