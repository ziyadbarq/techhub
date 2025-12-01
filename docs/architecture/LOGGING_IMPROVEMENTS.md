# Logging Improvements Implementation Guide

This document provides detailed implementation guidance for the logging improvements outlined in the Architecture Hardening Plan.

## Overview

The logging improvements address three critical gaps:
1. **DRY violations** - Child logger duplicates 90% of parent code
2. **Missing request tracking** - No correlation IDs for production debugging
3. **Manual boundary logging** - Repetitive timing code in every use case

## Priority Order

### High Priority (Must Fix)
1. Fix child logger duplication (maintenance + performance)
2. Add request tracking with AsyncLocalStorage (operational requirement)

### Medium Priority (Architectural Improvement)
3. Automated boundary logging with decorators
4. Extract timing utilities to shared modules

### Optional (Nice to Have)
5. Structured log helpers for common patterns
6. Enhanced metrics and aggregation

---

## 1. Fix Child Logger Duplication (HIGH PRIORITY)

### Current Problem

```typescript
// src/infrastructure/services/logger/pino-logger.service.ts
class PinoLoggerService implements ILoggerService {
  // ~200 lines of implementation
  debug() { /* ... */ }
  info() { /* ... */ }
  endTimer() { /* complex logic */ }
  getSlowOperationThreshold() { /* shared logic */ }
}

// DUPLICATE: 90% of the same code
class PinoLoggerChildService implements ILoggerService {
  // ~150 lines duplicating parent
  debug() { /* duplicate */ }
  info() { /* duplicate */ }
  endTimer() { /* duplicate */ }
  getSlowOperationThreshold() { /* duplicate */ }
}
```

**Impact**: Maintenance burden (changes must be made twice), violates DRY principle.

### Solution: Composition Pattern

**Step 1: Extract timing utilities**

```typescript
// src/infrastructure/services/logger/timing-utils.ts
export const SLOW_OPERATION_THRESHOLDS = {
  "database.query": 1000,
  "database.query.reports": 5000,
  "api.call": 3000,
  "api.call.analytics": 10000,
  default: 5000,
} as const;

export function getSlowOperationThreshold(operation: string): number {
  // Check exact match
  if (operation in SLOW_OPERATION_THRESHOLDS) {
    return SLOW_OPERATION_THRESHOLDS[
      operation as keyof typeof SLOW_OPERATION_THRESHOLDS
    ];
  }

  // Check prefix match (e.g., "database.query.users" matches "database.query")
  for (const [key, value] of Object.entries(SLOW_OPERATION_THRESHOLDS)) {
    if (key !== "default" && operation.startsWith(key)) {
      return value;
    }
  }

  return SLOW_OPERATION_THRESHOLDS.default;
}

export interface TimingContext {
  operation: string;
  durationMs: number;
  threshold: number;
  isSlow: boolean;
}

export function calculateTiming(
  startTime: number,
  operation: string
): TimingContext {
  const duration = performance.now() - startTime;
  const durationMs = Math.round(duration);
  const threshold = getSlowOperationThreshold(operation);
  const isSlow = durationMs > threshold;

  return { operation, durationMs, threshold, isSlow };
}
```

**Step 2: Refactor parent to use utilities**

```typescript
// src/infrastructure/services/logger/pino-logger.service.ts
import { calculateTiming } from './timing-utils';

@injectable()
export class PinoLoggerService implements ILoggerService {
  private readonly logger: Logger;

  // ... constructor and basic methods unchanged

  endTimer(
    timer: PerformanceTimer,
    additionalContext?: Record<string, unknown>
  ): void {
    const timing = calculateTiming(timer.startTime, timer.operation);

    const context: Record<string, unknown> = {
      operation: timing.operation,
      durationMs: timing.durationMs,
      ...timer.context,
      ...additionalContext,
    };

    if (timing.isSlow) {
      this.logger.warn(
        context,
        `Slow operation detected: ${timing.operation} took ${timing.durationMs}ms`
      );
    } else {
      this.logger.debug(
        context,
        `Operation completed: ${timing.operation} in ${timing.durationMs}ms`
      );
    }
  }

  // Expose for child loggers to use
  public getInternalLogger(): Logger {
    return this.logger;
  }
}
```

**Step 3: Refactor child to use composition**

```typescript
// src/infrastructure/services/logger/pino-logger.service.ts (same file)
import type { Logger } from 'pino';
import { calculateTiming, serializeError } from './timing-utils';

/**
 * Child Logger Service - Uses composition to avoid duplication
 *
 * Delegates complex operations to shared utilities instead of duplicating logic.
 */
class PinoLoggerChildService implements ILoggerService {
  constructor(
    private readonly logger: Logger,
    private readonly parentService: PinoLoggerService
  ) {}

  // Simple methods stay inline (no duplication of complex logic)
  debug(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.info(context, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (context) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const logContext: Record<string, unknown> = { ...context };
    if (error) {
      logContext.err = error;
    }
    if (Object.keys(logContext).length > 0) {
      this.logger.error(logContext, message);
    } else {
      this.logger.error(message);
    }
  }

  child(context: Record<string, unknown>): ILoggerService {
    const childLogger = this.logger.child(context);
    return new PinoLoggerChildService(childLogger, this.parentService);
  }

  startTimer(operation: string, context?: Record<string, unknown>): PerformanceTimer {
    return {
      startTime: performance.now(),
      operation,
      context,
    };
  }

  // Complex methods delegate to shared utilities (no duplication)
  endTimer(timer: PerformanceTimer, additionalContext?: Record<string, unknown>): void {
    const timing = calculateTiming(timer.startTime, timer.operation);

    const context: Record<string, unknown> = {
      operation: timing.operation,
      durationMs: timing.durationMs,
      ...timer.context,
      ...additionalContext,
    };

    if (timing.isSlow) {
      this.logger.warn(
        context,
        `Slow operation detected: ${timing.operation} took ${timing.durationMs}ms`
      );
    } else {
      this.logger.debug(
        context,
        `Operation completed: ${timing.operation} in ${timing.durationMs}ms`
      );
    }
  }

  audit(entry: AuditLogEntry): void {
    this.logger.info(
      {
        audit: true,
        action: entry.action,
        userId: entry.userId,
        resource: entry.resource,
        result: entry.result,
        ...entry.metadata,
      },
      `Audit: ${entry.action} - ${entry.result}`
    );
  }

  async withTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const timer = this.startTimer(operation, context);

    try {
      const result = await fn();
      this.endTimer(timer, { result: "success" });
      return result;
    } catch (error) {
      this.endTimer(timer, { result: "failure", error: serializeError(error) });
      throw error;
    }
  }
}
```

**Step 4: Update parent's child() method**

```typescript
// In PinoLoggerService class
child(context: Record<string, unknown>): ILoggerService {
  const childLogger = this.logger.child(context);
  return new PinoLoggerChildService(childLogger, this); // Pass 'this' as parent
}
```

**Benefits**:
- Eliminates 150 lines of duplicated code
- Single source of truth for timing thresholds
- Easier to maintain and test
- Shared utilities can be used elsewhere

---

## 2. Request Tracking with AsyncLocalStorage (HIGH PRIORITY)

### Current Problem

Without request tracking:
```
[12:45:10] User login started { userId: '123' }
[12:45:11] Permission check failed { permission: 'admin' }
[12:45:12] Database query slow { durationMs: 1500 }
[12:45:13] API error { error: 'Unauthorized' }
```

**Question**: Are these logs from the same request? Different users? Impossible to tell.

### Solution: AsyncLocalStorage Request Context

**Step 1: Create request context utilities**

```typescript
// src/lib/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  /** Unique request ID (from x-request-id header or generated) */
  requestId: string;

  /** User ID if authenticated */
  userId?: string;

  /** Request path */
  path: string;

  /** HTTP method */
  method: string;

  /** Request start timestamp */
  startTime: number;

  /** Correlation ID for distributed tracing (optional) */
  correlationId?: string;
}

/**
 * AsyncLocalStorage for request context
 *
 * Provides automatic context propagation across async boundaries
 * without explicit parameter passing.
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get current request context
 *
 * Returns undefined if called outside of request context.
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  // Use crypto.randomUUID() or nanoid
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Run a function within request context
 *
 * Use this to wrap API route handlers, server actions, etc.
 */
export async function withRequestContext<T>(
  context: Partial<RequestContext>,
  fn: () => Promise<T>
): Promise<T> {
  const fullContext: RequestContext = {
    requestId: context.requestId || generateRequestId(),
    path: context.path || 'unknown',
    method: context.method || 'unknown',
    startTime: Date.now(),
    ...context,
  };

  return requestContextStorage.run(fullContext, fn);
}
```

**Step 2: Integrate into proxy.ts**

```typescript
// proxy.ts
import { withRequestContext, generateRequestId } from '@/lib/request-context';

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Extract or generate request ID
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const correlationId = request.headers.get('x-correlation-id') || requestId;

  // TODO: Extract userId from session (if authenticated)
  // const session = await getSession();
  // const userId = session?.user?.id;

  return withRequestContext(
    {
      requestId,
      correlationId,
      path: url.pathname,
      method: request.method,
      // userId, // Add when session is available
    },
    async () => {
      // Your existing proxy logic here
      return handleProxyRequest(request);
    }
  );
}
```

**Step 3: Update PinoLoggerService to inject context automatically**

```typescript
// src/infrastructure/services/logger/pino-logger.service.ts
import { getRequestContext } from '@/lib/request-context';

@injectable()
export class PinoLoggerService implements ILoggerService {
  // ... existing code

  /**
   * Merge request context into log context
   */
  private enrichContext(context?: Record<string, unknown>): Record<string, unknown> {
    const requestContext = getRequestContext();

    if (!requestContext) {
      return context || {};
    }

    // Merge request context with provided context
    return {
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      userId: requestContext.userId,
      path: requestContext.path,
      method: requestContext.method,
      ...context, // User context can override defaults
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.debug(enriched, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.info(enriched, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.warn(enriched, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const enriched = this.enrichContext(context);
    if (error) {
      enriched.err = error;
    }
    if (Object.keys(enriched).length > 0) {
      this.logger.error(enriched, message);
    } else {
      this.logger.error(message);
    }
  }

  // ... rest of methods
}
```

**Step 4: Apply to child logger as well**

```typescript
class PinoLoggerChildService implements ILoggerService {
  // ... existing code

  private enrichContext(context?: Record<string, unknown>): Record<string, unknown> {
    const requestContext = getRequestContext();
    if (!requestContext) {
      return context || {};
    }
    return {
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      userId: requestContext.userId,
      path: requestContext.path,
      method: requestContext.method,
      ...context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const enriched = this.enrichContext(context);
    if (Object.keys(enriched).length > 0) {
      this.logger.debug(enriched, message);
    } else {
      this.logger.debug(message);
    }
  }

  // Apply to info(), warn(), error() as well
  // ... (same pattern)
}
```

### After Implementation

With request tracking:
```json
{ "requestId": "req_1234", "time": "12:45:10", "msg": "User login started", "userId": "123", "path": "/api/auth/login" }
{ "requestId": "req_1234", "time": "12:45:11", "msg": "Permission check failed", "permission": "admin" }
{ "requestId": "req_1234", "time": "12:45:12", "msg": "Database query slow", "durationMs": 1500 }
{ "requestId": "req_1234", "time": "12:45:13", "msg": "API error", "error": "Unauthorized" }
```

**Benefits**:
- All logs from the same request have the same `requestId`
- Grep/filter production logs by request ID
- Trace request flow across layers
- Support for distributed tracing with correlation IDs

---

## 3. Automated Boundary Logging (MEDIUM PRIORITY)

### Current Problem

Manual timing in every use case:

```typescript
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
  ) {}

  async execute(dto: CreateUserDTO) {
    // Manual timing boilerplate (repeated in every use case)
    const timer = this.logger.startTimer('users.create');
    this.logger.info('Creating user', { email: dto.email });

    try {
      const user = await this.userRepository.create(dto);
      this.logger.info('User created', { userId: user.id });
      this.logger.endTimer(timer);
      return user;
    } catch (error) {
      this.logger.error('User creation failed', error);
      this.logger.endTimer(timer);
      throw error;
    }
  }
}
```

**Problem**: Repetitive, error-prone (easy to forget), clutters business logic.

### Solution: @LogExecution Decorator

**Step 1: Create decorator**

```typescript
// src/lib/decorators/log-execution.decorator.ts
import type { ILoggerService } from '@/core/services';

/**
 * Decorator for automatic use case logging
 *
 * Automatically logs:
 * - Use case entry
 * - Use case exit with duration
 * - Success/failure outcome
 * - Error details on failure
 *
 * @param operationName - Operation name for logs (defaults to ClassName.methodName)
 *
 * @example
 * ```typescript
 * @injectable()
 * export class CreateUserUseCase {
 *   @LogExecution('users.create')
 *   async execute(dto: CreateUserDTO) {
 *     // Business logic only - logging is automatic
 *   }
 * }
 * ```
 */
export function LogExecution(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get logger from the service instance
      const logger: ILoggerService | undefined = (this as any).logger;

      if (!logger) {
        console.warn(
          `@LogExecution: No logger found on ${target.constructor.name}. ` +
          `Ensure the class has an injected logger property.`
        );
        return originalMethod.apply(this, args);
      }

      // Generate operation name
      const operation = operationName || `${target.constructor.name}.${propertyKey}`;

      // Log entry
      logger.debug(`Starting ${operation}`, {
        operation,
        args: safeStringify(args),
      });

      // Start timing
      const timer = logger.startTimer(operation);

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log success
        logger.endTimer(timer, { result: 'success' });
        logger.debug(`Completed ${operation}`, { operation });

        return result;
      } catch (error) {
        // Log failure
        logger.endTimer(timer, { result: 'failure' });
        logger.error(
          `Failed ${operation}`,
          error instanceof Error ? error : new Error(String(error)),
          { operation }
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Safely stringify arguments (avoid circular references and sensitive data)
 */
function safeStringify(args: any[]): string {
  try {
    return JSON.stringify(args, (key, value) => {
      // Redact sensitive fields
      if (['password', 'token', 'apiKey', 'secret'].includes(key)) {
        return '[REDACTED]';
      }
      return value;
    });
  } catch {
    return '[Unable to stringify]';
  }
}
```

**Step 2: Apply to use cases**

```typescript
// Before: Manual logging
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
  ) {}

  async execute(dto: CreateUserDTO) {
    const timer = this.logger.startTimer('users.create');
    this.logger.info('Creating user', { email: dto.email });
    // ... business logic
    this.logger.endTimer(timer);
  }
}

// After: Automatic logging
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
  ) {}

  @LogExecution('users.create')
  async execute(dto: CreateUserDTO) {
    // Pure business logic - logging is automatic
    const user = await this.userRepository.create(dto);
    return user;
  }
}
```

**Step 3: Apply to multiple methods**

```typescript
@injectable()
export class StockMovementService {
  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
  ) {}

  @LogExecution('stock.move')
  async moveStock(dto: MoveStockDTO) {
    // Business logic
  }

  @LogExecution('stock.reserve')
  async reserveStock(dto: ReserveStockDTO) {
    // Business logic
  }

  @LogExecution('stock.release')
  async releaseStock(id: string) {
    // Business logic
  }
}
```

**Benefits**:
- Eliminates repetitive timing code
- Consistent logging across all use cases
- Centralized logging behavior (easier to change)
- Business logic stays clean and focused

---

## 4. Structured Log Helpers (OPTIONAL)

### Pattern: Domain-Specific Helpers

Instead of:
```typescript
logger.info('User logged in', { userId, ip, method, timestamp, ... });
```

Use helpers:
```typescript
logger.logUserAction('login', userId, { ip, method });
```

**Implementation**:

```typescript
// src/infrastructure/services/logger/log-helpers.ts
import type { ILoggerService } from '@/core/services';

/**
 * Add domain-specific log helpers to logger service
 */
export class LogHelpers {
  constructor(private logger: ILoggerService) {}

  /**
   * Log user action (login, logout, password change, etc.)
   */
  logUserAction(
    action: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): void {
    this.logger.info(`User action: ${action}`, {
      category: 'user-action',
      action,
      userId,
      ...metadata,
    });
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    rowCount?: number
  ): void {
    this.logger.debug(`Database ${operation}`, {
      category: 'database',
      operation,
      table,
      durationMs: duration,
      rowCount,
    });
  }

  /**
   * Log permission check
   */
  logPermissionCheck(
    permission: string,
    userId: string,
    result: 'granted' | 'denied',
    resource?: string
  ): void {
    if (result === 'denied') {
      this.logger.warn('Permission denied', {
        category: 'permission',
        permission,
        userId,
        result,
        resource,
      });
    } else {
      this.logger.debug('Permission granted', {
        category: 'permission',
        permission,
        userId,
        result,
        resource,
      });
    }
  }

  /**
   * Log feature flag check
   */
  logFeatureFlagCheck(
    flag: string,
    userId: string | undefined,
    enabled: boolean
  ): void {
    this.logger.debug('Feature flag checked', {
      category: 'feature-flag',
      flag,
      userId,
      enabled,
    });
  }
}

// Export factory function
export function createLogHelpers(logger: ILoggerService): LogHelpers {
  return new LogHelpers(logger);
}
```

**Usage**:

```typescript
@injectable()
export class CheckPermissionUseCase {
  private logHelpers: LogHelpers;

  constructor(
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService
  ) {
    this.logHelpers = createLogHelpers(logger);
  }

  async execute(userId: string, permission: string) {
    const hasPermission = await this.checkPermission(userId, permission);

    // Structured logging with helpers
    this.logHelpers.logPermissionCheck(
      permission,
      userId,
      hasPermission ? 'granted' : 'denied'
    );

    return hasPermission;
  }
}
```

---

## Testing Considerations

### Test Request Context Propagation

```typescript
// tests/lib/request-context.test.ts
import { describe, it, expect } from 'vitest';
import { withRequestContext, getRequestContext } from '@/lib/request-context';

describe('Request Context', () => {
  it('propagates context across async boundaries', async () => {
    const result = await withRequestContext(
      { requestId: 'test-123', path: '/test', method: 'GET' },
      async () => {
        const context = getRequestContext();
        expect(context?.requestId).toBe('test-123');

        // Test nested async
        await Promise.resolve();
        const contextAfterAsync = getRequestContext();
        expect(contextAfterAsync?.requestId).toBe('test-123');

        return 'success';
      }
    );

    expect(result).toBe('success');

    // Context should be cleared outside
    expect(getRequestContext()).toBeUndefined();
  });

  it('isolates contexts between concurrent requests', async () => {
    const [result1, result2] = await Promise.all([
      withRequestContext({ requestId: 'req-1', path: '/1', method: 'GET' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getRequestContext()?.requestId;
      }),
      withRequestContext({ requestId: 'req-2', path: '/2', method: 'GET' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getRequestContext()?.requestId;
      }),
    ]);

    expect(result1).toBe('req-1');
    expect(result2).toBe('req-2');
  });
});
```

### Test Logger Context Injection

```typescript
// tests/infrastructure/services/logger.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PinoLoggerService } from '@/infrastructure/services/logger/pino-logger.service';
import { withRequestContext } from '@/lib/request-context';

describe('Logger with Request Context', () => {
  it('automatically includes request context in logs', async () => {
    const logSpy = vi.fn();
    const logger = new PinoLoggerService();
    // Spy on internal logger
    vi.spyOn((logger as any).logger, 'info').mockImplementation(logSpy);

    await withRequestContext(
      { requestId: 'test-123', userId: 'user-456', path: '/test', method: 'GET' },
      async () => {
        logger.info('Test message', { customField: 'value' });
      }
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-123',
        userId: 'user-456',
        path: '/test',
        method: 'GET',
        customField: 'value',
      }),
      'Test message'
    );
  });
});
```

---

## Migration Strategy

### Phase 1: High Priority (Week 1-2)
1. **Day 1-2**: Extract timing utilities to `timing-utils.ts`
2. **Day 3-4**: Refactor `PinoLoggerChildService` to use composition
3. **Day 5-7**: Implement request context with AsyncLocalStorage
4. **Day 8-10**: Integrate request context into logger service

### Phase 2: Medium Priority (Week 3-4)
5. **Day 11-13**: Create `@LogExecution` decorator
6. **Day 14-21**: Apply decorator to all use cases (incremental)

### Phase 3: Optional (Week 5+)
7. **Day 22-28**: Add structured log helpers (as needed)

---

## Related Documentation

- [LOGGING.md](../guides/LOGGING.md) - Current logging guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall architecture
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Development workflows
