/**
 * Request Context Management using AsyncLocalStorage
 *
 * Provides request-scoped context that automatically propagates through
 * async operations without explicit passing. This enables features like:
 * - Request ID tracking across all layers
 * - User context in logs
 * - Correlation IDs for distributed tracing
 * - Performance timing per request
 *
 * Architecture:
 * - Uses Node.js AsyncLocalStorage for async context propagation
 * - Middleware initializes context for each request
 * - Context automatically available in all downstream code
 * - Thread-safe and isolated per request
 *
 * Usage in middleware:
 * ```typescript
 * export function middleware(request: NextRequest) {
 *   return requestContext.run({
 *     requestId: generateRequestId(),
 *     // ... other context
 *   }, () => NextResponse.next());
 * }
 * ```
 *
 * Usage in services:
 * ```typescript
 * const context = getRequestContext();
 * logger.info('Processing request', { requestId: context?.requestId });
 * ```
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/**
 * Request context data structure
 *
 * Contains all context information that should be available
 * throughout the request lifecycle
 */
export interface RequestContext {
  /**
   * Unique identifier for this request
   * Used for log correlation and distributed tracing
   */
  requestId: string;

  /**
   * Correlation ID for distributed tracing
   * Can be passed from upstream services via X-Correlation-ID header
   */
  correlationId?: string;

  /**
   * User ID for authenticated requests
   * Useful for audit logging and user-specific context
   */
  userId?: string;

  /**
   * Request timestamp (ISO 8601)
   * Used for performance tracking and log ordering
   */
  timestamp: string;

  /**
   * Request method (GET, POST, etc.)
   */
  method?: string;

  /**
   * Request path
   */
  path?: string;

  /**
   * User IP address
   * Useful for security and audit logging
   */
  ip?: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Additional custom context data
   * Allows extending context with application-specific data
   */
  metadata?: Record<string, unknown>;
}

/**
 * AsyncLocalStorage instance for request context
 * This provides the storage mechanism for request-scoped data
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context
 *
 * @returns Current request context or undefined if not in a request context
 *
 * @example
 * ```typescript
 * const context = getRequestContext();
 * if (context) {
 *   logger.info('Processing', { requestId: context.requestId });
 * }
 * ```
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Run a function within a request context
 *
 * @param context - Request context to set
 * @param callback - Function to run within the context
 * @returns Result of the callback function
 *
 * @example
 * ```typescript
 * const result = runWithContext(
 *   { requestId: 'req_123', timestamp: new Date().toISOString() },
 *   async () => {
 *     // All code here and in nested calls has access to context
 *     await processRequest();
 *     return 'done';
 *   }
 * );
 * ```
 */
export function runWithContext<T>(
  context: RequestContext,
  callback: () => T,
): T {
  return asyncLocalStorage.run(context, callback);
}

/**
 * Update the current request context
 *
 * Useful for adding context data during request processing
 * (e.g., adding userId after authentication)
 *
 * @param updates - Partial context to merge with existing context
 *
 * @example
 * ```typescript
 * // After authentication:
 * updateRequestContext({ userId: authenticatedUser.id });
 * ```
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
  const current = asyncLocalStorage.getStore();
  if (current) {
    Object.assign(current, updates);
  }
}

/**
 * Generate a unique request ID
 *
 * Uses UUID v4 for guaranteed uniqueness across distributed systems
 *
 * @returns Unique request ID in format "req_<uuid>"
 */
export function generateRequestId(): string {
  return `req_${randomUUID()}`;
}

/**
 * Extract request context from Next.js request headers
 *
 * Extracts common headers and generates/extracts request IDs
 *
 * @param headers - Next.js request headers
 * @param url - Request URL
 * @returns Partial request context from headers
 *
 * @example
 * ```typescript
 * const context = extractContextFromHeaders(
 *   request.headers,
 *   request.url
 * );
 * ```
 */
export function extractContextFromHeaders(
  headers: Headers,
  url: string,
): Partial<RequestContext> {
  // Extract or generate request ID
  const requestId =
    headers.get("x-request-id") ||
    headers.get("request-id") ||
    generateRequestId();

  // Extract correlation ID if present
  const correlationId =
    headers.get("x-correlation-id") ||
    headers.get("correlation-id") ||
    requestId;

  // Extract user agent
  const userAgent = headers.get("user-agent") || undefined;

  // Extract IP address (works with common proxy headers)
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    undefined;

  // Parse URL for path and method info
  const urlObj = new URL(url);

  return {
    requestId,
    correlationId,
    userAgent,
    ip,
    path: urlObj.pathname,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a request context logger factory
 *
 * Returns a function that creates child loggers with automatic
 * request context injection. This ensures all logs include
 * request tracking information.
 *
 * @param logger - Base logger service
 * @returns Function that creates request-aware child loggers
 *
 * @example
 * ```typescript
 * import { container } from '@/di/container';
 * import { DI_TOKENS } from '@/di/types';
 *
 * const baseLogger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
 * const createLogger = createRequestLoggerFactory(baseLogger);
 *
 * // In a request handler:
 * const logger = createLogger({ module: 'UserService' });
 * logger.info('User created'); // Automatically includes requestId, correlationId
 * ```
 */
export function createRequestContextLogger<
  T extends { child: (context: Record<string, unknown>) => T },
>(logger: T): (additionalContext?: Record<string, unknown>) => T {
  return (additionalContext = {}) => {
    const context = getRequestContext();

    if (!context) {
      // No request context available, return logger with just additional context
      return Object.keys(additionalContext).length > 0
        ? logger.child(additionalContext)
        : logger;
    }

    // Merge request context with additional context
    const logContext: Record<string, unknown> = {
      requestId: context.requestId,
      correlationId: context.correlationId,
      userId: context.userId,
      method: context.method,
      path: context.path,
      ...additionalContext,
    };

    // Remove undefined values
    Object.keys(logContext).forEach((key) => {
      if (logContext[key] === undefined) {
        delete logContext[key];
      }
    });

    return logger.child(logContext);
  };
}
