/**
 * @LogExecution Decorator for Automatic Boundary Logging
 *
 * Provides AOP-style logging for use case execution without cluttering
 * business logic with manual timing and logging code.
 *
 * Features:
 * - Automatic entry/exit logging
 * - Performance timing with duration
 * - Success/failure tracking
 * - Error logging with context
 * - Arguments sanitization (redacts sensitive data)
 *
 * Architecture:
 * - Applied to use case execute() methods
 * - Delegates to injected ILoggerService from the class
 * - Uses logger.withTiming() for automatic duration tracking
 * - Compatible with Clean Architecture (no framework coupling)
 *
 * Usage:
 * ```typescript
 * @injectable()
 * export class CreateUserUseCase {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService)
 *     private logger: ILoggerService
 *   ) {}
 *
 *   @LogExecution('users.create')
 *   async execute(dto: CreateUserDTO): Promise<User> {
 *     // Pure business logic - logging is automatic
 *     return this.userRepository.create(dto);
 *   }
 * }
 * ```
 *
 * Benefits:
 * - Eliminates repetitive timing code (10-15 lines per use case)
 * - Consistent logging format across all use cases
 * - Centralized logging behavior (easy to change)
 * - Business logic stays clean and focused
 * - Automatic request context injection via AsyncLocalStorage
 */

import type { ILoggerService } from "@/core/services";
import { logger as fallbackLogger } from "@/lib/logger";

const decoratorLogger = fallbackLogger.scope("LogExecutionDecorator");

/**
 * Sensitive field names that should be redacted in logs
 *
 * Add any field names that might contain sensitive data.
 */
const SENSITIVE_FIELDS = new Set([
  "password",
  "token",
  "apiKey",
  "secret",
  "accessToken",
  "refreshToken",
  "sessionToken",
  "apiSecret",
  "privateKey",
  "creditCard",
  "ssn",
  "cvv",
]);

/**
 * Safely stringify arguments for logging
 *
 * - Redacts sensitive fields
 * - Handles circular references
 * - Truncates large objects
 * - Returns placeholder for unstringifiable values
 *
 * @param args - Method arguments
 * @param maxLength - Maximum string length (default: 500)
 * @returns Sanitized string representation
 */
function safeStringifyArgs(args: unknown[], maxLength = 500): string {
  try {
    const sanitized = JSON.stringify(
      args,
      (key, value) => {
        // Redact sensitive fields
        if (SENSITIVE_FIELDS.has(key)) {
          return "[REDACTED]";
        }

        // Truncate long strings
        if (typeof value === "string" && value.length > maxLength) {
          return value.substring(0, maxLength) + "... [truncated]";
        }

        return value;
      },
      2, // Pretty print with 2-space indent
    );

    // Truncate entire output if too long
    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength) + "... [truncated]";
    }

    return sanitized;
  } catch {
    // Handle circular references or other serialization errors
    return "[Unable to stringify arguments]";
  }
}

/**
 * Log Execution Decorator
 *
 * Automatically logs use case execution with timing, arguments, and outcomes.
 * Applied to async methods (typically use case execute() methods).
 *
 * @param operationName - Human-readable operation name for logs (e.g., "users.create", "assets.assign")
 *                        If not provided, uses ClassName.methodName
 *
 * @example
 * ```typescript
 * // Explicit operation name (recommended)
 * @LogExecution('users.create')
 * async execute(dto: CreateUserDTO): Promise<User> { ... }
 *
 * // Auto-generated name from class and method
 * @LogExecution()
 * async execute(dto: CreateUserDTO): Promise<User> { ... }
 * // Logs as "CreateUserUseCase.execute"
 * ```
 */
export function LogExecution(operationName?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // Validate original method is async
    if (
      typeof originalMethod !== "function" ||
      originalMethod.constructor.name !== "AsyncFunction"
    ) {
      decoratorLogger.warn(
        "LogExecution",
        `@LogExecution: Method ${propertyKey} is not async. Decorator is designed for async methods.`,
      );
    }

    descriptor.value = async function (
      this: {
        logger?: ILoggerService;
        [key: string]: unknown;
      },
      ...args: unknown[]
    ) {
      // Get logger from the service instance
      const logger = this.logger as ILoggerService | undefined;

      if (!logger) {
        decoratorLogger.warn(
          "LogExecution",
          `@LogExecution: No logger found on ${(target as { constructor: { name: string } }).constructor.name}. ` +
            `Ensure the class has an injected ILoggerService via constructor.`,
        );
        // Execute without logging if no logger available
        return originalMethod.apply(this, args);
      }

      // Generate operation name (explicit or auto-generated)
      const operation =
        operationName ||
        `${(target as { constructor: { name: string } }).constructor.name}.${propertyKey}`;

      // Log entry with sanitized arguments
      logger.debug(`Starting ${operation}`, {
        operation,
        args: safeStringifyArgs(args),
      });

      // Execute with automatic timing
      return logger.withTiming(operation, async () => {
        try {
          const result = await originalMethod.apply(this, args);

          // Log success (debug level, included in withTiming)
          logger.debug(`Completed ${operation}`, {
            operation,
            result: "success",
          });

          return result;
        } catch (error) {
          // Log failure (error level, included in withTiming)
          logger.error(
            `Failed ${operation}`,
            error instanceof Error ? error : new Error(String(error)),
            {
              operation,
              result: "failure",
            },
          );

          // Re-throw error to preserve original behavior
          throw error;
        }
      });
    };

    return descriptor;
  };
}

/**
 * Example Usage Patterns
 *
 * 1. Basic usage:
 * ```typescript
 * @injectable()
 * export class CreateAssetUseCase {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
 *     @inject(DI_TOKENS.IAssetRepository) private assetRepository: IAssetRepository
 *   ) {}
 *
 *   @LogExecution('assets.create')
 *   async execute(dto: CreateAssetDTO): Promise<Asset> {
 *     return this.assetRepository.create(dto);
 *   }
 * }
 * ```
 *
 * 2. Multiple methods in same class:
 * ```typescript
 * @injectable()
 * export class AssetService {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
 *   ) {}
 *
 *   @LogExecution('assets.create')
 *   async create(dto: CreateAssetDTO): Promise<Asset> { ... }
 *
 *   @LogExecution('assets.update')
 *   async update(id: string, dto: UpdateAssetDTO): Promise<Asset> { ... }
 *
 *   @LogExecution('assets.delete')
 *   async delete(id: string): Promise<void> { ... }
 * }
 * ```
 *
 * 3. Hierarchical operation names:
 * ```typescript
 * @LogExecution('inventory.stock.move')
 * async moveStock(dto: MoveStockDTO): Promise<StockMovement> { ... }
 *
 * @LogExecution('inventory.stock.reserve')
 * async reserveStock(dto: ReserveStockDTO): Promise<Reservation> { ... }
 * ```
 *
 * This enables filtering logs by module (e.g., "inventory.*") or specific operations.
 */

/**
 * Logged Output Example
 *
 * With decorator applied, a single use case execution produces:
 *
 * ```json
 * // Entry (debug level)
 * {
 *   "level": "debug",
 *   "time": "2025-01-20T10:30:00.000Z",
 *   "msg": "Starting users.create",
 *   "operation": "users.create",
 *   "args": "{ email: 'user@example.com', role: 'viewer' }",
 *   "requestId": "req_1234567890_abc123",
 *   "userId": "admin-123",
 *   "path": "/api/users",
 *   "method": "POST"
 * }
 *
 * // Exit (debug level) - from logger.withTiming
 * {
 *   "level": "debug",
 *   "time": "2025-01-20T10:30:00.150Z",
 *   "msg": "Operation completed: users.create in 150ms",
 *   "operation": "users.create",
 *   "durationMs": 150,
 *   "result": "success",
 *   "requestId": "req_1234567890_abc123"
 * }
 *
 * // On error (error level)
 * {
 *   "level": "error",
 *   "time": "2025-01-20T10:30:00.150Z",
 *   "msg": "Failed users.create",
 *   "operation": "users.create",
 *   "result": "failure",
 *   "err": {
 *     "type": "ValidationError",
 *     "message": "Email already exists",
 *     "stack": "..."
 *   },
 *   "requestId": "req_1234567890_abc123"
 * }
 * ```
 *
 * Benefits over manual logging:
 * - Consistent format across all use cases
 * - Automatic timing without manual startTimer/endTimer calls
 * - Request context automatically included (requestId, userId, etc.)
 * - Error handling and re-throwing preserved
 * - Arguments sanitized automatically
 */
