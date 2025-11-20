/**
 * Centralized Controller Error Handler
 *
 * Provides standardized error handling for all server actions with:
 * - Structured logging using DI logger
 * - Type-safe error categorization
 * - Consistent error message formatting
 * - Enhanced error serialization
 * - Special handling for validation errors (Zod)
 * - Special handling for domain errors
 */

import { ZodError } from "zod";
import { isDomainError } from "@/core/domain/errors/domain-errors";
import type { ActionResponse } from "./types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";

/**
 * Get logger from DI container
 *
 * Helper function to retrieve logger instance for error handling
 */
function getLogger(): ILoggerService {
  const container = getContainer();
  return container.get<ILoggerService>(DI_TOKENS.ILoggerService);
}

/**
 * Handles errors in controller actions with structured logging and formatting
 *
 * @param error - The caught error
 * @param context - Context information (function name, user ID, etc.)
 * @param fallbackMessage - Default message if error message extraction fails
 * @returns Formatted error response
 *
 * @example
 * ```typescript
 * export async function createPresentationAction(formData: FormData): Promise<ActionResponse<PresentationResponseDTO>> {
 *   try {
 *     // ... business logic
 *     return { success: true, data: responseData };
 *   } catch (error) {
 *     return handleControllerError(error, {
 *       function: 'createPresentationAction',
 *       userId: session?.userId,
 *     }, 'Failed to create presentation');
 *   }
 * }
 * ```
 */
export function handleControllerError<T = unknown>(
  error: unknown,
  context: {
    function: string;
    userId?: string;
    [key: string]: unknown;
  },
  fallbackMessage: string,
): ActionResponse<T> {
  const logger = getLogger();

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    const fieldName = firstError?.path.join(".");
    const message = firstError
      ? `${fieldName}: ${firstError.message}`
      : "Validation failed";

    logger.warn("Validation error in controller", {
      ...context,
      validationErrors: error.issues,
      errorCount: error.issues.length,
    });

    return {
      success: false,
      error: message,
    };
  }

  // Handle all domain errors (NotFound, Validation, Duplicate, etc.)
  if (isDomainError(error)) {
    logger.warn("Domain error occurred in controller", {
      ...context,
      errorType: error.name,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    logger.error("Controller action failed", error, {
      ...context,
    });

    return {
      success: false,
      error: error.message,
    };
  }

  // Handle unknown error types
  logger.error(
    "Controller action failed with unknown error",
    new Error(String(error)),
    {
      ...context,
      errorType: typeof error,
      errorValue: String(error),
    },
  );

  return {
    success: false,
    error: fallbackMessage,
  };
}

/**
 * Wrapper function for controller actions that automatically handles errors
 *
 * @param fn - The async function to execute
 * @param functionName - Name of the controller function for logging
 * @param fallbackMessage - Default error message
 * @returns Wrapped function with automatic error handling
 *
 * @example
 * ```typescript
 * export const createPresentationAction = withErrorHandler(
 *   async (formData: FormData): Promise<PresentationResponseDTO> => {
 *     // ... business logic (no try-catch needed)
 *     return responseData;
 *   },
 *   'createPresentationAction',
 *   'Failed to create presentation'
 * );
 * ```
 */
export function withErrorHandler<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<TData>,
  functionName: string,
  fallbackMessage: string,
): (...args: TArgs) => Promise<ActionResponse<TData>> {
  return async (...args: TArgs): Promise<ActionResponse<TData>> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (error) {
      return handleControllerError(
        error,
        { function: functionName },
        fallbackMessage,
      );
    }
  };
}
