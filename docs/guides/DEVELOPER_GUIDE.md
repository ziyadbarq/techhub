# Developer Guide

**Barq Assets** - A comprehensive guide to building production-ready applications with Clean Architecture.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start](#3-quick-start)
4. [Project Structure](#4-project-structure)
5. [Architecture Overview](#5-architecture-overview)
6. [Domain Layer](#6-domain-layer)
7. [Use Cases Layer](#7-use-cases-layer)
8. [Interface Adapters Layer](#8-interface-adapters-layer)
9. [Infrastructure Layer](#9-infrastructure-layer)
10. [Presentation Layer](#10-presentation-layer)
11. [Routes Manifest System](#11-routes-manifest-system)
12. [Dependency Injection](#12-dependency-injection)
13. [Database & Prisma](#13-database--prisma)
14. [AI Integration](#14-ai-integration)
15. [Theme System](#15-theme-system)
16. [Error Handling](#16-error-handling)
17. [Logging](#17-logging)
18. [Testing Strategy](#18-testing-strategy)
19. [Deployment](#19-deployment)
20. [Troubleshooting](#20-troubleshooting)
21. [Best Practices](#21-best-practices)
22. [Code Examples](#22-code-examples)
23. [FAQ](#23-faq)

---

## 1. Introduction

### What is Barq Assets?

A production-ready Next.js 16 starter kit implementing Clean Architecture with dependency injection. Built to accelerate development while maintaining code quality, testability, and scalability.

### Key Features

- ✅ **Clean Architecture** - 5-layer separation of concerns
- ✅ **Dependency Injection** - InversifyJS with TypeScript decorators
- ✅ **AI Integration** - OpenAI with structured outputs & prompt management
- ✅ **Modern UI** - 35+ shadcn/ui components, OKLCH colors, dark mode
- ✅ **Type Safety** - Strict TypeScript, Zod validation, Prisma ORM
- ✅ **Developer Experience** - Hot reload, ESLint, Prettier, Husky hooks
- ✅ **Complete Example** - Full Task CRUD demonstrating all layers

### Philosophy

This assets app follows the **Dependency Inversion Principle** - high-level business logic never depends on low-level implementation details. This makes code:

- **Testable** - Mock dependencies easily
- **Maintainable** - Change implementations without touching business logic
- **Scalable** - Add features without refactoring existing code

---

## 2. Prerequisites

### Required Tools

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **PostgreSQL** 14+ (installed via Homebrew on macOS)
- **Redis** (installed via Homebrew on macOS)
- **Git** 2.30+

### Platform & Environment

**IMPORTANT**: This application runs on **macOS only** with native services installed via Homebrew:

```bash
# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Redis
brew install redis
brew services start redis
```

**Docker is NOT used** in this project. All services (PostgreSQL, Redis) run natively on macOS.

### Recommended Tools

- **VS Code** with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing
- **Prisma Studio** for database management

### Knowledge Requirements

- **TypeScript** - Intermediate level
- **React** - Familiarity with hooks and server components
- **Next.js** - Understanding of App Router
- **Prisma** - Basic ORM concepts
- **Clean Architecture** - Recommended but not required

---

## 2.5. Everyday Workflow

Before coding, follow these core practices to maintain consistency and quality:

### 1. Understand the Slice

Trace the complete path: **Presentation → Controllers → Use Cases → Repositories**. Most refactors touch all layers - don't short-circuit the architecture.

### 2. Reuse the DI Container

Resolve dependencies via `getContainer()`/`resolve()` and bindings in `src/di/modules/*`. **Never** instantiate repositories or services with `new` directly.

```typescript
// ✅ Correct - Use DI container
const container = getContainer();
const repository = container.get<ITaskRepository>(DI_TOKENS.TaskRepository);

// ❌ Wrong - Direct instantiation
const repository = new PrismaTaskRepository(prisma, logger);
```

### 3. Access Sessions via getSession()

Server routes/layouts must call `src/lib/auth/session.ts`. **Do not** import Better Auth "server" helpers directly; the session utility wraps `/api/auth/get-session` + cookie handling.

```typescript
// ✅ Correct
import { getSession } from "@/lib/auth/session";
const session = await getSession();

// ❌ Wrong
import { auth } from "@/lib/auth/better-auth";
const session = await auth.api.getSession();
```

### 3b. Client-Side Session Access via useSessionContext()

In client components within the dashboard, use `useSessionContext()` from the centralized `SessionProvider`. This prevents duplicate session fetches and rate limiting issues.

```typescript
"use client";

// ✅ Correct - Use centralized session context (inside dashboard)
import { useSessionContext } from "@/contexts/session-context";

function MyComponent() {
  const { user, isPending } = useSessionContext();

  if (isPending) return <Skeleton />;
  if (!user) return null;

  return <div>Hello, {user.name}</div>;
}

// ❌ Wrong - Direct useSession() causes duplicate API calls
import { useSession } from "@/lib/auth/client";
const { data: session } = useSession(); // Each component calls /api/auth/get-session
```

**Note**: The `SessionProvider` wraps the dashboard layout. Components outside the dashboard (marketing pages) should use `authClient.getSession()` in useEffect instead.

### 3c. SSO Login Restriction (Microsoft OAuth)

**Microsoft OAuth** login is restricted to employees who already exist in the Person database and meet these criteria:

- **Person must exist**: Email must match an existing Person record (synced from MS Graph)
- **Person must be active**: `isActive === true`
- **Person must not be excluded**: `isExcluded === false` (not a service account)

If validation fails, the user is redirected to `/auth/blocked` with an appropriate error message. The User/Account/Session records created during OAuth are automatically cleaned up.

**Email/password login** still allows Person auto-creation for initial admin setup (bootstrapping).

**Implementation**: See `src/lib/auth/better-auth.ts` - `validatePersonForSSO()` function and `after` hook.

**Workflow for new employees:**
1. Run MS Graph user sync to populate Person records
2. Employees can then sign in via Microsoft OAuth
3. Person record is automatically linked to User on first login

**ENCRYPTION_KEY Requirement:**

Microsoft OAuth **requires** the `ENCRYPTION_KEY` environment variable for secure token storage:

- **Purpose**: AES-256-GCM encryption of OAuth tokens (access tokens, refresh tokens, ID tokens)
- **Format**: Exactly 64 hexadecimal characters (32 bytes)
- **Generation**: `openssl rand -hex 32`
- **Security**: Must be unique per environment (dev/staging/prod), never reuse
- **Impact**: Without this key, Microsoft OAuth login will fail with validation error

**Implementation**: See [src/lib/auth/encryption.ts](src/lib/auth/encryption.ts) for encryption/decryption functions used by Better Auth.

**Key Management Best Practices:**
- Generate different keys for each environment
- Store in secure secrets manager (AWS Secrets Manager, Vercel env vars, etc.)
- Back up keys securely - losing the key means losing access to encrypted tokens
- Rotate keys regularly and decrypt/re-encrypt existing tokens during rotation

### 3d. Client-Side Permissions via usePermissions()

In client components within the dashboard, use `usePermissions()` hook which delegates to the centralized `PermissionsProvider`. This prevents duplicate permission API calls.

```typescript
"use client";

// ✅ Correct - Use permissions hook (backed by PermissionsProvider context)
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function MyComponent() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return <Skeleton />;
  if (!hasPermission(PERMISSIONS.ASSET_VIEW)) return null;

  return <AssetList />;
}
```

**Provider Hierarchy** (in `dashboard-layout-client.tsx`):
```
SessionProvider → PermissionsProvider → FeatureFlagsProvider → CommandPaletteProvider
```

**Feature Flags**: Similarly, use `useIsFeatureEnabled("FLAG_NAME")` which delegates to `FeatureFlagsProvider` context.

```typescript
import { useIsFeatureEnabled } from "@/hooks/use-feature-flags";

function MyFeature() {
  const isEnabled = useIsFeatureEnabled("CONTRACTS");
  if (!isEnabled) return null;
  return <ContractsModule />;
}
```

### 4. Permission Checks

Use `hasAnyPermission`/`checkPermissionUseCase` plus `permissionCache`. Ownership logic lives in `CheckPermissionUseCase` - keep new checks consistent.

```typescript
// ✅ Correct - Check permissions in server actions
import { requirePermission } from "@/lib/auth/permissions";

export async function updateTaskAction(data: UpdateTaskDTO) {
  await requirePermission(PERMISSIONS.TASKS.UPDATE);
  // ... update logic
}
```

### 5. Logging

Prefer `ILoggerService` injection; structured logs already redact sensitive info. Use `logger.startTimer/endTimer` for DB + cache instrumentation.

```typescript
// ✅ Correct - DI logger
@injectable()
export class MyService {
  constructor(
    @inject(DI_TOKENS.LoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async doSomething() {
    this.logger.info("Operation started", { context: "data" });
  }
}

// ❌ Wrong - Console logging
console.log("Operation started");
```

### 6. Before Sending Changes

Run the validation suite:

```bash
npm run lint        # ESLint + React Compiler rules
npm run type-check  # TypeScript validation
npm run test        # Unit + integration tests
```

**Note**: The test suite includes RBAC integration tests; expect console output from repository logging.

**See**: [Testing Strategy](#17-testing-strategy) for complete testing guide.

---

## 3. Quick Start

### Installation

```bash
# Clone or use as template
cd barq-assets

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# CRITICAL: Generate ENCRYPTION_KEY for Microsoft SSO
# This key is REQUIRED for OAuth token encryption (32 bytes = 64 hex chars)
openssl rand -hex 32
# Copy the output and add to .env.local: ENCRYPTION_KEY=<output>

# Configure other required variables in .env.local:
# - DATABASE_URL (PostgreSQL connection string)
# - REDIS_URL (Redis connection for background jobs)
# - OPENAI_API_KEY (for AI features)
# - NEXT_PUBLIC_APP_URL (your application URL)

# Apply database migrations
npm run db:migrate

# Seed database with example data
npm run db:seed

# Start development server
npm run dev
```

### Verify Installation

1. Open [http://localhost:3000](http://localhost:3000)
2. Navigate to `/tasks` to see the working CRUD demo
3. Try creating, editing, and deleting tasks
4. Toggle between light/dark mode

### Development Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server (auto-kills port conflicts)
npm run type-check       # TypeScript validation
npm run lint             # ESLint
npm run format           # Prettier (auto-fix)
npm run db:migrate       # Create/apply migrations (dev)
npm run db:migrate:deploy # Apply migrations (prod)
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

---

## 4. Project Structure

### High-Level Overview

```
barq-assets/
├── src/                    # Source code
│   ├── app/                # Next.js routes (Layer 1)
│   ├── components/         # React components (Layer 1)
│   ├── interface-adapters/ # Controllers & DTOs (Layer 2)
│   ├── core/               # Business logic (Layers 3-4)
│   ├── infrastructure/     # External implementations (Layer 5)
│   ├── di/                 # Dependency injection
│   └── lib/                # Shared utilities
├── docs/                   # Documentation
├── scripts/                # Build scripts
├── .husky/                 # Git hooks
└── prisma/                 # Database migrations (generated)
```

### Detailed Structure

```
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Landing page
│   ├── globals.css                         # Global styles
│   └── tasks/                              # Task demo page
│       └── page.tsx
│
├── components/                             # UI Components
│   ├── ui/                                 # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ... (35+ components)
│   └── task/                               # Task CRUD components
│       ├── task-list.tsx
│       ├── task-item.tsx
│       ├── task-form.tsx
│       └── task-filters.tsx
│
├── interface-adapters/                     # Interface Adapters Layer
│   ├── controllers/
│   │   ├── task.controller.ts              # Task server actions
│   │   └── error-handler.ts                # Centralized error handling
│   ├── dtos/
│   │   └── task.dto.ts                     # Data transfer objects
│   └── presenters/
│       └── task.presenter.ts               # Entity → DTO transformation
│
├── core/                                   # Core Business Logic
│   ├── domain/                             # Domain Layer
│   │   ├── entities/
│   │   │   ├── task.entity.ts              # Task entity
│   │   │   ├── prompt-block.entity.ts      # Prompt block entity
│   │   │   └── prompt-composition.entity.ts # Prompt composition entity
│   │   └── errors/
│   │       ├── not-found.error.ts
│   │       └── validation.error.ts
│   │
│   ├── repositories/                       # Repository Interfaces
│   │   ├── task.repository.interface.ts
│   │   ├── prompt-block.repository.interface.ts
│   │   └── prompt-composition.repository.interface.ts
│   │
│   ├── services/                           # Service Interfaces
│   │   ├── ai-content-generator.service.interface.ts
│   │   ├── ai-prompt-manager.service.interface.ts
│   │   └── ai-debug-trace.service.interface.ts
│   │
│   └── use-cases/                          # Use Cases
│       ├── task/
│       │   ├── create-task.use-case.ts
│       │   ├── list-tasks.use-case.ts
│       │   ├── get-task.use-case.ts
│       │   ├── update-task.use-case.ts
│       │   ├── delete-task.use-case.ts
│       │   └── complete-task.use-case.ts
│       └── ai/
│           └── ... (AI use cases)
│
├── infrastructure/                         # Infrastructure Layer
│   ├── database/
│   │   └── prisma/
│   │       ├── schema/                     # Multi-file schema (17 domain files)
│   │       │   ├── schema.prisma           # Generator + datasource config
│   │       │   ├── auth.prisma             # Auth models
│   │       │   ├── assets.prisma           # Asset models
│   │       │   └── ...                     # Other domain files
│   │       └── seed.ts                     # Seed data
│   │
│   ├── repositories/                       # Repository Implementations
│   │   ├── prisma-task.repository.ts
│   │   ├── prisma-prompt-block.repository.ts
│   │   ├── prisma-prompt-composition.repository.ts
│   │   ├── prisma-helpers.ts               # Type-safe JSON utilities
│   │   └── repository-logger.ts            # Repository logging
│   │
│   └── services/                           # Service Implementations
│       └── ai/
│           ├── openai-content-generator.service.ts
│           ├── openai-prompt-manager.service.ts
│           └── openai-debug-trace.service.ts
│
├── di/                                     # Dependency Injection
│   ├── container.ts                        # InversifyJS container
│   ├── types.ts                            # DI tokens
│   └── modules/                            # DI modules
│       ├── database.module.ts
│       ├── services.module.ts
│       ├── use-cases.module.ts
│       └── ai.module.ts
│
└── lib/                                    # Shared Utilities
    ├── theme/                              # Theme system
    │   ├── constants.ts                    # Brand colors (OKLCH)
    │   ├── types.ts                        # Theme types
    │   └── utils.ts                        # Theme utilities
    ├── logger.ts                           # Structured logging
    ├── result.ts                           # Result<T,E> type
    └── utils.ts                            # Common utilities
```

---

## 5. Architecture Overview

### Clean Architecture Layers

The application follows **Clean Architecture** (Robert C. Martin) with 5 distinct layers:

```
┌─────────────────────────────────────────────────────┐
│         1. Presentation Layer (UI)                  │
│    Next.js Pages + React Components                 │
│    Dependencies: Interface Adapters                 │
├─────────────────────────────────────────────────────┤
│      2. Interface Adapters (Controllers)            │
│    Server Actions + DTOs + Presenters               │
│    Dependencies: Use Cases                          │
├─────────────────────────────────────────────────────┤
│         3. Use Cases (Application Logic)            │
│    Business workflows and orchestration             │
│    Dependencies: Domain                             │
├─────────────────────────────────────────────────────┤
│         4. Domain (Business Logic)                  │
│    Entities + Repository Interfaces                 │
│    Dependencies: None (pure business logic)         │
├─────────────────────────────────────────────────────┤
│      5. Infrastructure (External Concerns)          │
│    Database + APIs + File System                    │
│    Dependencies: Domain (implements interfaces)     │
└─────────────────────────────────────────────────────┘
```

### Dependency Rule

**Dependencies point inward** - outer layers can depend on inner layers, but inner layers NEVER depend on outer layers.

- ✅ Controllers can import Use Cases
- ✅ Use Cases can import Entities
- ✅ Infrastructure implements Domain interfaces
- ❌ Entities CANNOT import Use Cases
- ❌ Domain CANNOT import Infrastructure

### Data Flow

**Request Flow** (user action → database):

```
UI Component → Server Action → Use Case → Repository Interface → Repository Implementation → Database
```

**Response Flow** (database → user):

```
Database → Repository Implementation → Entity → Use Case → Presenter → DTO → UI Component
```

---

## 6. Domain Layer

### What is the Domain Layer?

The **heart of your application** - contains business entities and rules. This layer:

- Has ZERO dependencies on frameworks or external libraries
- Defines what your application does (not how)
- Contains entities, value objects, and repository interfaces
- Is the most stable layer (changes least frequently)

### Entities

**Location**: `src/core/domain/entities/`

Entities encapsulate business logic and rules. Example: `Task` entity.

```typescript
export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  // Factory method for creation
  static create(props: CreateTaskProps): Task {
    // Validation
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }
    if (props.title.length > 200) {
      throw new ValidationError("Title must be 200 characters or less");
    }

    const now = new Date();
    return new Task(
      "", // ID will be assigned by database
      props.title.trim(),
      props.description?.trim() || null,
      props.status || TaskStatus.PENDING,
      now,
      now,
    );
  }

  // Business method
  complete(): void {
    if (this.status === TaskStatus.COMPLETED) {
      throw new ValidationError("Task is already completed");
    }
    this.status = TaskStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  // Business method
  updateDetails(title: string, description: string | null): void {
    if (!title || title.trim().length === 0) {
      throw new ValidationError("Task title is required");
    }
    this.title = title.trim();
    this.description = description?.trim() || null;
    this.updatedAt = new Date();
  }
}
```

**Key Principles**:

- Use factory methods (`static create`) for instantiation
- Validate in constructors and methods
- Immutable IDs, mutable business fields
- Throw domain errors (ValidationError, etc.)
- Keep business logic here, not in use cases

### Repository Interfaces

**Location**: `src/core/repositories/`

Define contracts for data access without implementation details.

```typescript
export interface ITaskRepository {
  findAll(filter?: TaskFilterOptions): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  countByStatus(): Promise<Record<TaskStatus, number>>;
}
```

**Benefits**:

- Domain layer doesn't know about Prisma, SQL, or database
- Easy to swap implementations (Prisma → MongoDB → In-memory)
- Enables testing with mocks

### Domain Errors

**Location**: `src/core/domain/errors/`

Custom error classes for domain violations.

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID ${id} not found`);
    this.name = "NotFoundError";
  }
}
```

---

## 7. Use Cases Layer

### What are Use Cases?

**Application-specific business rules** - orchestrate the flow of data between entities and repositories.

**Location**: `src/core/use-cases/`

### Characteristics

- One use case = one user action/operation
- Inject dependencies via constructor (DI)
- Thin orchestration layer (business logic in entities)
- Return domain entities (not DTOs)

### Example: CreateTaskUseCase

```typescript
import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { Task, type CreateTaskProps } from "@/core/domain/entities/task.entity";

@injectable()
export class CreateTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(props: CreateTaskProps): Promise<Task> {
    // 1. Create entity (validation happens here)
    const task = Task.create(props);

    // 2. Persist via repository
    const createdTask = await this.taskRepository.create(task);

    // 3. Return domain entity
    return createdTask;
  }
}
```

### All Task Use Cases

| Use Case              | Purpose              | Input                | Output   |
| --------------------- | -------------------- | -------------------- | -------- |
| `CreateTaskUseCase`   | Create new task      | `CreateTaskProps`    | `Task`   |
| `ListTasksUseCase`    | List all tasks       | `TaskFilterOptions?` | `Task[]` |
| `GetTaskUseCase`      | Get task by ID       | `string`             | `Task`   |
| `UpdateTaskUseCase`   | Update existing task | `UpdateTaskProps`    | `Task`   |
| `DeleteTaskUseCase`   | Delete task          | `string`             | `void`   |
| `CompleteTaskUseCase` | Mark task complete   | `string`             | `Task`   |

### When to Create a Use Case

✅ **Create a use case when**:

- User performs an action (create, update, delete)
- Multiple repositories are involved
- Complex business workflow needs orchestration
- You need to enforce transaction boundaries

❌ **Don't create a use case for**:

- Simple getters (repository can handle)
- Pure calculations (belongs in entity)
- UI state management (belongs in components)

---

## 8. Interface Adapters Layer

### What are Interface Adapters?

Convert data between use cases and external interfaces (web, CLI, etc.).

**Components**:

1. **Controllers** - Handle incoming requests (server actions)
2. **DTOs** - Data transfer objects for validation
3. **Presenters** - Transform entities to DTOs for responses

### Controllers (Server Actions)

**Location**: `src/interface-adapters/controllers/`

Next.js Server Actions that invoke use cases.

```typescript
"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { CreateTaskUseCase } from "@/core/use-cases/task/create-task.use-case";
import { CreateTaskSchema, type CreateTaskDTO } from "../dtos/task.dto";
import { presentTask, type TaskDTO } from "../presenters/task.presenter";
import { handleControllerError } from "./error-handler";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createTaskAction(
  data: CreateTaskDTO,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // 1. Validate input with Zod
    const validated = CreateTaskSchema.parse(data);

    // 2. Get use case from DI container
    const container = getContainer();
    const createTask = container.get<CreateTaskUseCase>(
      DI_TOKENS.CreateTaskUseCase,
    );

    // 3. Execute use case
    const task = await createTask.execute({
      title: validated.title,
      description: validated.description ?? null,
      status: validated.status,
    });

    // 4. Present result as DTO
    return { success: true, data: presentTask(task) };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createTaskAction" },
      "Failed to create task",
    );
  }
}
```

**Error Handling Utility**:

```typescript
// src/interface-adapters/controllers/error-handler.ts
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import { controllerLogger } from "@/lib/logger";

export function handleControllerError(
  error: unknown,
  context: { function: string },
  fallbackMessage: string,
): ActionResponse<never> {
  // Zod validation errors
  if (error instanceof ZodError) {
    const message = error.errors.map((e) => e.message).join(", ");
    controllerLogger.warn(`Validation error in ${context.function}`, {
      error: message,
    });
    return { success: false, error: message };
  }

  // Domain validation errors
  if (error instanceof ValidationError) {
    controllerLogger.warn(`Domain validation error in ${context.function}`, {
      error: error.message,
    });
    return { success: false, error: error.message };
  }

  // Domain not found errors
  if (error instanceof NotFoundError) {
    controllerLogger.warn(`Not found error in ${context.function}`, {
      error: error.message,
    });
    return { success: false, error: error.message };
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    controllerLogger.error(`Database error in ${context.function}`, {
      code: error.code,
    });
    return { success: false, error: "Database error occurred" };
  }

  // Unknown errors
  controllerLogger.error(`Unknown error in ${context.function}`, { error });
  return { success: false, error: fallbackMessage };
}
```

### DTOs (Data Transfer Objects)

**Location**: `src/interface-adapters/dtos/`

Zod schemas for runtime validation.

```typescript
import { z } from "zod";
import { TaskStatus } from "@/core/domain/entities/task.entity";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z
    .string()
    .max(2000, "Description too long")
    .optional()
    .nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export type UpdateTaskDTO = z.infer<typeof UpdateTaskSchema>;
```

### Presenters

**Location**: `src/interface-adapters/presenters/`

Transform domain entities to DTOs for API responses.

```typescript
import type { Task } from "@/core/domain/entities/task.entity";

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function presentTask(task: Task): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function presentTasks(tasks: Task[]): TaskDTO[] {
  return tasks.map(presentTask);
}
```

### Enrichment Pattern (Display Names for Related Entities)

When displaying entities in tables or detail views, raw CUIDs (e.g., `cmifrk2qu004i5k8b63lcefff`) should be replaced with human-readable names. This is done via **controller-level enrichment**.

**Pattern Overview**:

1. **Presenter** - Define enrichment interface with optional display fields
2. **Controller** - Batch-fetch related entities and build enrichment map
3. **UI** - Use `EntityDisplay` component for consistent styling

**Step 1: Define Enrichment Interface** (in presenter):

```typescript
// src/interface-adapters/presenters/asset-assignment.presenter.ts

export interface AssetAssignmentEnrichment {
  assetTag?: string;
  assigneeName?: string;
}

export interface AssetAssignmentDTO {
  // ... existing fields
  // Display fields (enriched from relations)
  assetTag?: string;
  assigneeName?: string;
}

export function presentAssetAssignment(
  assignment: AssetAssignment,
  enrichment?: AssetAssignmentEnrichment,
): AssetAssignmentDTO {
  return {
    // ... existing fields
    assetTag: enrichment?.assetTag,
    assigneeName: enrichment?.assigneeName,
  };
}

export function presentAssetAssignments(
  assignments: AssetAssignment[],
  enrichmentMap?: Map<string, AssetAssignmentEnrichment>,
): AssetAssignmentDTO[] {
  return assignments.map((assignment) =>
    presentAssetAssignment(assignment, enrichmentMap?.get(assignment.id)),
  );
}
```

**Step 2: Build Enrichment Map** (in controller):

```typescript
// src/interface-adapters/controllers/asset-assignment.controller.ts

async function enrichAssetAssignments(
  assignments: AssetAssignment[],
): Promise<Map<string, AssetAssignmentEnrichment>> {
  const enrichmentMap = new Map<string, AssetAssignmentEnrichment>();
  if (assignments.length === 0) return enrichmentMap;

  // Collect unique IDs
  const assetIds = [...new Set(assignments.map((a) => a.assetId))];
  const personIds = [...new Set(
    assignments.filter((a) => a.assigneeType === "PERSON").map((a) => a.assigneeId)
  )];

  // Batch fetch related entities in parallel
  const [assetsMap, personsMap] = await Promise.all([
    (async () => {
      const useCase = container.get<ListAssetsUseCase>(DI_TOKENS.ListAssetsUseCase);
      const assets = await useCase.execute({ ids: assetIds });
      return new Map(assets.items.map((a) => [a.id, a.assetTag]));
    })(),
    (async () => {
      const useCase = container.get<ListPeopleUseCase>(DI_TOKENS.ListPeopleUseCase);
      const persons = await useCase.execute({ ids: personIds });
      return new Map(persons.map((p) => [p.id, p.displayName]));
    })(),
  ]);

  // Build enrichment map
  for (const assignment of assignments) {
    enrichmentMap.set(assignment.id, {
      assetTag: assetsMap.get(assignment.assetId),
      assigneeName: assignment.assigneeType === "PERSON"
        ? personsMap.get(assignment.assigneeId)
        : undefined,
    });
  }

  return enrichmentMap;
}

// Use in list action
export async function listAssetAssignmentsAction() {
  const assignments = await listUseCase.execute({});
  const enrichmentMap = await enrichAssetAssignments(assignments);
  return { success: true, data: presentAssetAssignments(assignments, enrichmentMap) };
}
```

**Step 3: Use EntityDisplay in UI**:

```tsx
// In table column definition
import { EntityDisplay } from "@/components/ui/entity-display";
import { Tag, User } from "lucide-react";

{
  accessorKey: "assetTag",
  header: "Asset",
  cell: ({ row }) => (
    <EntityDisplay name={row.original.assetTag} icon={Tag} fallback="Unknown" />
  ),
}

{
  accessorKey: "assigneeName",
  header: "Assignee",
  cell: ({ row }) => (
    <EntityDisplay name={row.original.assigneeName} icon={User} />
  ),
}
```

**Key Benefits**:

- **Performance**: Batch fetching prevents N+1 queries
- **Flexibility**: Optional enrichment fields don't break existing code
- **Consistency**: `EntityDisplay` component provides uniform styling
- **Maintainability**: Enrichment logic centralized in controller

**See**: [UI Components Guide](./UI_COMPONENTS.md#entitydisplay-component) for complete `EntityDisplay` documentation.

---

## 9. Infrastructure Layer

### What is Infrastructure?

**External implementations** - connects your application to databases, APIs, file systems, and third-party services.

**Location**: `src/infrastructure/`

### Repository Implementations

**Location**: `src/infrastructure/repositories/`

Prisma-based implementations of repository interfaces.

```typescript
import { injectable, inject } from "inversify";
import type { PrismaClient, Task as PrismaTask } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { Task, TaskStatus } from "@/core/domain/entities/task.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class PrismaTaskRepository implements ITaskRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findAll(filter?: TaskFilterOptions): Promise<Task[]> {
    const where = filter?.status ? { status: filter.status } : {};
    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return tasks.map(this.toDomain);
  }

  async findById(id: string): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    return task ? this.toDomain(task) : null;
  }

  async create(task: Task): Promise<Task> {
    const created = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
      },
    });
    return this.toDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { id: task.id },
    });
    if (!existing) {
      throw new NotFoundError("Task", task.id);
    }

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        updatedAt: task.updatedAt,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  // Mapper: Prisma model → Domain entity
  private toDomain(prismaTask: PrismaTask): Task {
    return new Task(
      prismaTask.id,
      prismaTask.title,
      prismaTask.description,
      prismaTask.status as TaskStatus,
      prismaTask.createdAt,
      prismaTask.updatedAt,
    );
  }
}
```

### Prisma Helpers

**Location**: `src/infrastructure/repositories/prisma-helpers.ts`

Type-safe utilities for handling Prisma JSON fields.

```typescript
import { Prisma } from "@prisma/client";

export function toJsonValue<T>(
  value: T | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

export function fromJsonValue<T>(
  value: Prisma.JsonValue | null | undefined,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value as T;
}
```

### Repository Logger

**Location**: `src/infrastructure/repositories/repository-logger.ts`

Utility for logging repository operations.

```typescript
export async function logRepositoryOperation<T>(
  logger: ReturnType<typeof createRepositoryLogger>,
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(`${operation} completed in ${duration}ms`, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed after ${duration}ms`, {
      ...context,
      error,
    });
    throw error;
  }
}
```

---

## 10. Presentation Layer

### React Components

**Location**: `src/components/`

Client and server components following React 19 patterns.

### shadcn/ui Components

**Location**: `src/components/ui/`

35+ accessible, customizable components:

- Forms: Button, Input, Textarea, Select, Checkbox, Radio, Switch
- Data Display: Table, Card, Badge, Avatar, Separator
- Feedback: Alert, Toast (Sonner), Progress, Skeleton
- Overlays: Dialog, Sheet, Popover, Dropdown Menu, Alert Dialog
- Navigation: Tabs, Accordion, Navigation Menu

### Task Components Example

**TaskList Component** (`src/components/task/task-list.tsx`):

```typescript
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import { listTasksAction } from "@/interface-adapters/controllers/task.controller";
import { TaskStatus } from "@/core/domain/entities/task.entity";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";
import { TaskFilters } from "./task-filters";

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const result = await listTasksAction();
      if (result.success) {
        setTasks(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedStatus === "ALL") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === selectedStatus));
    }
  }, [tasks, selectedStatus]);

  const handleEdit = (task: TaskDTO) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button onClick={() => setIsFormOpen(true)} className="bg-barq-yellow text-barq-black">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <TaskFilters selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />

      {filteredTasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdate={loadTasks} onEdit={handleEdit} />
      ))}

      <TaskForm open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={loadTasks} task={editingTask} />
    </div>
  );
}
```

### Client vs Server Components

**Server Components** (default):

- ✅ Can use server actions
- ✅ Faster initial load (no JavaScript shipped)
- ✅ Direct database access (via server actions)
- ❌ No interactivity (no useState, useEffect, etc.)

**Client Components** (`"use client"`):

- ✅ Full interactivity (state, effects, event handlers)
- ✅ Access to browser APIs
- ❌ Larger bundle size
- ❌ Cannot import server-only code

**Rule**: Keep components server-side by default, only add `"use client"` when you need interactivity.

### React 19 Patterns

React 19 introduces new hooks for forms and optimistic updates. This project uses React 19.2 integrated with Next.js 16.

#### useActionState Hook

Handle form actions with error states and loading indicators:

```typescript
import { useActionState } from 'react';

function MyForm() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateData(formData);
      if (error) return error;
      redirect("/success");
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <input name="field" />
      <button disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

**Use cases**:

- Form submission with error handling
- Loading states during async operations
- Progressive enhancement (works without JavaScript)

#### useFormStatus Hook

Access parent form status in child components:

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

// Use in form
function MyForm() {
  return (
    <form action={submitAction}>
      <input name="field" />
      <SubmitButton />
    </form>
  );
}
```

**Use cases**:

- Reusable submit buttons
- Form-wide loading indicators
- Coordinated state across form components

#### useOptimistic Hook

Implement optimistic UI updates for better perceived performance:

```typescript
import { useOptimistic } from 'react';

function TaskList({ tasks, onUpdate }) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, newTask) => [...state, newTask]
  );

  const handleAdd = async (formData) => {
    const newTask = { id: crypto.randomUUID(), ...formData };

    // Optimistically add task (instant UI update)
    setOptimisticTasks(newTask);

    // Actually create task (may fail)
    await onUpdate(newTask);
  };

  return (
    <div>
      {optimisticTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
      <button onClick={handleAdd}>Add Task</button>
    </div>
  );
}
```

**Use cases**:

- Instant UI feedback for async operations
- Better perceived performance
- Automatic rollback on failure

#### React Compiler

The project includes `eslint-plugin-react-compiler` for automatic memoization and performance optimization:

```javascript
// eslint.config.mjs
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
];
```

**Benefits**:

- Automatic memoization suggestions
- Performance optimization recommendations
- React Rules enforcement

**Best Practice**: In React Hook Form components audited by React Compiler, prefer `useWatch` over `form.watch` to avoid "incompatible library" warnings.

#### JSX Namespace Augmentation

React 19 requires JSX namespace augmentation to be wrapped in module declarations:

```typescript
// global.d.ts
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "custom-element": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
```

**See**: [global.d.ts](../../global.d.ts) for implementation.

### Component Refactoring Patterns

**When to refactor large components**:

- Component exceeds 300-500 lines
- Multiple responsibilities (state management, UI rendering, business logic)
- Difficult to test or maintain
- Code duplication across similar components

**Best Practice Pattern: Hooks + Components Composition**

The PermissionsManager component refactoring demonstrates the recommended pattern:

**Before**: Monolithic component (698 lines)
- All state management inline
- All UI rendering in one file
- Difficult to test individual concerns

**After**: Composed architecture (243 lines)
- 3 custom hooks (state management)
- 5 focused components (UI rendering)
- Easy to test and maintain

#### Custom Hooks Pattern

Extract stateful logic into custom hooks following Single Responsibility Principle:

**1. State Management Hook** ([use-permission-selection.ts](../../src/hooks/use-permission-selection.ts)):

```typescript
export function usePermissionSelection({
  initialPermissions,
}: UsePermissionSelectionOptions) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(initialPermissions),
  );

  const originalPermissions = useMemo(
    () => new Set(initialPermissions),
    [initialPermissions],
  );

  const togglePermission = useCallback((permissionName: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  }, []);

  const hasChanges = useCallback(() => {
    if (selectedPermissions.size !== originalPermissions.size) return true;
    for (const perm of selectedPermissions) {
      if (!originalPermissions.has(perm)) return true;
    }
    return false;
  }, [selectedPermissions, originalPermissions]);

  const reset = useCallback(() => {
    setSelectedPermissions(new Set(originalPermissions));
  }, [originalPermissions]);

  return {
    selectedPermissions,
    setSelectedPermissions,
    togglePermission,
    hasChanges,
    reset,
  };
}
```

**Benefits**:
- Isolated state logic (easy to test)
- Reusable across components
- Clear interface (inputs/outputs)
- Performance optimized with `useCallback` and `useMemo`

**2. Feature-Specific Hook** ([use-bulk-selection.ts](../../src/hooks/use-bulk-selection.ts)):

```typescript
export function useBulkSelection() {
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());

  const toggleBulkMode = useCallback(() => {
    setBulkMode((prev) => !prev);
    if (bulkMode) {
      setBulkSelection(new Set());
    }
  }, [bulkMode]);

  const addBulk = useCallback(
    (
      targetSet: Set<string>,
      setTarget: React.Dispatch<React.SetStateAction<Set<string>>>,
    ) => {
      setTarget((prev) => {
        const next = new Set(prev);
        bulkSelection.forEach((perm) => next.add(perm));
        return next;
      });
      const count = bulkSelection.size;
      setBulkSelection(new Set());
      toast.success(`Added ${count} permissions`);
    },
    [bulkSelection],
  );

  return {
    bulkMode,
    bulkSelection,
    setBulkSelection,
    toggleBulkMode,
    addBulk,
    // ... more methods
  };
}
```

**3. Display Logic Hook** ([use-permission-groups.ts](../../src/hooks/use-permission-groups.ts)):

```typescript
export function usePermissionGroups({
  allPermissions,
  searchQuery,
  selectedPermissions,
}: UsePermissionGroupsOptions) {
  const permissionMap = useMemo(() => {
    const map = new Map<string, PermissionDTO>();
    allPermissions.forEach((perm) => map.set(perm.name, perm));
    return map;
  }, [allPermissions]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedPermissions;
    const query = searchQuery.toLowerCase();
    return groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (perm) =>
            perm.name.toLowerCase().includes(query) ||
            perm.displayName.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [searchQuery]);

  const getGroupStats = useCallback(
    (groupId: string) => {
      const group = filteredGroups.find((g) => g.id === groupId);
      if (!group) return { selectedCount: 0, isFullySelected: false, isPartiallySelected: false };

      const selectedCount = group.permissions.filter((p) =>
        selectedPermissions.has(p.name)
      ).length;
      const totalCount = group.permissions.length;

      return {
        selectedCount,
        isFullySelected: selectedCount === totalCount && totalCount > 0,
        isPartiallySelected: selectedCount > 0 && selectedCount < totalCount,
      };
    },
    [filteredGroups, selectedPermissions]
  );

  return {
    permissionMap,
    filteredGroups,
    getGroupStats,
    // ... more methods
  };
}
```

#### Component Composition Pattern

Break large components into smaller, focused components:

**1. Summary Component** ([PermissionsSummaryCard.tsx](../../src/components/roles/PermissionsSummaryCard.tsx)):

```typescript
interface PermissionsSummaryCardProps {
  currentPermissionsCount: number;
  selectedPermissionsCount: number;
  allPermissionsCount: number;
  hasChanges: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  bulkMode: boolean;
  onBulkModeChange: () => void;
  // ... more props
}

export function PermissionsSummaryCard({
  currentPermissionsCount,
  selectedPermissionsCount,
  hasChanges,
  searchQuery,
  onSearchChange,
}: PermissionsSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          {currentPermissionsCount} of {allPermissionsCount} permissions assigned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search permissions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
```

**2. Group Component** ([PermissionGroupCard.tsx](../../src/components/roles/PermissionGroupCard.tsx)):

```typescript
interface PermissionGroupCardProps {
  group: PermissionGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedPermissions: Set<string>;
  onTogglePermission: (permissionName: string) => void;
  // ... more props
}

export function PermissionGroupCard({
  group,
  isExpanded,
  onToggleExpand,
  selectedPermissions,
  onTogglePermission,
}: PermissionGroupCardProps) {
  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="cursor-pointer" onClick={onToggleExpand}>
          <CardTitle>{group.label}</CardTitle>
          <CardDescription>{group.description}</CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {group.permissions.map((permission) => (
              <PermissionItem
                key={permission.id}
                permission={permission}
                isSelected={selectedPermissions.has(permission.name)}
                onToggle={() => onTogglePermission(permission.name)}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
```

**3. Item Component** ([PermissionItem.tsx](../../src/components/roles/PermissionItem.tsx)):

```typescript
interface PermissionItemProps {
  permission: PermissionDTO;
  isSelected: boolean;
  onToggle: () => void;
  dependencies: PermissionKey[];
  // ... more props
}

export function PermissionItem({
  permission,
  isSelected,
  onToggle,
  dependencies,
}: PermissionItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      <div className="flex-1">
        <div className="font-medium">{permission.displayName}</div>
        <div className="text-sm text-muted-foreground">
          {permission.description}
        </div>
        {dependencies.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            Requires: {dependencies.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### Orchestrator Component Pattern

The main component becomes a thin orchestrator that composes hooks and components:

```typescript
export function PermissionsManager({ role, allPermissions, isSystemRole }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Hook 1: Permission selection state
  const {
    selectedPermissions,
    togglePermission,
    hasChanges,
    reset,
  } = usePermissionSelection({ initialPermissions: role.permissions ?? [] });

  // Hook 2: Bulk selection mode
  const {
    bulkMode,
    bulkSelection,
    toggleBulkMode,
    addBulk,
    removeBulk,
  } = useBulkSelection();

  // Hook 3: Permission groups display logic
  const {
    permissionMap,
    filteredGroups,
    expandedGroups,
    toggleGroup,
    getGroupStats,
  } = usePermissionGroups({
    allPermissions,
    searchQuery,
    selectedPermissions,
    bulkSelection,
    bulkMode,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save logic
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PermissionsSummaryCard
        currentPermissionsCount={role.permissions?.length ?? 0}
        selectedPermissionsCount={selectedPermissions.size}
        hasChanges={hasChanges()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bulkMode={bulkMode}
        onBulkModeChange={toggleBulkMode}
      />

      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <PermissionGroupCard
            key={group.id}
            group={group}
            isExpanded={expandedGroups.has(group.id)}
            onToggleExpand={() => toggleGroup(group.id)}
            selectedPermissions={selectedPermissions}
            onTogglePermission={togglePermission}
          />
        ))}
      </div>

      <PermissionActionsFooter
        hasChanges={hasChanges()}
        isSystemRole={isSystemRole}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={reset}
      />
    </div>
  );
}
```

**Key Benefits**:

1. **Single Responsibility**: Each hook and component has one clear purpose
2. **Testability**: Test hooks and components independently
3. **Reusability**: Hooks can be used in other components
4. **Maintainability**: Easy to locate and modify specific concerns
5. **Performance**: Memoization and callbacks prevent unnecessary re-renders
6. **Readability**: Clear separation of concerns

**Result**: 698 lines → 243 lines (65% reduction) with improved maintainability

---

## 11. Routes Manifest System

### Overview

The routes manifest system provides a **single source of truth** for all application routes, navigation structure, and route-level permissions. It uses code generation to eliminate inconsistencies between navigation UI and route protection logic.

**Location**: `src/config/routes-manifest.ts`

### Why Routes Manifest?

**Problems it solves**:
- ❌ Navigation and protected routes defined separately → inconsistencies
- ❌ Adding new routes requires updates in multiple files
- ❌ Permission mismatches between UI visibility and route access
- ❌ No single place to see all application routes

**Benefits**:
- ✅ Single source of truth - define route once, generate all configs
- ✅ Type-safe route definitions with TypeScript
- ✅ Automatic navigation group generation
- ✅ Automatic route protection map generation
- ✅ Icon mapping for code generation
- ✅ Prevents drift between navigation and permissions

### Architecture

```
routes-manifest.ts (Source of Truth)
         ↓
    [Generator Script]
         ↓
    ┌────────┴────────┐
    ↓                 ↓
navigation-groups/   protected-routes.ts
(7 files)            (with helpers)
```

### Route Definition Structure

**File**: `src/config/routes-manifest.ts`

```typescript
export const ROUTES_MANIFEST: RouteDefinition[] = [
  {
    path: "/dashboard",                    // Route path (Next.js pattern)
    label: "Dashboard",                    // Display label
    icon: Home,                            // Lucide icon component
    description: "Overview and statistics", // Tooltip/docs
    requiredPermissions: ["DASHBOARD_VIEW"], // Permission constant NAMES
    visibleInNav: true,                    // Show in navigation
    navGroup: "main",                      // Navigation group ID
    navOrder: 1,                           // Sort order
  },
  {
    path: "/admin/users/[id]",             // Dynamic route
    label: "User Details",
    icon: Users,
    description: "View specific user details",
    requiredPermissions: ["USERS_VIEW"],
    visibleInNav: false,                   // Hidden from nav (detail page)
    isChildRoute: true,                    // Mark as child route
    parentRoute: "/admin/users",           // Parent route
  },
];
```

### Navigation Groups

Define logical groupings of routes:

```typescript
export const NAV_GROUPS: Record<NavGroupId, NavGroupMetadata> = {
  main: {
    id: "main",
    title: "Main",
    collapsible: false,
    order: 1,
  },
  system: {
    id: "system",
    title: "System & Admin",
    collapsible: true,
    defaultCollapsed: true,
    permission: PERMISSIONS.USERS_VIEW, // Group-level permission
    order: 7,
  },
};
```

### Icon Mapping

Lucide icons don't have reliable `displayName` properties, so we maintain an explicit mapping:

```typescript
export const ICON_NAME_MAP = new Map<LucideIcon, string>([
  [Home, "Home"],
  [Users, "Users"],
  [Package, "Package"],
  // ... 33 icon mappings
]);
```

### Code Generation

**Command**: `npm run generate:routes`

**Generates**:
1. **Navigation Groups** (7 files in `navigation-groups/`)
   - Type-safe NavGroup objects
   - Filtered by `visibleInNav`
   - Icon imports
   - Permission references

2. **Protected Routes Map** (`protected-routes.ts`)
   - Route → permission mapping
   - Dynamic route pattern matching
   - Helper functions:
     - `getRouteProtection(pathname)`
     - `canAccessRoute(pathname, permissions)`
     - `getRoutesByPermission(permission)`
     - `isPublicRoute(pathname)`

**Generated file headers**:
```typescript
/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * This file is automatically generated from: src/config/routes-manifest.ts
 * Generator version: 1.0.0
 * Generated at: 2025-12-02T06:21:34.441Z
 *
 * To modify these routes:
 * 1. Edit src/config/routes-manifest.ts
 * 2. Run: npm run generate:routes
 *
 * Manual edits will be lost on next generation.
 */
```

### Adding a New Route

**Step 1**: Add route definition to `routes-manifest.ts`

```typescript
{
  path: "/new-feature",
  label: "New Feature",
  icon: Sparkles,
  description: "New feature description",
  requiredPermissions: ["NEW_FEATURE_VIEW"],
  featureFlag: "NEW_FEATURE", // Optional
  visibleInNav: true,
  navGroup: "main",
  navOrder: 10,
}
```

**Step 2**: Add icon to `ICON_NAME_MAP` (if new icon)

```typescript
export const ICON_NAME_MAP = new Map<LucideIcon, string>([
  // ... existing mappings
  [Sparkles, "Sparkles"],
]);
```

**Step 3**: Generate navigation and routes

```bash
npm run generate:routes
```

**Step 4**: Verify generated files

```bash
npm run validate  # Type-check + lint
```

That's it! The route is now:
- ✅ Visible in navigation (if `visibleInNav: true`)
- ✅ Protected by permissions on server
- ✅ Integrated with permission checks
- ✅ Documented with description

### Permission Constant Names vs Values

**CRITICAL**: The manifest uses permission **constant names** (strings), not values!

```typescript
// ✅ CORRECT
requiredPermissions: ["DASHBOARD_VIEW"]

// ❌ WRONG - these are values, not constant names
requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW]
requiredPermissions: ["dashboard:view"]
```

**Why?**: The generator uses template literals like `PERMISSIONS.${name}` to output TypeScript code.

### Dynamic Routes

Routes with `[id]` segments are supported:

```typescript
{
  path: "/assets/[assetTag]",
  label: "Asset Details",
  // ...
  visibleInNav: false,  // Don't show in nav
  isChildRoute: true,   // Mark as child
  parentRoute: "/assets",
}
```

The `getRouteProtection()` helper converts `[id]` patterns to regex for matching:
```typescript
getRouteProtection("/assets/LAP-123")
// → Matches pattern "/assets/[assetTag]"
// → Returns { requiredPermissions: [PERMISSIONS.ASSETS_VIEW] }
```

### Feature Flags

Routes can be gated by feature flags:

```typescript
{
  path: "/intune/devices",
  label: "Intune Devices",
  requiredPermissions: ["INTUNE_DEVICES_VIEW"],
  featureFlag: "INTUNE",  // Gated by INTUNE flag
  visibleInNav: true,
}
```

Navigation automatically filters routes based on enabled features.

### Public Routes

Routes that don't require authentication:

```typescript
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/setup",
] as const;
```

### Validation Tests

**TODO**: Add integration tests to verify:
- All routes in manifest have corresponding page files
- All permission constants exist in `PERMISSIONS`
- Generated files match manifest structure
- No duplicate routes or conflicting paths

### Troubleshooting

**Issue**: Generated files have syntax errors like `PERMISSIONS.users:view`

**Cause**: Permission values were used instead of constant names in manifest

**Fix**: Ensure `requiredPermissions` uses constant names like `["USERS_VIEW"]`

---

**Issue**: Icon not found warning during generation

**Cause**: Icon not in `ICON_NAME_MAP`

**Fix**: Add icon to map:
```typescript
export const ICON_NAME_MAP = new Map<LucideIcon, string>([
  // ...
  [NewIcon, "NewIcon"],
]);
```

---

**Issue**: Route protection not working

**Cause**: Generated files not regenerated after manifest changes

**Fix**: Always run `npm run generate:routes` after editing manifest

### Best Practices

1. **Always edit manifest first** - Never manually edit generated files
2. **Run generator after changes** - `npm run generate:routes`
3. **Validate after generation** - `npm run validate`
4. **Use consistent naming** - Route paths, labels, and descriptions
5. **Group related routes** - Use `navGroup` to organize logically
6. **Hide detail pages** - Use `visibleInNav: false` for child routes
7. **Document descriptions** - Help users understand route purpose
8. **Test permissions** - Verify access control works as expected

### Migration from Old System

The routes manifest replaces the old system where:
- Navigation was defined in `navigation-groups/*.ts` (manually maintained)
- Protected routes in `protected-routes.ts` (manually maintained)
- Risk of drift between navigation and protection

**Migration completed**: All 72 routes migrated to manifest system ✅

---

## 12. Dependency Injection

### Why Dependency Injection?

- **Testability** - Mock dependencies for unit tests
- **Flexibility** - Swap implementations without changing code
- **Separation of Concerns** - Dependencies are injected, not created
- **Inversion of Control** - Framework manages object lifecycle

### InversifyJS Setup

**Location**: `src/di/`

### DI Tokens

**File**: `src/di/types.ts`

Define symbols for all interfaces.

```typescript
export const DI_TOKENS = {
  // Repositories
  ITaskRepository: Symbol.for("ITaskRepository"),
  IPromptBlockRepository: Symbol.for("IPromptBlockRepository"),
  IPromptCompositionRepository: Symbol.for("IPromptCompositionRepository"),

  // Services
  IAIContentGeneratorService: Symbol.for("IAIContentGeneratorService"),
  IAIPromptManagerService: Symbol.for("IAIPromptManagerService"),
  IAIDebugTraceService: Symbol.for("IAIDebugTraceService"),

  // Use Cases
  CreateTaskUseCase: Symbol.for("CreateTaskUseCase"),
  ListTasksUseCase: Symbol.for("ListTasksUseCase"),
  GetTaskUseCase: Symbol.for("GetTaskUseCase"),
  UpdateTaskUseCase: Symbol.for("UpdateTaskUseCase"),
  DeleteTaskUseCase: Symbol.for("DeleteTaskUseCase"),
  CompleteTaskUseCase: Symbol.for("CompleteTaskUseCase"),

  // Infrastructure
  PrismaClient: Symbol.for("PrismaClient"),
};
```

### Container Configuration

**File**: `src/di/container.ts`

The DI container uses a **three-tier modular system** with lazy loading support:

- **CORE Tier** (14 modules): Always loaded, essential services (~100-200ms)
- **DASHBOARD Tier** (11 modules): Common features (~300-500ms total)
- **HEAVY Tier** (4 modules): Lazy loaded on demand (~50-100ms each)

```typescript
import { initContainer, getContainer, loadHeavyModule, ModuleTier } from "@/di/container";

// Async initialization (recommended for optimal performance)
await initContainer(ModuleTier.DASHBOARD);  // Load CORE + DASHBOARD

// Lazy load heavy modules when user accesses feature
if (!isModuleLoaded('intune')) {
  await loadHeavyModule('intune');  // Load Intune + dependencies
}

// Backward compatible (synchronous, loads CORE + DASHBOARD)
const container = getContainer();
const useCase = container.get(DI_TOKENS.CreateAssetUseCase);
```

**Module Registry**: All 29 modules are defined in `src/di/module-definitions.ts` with:
- Module tier (CORE, DASHBOARD, or HEAVY)
- Dependencies (automatic resolution via topological sort)
- Feature flags (gate heavy modules)
- Health checks (validate external dependencies)

See [DI_MODULARIZATION.md](../architecture/DI_MODULARIZATION.md) for complete documentation.

### Adding a New Module

When creating a new feature module:

**1. Create module binding function** (`src/di/modules/my-feature.module.ts`):

```typescript
import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

export function bindMyFeatureDependencies(container: Container): void {
  // Bind repositories (singleton)
  container
    .bind(DI_TOKENS.IMyFeatureRepository)
    .to(PrismaMyFeatureRepository)
    .inSingletonScope();

  // Bind use cases (transient - new instance per request)
  container
    .bind(DI_TOKENS.CreateMyFeatureUseCase)
    .to(CreateMyFeatureUseCase)
    .inTransientScope();
}
```

**2. Add module definition** (`src/di/module-definitions.ts`):

```typescript
export const MY_FEATURE_MODULE: DIModule = {
  name: "my-feature",
  displayName: "My Feature",
  tier: ModuleTier.DASHBOARD,  // or CORE or HEAVY
  description: "My feature description",
  featureFlag: "MY_FEATURE",   // optional
  dependencies: ["logger", "database", "foundation"],
  isLoaded: false,
  bindFunction: bindMyFeatureDependencies,
  healthCheck: createMyFeatureHealthCheck(),  // optional for HEAVY modules
};

// Add to ALL_MODULES array
export const ALL_MODULES: DIModule[] = [
  // ... existing modules
  MY_FEATURE_MODULE,
];
```

**3. Choosing the right tier**:
- **CORE**: Essential services needed by all features (auth, logging, database)
- **DASHBOARD**: Common features used by most users (assets, inventory)
- **HEAVY**: Specialized features with external APIs or heavy dependencies (Intune, Services)

### Scopes

- **Singleton** (`.inSingletonScope()`) - One instance for entire application
  - Use for: Repositories, services, PrismaClient
- **Transient** (`.inTransientScope()`) - New instance every time
  - Use for: Use cases, controllers
- **Request** (`.inRequestScope()`) - One instance per request
  - Not used in this assets app

---

## 12. Database & Prisma

### Prisma Schema

**Location**: `src/infrastructure/database/prisma/schema/` (multi-file schema)

See [PRISMA_GUIDE.md - Multi-File Schema Organization](PRISMA_GUIDE.md#multi-file-schema-organization) for complete structure.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?    @db.Text
  status      TaskStatus @default(PENDING)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([status])
  @@index([createdAt])
  @@map("tasks")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model PromptBlock {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?  @db.Text
  content     String   @db.Text
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
  @@map("prompt_blocks")
}

model PromptComposition {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?  @db.Text
  blocks      Json     // Array of { key: string, order: number }
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
  @@map("prompt_compositions")
}
```

### Migrations

```bash
# Development: Create and apply migrations
npm run db:migrate

# Production: Apply pending migrations (no prompts)
npm run db:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Seed Data

**File**: `src/infrastructure/database/prisma/seed.ts`

```typescript
import type { TaskStatus } from "@/generated/prisma";
import { prisma } from "@/infrastructure/database/prisma/client";

// Use the singleton prisma client from infrastructure layer

async function main() {
  // Seed AI prompt templates
  await prisma.promptBlock.createMany({
    data: [
      {
        key: "system-role",
        name: "System Role",
        description: "Defines the AI's role and behavior",
        content: "You are a helpful AI assistant...",
      },
      // ... more prompts
    ],
    skipDuplicates: true,
  });

  // Seed example tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Welcome to Barq Assets!",
        description: "This is an example task...",
        status: TaskStatus.COMPLETED,
      },
      // ... more tasks
    ],
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Prisma Studio

Visual database editor:

```bash
npm run db:studio
```

Opens [http://localhost:5555](http://localhost:5555) with a GUI for viewing and editing data.

---

## 13. AI Integration

### Overview

The assets app includes complete OpenAI integration with:

- ✅ GPT-5 with structured outputs
- ✅ Extended caching (24-hour cache for prompts)
- ✅ Modular prompt system
- ✅ Debug tracing

### AI Services

**Location**: `src/infrastructure/services/ai/`

1. **OpenAIContentGeneratorService** - Generate content with structured outputs
2. **OpenAIPromptManagerService** - Compose prompts from blocks
3. **OpenAIDebugTraceService** - Log AI requests/responses

### Service Interfaces

**Location**: `src/core/services/`

```typescript
export interface IAIContentGeneratorService {
  generateContent<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIGenerationOptions,
  ): Promise<T>;
}

export interface IAIPromptManagerService {
  getPromptByKey(key: string): Promise<string>;
  composePrompt(compositionKey: string): Promise<string>;
}

export interface IAIDebugTraceService {
  logRequest(prompt: string, options?: Record<string, unknown>): void;
  logResponse(response: unknown, duration: number): void;
}
```

### Example Usage

```typescript
import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { z } from "zod";
import type { IAIContentGeneratorService } from "@/core/services/ai-content-generator.service.interface";

const BlogPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
});

@injectable()
export class GenerateBlogPostUseCase {
  constructor(
    @inject(DI_TOKENS.IAIContentGeneratorService)
    private readonly ai: IAIContentGeneratorService,
  ) {}

  async execute(topic: string): Promise<z.infer<typeof BlogPostSchema>> {
    const prompt = `Write a blog post about: ${topic}`;
    return await this.ai.generateContent(prompt, BlogPostSchema);
  }
}
```

### Prompt Management

Prompts are stored in the database as reusable blocks.

**Seed Example** (`seed.ts`):

```typescript
await prisma.promptBlock.createMany({
  data: [
    {
      key: "system-role",
      name: "System Role",
      content:
        "You are a helpful AI assistant specialized in technical writing.",
    },
    {
      key: "blog-structure",
      name: "Blog Structure",
      content:
        "Include: engaging title, introduction, 3-5 main points, conclusion.",
    },
  ],
});

await prisma.promptComposition.create({
  data: {
    key: "blog-post-generator",
    name: "Blog Post Generator",
    blocks: [
      { key: "system-role", order: 1 },
      { key: "blog-structure", order: 2 },
    ],
  },
});
```

**Usage**:

```typescript
const prompt = await promptManager.composePrompt("blog-post-generator");
const blogPost = await ai.generateContent(prompt, BlogPostSchema);
```

### Extended Caching

OpenAI's extended caching reduces costs by caching prompts for 24 hours.

**Enabled by default** in `OpenAIPromptManagerService`:

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-5",
  messages: [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: composedPrompt,
          cache_control: { type: "ephemeral" }, // 24-hour cache
        },
      ],
    },
  ],
});
```

---

## 14. Theme System

### Overview

Centralized, type-safe theme system using **OKLCH color space** for perceptually uniform colors.

**Location**: `src/lib/theme/`

### Brand Colors

**File**: `src/lib/theme/constants.ts`

```typescript
export const BARQ_COLORS = {
  yellow: "oklch(0.95 0.15 100)", // Primary brand color
  black: "oklch(0.1 0 0)", // Dark backgrounds
  blue: "oklch(0.5 0.2 250)", // Accent blue
  lightBlue: "oklch(0.8 0.1 240)", // Light blue
  purple: "oklch(0.6 0.2 300)", // Accent purple
  orange: "oklch(0.7 0.2 50)", // Warning/accent
};
```

### Tailwind Integration

**File**: `tailwind.config.ts`

Colors are auto-generated as Tailwind utilities:

- `bg-barq-yellow`
- `text-barq-black`
- `border-barq-blue`
- Opacity modifiers: `bg-barq-yellow/10`, `text-barq-blue/50`

### Semantic Tokens

Design system colors for common use cases:

- `bg-primary` / `text-primary` - Primary brand color
- `bg-destructive` / `text-destructive` - Errors, deletions
- `bg-success` / `text-success` - Success states
- `bg-warning` / `text-warning` - Warnings
- `bg-muted` / `text-muted` - Secondary content

### Dark Mode

**Provider**: `next-themes`

```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>;
```

**Usage**:

```tsx
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </Button>
  );
}
```

### Best Practices

✅ **DO**:

- Use Tailwind utilities: `bg-barq-yellow`, `text-barq-light-blue`
- Use semantic tokens: `bg-primary`, `bg-destructive`
- Use opacity modifiers: `bg-barq-yellow/10`

❌ **DON'T**:

- Hardcode colors: `text-[#FFDA00]`
- Use CSS variables directly: `bg-[--color-barq-yellow]`
- Use arbitrary color values: `bg-blue-500 dark:bg-blue-900`

**Reference**: See [docs/THEME_SYSTEM.md](docs/THEME_SYSTEM.md) for complete documentation.

---

## 15. Error Handling

### Error Types

**Domain Errors** (`src/core/domain/errors/`):

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID ${id} not found`);
    this.name = "NotFoundError";
  }
}
```

### Controller Error Handling

**Utility**: `src/interface-adapters/controllers/error-handler.ts`

```typescript
import { handleControllerError } from "./error-handler";

export async function createTaskAction(
  data: CreateTaskDTO,
): Promise<ActionResponse<TaskDTO>> {
  try {
    // ... create task logic
    return { success: true, data: presentTask(task) };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createTaskAction" },
      "Failed to create task",
    );
  }
}
```

**Handles**:

- Zod validation errors
- Domain errors (ValidationError, NotFoundError)
- Prisma errors
- Unknown errors

### UI Error Handling

**Toast Notifications** (Sonner):

```tsx
import { toast } from "sonner";

async function handleSubmit() {
  const result = await createTaskAction(data);
  if (result.success) {
    toast.success("Task created successfully!");
  } else {
    toast.error(result.error);
  }
}
```

---

## 16. Logging

### Logger Setup

**Location**: `src/lib/logger.ts`

Structured logging with LOG_LEVEL support.

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.level = envLevel ? LogLevel[envLevel as keyof typeof LogLevel] : level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  scope(name: string): Logger {
    return new ScopedLogger(name, this.level);
  }
}
```

### Scoped Loggers

```typescript
export const logger = new Logger();
export const controllerLogger = logger.scope("Controller");
export const useCaseLogger = logger.scope("UseCase");
export const repositoryLogger = logger.scope("Repository");
export const aiLogger = logger.scope("AI");
```

### Usage

```typescript
import { controllerLogger } from "@/lib/logger";

controllerLogger.info("Creating task", { title: "Example" });
controllerLogger.error("Failed to create task", { error: e.message });
```

### Environment Configuration

```env
LOG_LEVEL=debug   # Enable all logs
LOG_LEVEL=info    # Production default
LOG_LEVEL=error   # Only errors
```

---

## 17. Testing Strategy

### Unit Tests

Test individual units in isolation (not yet implemented, but recommended).

**Recommended**: Vitest

```typescript
import { describe, it, expect, vi } from "vitest";
import { CreateTaskUseCase } from "@/core/use-cases/task/create-task.use-case";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";

describe("CreateTaskUseCase", () => {
  it("should create a task", async () => {
    // Mock repository
    const mockRepo: ITaskRepository = {
      create: vi.fn().mockResolvedValue(mockTask),
      // ... other methods
    };

    const useCase = new CreateTaskUseCase(mockRepo);
    const result = await useCase.execute({ title: "Test Task" });

    expect(result.title).toBe("Test Task");
    expect(mockRepo.create).toHaveBeenCalledOnce();
  });
});
```

### Integration Tests

Test multiple layers together (not yet implemented).

### E2E Tests

Test full user flows (not yet implemented).

**Recommended**: Playwright

---

## 18. Deployment

### Environment Variables

**Production `.env`**:

```env
DATABASE_URL="postgresql://user:password@host:5432/db"
OPENAI_API_KEY="sk-..."
NODE_ENV="production"
LOG_LEVEL="info"
```

### Build

```bash
npm run build
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Deploy to Railway/Render

1. Add `Dockerfile` (optional)
2. Configure environment variables
3. Connect to PostgreSQL addon
4. Deploy

### Database Migrations

**Production migrations**:

```bash
npx prisma migrate deploy
```

**DO NOT** use `db:push` in production - use migrations.

---

## 19. Troubleshooting

### Common Issues

**Issue**: `Module not found: Can't resolve '@/...'`

**Solution**: Check `tsconfig.json` paths configuration.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

**Issue**: `No Prisma Client found`

**Solution**: Generate Prisma Client:

```bash
npm run db:generate
```

---

**Issue**: `Cannot find module 'reflect-metadata'`

**Solution**: Ensure `reflect-metadata` is imported at app entry:

```typescript
import "reflect-metadata";
```

---

**Issue**: DI container errors

**Solution**: Verify all bindings are registered in `container.ts`.

---

**Issue**: Dark mode not working

**Solution**: Ensure `ThemeProvider` wraps app in `layout.tsx` with `suppressHydrationWarning` on `<html>`.

---

## 20. Best Practices

### Architecture

- ✅ Follow dependency rule (dependencies point inward)
- ✅ Keep business logic in entities
- ✅ Use interfaces for all dependencies
- ✅ One use case per user action
- ❌ Don't bypass layers (e.g., UI → Repository directly)

### TypeScript

- ✅ Enable strict mode
- ✅ Use interfaces for contracts
- ✅ Use Zod for runtime validation
- ❌ Avoid `any` type
- ❌ Don't use `@ts-ignore`

#### Type-Only Imports (CRITICAL)

**ALWAYS use `import type` for type-only imports** (interfaces, types, type aliases):

```typescript
// ✅ Correct - Type-only import
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { Task } from "@/core/domain/entities/task.entity";

// ❌ Incorrect - Value import for types
import { ITaskRepository } from "@/core/repositories/task.repository.interface";
```

**Why**: Turbopack (Next.js 16) strictly enforces type-only imports. Using value imports for interfaces causes "module has no exports" errors.

**ESLint Rule**: `@typescript-eslint/consistent-type-imports` enforces this pattern automatically.

**Rule of Thumb**:

- `import type { ... }` for interfaces, types, and type aliases
- `import { ... }` for classes, functions, and values
- VSCode/IDE auto-imports often suggest value imports - always verify!

### React

- ✅ Server components by default
- ✅ Use `"use client"` only when needed
- ✅ Keep components small and focused
- ❌ Don't import server code in client components

### Database

- ✅ Use migrations in production
- ✅ Index frequently queried fields
- ✅ Use transactions for multi-step operations
- ❌ Don't use `db:push` in production

### Error Handling

- ✅ Use domain errors for business rules
- ✅ Use `handleControllerError` in controllers
- ✅ Log errors with context
- ❌ Don't swallow errors silently

### Centralized Utilities

#### Date Formatting

**ALWAYS use the centralized date formatting utilities** instead of `.toLocaleDateString()` or `.toLocaleString()`:

```typescript
import { formatDate, formatDateTime, formatDateFull } from "@/lib/utils/date-format";

// ✅ Correct - Centralized utilities
<span>{formatDate(asset.purchaseDate)}</span>           // "Jan 15, 2024"
<span>{formatDateTime(log.createdAt)}</span>            // "Jan 15, 2024 at 2:30 PM"
<span>{formatDateFull(document.issueDate)}</span>       // "January 15, 2024"

// ❌ Incorrect - Manual formatting
<span>{new Date(asset.purchaseDate).toLocaleDateString()}</span>
```

**Available Functions** (`src/lib/utils/date-format.ts`):

| Function | Format | Use Case |
|----------|--------|----------|
| `formatDate()` | "Jan 15, 2024" | Tables, details, forms |
| `formatDateShort()` | "Jan 15" | Compact displays |
| `formatDateFull()` | "January 15, 2024" | Documents, reports |
| `formatDateTime()` | "Jan 15, 2024 at 2:30 PM" | Timestamps, logs |
| `formatTime()` | "2:30 PM" | Time-only context |
| `formatRelativeTime()` | "2 hours ago" | Activity, notifications |
| `formatDateISO()` | "2024-01-15" | Form input values |

All functions safely handle `null`, `undefined`, and invalid dates (returns "—" for display functions).

#### Status Colors

**ALWAYS use the centralized status color utilities** for consistent status badges:

```typescript
import { getStatusBadgeClasses, getStatusColor } from "@/lib/utils/status-colors";

// ✅ Correct - Centralized utilities
<Badge className={getStatusBadgeClasses(status)}>{status}</Badge>

// ❌ Incorrect - Manual color mapping
<Badge className={status === "active" ? "bg-green-500" : "bg-gray-500"}>{status}</Badge>
```

**Available Functions** (`src/lib/utils/status-colors.ts`):

| Function | Returns | Use Case |
|----------|---------|----------|
| `getStatusColor()` | Color name ("green", "blue", etc.) | Custom styling |
| `getStatusBadgeClasses()` | Tailwind classes with opacity | Standard badges |
| `getStatusBadgeSolidClasses()` | Solid background classes | Prominent badges |
| `getStatusDotClasses()` | Dot indicator classes | Status dots |
| `getStatusTextClasses()` | Text color classes | Status text |

**Pre-defined Mappings**: `reservationStatusColors`, `disposalStatusColors`, `complianceStatusColors`

**Color Semantics**:
- **Green**: Active, Success, Approved, Completed, Available
- **Blue**: Confirmed, In Progress, Info, Synced
- **Amber**: Pending, Warning, Waiting, Partial
- **Red**: Failed, Error, Cancelled, Inactive, Overdue
- **Gray**: Inactive, Unknown, Draft, N/A
- **Purple**: Reserved, Checked Out

### Code Quality & Linting

#### Unused Variables

Prefix intentionally unused variables/parameters with underscore to pass linting:

```typescript
// Interface contract parameter not used yet
private async writePrompts(_presentationId: string): Promise<void> {
  // Implementation coming later
}

// Callback parameter not needed
array.map((_item, index) => index);

// Error in catch block not used
try {
  await riskyOperation();
} catch (_error) {
  // Error logged elsewhere, just need to catch
}
```

**ESLint Rule**: `@typescript-eslint/no-unused-vars` with:

- `argsIgnorePattern: "^_"`
- `varsIgnorePattern: "^_"`
- `caughtErrorsIgnorePattern: "^_"`

**When to use**:

- Interface methods not yet implemented
- Callback parameters required by signature but not used
- Error variables when error details aren't needed

**When NOT to use**:

- Production code that will never use the parameter (remove it instead)
- Hiding legitimate unused variable warnings

---

## 21. Code Examples

### Complete CRUD Example

See the **Task** feature for a complete example:

1. **Entity**: [src/core/domain/entities/task.entity.ts](src/core/domain/entities/task.entity.ts)
2. **Repository Interface**: [src/core/repositories/task.repository.interface.ts](src/core/repositories/task.repository.interface.ts)
3. **Repository Implementation**: [src/infrastructure/repositories/prisma-task.repository.ts](src/infrastructure/repositories/prisma-task.repository.ts)
4. **Use Cases**: [src/core/use-cases/task/](src/core/use-cases/task/)
5. **Controller**: [src/interface-adapters/controllers/task.controller.ts](src/interface-adapters/controllers/task.controller.ts)
6. **DTOs**: [src/interface-adapters/dtos/task.dto.ts](src/interface-adapters/dtos/task.dto.ts)
7. **Presenter**: [src/interface-adapters/presenters/task.presenter.ts](src/interface-adapters/presenters/task.presenter.ts)
8. **Components**: [src/components/task/](src/components/task/)
9. **Page**: [src/app/tasks/page.tsx](src/app/tasks/page.tsx)

### Adding a New Feature: "Notes"

1. **Update Schema** (add to appropriate domain file in `schema/`):

```prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notes")
}
```

2. **Create Entity** (`note.entity.ts`):

```typescript
export class Note {
  constructor(
    public readonly id: string,
    public title: string,
    public content: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: { title: string; content: string }): Note {
    if (!props.title.trim()) throw new ValidationError("Title required");
    const now = new Date();
    return new Note("", props.title.trim(), props.content, now, now);
  }
}
```

3. **Create Repository Interface** (`note.repository.interface.ts`):

```typescript
export interface INoteRepository {
  findAll(): Promise<Note[]>;
  findById(id: string): Promise<Note | null>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
}
```

4. **Implement Repository** (`prisma-note.repository.ts`) - Similar to Task repository

5. **Create Use Cases** - Copy Task use cases, replace with Note

6. **CRITICAL: Create Barrel Export** (`src/core/use-cases/note/index.ts`):

```typescript
/**
 * Note Use Cases - Barrel Export
 */
export * from "./create-note.use-case";
export * from "./get-note.use-case";
export * from "./list-notes.use-case";
export * from "./update-note.use-case";
export * from "./delete-note.use-case";
```

**Why This Is Critical**: Controllers import use cases via `@/core/use-cases/note` path. Without the barrel export (`index.ts`), TypeScript cannot resolve the module during pre-commit type-checking, causing commit failures.

**Example Structure**:

```
src/core/use-cases/
├── note/
│   ├── create-note.use-case.ts
│   ├── get-note.use-case.ts
│   ├── list-notes.use-case.ts
│   ├── update-note.use-case.ts
│   ├── delete-note.use-case.ts
│   └── index.ts                    # ⭐ BARREL EXPORT (REQUIRED)
└── asset/
    ├── asset/
    │   ├── create-asset.use-case.ts
    │   ├── index.ts                # Exports all asset use cases
    │   └── ...
    ├── asset-category/
    │   └── ...
    └── index.ts                    # ⭐ BARREL EXPORT (REQUIRED)
```

**Common Mistake**: Forgetting the barrel export causes this error during `git commit`:

```
error TS2307: Cannot find module '@/core/use-cases/note' or its corresponding type declarations.
```

**Fix**: Always create `index.ts` in the use case module directory that exports all use cases.

7. **Register in DI** (`container.ts`):

```typescript
container
  .bind<INoteRepository>(DI_TOKENS.INoteRepository)
  .to(PrismaNoteRepository)
  .inSingletonScope();
```

8. **Create Controller** (`note.controller.ts`):

```typescript
"use server";

import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createNoteAction(data: CreateNoteDTO) {
  // CRITICAL: Always check permissions in server actions
  await requirePermission(PERMISSIONS.NOTES_CREATE);

  // ... use case execution
}

export async function listNotesAction() {
  await requirePermission(PERMISSIONS.NOTES_VIEW);
  // ... use case execution
}

// ... other actions with permission checks
```

9. **Add Permissions** (`permission-key.ts`):

```typescript
export const PERMISSIONS = {
  // ... existing permissions

  // Notes
  NOTES_VIEW: "notes:view",
  NOTES_CREATE: "notes:create",
  NOTES_UPDATE: "notes:update",
  NOTES_DELETE: "notes:delete",
  NOTES_MANAGE: "notes:manage",
} as const;
```

10. **Register Permissions** (`seed-rbac.ts`) - Add permission definitions to seed

11. **Add Route Protection** (`app/notes/page.tsx`):

**CRITICAL SECURITY PATTERN**:
```typescript
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { NotesPageClient } from "@/components/notes/notes-page-client";

// Required for auth/session pages
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  // CRITICAL: Server-side permission check (security boundary)
  await requirePermission(PERMISSIONS.NOTES_VIEW);

  return <NotesPageClient />;
}
```

12. **Register Route** (`protected-routes.ts`):

```typescript
export const PROTECTED_ROUTES: Record<string, RouteProtection> = {
  // ... existing routes

  "/notes": {
    requiredPermissions: [PERMISSIONS.NOTES_VIEW],
    description: "Note list",
  },
  "/notes/new": {
    requiredPermissions: [PERMISSIONS.NOTES_CREATE],
    description: "Create new note",
  },
  "/notes/[id]": {
    requiredPermissions: [PERMISSIONS.NOTES_VIEW],
    description: "View note details",
  },
};
```

13. **Create Components** (`notes-page-client.tsx`):

```typescript
"use client";

import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export function NotesPageClient() {
  // Client-side check for UX only (NOT security)
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.NOTES_CREATE);

  return (
    <div>
      {canCreate && <CreateNoteButton />}
      <NotesList />
    </div>
  );
}
```

**Security Checklist**:
- [x] Add `await requirePermission()` in all server actions
- [x] Add `await requirePermission()` in page.tsx (server component)
- [x] Add `export const dynamic = "force-dynamic"` to page.tsx
- [x] Extract client logic to `*-page-client.tsx`
- [x] Register route in `protected-routes.ts`
- [x] Test with viewer account to verify access denial

**Common Security Mistakes to Avoid**:
- ❌ Relying only on `usePermissions()` hook (can be bypassed)
- ❌ Relying only on `PermissionGuard` component (can be bypassed)
- ❌ Forgetting `export const dynamic = "force-dynamic"`
- ❌ Not checking permissions in server actions
- ✅ Always use server-side `requirePermission()` checks

---

## 22. FAQ

**Q: Do I need to use all layers for simple features?**

A: Yes, to maintain consistency and testability. The layers make refactoring easier.

---

**Q: Can I use a different database (MongoDB, MySQL)?**

A: Yes, change `datasource` in `schema/schema.prisma` and update repository implementations.

---

**Q: Can I use a different DI container (TSyringe, Awilix)?**

A: Yes, but you'll need to refactor `src/di/` and update all `@injectable()` decorators.

---

**Q: How do I add or customize authentication?**

A: Better Auth is already integrated (`src/lib/auth/better-auth.ts`). Extend that configuration (providers, hooks, session fields) and reuse the helpers in `src/lib/auth/session.ts`. When adding new auth flows, keep the layering pattern: Better Auth → interface adapters (API routes) → DI-powered use cases.

**Important Best Practices:**
- Use repository layer for user creation in use cases (NOT Better Auth API directly)
- Better Auth API calls require Next.js request context - only use in API routes
- Let Better Auth hooks handle cross-cutting concerns (e.g., Person entity creation)
- Account format for credential provider: `type: "oauth"`, `provider: "credential"`
- See [SYSTEM_SETUP.md](../features/SYSTEM_SETUP.md#refactoring-lessons-learned) for detailed patterns

---

**Q: Can I use this with React Native?**

A: The core (Domain, Use Cases, Infrastructure) is framework-agnostic and can be reused. Replace Presentation layer with React Native components.

---

**Q: How do I test use cases?**

A: Mock repository interfaces. See [Testing Strategy](#17-testing-strategy).

---

**Q: Can I remove the AI integration?**

A: Yes, remove AI services from `di/container.ts` and delete `src/infrastructure/services/ai/`.

---

**Q: How do I add real-time features (WebSockets)?**

A: Add a WebSocket service in Infrastructure layer. Use cases remain the same.

---

**Q: Can I use GraphQL instead of Server Actions?**

A: Yes, replace controllers with GraphQL resolvers. Use cases remain the same.

---

## Next Steps

1. **Explore the Task CRUD demo** at `/tasks`
2. **Read the architecture docs** - [CLAUDE.md](CLAUDE.md), [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Build your first feature** - Follow the "Notes" example above
4. **Add tests** - Set up Vitest for unit tests
5. **Deploy to production** - Vercel, Railway, or Render

**Need help?** Check the documentation in `docs/` or review the Task example code.
