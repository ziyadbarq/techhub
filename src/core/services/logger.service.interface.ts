/**
 * Logger Service Interface
 *
 * Defines the contract for structured logging throughout the application.
 * This interface belongs to the Core layer and is implementation-agnostic.
 *
 * Architecture:
 * - Interface in core/services (domain layer)
 * - Implementation in infrastructure/services (e.g., PinoLoggerService)
 * - Injected via dependency injection container
 *
 * Usage:
 * ```typescript
 * @injectable()
 * export class MyService {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService)
 *     private logger: ILoggerService
 *   ) {}
 *
 *   myMethod() {
 *     this.logger.info('Operation started', { userId: '123' });
 *     // ... business logic
 *     this.logger.info('Operation completed', { duration: 150 });
 *   }
 * }
 * ```
 */

/**
 * Log level enumeration
 * Controls the verbosity of logging output
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Performance timer handle
 *
 * Returned by startTimer() and used with endTimer() for performance tracking
 */
export interface PerformanceTimer {
  /**
   * Timer start timestamp (high-resolution)
   */
  startTime: number;

  /**
   * Timer operation name
   */
  operation: string;

  /**
   * Additional context
   */
  context?: Record<string, unknown>;
}

/**
 * Audit log entry
 *
 * Structured format for security and compliance audit logs
 */
export interface AuditLogEntry {
  /**
   * Action performed (e.g., "user.login", "data.access", "permission.granted")
   */
  action: string;

  /**
   * User who performed the action
   */
  userId?: string;

  /**
   * Resource affected (e.g., "users/123", "documents/456")
   */
  resource?: string;

  /**
   * Result of the action ("success" | "failure")
   */
  result: "success" | "failure";

  /**
   * Additional context
   */
  metadata?: Record<string, unknown>;
}

/**
 * Logger Service Interface
 *
 * Provides structured logging with context objects for better observability.
 * All methods accept an optional context parameter for additional metadata.
 *
 * Features:
 * - Structured logging with context
 * - Performance timing and monitoring
 * - Audit logging for security/compliance
 * - Child loggers with persistent context
 * - Request correlation and tracing
 */
export interface ILoggerService {
  /**
   * Log debug-level message
   *
   * Used for detailed diagnostic information during development.
   * Should be disabled in production to reduce noise.
   *
   * @param message - Human-readable log message
   * @param context - Optional structured context data
   *
   * @example
   * ```typescript
   * logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });
   * ```
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log info-level message
   *
   * Used for general informational messages about application flow.
   * Should be used for important state changes and milestones.
   *
   * @param message - Human-readable log message
   * @param context - Optional structured context data
   *
   * @example
   * ```typescript
   * logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
   * ```
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log warning-level message
   *
   * Used for potentially harmful situations that don't prevent operation.
   * Should be monitored for operational issues.
   *
   * @param message - Human-readable log message
   * @param context - Optional structured context data
   *
   * @example
   * ```typescript
   * logger.warn('API rate limit approaching', { remaining: 10, limit: 100 });
   * ```
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log error-level message
   *
   * Used for error conditions that prevent normal operation.
   * Should include error objects for stack traces and debugging.
   *
   * @param message - Human-readable log message
   * @param error - Optional Error object for stack trace
   * @param context - Optional structured context data
   *
   * @example
   * ```typescript
   * logger.error('Database connection failed', dbError, { host: 'localhost', port: 5432 });
   * ```
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void;

  /**
   * Create a child logger with persistent context
   *
   * Useful for adding module-specific or request-specific context
   * that should be included in all subsequent log entries.
   *
   * @param context - Persistent context to include in all logs
   * @returns New logger instance with bound context
   *
   * @example
   * ```typescript
   * const requestLogger = logger.child({ requestId: '123', userId: '456' });
   * requestLogger.info('Processing request'); // Includes requestId and userId
   * ```
   */
  child(context: Record<string, unknown>): ILoggerService;

  /**
   * Start a performance timer
   *
   * Returns a timer handle that can be passed to endTimer() to log
   * the duration of an operation. Useful for performance monitoring.
   *
   * @param operation - Name of the operation being timed
   * @param context - Optional context to include in the timing log
   * @returns Timer handle for endTimer()
   *
   * @example
   * ```typescript
   * const timer = logger.startTimer('database.query', { query: 'SELECT * FROM users' });
   * await db.query('SELECT * FROM users');
   * logger.endTimer(timer); // Logs duration
   * ```
   */
  startTimer(
    operation: string,
    context?: Record<string, unknown>,
  ): PerformanceTimer;

  /**
   * End a performance timer and log the duration
   *
   * Logs the duration since startTimer() was called. Automatically
   * detects slow operations based on configurable thresholds.
   *
   * @param timer - Timer handle from startTimer()
   * @param additionalContext - Optional additional context to include
   *
   * @example
   * ```typescript
   * const timer = logger.startTimer('api.call');
   * const result = await api.fetchData();
   * logger.endTimer(timer, { resultCount: result.length });
   * ```
   */
  endTimer(
    timer: PerformanceTimer,
    additionalContext?: Record<string, unknown>,
  ): void;

  /**
   * Log an audit event
   *
   * Records security and compliance audit events in a structured format.
   * Useful for tracking user actions, data access, and permission changes.
   *
   * @param entry - Audit log entry
   *
   * @example
   * ```typescript
   * logger.audit({
   *   action: 'user.login',
   *   userId: '123',
   *   result: 'success',
   *   metadata: { ip: '192.168.1.1', method: 'oauth' }
   * });
   * ```
   */
  audit(entry: AuditLogEntry): void;

  /**
   * Log with automatic performance tracking
   *
   * Wraps an async operation with automatic timing. The operation
   * duration is logged when the promise resolves or rejects.
   *
   * @param operation - Name of the operation
   * @param fn - Async function to track
   * @param context - Optional context to include
   * @returns Promise with the operation result
   *
   * @example
   * ```typescript
   * const users = await logger.withTiming(
   *   'database.query.users',
   *   () => db.users.findMany(),
   *   { filter: 'active' }
   * );
   * ```
   */
  withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T>;
}
