# Logging Guide

Comprehensive guide to structured logging in the Next.js boilerplate using Pino logger with advanced features for production-grade observability.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Logger Features](#logger-features)
- [Request Tracking](#request-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Database Query Logging](#database-query-logging)
- [Auth Debug Logging](#auth-debug-logging)
- [Background Job Logging](#background-job-logging)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging)
- [Best Practices](#best-practices)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses a production-ready logging system based on Pino with:

- **Structured logging** with JSON output
- **Request correlation** via AsyncLocalStorage
- **Performance timing** and slow operation detection
- **Automatic query logging** for database operations
- **Enhanced error serialization** for domain errors and Zod validation
- **Audit trails** for security and compliance
- **Environment-aware configuration** (dev vs production)

## Quick Start

### Basic Usage

```typescript
import { container } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";

// Get logger from DI container
const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

// Log at different levels
logger.debug("Cache hit", { key: "user:123", ttl: 3600 });
logger.info("User logged in", { userId: "123", ip: "192.168.1.1" });
logger.warn("API rate limit approaching", { remaining: 10, limit: 100 });
logger.error("Database connection failed", error, { host: "localhost" });
```

### Using in Services (Recommended)

```typescript
import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";

@injectable()
export class UserService {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,
  ) {}

  async createUser(data: CreateUserData) {
    this.logger.info("Creating user", { email: data.email });

    try {
      const user = await this.userRepository.create(data);
      this.logger.info("User created successfully", { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error("Failed to create user", error, { email: data.email });
      throw error;
    }
  }
}
```

## Core Concepts

### Structured Logging

All logs are structured as JSON objects in production, making them easy to parse, search, and analyze.

```typescript
// Good: Structured logging
logger.info("User action completed", {
  userId: "123",
  action: "purchase",
  amount: 99.99,
  currency: "USD",
});

// Bad: String concatenation
logger.info(`User 123 completed purchase of $99.99 USD`);
```

### Log Levels

The application uses four log levels:

- **`debug`**: Detailed diagnostic information (development only)
- **`info`**: General informational messages about application flow
- **`warn`**: Potentially harmful situations that don't prevent operation
- **`error`**: Error conditions that prevent normal operation

Set via `LOG_LEVEL` environment variable (default: `debug` in dev, `info` in production).

### Child Loggers

Create child loggers to automatically include context in all subsequent logs:

```typescript
// Create child logger with persistent context
const requestLogger = logger.child({
  requestId: "req_123",
  userId: "user_456",
  path: "/api/users",
});

// All logs from this logger include the context
requestLogger.info("Processing request");
// Output: { requestId: 'req_123', userId: 'user_456', path: '/api/users', msg: 'Processing request' }

requestLogger.info("Request completed", { status: 200 });
// Output: { requestId: 'req_123', userId: 'user_456', path: '/api/users', status: 200, msg: 'Request completed' }
```

## Logger Features

### 1. Performance Timing

Track operation duration with automatic slow query detection:

```typescript
// Manual timing
const timer = logger.startTimer("database.query", {
  query: "SELECT * FROM users",
});
const users = await db.users.findMany();
logger.endTimer(timer, { rowCount: users.length });
// Logs warning if operation exceeds threshold (1000ms for database.query)

// Automatic timing wrapper
const users = await logger.withTiming(
  "database.query.users",
  () => db.users.findMany(),
  { filter: "active" },
);
// Automatically logs duration and result status
```

**Slow Operation Thresholds**:

- Database queries: `1000ms`
- API calls: `3000ms`
- Default: `5000ms`

### 2. Enhanced Error Serialization

Errors are automatically enriched with context:

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    userId: "123",
    operation: "data-sync",
  });
}

// Logged error includes:
// - Error type (ValidationError, NotFoundError, ZodError, etc.)
// - Error message
// - Stack trace
// - Domain-specific context (entityId, statusCode, etc.)
// - Validation errors (for Zod)
// - Error cause chain (for nested errors)
```

**Supported Error Types**:

- `ValidationError` - Domain validation errors
- `NotFoundError` - Entity not found errors
- `ZodError` - Schema validation errors
- `Standard Error` - With cause chains

### 3. Audit Logging

Record security and compliance events:

```typescript
logger.audit({
  action: "user.login",
  userId: "123",
  result: "success",
  metadata: {
    ip: "192.168.1.1",
    method: "oauth",
    provider: "google",
  },
});

logger.audit({
  action: "data.access",
  userId: "123",
  resource: "users/456",
  result: "success",
  metadata: {
    fields: ["email", "name"],
    reason: "admin-panel",
  },
});
```

**Common Audit Actions**:

- `user.login` / `user.logout`
- `user.password-change`
- `permission.granted` / `permission.revoked`
- `data.access` / `data.export`
- `admin.action`

## Request Tracking

### Automatic Request Context

The application uses AsyncLocalStorage to automatically track request context across all layers.

**Setup** (via [src/proxy.ts](../../src/proxy.ts)):

```typescript
// Proxy automatically initializes context for every request
export function proxy(request: NextRequest) {
  const context: RequestContext = {
    requestId: generateRequestId(), // req_<uuid>
    correlationId: request.headers.get("x-correlation-id") || requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.url,
    ip: extractIpAddress(request),
    userAgent: request.headers.get("user-agent"),
  };

  return runWithContext(context, () => {
    // All code here has access to context
    return NextResponse.next();
  });
}
```

### Using Request Context in Services

```typescript
import {
  getRequestContext,
  createRequestContextLogger,
} from "@/infrastructure/middleware/request-context";

// Get current request context
const context = getRequestContext();
if (context) {
  console.log(context.requestId); // req_abc123
  console.log(context.userId); // user_456 (if set)
}

// Create logger with automatic request context
const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
const createLogger = createRequestContextLogger(logger);

const requestLogger = createLogger({ module: "UserService" });
requestLogger.info("Processing");
// Automatically includes: requestId, correlationId, userId, method, path
```

### Distributed Tracing

Pass correlation IDs across service boundaries:

```typescript
// Client sends request with correlation ID
const response = await fetch("/api/users", {
  headers: {
    "x-correlation-id": "trace_xyz789",
  },
});

// Server automatically uses it
// All logs will include: { correlationId: 'trace_xyz789', ... }
```

## Performance Monitoring

### Database Query Logging

Prisma v7 logging is handled centrally in [src/infrastructure/database/prisma/client.ts](../../src/infrastructure/database/prisma/client.ts) via `$on("query" | "warn" | "error")` listeners. This approach works with the new Rust-free engine and does not rely on deprecated middleware APIs.

**Features**:

- Query duration tracking (`durationMs`)
- Sanitized parameters (passwords/tokens automatically redacted before logging)
- Environment-aware verbosity:
  - Dev: query/warn/error listeners enabled by default
  - Prod: opt-in via `PRISMA_VERBOSE_LOGS=true`
- Slow query detection handled by Pino logger thresholds

**Configuration**:

```bash
# .env.local (default in dev)
PRISMA_VERBOSE_LOGS=true

# .env.production (recommended)
PRISMA_VERBOSE_LOGS=false
```

```typescript
const shouldLogVerbosePrisma =
  process.env.PRISMA_VERBOSE_LOGS === "true" ||
  process.env.NODE_ENV !== "production";

if (shouldLogVerbosePrisma) {
  prisma.$on("query", ({ query, duration, params }) => {
    console.info("[Prisma][query]", {
      query,
      durationMs: duration,
      params: sanitizeParams(params),
    });
  });
  prisma.$on("warn", ...);
  prisma.$on("error", ...);
}
```

**Example Logs**:

```json
{
  "query": "INSERT INTO \"users\" ...",
  "durationMs": 45,
  "params": "[\"[REDACTED]\",\"2025-11-20T12:53:13.729Z\"]",
  "target": "quaint::connector::metrics"
}

{
  "message": "Timed out fetching connection from the pool",
  "target": "query_engine::pool",
  "level": "error"
}
```

### Custom Performance Tracking

```typescript
// Track any async operation
const result = await logger.withTiming(
  "external-api.github",
  async () => {
    const response = await fetch("https://api.github.com/repos/owner/repo");
    return response.json();
  },
  { endpoint: "/repos/owner/repo" },
);
```

## Auth Debug Logging

Better Auth exposes additional instrumentation that is useful when diagnosing sign-up/sign-in failures (e.g., schema mismatches, provider callbacks). Debug logging is disabled by default to keep sensitive data out of logs.

**Enable**:

```bash
# .env.local
AUTH_DEBUG_LOGS=true
```

**What you get**:

- User/account/session lifecycle logs emitted from [src/lib/auth/better-auth.ts](../../src/lib/auth/better-auth.ts)
- Automatic masking of emails, tokens, and passwords before printing
- Request-level logs for `/api/auth/[...all]` handlers (status, preview of error responses)
- Additional Prisma query traces when combined with `PRISMA_VERBOSE_LOGS=true`

**When to turn on**:

- Email/password registration fails without clear UI error
- OAuth callbacks succeed but no session is created
- First-user admin assignment fails (watch for transaction warnings)

Remember to disable `AUTH_DEBUG_LOGS` (or set it to `false`) once the issue is resolved to avoid noisy logs.

## Background Job Logging

### Job Handler Pattern

```typescript
import { container } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services";
import type { Job } from "bullmq";

export async function handleMyJob(job: Job<MyJobData>) {
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting job", {
    jobId: job.id,
    jobName: job.name,
    data: job.data,
  });

  try {
    // Job logic here
    const result = await processJob(job.data);

    logger.info("Job completed successfully", {
      jobId: job.id,
      result: result.summary,
    });

    return result;
  } catch (error) {
    logger.error(
      "Job failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id },
    );
    throw error;
  }
}
```

### Scheduled Jobs

```typescript
import { setupScheduledJobs } from "@/infrastructure/services/queue/scheduled-jobs";

// Logs when jobs are scheduled
await setupScheduledJobs(jobQueueService);
// Output: "Daily cleanup job scheduled" { pattern: "0 2 * * *", timezone: "UTC" }
```

## Error Handling

### Error Context Extraction

The logger automatically extracts maximum context from errors:

```typescript
// Zod validation error
try {
  UserSchema.parse(invalidData);
} catch (error) {
  logger.error("Validation failed", error);
}
// Logged with:
// - type: "ZodValidationError"
// - validationErrors: [{ field: "email", message: "Invalid email", code: "invalid_string" }]
// - errorCount: 3

// Domain error
throw new NotFoundError("User not found", "User", "123");
logger.error("Operation failed", error);
// Logged with:
// - type: "NotFoundError"
// - statusCode: 404
// - context: { entityName: "User", entityId: "123" }

// Error with cause chain
try {
  // ...
} catch (originalError) {
  const wrappedError = new Error("Operation failed", { cause: originalError });
  logger.error("Wrapped error", wrappedError);
}
// Logged with:
// - message: "Operation failed"
// - cause: { type: "...", message: "...", stack: "..." }
```

### Operational vs Non-Operational Errors

```typescript
import {
  isOperationalError,
  formatErrorForUser,
} from "@/infrastructure/services/logger/error-serializer";

// Check if error is safe to show to user
if (isOperationalError(error)) {
  // ValidationError, NotFoundError, ZodError - show to user
  return { error: error.message };
} else {
  // Unexpected errors - log but don't expose
  logger.error("Unexpected error", error);
  return { error: "An unexpected error occurred" };
}
```

## Audit Logging

### Security Events

```typescript
// Authentication
logger.audit({
  action: "user.login",
  userId: user.id,
  result: "success",
  metadata: {
    ip: request.ip,
    method: "password",
    mfaUsed: true,
  },
});

// Authorization
logger.audit({
  action: "permission.granted",
  userId: admin.id,
  resource: `users/${user.id}`,
  result: "success",
  metadata: {
    permission: "admin",
    grantedBy: admin.id,
  },
});

// Data Access
logger.audit({
  action: "data.export",
  userId: user.id,
  resource: "financial-records",
  result: "success",
  metadata: {
    recordCount: 1500,
    format: "csv",
    dateRange: "2024-01-01 to 2024-12-31",
  },
});
```

### Compliance Logging

All audit logs are automatically tagged and can be filtered:

```bash
# Filter audit logs
grep '"audit":true' logs/app.log

# Filter by action
grep '"action":"user.login"' logs/app.log

# Filter by user
grep '"userId":"123"' logs/app.log
```

## Best Practices

### ✅ DO

1. **Use DI logger in services**:

   ```typescript
   @injectable()
   export class MyService {
     constructor(
       @inject(DI_TOKENS.ILoggerService)
       private logger: ILoggerService,
     ) {}
   }
   ```

2. **Include relevant context**:

   ```typescript
   logger.info("User created", {
     userId: user.id,
     email: user.email,
     role: user.role,
   });
   ```

3. **Use appropriate log levels**:
   - `debug`: Verbose diagnostic info
   - `info`: Important state changes
   - `warn`: Degraded performance, approaching limits
   - `error`: Failures that prevent operation

4. **Log errors with context**:

   ```typescript
   logger.error("Operation failed", error, {
     userId: user.id,
     operation: "purchase",
     amount: 99.99,
   });
   ```

5. **Use child loggers for scoped context**:
   ```typescript
   const userLogger = logger.child({ userId: user.id });
   userLogger.info("Processing payment");
   userLogger.info("Payment completed");
   ```

### ❌ DON'T

1. **Don't use console.log**:

   ```typescript
   // BAD
   console.log("User created:", user);

   // GOOD
   logger.info("User created", { userId: user.id });
   ```

2. **Don't log sensitive data**:

   ```typescript
   // BAD
   logger.info("User data", { password: user.password, ssn: user.ssn });

   // GOOD (redaction handles this automatically)
   logger.info("User data", { email: user.email, role: user.role });
   ```

3. **Don't use string concatenation**:

   ```typescript
   // BAD
   logger.info(`User ${user.id} created order ${order.id}`);

   // GOOD
   logger.info("Order created", { userId: user.id, orderId: order.id });
   ```

4. **Don't skip error objects**:

   ```typescript
   // BAD
   logger.error(error.message);

   // GOOD
   logger.error("Operation failed", error, { context: "additional info" });
   ```

5. **Don't log in loops without sampling**:

   ```typescript
   // BAD
   items.forEach((item) => logger.debug("Processing", { item }));

   // GOOD
   logger.info("Processing items", { count: items.length });
   // Or use sampling for critical debug scenarios
   ```

## Configuration

### Environment Variables

```bash
# .env.local
LOG_LEVEL=debug              # debug | info | warn | error
NODE_ENV=development         # development | production | test
PRISMA_VERBOSE_LOGS=true     # Sanitized Prisma query logging
AUTH_DEBUG_LOGS=false        # Verbose Better Auth logging (enable only for debugging)
```

### Log Level Hierarchy

- `debug`: Shows debug, info, warn, error
- `info`: Shows info, warn, error
- `warn`: Shows warn, error
- `error`: Shows error only

### Production Configuration

```bash
# .env.production
LOG_LEVEL=info               # Recommended for production
NODE_ENV=production
PRISMA_VERBOSE_LOGS=false
AUTH_DEBUG_LOGS=false
```

**Production Optimizations**:

- No pretty printing (raw JSON)
- No debug logs
- Minimal stack traces
- Slow query logging only

## Troubleshooting

### Logs Not Appearing

1. **Check log level**:

   ```bash
   echo $LOG_LEVEL
   # Should be "debug" in development
   ```

2. **Verify logger initialization**:

   ```typescript
   const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
   logger.info("Test log"); // Should appear in console
   ```

3. **Check if logger is properly injected**:
   ```typescript
   // Should have @inject decorator
   constructor(
     @inject(DI_TOKENS.ILoggerService)
     private logger: ILoggerService
   ) {}
   ```

### Request Context Not Available

1. **Ensure proxy is running** ([src/proxy.ts](../../src/proxy.ts))
2. **Check route matcher** - some routes may be excluded
3. **Verify AsyncLocalStorage** is supported (Node.js 16+)

### Slow Query Logs Overwhelming

Adjust thresholds in [src/infrastructure/services/logger/pino-logger.service.ts](../../src/infrastructure/services/logger/pino-logger.service.ts):

```typescript
const SLOW_OPERATION_THRESHOLDS = {
  "database.query": 2000, // Increase to 2 seconds
  "api.call": 5000, // Increase to 5 seconds
  default: 10000, // Increase to 10 seconds
};
```

### Sensitive Data in Logs

Data redaction is automatic for common fields. Add more in [src/infrastructure/services/logger/pino-logger.service.ts](../../src/infrastructure/services/logger/pino-logger.service.ts):

```typescript
redact: {
  paths: [
    "password",
    "apiKey",
    "secret",
    "token",
    "ssn",           // Add custom fields
    "creditCard",
    // ...
  ],
  remove: true,
}
```

## Advanced Topics

### Custom Slow Operation Thresholds

Override thresholds per operation:

```typescript
// In PinoLoggerService
const SLOW_OPERATION_THRESHOLDS = {
  "database.query": 1000,
  "database.query.reports": 5000, // Reports can be slower
  "api.call": 3000,
  "api.call.analytics": 10000, // Analytics API is slow
  default: 5000,
};
```

### Integration with External Services

#### Datadog

```typescript
// Add Datadog transport
import pinoDatadog from "pino-datadog";

const logger = pino({
  // ... other config
  transport:
    env.NODE_ENV === "production"
      ? {
          target: "pino-datadog",
          options: {
            apiKey: env.DATADOG_API_KEY,
            service: "barq-app",
            ddsource: "nodejs",
          },
        }
      : undefined,
});
```

#### Sentry

```typescript
// Add Sentry for error tracking
logger.error("Critical error", error, { sentryLevel: "error" });
```

## Next Steps

- Review [Error Handler](../../src/interface-adapters/controllers/error-handler.ts) for controller error patterns
- Check [Prisma Middleware](../../src/infrastructure/database/prisma/logging-middleware.ts) for query logging details
- See [Request Context](../../src/infrastructure/middleware/request-context.ts) for distributed tracing setup
- Read [Architecture Guide](../architecture/ARCHITECTURE.md) for overall system design

## Related Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Background Jobs](./BACKGROUND_JOBS.md)
- [Real-time Features](./REALTIME.md)
- [Architecture Guide](../architecture/ARCHITECTURE.md)
