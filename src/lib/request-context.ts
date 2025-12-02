/**
 * Request Context with AsyncLocalStorage
 *
 * Provides automatic request context propagation across async boundaries
 * without explicit parameter passing. Critical for production debugging
 * and distributed tracing.
 *
 * Architecture:
 * - Uses Node.js AsyncLocalStorage for context isolation
 * - Integrates with proxy.ts for automatic request ID generation
 * - Logger service automatically includes context in all logs
 * - Context persists across async operations (database calls, API calls, etc.)
 *
 * Benefits:
 * - Correlate all logs within a single request
 * - Trace requests across service boundaries
 * - Debug production issues faster
 * - Support for distributed tracing
 *
 * Usage:
 * ```typescript
 * // In API route handler
 * return withRequestContext(
 *   { requestId: generateRequestId(), path: '/api/users', method: 'GET' },
 *   async () => {
 *     // All operations within this scope have access to context
 *     const users = await userService.getUsers();
 *     return NextResponse.json(users);
 *   }
 * );
 *
 * // Anywhere in the call stack
 * const context = getRequestContext();
 * // context.requestId, context.userId, context.path available
 * ```
 */

import { AsyncLocalStorage } from "async_hooks";
import { customAlphabet } from "nanoid";

/**
 * Request context interface
 *
 * Contains request-level metadata that should be available throughout
 * the request lifecycle for logging, tracing, and debugging.
 */
export interface RequestContext {
  /**
   * Unique request ID (from x-request-id header or generated)
   *
   * Used to correlate all logs and operations within a single request.
   * Format: req_<timestamp>_<random>
   */
  requestId: string;

  /**
   * User ID if authenticated
   *
   * Available after authentication middleware runs.
   */
  userId?: string;

  /**
   * Request path (e.g., /api/users, /assets/123)
   */
  path: string;

  /**
   * HTTP method (GET, POST, PUT, DELETE, etc.)
   */
  method: string;

  /**
   * Request start timestamp (milliseconds)
   *
   * Used to calculate total request duration.
   */
  startTime: number;

  /**
   * Correlation ID for distributed tracing (optional)
   *
   * Links requests across multiple services.
   * Can be the same as requestId or a separate trace ID.
   */
  correlationId?: string;

  /**
   * Additional metadata (extensible)
   */
  [key: string]: unknown;
}

/**
 * AsyncLocalStorage for request context
 *
 * Provides automatic context propagation across async boundaries.
 * Each request gets its own isolated context that persists through
 * all async operations (Promise chains, setTimeout, setImmediate, etc.).
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get current request context
 *
 * Returns the request context for the current async execution context.
 * Safe to call from anywhere in the call stack.
 *
 * @returns Request context or undefined if called outside request context
 *
 * @example
 * ```typescript
 * const context = getRequestContext();
 * if (context) {
 *   console.log(`Request ${context.requestId} from user ${context.userId}`);
 * }
 * ```
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Generate a unique request ID
 *
 * Format: req_<timestamp>_<random>
 * - req_ prefix for easy identification
 * - timestamp for temporal ordering
 * - random alphanumeric string for uniqueness
 *
 * Uses nanoid for cryptographically strong random IDs.
 *
 * @returns Unique request ID
 *
 * @example
 * ```typescript
 * const requestId = generateRequestId();
 * // "req_1701234567890_x3k9j2m"
 * ```
 */
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export function generateRequestId(): string {
  return `req_${Date.now()}_${nanoid()}`;
}

/**
 * Run a function within request context
 *
 * Creates a new request context and executes the provided function
 * within that context. All async operations within the function
 * will have access to the context via getRequestContext().
 *
 * @param context - Partial request context (requestId auto-generated if missing)
 * @param fn - Async function to execute within context
 * @returns Promise with function result
 *
 * @example
 * ```typescript
 * // In API route handler
 * export async function GET(request: Request) {
 *   const url = new URL(request.url);
 *   const requestId = request.headers.get('x-request-id') || generateRequestId();
 *
 *   return withRequestContext(
 *     {
 *       requestId,
 *       path: url.pathname,
 *       method: request.method,
 *       // userId added later by auth middleware
 *     },
 *     async () => {
 *       const data = await fetchData();
 *       return NextResponse.json(data);
 *     }
 *   );
 * }
 * ```
 */
export async function withRequestContext<T>(
  context: Partial<RequestContext>,
  fn: () => Promise<T>,
): Promise<T> {
  const fullContext: RequestContext = {
    requestId: context.requestId || generateRequestId(),
    path: context.path || "unknown",
    method: context.method || "unknown",
    startTime: Date.now(),
    ...context,
  };

  return requestContextStorage.run(fullContext, fn);
}

/**
 * Update current request context
 *
 * Useful for adding information that becomes available during request processing
 * (e.g., userId after authentication, operation result, etc.).
 *
 * WARNING: This mutates the current context. Use sparingly and only for
 * adding missing information (like userId after auth).
 *
 * @param updates - Partial context to merge into current context
 *
 * @example
 * ```typescript
 * // After authentication
 * const session = await getSession();
 * if (session?.user?.id) {
 *   updateRequestContext({ userId: session.user.id });
 * }
 * ```
 */
export function updateRequestContext(updates: Partial<RequestContext>): void {
  const currentContext = requestContextStorage.getStore();
  if (currentContext) {
    Object.assign(currentContext, updates);
  }
}

/**
 * Get request duration in milliseconds
 *
 * Calculates how long the current request has been running.
 *
 * @returns Duration in milliseconds or undefined if no context
 *
 * @example
 * ```typescript
 * const duration = getRequestDuration();
 * if (duration && duration > 5000) {
 *   logger.warn('Slow request detected', { durationMs: duration });
 * }
 * ```
 */
export function getRequestDuration(): number | undefined {
  const context = requestContextStorage.getStore();
  if (!context) {
    return undefined;
  }
  return Date.now() - context.startTime;
}

/**
 * Extract request context as plain object for logging
 *
 * Returns a sanitized copy of the request context suitable for logging.
 * Excludes internal fields and formats timestamps.
 *
 * @returns Plain object with request context or undefined
 *
 * @example
 * ```typescript
 * logger.info('Request processed', extractRequestContext());
 * // Logs: { requestId: '...', userId: '...', path: '...', method: '...', durationMs: 123 }
 * ```
 */
export function extractRequestContext(): Record<string, unknown> | undefined {
  const context = requestContextStorage.getStore();
  if (!context) {
    return undefined;
  }

  const { startTime, ...rest } = context;
  return {
    ...rest,
    durationMs: Date.now() - startTime,
  };
}
