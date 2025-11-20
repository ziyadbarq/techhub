/**
 * AI Generation Error Hierarchy
 *
 * Provides structured error handling for AI generation operations with
 * support for retry logic, error codes, and contextual information.
 */

/**
 * Base error class for all AI generation-related errors
 */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly cause?: Error,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AIGenerationError";

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      metadata: this.metadata,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

/**
 * OpenAI rate limit exceeded (HTTP 429)
 * Should be retried with exponential backoff
 */
export class AIRateLimitError extends AIGenerationError {
  constructor(
    public readonly retryAfter?: number, // Seconds until retry is allowed
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      retryAfter
        ? `OpenAI rate limit exceeded. Please retry after ${retryAfter} seconds.`
        : "OpenAI rate limit exceeded. Please try again in a moment.",
      "AI_RATE_LIMIT",
      true, // Retryable
      cause,
      { ...metadata, retryAfter },
    );
    this.name = "AIRateLimitError";
  }
}

/**
 * OpenAI service unavailable (HTTP 500, 503, 504)
 * Temporary server-side issue, should be retried
 */
export class AIServiceUnavailableError extends AIGenerationError {
  constructor(
    public readonly statusCode: number,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `OpenAI service temporarily unavailable (HTTP ${statusCode}). Please try again.`,
      "AI_SERVICE_UNAVAILABLE",
      true, // Retryable
      cause,
      { ...metadata, statusCode },
    );
    this.name = "AIServiceUnavailableError";
  }
}

/**
 * OpenAI API authentication failed (HTTP 401, 403)
 * Not retryable - requires configuration fix
 */
export class AIAuthenticationError extends AIGenerationError {
  constructor(cause?: Error, metadata?: Record<string, unknown>) {
    super(
      "OpenAI API authentication failed. Please check your API key configuration.",
      "AI_AUTHENTICATION_FAILED",
      false, // Not retryable
      cause,
      metadata,
    );
    this.name = "AIAuthenticationError";
  }
}

/**
 * OpenAI request validation failed (HTTP 400)
 * Not retryable - indicates invalid input
 */
export class AIValidationError extends AIGenerationError {
  constructor(
    details: string,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `AI request validation failed: ${details}`,
      "AI_VALIDATION",
      false, // Not retryable - input is invalid
      cause,
      metadata,
    );
    this.name = "AIValidationError";
  }
}

/**
 * AI response parsing/validation failed
 * Not retryable - indicates schema mismatch or malformed response
 */
export class AIResponseParsingError extends AIGenerationError {
  constructor(
    details: string,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Failed to parse AI response: ${details}`,
      "AI_RESPONSE_PARSING",
      false, // Not retryable
      cause,
      metadata,
    );
    this.name = "AIResponseParsingError";
  }
}

/**
 * Network/timeout error
 * Retryable - temporary connectivity issue
 */
export class AINetworkError extends AIGenerationError {
  constructor(cause?: Error, metadata?: Record<string, unknown>) {
    super(
      "Network error while communicating with OpenAI API. Please check your connection.",
      "AI_NETWORK_ERROR",
      true, // Retryable
      cause,
      metadata,
    );
    this.name = "AINetworkError";
  }
}

/**
 * Request timeout
 * Retryable - temporary issue
 */
export class AITimeoutError extends AIGenerationError {
  constructor(
    public readonly timeoutMs: number,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `AI generation request timed out after ${timeoutMs}ms.`,
      "AI_TIMEOUT",
      true, // Retryable
      cause,
      { ...metadata, timeoutMs },
    );
    this.name = "AITimeoutError";
  }
}

/**
 * Content safety/policy violation (HTTP 400 with safety error)
 * Not retryable - content violates OpenAI policies
 */
export class AIContentPolicyError extends AIGenerationError {
  constructor(
    reason: string,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Content violates OpenAI usage policies: ${reason}`,
      "AI_CONTENT_POLICY",
      false, // Not retryable - content must be modified
      cause,
      metadata,
    );
    this.name = "AIContentPolicyError";
  }
}

/**
 * Token/context length exceeded
 * Not retryable - input must be shortened
 */
export class AIContextLengthError extends AIGenerationError {
  constructor(
    public readonly maxTokens: number,
    public readonly requestedTokens: number,
    cause?: Error,
    metadata?: Record<string, unknown>,
  ) {
    super(
      `Input exceeds maximum context length (${requestedTokens} > ${maxTokens} tokens).`,
      "AI_CONTEXT_LENGTH",
      false, // Not retryable - must reduce input
      cause,
      { ...metadata, maxTokens, requestedTokens },
    );
    this.name = "AIContextLengthError";
  }
}

/**
 * Unexpected/unknown AI error
 * Retryable with caution - unclear cause
 */
export class AIUnknownError extends AIGenerationError {
  constructor(originalError: Error, metadata?: Record<string, unknown>) {
    super(
      `Unexpected AI generation error: ${originalError.message}`,
      "AI_UNKNOWN",
      true, // Retryable - might be transient
      originalError,
      metadata,
    );
    this.name = "AIUnknownError";
  }
}

/**
 * Helper function to categorize OpenAI errors into typed error classes
 *
 * @param error - Original error from OpenAI SDK
 * @param metadata - Additional context for the error
 * @returns Typed AIGenerationError subclass
 */
export function categorizeOpenAIError(
  error: unknown,
  metadata?: Record<string, unknown>,
): AIGenerationError {
  // Check for HTTP status codes
  if (error && typeof error === "object" && "status" in error) {
    switch ((error as { status: number }).status) {
      case 429: {
        const retryAfter =
          error &&
          typeof error === "object" &&
          "headers" in error &&
          error.headers &&
          typeof error.headers === "object" &&
          "retry-after" in error.headers
            ? parseInt(
                String(
                  (error.headers as Record<string, unknown>)["retry-after"],
                ),
              )
            : undefined;
        return new AIRateLimitError(
          retryAfter,
          error as unknown as Error,
          metadata,
        );
      }

      case 401:
      case 403:
        return new AIAuthenticationError(error as unknown as Error, metadata);

      case 400: {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "";
        // Check if it's a context length error
        if (errorMessage.toLowerCase().includes("context")) {
          return new AIContextLengthError(
            0,
            0,
            error as unknown as Error,
            metadata,
          ); // Parse actual values if available
        }
        // Check if it's a content policy error
        if (
          errorMessage.toLowerCase().includes("policy") ||
          errorMessage.toLowerCase().includes("safety")
        ) {
          return new AIContentPolicyError(
            errorMessage,
            error as unknown as Error,
            metadata,
          );
        }
        return new AIValidationError(
          errorMessage,
          error as unknown as Error,
          metadata,
        );
      }

      case 500:
      case 502:
      case 503:
      case 504:
        return new AIServiceUnavailableError(
          (error as { status: number }).status,
          error as unknown as Error,
          metadata,
        );

      default:
        return new AIUnknownError(error as unknown as Error, metadata);
    }
  }

  // Check for timeout errors
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const errorMessage =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  if (
    errorCode === "ETIMEDOUT" ||
    errorCode === "ECONNABORTED" ||
    errorMessage.toLowerCase().includes("timeout")
  ) {
    return new AITimeoutError(120000, error as unknown as Error, metadata); // Default 120s
  }

  // Check for network errors
  if (
    errorCode === "ECONNREFUSED" ||
    errorCode === "ENOTFOUND" ||
    errorCode === "ECONNRESET" ||
    errorMessage.toLowerCase().includes("network")
  ) {
    return new AINetworkError(error as unknown as Error, metadata);
  }

  // Check for parsing/validation errors
  const errorName =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  if (errorName === "ZodError" || errorName === "SyntaxError") {
    return new AIResponseParsingError(
      errorMessage,
      error as unknown as Error,
      metadata,
    );
  }

  // Fallback to unknown error
  return new AIUnknownError(error as unknown as Error, metadata);
}

/**
 * Type guard functions for error type narrowing
 * These enable TypeScript to correctly narrow error types in catch blocks
 */

/**
 * Check if error is an AIGenerationError (base class)
 */
export function isAIGenerationError(
  error: unknown,
): error is AIGenerationError {
  return error instanceof AIGenerationError;
}

/**
 * Check if error is a rate limit error (retryable)
 */
export function isAIRateLimitError(error: unknown): error is AIRateLimitError {
  return error instanceof AIRateLimitError;
}

/**
 * Check if error is a service unavailable error (retryable)
 */
export function isAIServiceUnavailableError(
  error: unknown,
): error is AIServiceUnavailableError {
  return error instanceof AIServiceUnavailableError;
}

/**
 * Check if error is an authentication error (not retryable)
 */
export function isAIAuthenticationError(
  error: unknown,
): error is AIAuthenticationError {
  return error instanceof AIAuthenticationError;
}

/**
 * Check if error is a validation error (not retryable)
 */
export function isAIValidationError(
  error: unknown,
): error is AIValidationError {
  return error instanceof AIValidationError;
}

/**
 * Check if error is a response parsing error (not retryable)
 */
export function isAIResponseParsingError(
  error: unknown,
): error is AIResponseParsingError {
  return error instanceof AIResponseParsingError;
}

/**
 * Check if error is a network error (retryable)
 */
export function isAINetworkError(error: unknown): error is AINetworkError {
  return error instanceof AINetworkError;
}

/**
 * Check if error is a timeout error (retryable)
 */
export function isAITimeoutError(error: unknown): error is AITimeoutError {
  return error instanceof AITimeoutError;
}

/**
 * Check if error is a content policy violation (not retryable)
 */
export function isAIContentPolicyError(
  error: unknown,
): error is AIContentPolicyError {
  return error instanceof AIContentPolicyError;
}

/**
 * Check if error is a context length error (not retryable)
 */
export function isAIContextLengthError(
  error: unknown,
): error is AIContextLengthError {
  return error instanceof AIContextLengthError;
}

/**
 * Check if error is an unknown AI error (retryable)
 */
export function isAIUnknownError(error: unknown): error is AIUnknownError {
  return error instanceof AIUnknownError;
}

/**
 * Check if an AI error is retryable based on its properties
 * @param error - The error to check
 * @returns true if the error can be retried
 */
export function isRetryableAIError(error: unknown): boolean {
  if (!isAIGenerationError(error)) {
    return false;
  }
  return error.retryable;
}
