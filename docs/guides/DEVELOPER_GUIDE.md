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
11. [Dependency Injection](#11-dependency-injection)
12. [Database & Prisma](#12-database--prisma)
13. [AI Integration](#13-ai-integration)
14. [Theme System](#14-theme-system)
15. [Error Handling](#15-error-handling)
16. [Logging](#16-logging)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment](#18-deployment)
19. [Troubleshooting](#19-troubleshooting)
20. [Best Practices](#20-best-practices)
21. [Code Examples](#21-code-examples)
22. [FAQ](#22-faq)

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
cp .env.example .env
# Edit .env with your database URL and OpenAI key

# Push database schema
npm run db:push

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
npm run start            # Start production server
npm run type-check       # TypeScript validation
npm run lint             # ESLint
npm run format           # Prettier (auto-fix)
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
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
│   │       ├── schema.prisma               # Database schema
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

---

## 11. Dependency Injection

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

```typescript
import "reflect-metadata";
import { Container } from "inversify";
import { registerDatabase } from "./modules/database.module";
import { registerServices } from "./modules/services.module";
import { registerUseCases } from "./modules/use-cases.module";
import { registerAI } from "./modules/ai.module";

let containerInstance: Container | null = null;

export function initContainer(): Container {
  if (!containerInstance) {
    const container = new Container();

    // Register all modules
    registerDatabase(container);
    registerServices(container);
    registerUseCases(container);
    registerAI(container);

    containerInstance = container;
  }

  return containerInstance;
}

export function getContainer(): Container {
  if (!containerInstance) {
    return initContainer();
  }
  return containerInstance;
}
```

### Module Example: Database

**File**: `src/di/modules/database.module.ts`

```typescript
import { Container } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "../types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import { PrismaTaskRepository } from "@/infrastructure/repositories/prisma-task.repository";

export function registerDatabase(container: Container): void {
  // Prisma Client (singleton)
  container
    .bind<PrismaClient>(DI_TOKENS.PrismaClient)
    .toDynamicValue(() => {
      return new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    })
    .inSingletonScope();

  // Task Repository (singleton)
  container
    .bind<ITaskRepository>(DI_TOKENS.ITaskRepository)
    .to(PrismaTaskRepository)
    .inSingletonScope();
}
```

### Module Example: Use Cases

**File**: `src/di/modules/use-cases.module.ts`

```typescript
import { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { CreateTaskUseCase } from "@/core/use-cases/task/create-task.use-case";
import { ListTasksUseCase } from "@/core/use-cases/task/list-tasks.use-case";
// ... other use cases

export function registerUseCases(container: Container): void {
  // Task Use Cases (transient - new instance per request)
  container
    .bind<CreateTaskUseCase>(DI_TOKENS.CreateTaskUseCase)
    .to(CreateTaskUseCase)
    .inTransientScope();

  container
    .bind<ListTasksUseCase>(DI_TOKENS.ListTasksUseCase)
    .to(ListTasksUseCase)
    .inTransientScope();

  // ... other use cases
}
```

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

**Location**: `src/infrastructure/database/prisma/schema.prisma`

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
# Development: Push schema changes directly
npm run db:push

# Production: Create migration file
npm run db:migrate

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
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
npx prisma generate
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

1. **Update Schema** (`schema.prisma`):

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

8. **Create Controller** - Similar to Task controller

9. **Create Components** - Similar to Task components

10. **Add Route** - Create `app/notes/page.tsx`

---

## 22. FAQ

**Q: Do I need to use all layers for simple features?**

A: Yes, to maintain consistency and testability. The layers make refactoring easier.

---

**Q: Can I use a different database (MongoDB, MySQL)?**

A: Yes, change `datasource` in `schema.prisma` and update repository implementations.

---

**Q: Can I use a different DI container (TSyringe, Awilix)?**

A: Yes, but you'll need to refactor `src/di/` and update all `@injectable()` decorators.

---

**Q: How do I add or customize authentication?**

A: Better Auth is already integrated (`src/lib/auth/better-auth.ts`). Extend that configuration (providers, hooks, session fields) and reuse the helpers in `src/lib/auth/session.ts`/`src/lib/auth/assign-first-admin.ts`. When adding new auth flows, keep the layering pattern: Better Auth → interface adapters (API routes) → DI-powered use cases.

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
