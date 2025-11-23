# Architecture Documentation

**Barq Assets** - Comprehensive architecture guide with diagrams.

## Table of Contents

1. [Overview](#overview)
2. [Clean Architecture Layers](#clean-architecture-layers)
3. [Data Flow](#data-flow)
4. [Dependency Injection](#dependency-injection)
5. [Component Relationships](#component-relationships)
6. [Request/Response Flow](#requestresponse-flow)
7. [Database Architecture](#database-architecture)
8. [AI Integration Architecture](#ai-integration-architecture)
9. [Design Principles](#design-principles)
10. [Scalability Considerations](#scalability-considerations)

---

## Overview

This assets app implements **Clean Architecture** (Robert C. Martin) with **Dependency Injection** to create maintainable, testable, and scalable applications.

### Core Principles

- **Separation of Concerns** - Each layer has a single responsibility
- **Dependency Inversion** - Dependencies point inward toward business logic
- **Framework Independence** - Business logic doesn't depend on Next.js, Prisma, etc.
- **Testability** - Mock dependencies for isolated unit tests

### Technology Stack

```
┌──────────────────────────────────────────────────────────┐
│                    Application Stack                      │
├──────────────────────────────────────────────────────────┤
│  UI Layer          │  Next.js 16, React 19, shadcn/ui    │
│  Validation        │  Zod, TypeScript                    │
│  State Management  │  React Hooks, Server Actions        │
│  DI Container      │  InversifyJS                        │
│  Database          │  Prisma ORM, PostgreSQL             │
│  AI Services       │  OpenAI API                         │
│  Styling           │  Tailwind CSS 4, OKLCH colors       │
└──────────────────────────────────────────────────────────┘
```

---

## Clean Architecture Layers

### Layer Diagram

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    1. PRESENTATION LAYER                      ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Next.js App Router                                     │ ║
║  │  • app/page.tsx (Landing)                               │ ║
║  │  • app/tasks/page.tsx (Task Demo)                       │ ║
║  │  • app/layout.tsx (Root Layout)                         │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  React Components                                       │ ║
║  │  • components/ui/ (shadcn/ui primitives)                │ ║
║  │  • components/task/ (Task CRUD components)              │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                 2. INTERFACE ADAPTERS LAYER                   ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Controllers (Server Actions)                           │ ║
║  │  • task.controller.ts                                   │ ║
║  │  • error-handler.ts                                     │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  DTOs (Data Transfer Objects)                           │ ║
║  │  • task.dto.ts (Zod schemas)                            │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Presenters (Entity → DTO transformation)               │ ║
║  │  • task.presenter.ts                                    │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                    3. USE CASES LAYER                         ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Application Business Rules                             │ ║
║  │  • create-task.use-case.ts                              │ ║
║  │  • list-tasks.use-case.ts                               │ ║
║  │  • update-task.use-case.ts                              │ ║
║  │  • delete-task.use-case.ts                              │ ║
║  │  • complete-task.use-case.ts                            │ ║
║  │  • get-task.use-case.ts                                 │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                     4. DOMAIN LAYER                           ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Entities (Business Objects)                            │ ║
║  │  • task.entity.ts                                       │ ║
║  │  • prompt-block.entity.ts                               │ ║
║  │  • prompt-composition.entity.ts                         │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Repository Interfaces                                  │ ║
║  │  • task.repository.interface.ts                         │ ║
║  │  • prompt-block.repository.interface.ts                 │ ║
║  │  • prompt-composition.repository.interface.ts           │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Service Interfaces                                     │ ║
║  │  • ai-content-generator.service.interface.ts            │ ║
║  │  • ai-prompt-manager.service.interface.ts               │ ║
║  │  • ai-debug-trace.service.interface.ts                  │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Domain Errors                                          │ ║
║  │  • validation.error.ts                                  │ ║
║  │  • not-found.error.ts                                   │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                  5. INFRASTRUCTURE LAYER                      ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Repository Implementations                             │ ║
║  │  • prisma-task.repository.ts                            │ ║
║  │  • prisma-prompt-block.repository.ts                    │ ║
║  │  • prisma-prompt-composition.repository.ts              │ ║
║  │  • prisma-helpers.ts (JSON utilities)                   │ ║
║  │  • repository-logger.ts                                 │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Service Implementations                                │ ║
║  │  • openai-content-generator.service.ts                  │ ║
║  │  • openai-prompt-manager.service.ts                     │ ║
║  │  • openai-debug-trace.service.ts                        │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │  Database                                               │ ║
║  │  • schema.prisma (PostgreSQL schema)                    │ ║
║  │  • seed.ts (Seed data)                                  │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

                            ▲
                            │
                  Dependencies Point Inward
```

### Layer Dependencies

```
Presentation Layer
    │
    ├──> Interface Adapters Layer
    │       │
    │       ├──> Use Cases Layer
    │       │       │
    │       │       ├──> Domain Layer (Core)
    │       │       │
    │       │       └──> Repository Interfaces (Domain)
    │       │
    │       └──> DTOs & Presenters
    │
    └──> UI Components

Infrastructure Layer
    │
    └──> Implements Domain Interfaces
            │
            ├──> Repository Implementations
            └──> Service Implementations
```

**Key Rule**: Inner layers NEVER depend on outer layers.

---

## Data Flow

### Complete Request → Response Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTION                          │
│                  (Click "Create Task")                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               1. UI COMPONENT (Client)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TaskForm.tsx                                        │  │
│  │  • Collect form data (title, description, status)    │  │
│  │  • Validate client-side (optional)                   │  │
│  │  • Call server action: createTaskAction(data)        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            2. CONTROLLER (Server Action)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  task.controller.ts :: createTaskAction()            │  │
│  │  • Validate with Zod schema (CreateTaskSchema)       │  │
│  │  • Get use case from DI container                    │  │
│  │  • Execute use case                                  │  │
│  │  • Transform result with presenter                   │  │
│  │  • Return ActionResponse<TaskDTO>                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  3. USE CASE                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CreateTaskUseCase                                   │  │
│  │  • Call Task.create() factory method                 │  │
│  │  • Validate business rules (in entity)               │  │
│  │  • Call repository.create(task)                      │  │
│  │  • Return domain entity                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   4. ENTITY                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Task.create()                                       │  │
│  │  • Validate title (required, max 200 chars)          │  │
│  │  • Validate description (max 2000 chars)             │  │
│  │  • Set default status (PENDING)                      │  │
│  │  • Set timestamps                                    │  │
│  │  • Return new Task instance                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              5. REPOSITORY INTERFACE                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ITaskRepository :: create(task: Task)               │  │
│  │  • Abstract contract                                 │  │
│  │  • No implementation details                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          6. REPOSITORY IMPLEMENTATION                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PrismaTaskRepository :: create(task)                │  │
│  │  • Convert entity to Prisma data                     │  │
│  │  • Call prisma.task.create()                         │  │
│  │  • Convert Prisma result to entity (toDomain)        │  │
│  │  • Return domain entity                              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    7. DATABASE                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL                                          │  │
│  │  • INSERT INTO tasks (title, description, ...)       │  │
│  │  • Generate CUID for id                              │  │
│  │  • Set timestamps                                    │  │
│  │  • Return inserted row                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
      ╔════════════════════════════════════════════╗
      ║       RESPONSE FLOWS BACK UP               ║
      ╚════════════════════════════════════════════╝
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               8. PRESENTER                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  presentTask(task: Task): TaskDTO                    │  │
│  │  • Convert Date objects to ISO strings               │  │
│  │  • Convert domain entity to DTO                      │  │
│  │  • Return serializable object                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 9. CONTROLLER RESPONSE                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Return: { success: true, data: TaskDTO }            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                10. UI COMPONENT                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TaskForm.tsx                                        │  │
│  │  • Receive result                                    │  │
│  │  • Show success toast                                │  │
│  │  • Close form dialog                                 │  │
│  │  • Trigger task list refresh                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Error Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     ERROR OCCURS                            │
│  (e.g., Validation fails in entity)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ENTITY throws ValidationError                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│       USE CASE propagates error (doesn't catch)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│   CONTROLLER catches error in try/catch                     │
│   • Pass to handleControllerError()                         │
│   • Log with controllerLogger                               │
│   • Return: { success: false, error: "message" }            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            UI COMPONENT receives error                      │
│   • Show error toast                                        │
│   • Keep form open with data                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependency Injection

### DI Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   DI CONTAINER (InversifyJS)                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  TOKENS (Symbols)                                     │ │
│  │  • Symbol.for("ITaskRepository")                      │ │
│  │  • Symbol.for("CreateTaskUseCase")                    │ │
│  │  • Symbol.for("PrismaClient")                         │ │
│  │  • ... all dependencies                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  BINDINGS (Interface → Implementation)                │ │
│  │  • ITaskRepository → PrismaTaskRepository             │ │
│  │  • IAIContentGenerator → OpenAIContentGenerator       │ │
│  │  • CreateTaskUseCase → CreateTaskUseCase (self)       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  SCOPES                                               │ │
│  │  • Singleton: Repositories, Services, PrismaClient    │ │
│  │  • Transient: Use Cases                               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Resolution

```
Controller requests CreateTaskUseCase
    │
    ▼
Container.get(DI_TOKENS.CreateTaskUseCase)
    │
    ▼
Container checks bindings
    │
    ├──> Finds CreateTaskUseCase binding
    │
    ├──> Reads constructor parameters (@inject decorators)
    │       │
    │       └──> Needs: ITaskRepository
    │
    ├──> Resolves ITaskRepository
    │       │
    │       └──> Container.get(DI_TOKENS.ITaskRepository)
    │               │
    │               ├──> Finds PrismaTaskRepository binding
    │               │
    │               ├──> Reads constructor parameters
    │               │       │
    │               │       └──> Needs: PrismaClient
    │               │
    │               ├──> Resolves PrismaClient
    │               │       │
    │               │       └──> Container.get(DI_TOKENS.PrismaClient)
    │               │               │
    │               │               └──> Returns singleton instance
    │               │
    │               └──> Creates PrismaTaskRepository instance
    │                       with PrismaClient injected
    │
    └──> Creates CreateTaskUseCase instance
            with ITaskRepository injected
```

### Module Organization

```
di/
├── container.ts          # Main container initialization
├── types.ts              # DI token definitions
└── modules/
    ├── database.module.ts    # Binds: PrismaClient, Repositories
    ├── services.module.ts    # Binds: AI services
    ├── use-cases.module.ts   # Binds: All use cases
    └── ai.module.ts          # Binds: AI-specific modules

Each module:
  • Receives Container instance
  • Binds interfaces to implementations
  • Configures scopes (singleton/transient)
```

---

## Component Relationships

### Task CRUD Components

```
┌─────────────────────────────────────────────────────────────┐
│                     app/tasks/page.tsx                      │
│                      (Server Component)                     │
│                                                             │
│  • Initializes DI container                                 │
│  • Renders <TaskList />                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                <TaskList /> (Client Component)              │
│                                                             │
│  State:                                                     │
│  • tasks: TaskDTO[]                                         │
│  • filteredTasks: TaskDTO[]                                 │
│  • selectedStatus: TaskStatus | "ALL"                       │
│  • isLoading: boolean                                       │
│  • isFormOpen: boolean                                      │
│  • editingTask: TaskDTO | null                              │
│                                                             │
│  Effects:                                                   │
│  • useEffect(() => loadTasks(), [])                         │
│  • useEffect(() => filterTasks(), [tasks, selectedStatus])  │
│                                                             │
│  Methods:                                                   │
│  • loadTasks() - Calls listTasksAction()                    │
│  • handleEdit(task) - Opens form with task data             │
│  • handleFormClose() - Closes form, clears editingTask      │
│  • handleSuccess() - Reloads tasks                          │
└────┬────────────────────┬───────────────────┬──────────────┘
     │                    │                   │
     ▼                    ▼                   ▼
┌─────────────┐  ┌──────────────┐  ┌────────────────┐
│<TaskFilters>│  │  <TaskItem>  │  │  <TaskForm>    │
│             │  │   (repeated) │  │   (Dialog)     │
│ Props:      │  │              │  │                │
│ • selected  │  │ Props:       │  │ Props:         │
│ • onChange  │  │ • task       │  │ • open         │
│             │  │ • onUpdate   │  │ • onOpenChange │
│ Renders:    │  │ • onEdit     │  │ • onSuccess    │
│ • Filter    │  │              │  │ • task (edit)  │
│   buttons   │  │ Renders:     │  │                │
│ (All, Pend, │  │ • Task card  │  │ State:         │
│  InProg,    │  │ • Complete   │  │ • title        │
│  Completed) │  │   button     │  │ • description  │
│             │  │ • Edit btn   │  │ • status       │
│             │  │ • Delete btn │  │ • isSubmitting │
│             │  │              │  │                │
│             │  │ Calls:       │  │ Calls:         │
│             │  │ • completeTA │  │ • createTA or  │
│             │  │ • deleteTA   │  │   updateTA     │
│             │  │ • onEdit()   │  │                │
└─────────────┘  └──────────────┘  └────────────────┘

Legend:
  TA = TaskAction (server action)
```

### Component Communication

```
Event Flow:

1. User clicks "New Task" button in <TaskList>
   │
   ├──> Sets isFormOpen = true
   └──> Renders <TaskForm open={true} />

2. User fills form and clicks "Create"
   │
   ├──> <TaskForm> calls createTaskAction(data)
   │
   ├──> Server action returns result
   │
   ├──> If success: toast.success(), onSuccess()
   │                │
   │                └──> <TaskList> handleSuccess() → loadTasks()
   │
   └──> If error: toast.error(result.error)

3. User clicks status filter in <TaskFilters>
   │
   ├──> Calls onStatusChange(status)
   │
   └──> <TaskList> updates selectedStatus state
           │
           └──> useEffect filters tasks
                   │
                   └──> Re-renders <TaskItem> list
```

---

## Request/Response Flow

### Server Action Execution

```
┌─────────────────────────────────────────────────────────────┐
│               CLIENT COMPONENT                              │
│  const result = await createTaskAction(data)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │  (RPC call)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               SERVER ACTION                                 │
│  "use server"                                               │
│                                                             │
│  export async function createTaskAction(                    │
│    data: CreateTaskDTO                                      │
│  ): Promise<ActionResponse<TaskDTO>> {                      │
│    try {                                                    │
│      // 1. Validate                                         │
│      const validated = CreateTaskSchema.parse(data);        │
│                                                             │
│      // 2. Get container                                    │
│      const container = getContainer();                      │
│                                                             │
│      // 3. Resolve use case                                 │
│      const useCase = container.get(DI_TOKENS.CreateTask);   │
│                                                             │
│      // 4. Execute                                          │
│      const task = await useCase.execute(validated);         │
│                                                             │
│      // 5. Present                                          │
│      return { success: true, data: presentTask(task) };     │
│    } catch (error) {                                        │
│      return handleControllerError(error, ...);              │
│    }                                                        │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │  (Returns ActionResponse)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               CLIENT COMPONENT                              │
│  if (result.success) {                                      │
│    toast.success("Created!");                               │
│    onSuccess();                                             │
│  } else {                                                   │
│    toast.error(result.error);                               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### ActionResponse Pattern

```typescript
// Discriminated Union Type
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Benefits:
// 1. Type-safe error handling
// 2. Consistent API across all controllers
// 3. Forces explicit error handling in UI
```

---

## Database Architecture

### Prisma Schema Relationships

```
┌──────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐                                      │
│  │     Task       │                                      │
│  ├────────────────┤                                      │
│  │ id: String     │ @id @default(cuid())                 │
│  │ title: String  │                                      │
│  │ description    │ String? @db.Text                     │
│  │ status         │ TaskStatus @default(PENDING)         │
│  │ createdAt      │ DateTime @default(now())             │
│  │ updatedAt      │ DateTime @updatedAt                  │
│  └────────────────┘                                      │
│    Indexes: status, createdAt                            │
│                                                          │
│  ┌────────────────┐                                      │
│  │  PromptBlock   │                                      │
│  ├────────────────┤                                      │
│  │ id: String     │ @id @default(cuid())                 │
│  │ key: String    │ @unique                              │
│  │ name: String   │                                      │
│  │ description    │ String? @db.Text                     │
│  │ content        │ String @db.Text                      │
│  │ metadata       │ Json?                                │
│  │ createdAt      │ DateTime @default(now())             │
│  │ updatedAt      │ DateTime @updatedAt                  │
│  └────────────────┘                                      │
│    Indexes: key                                          │
│                                                          │
│  ┌─────────────────────┐                                 │
│  │ PromptComposition   │                                 │
│  ├─────────────────────┤                                 │
│  │ id: String          │ @id @default(cuid())            │
│  │ key: String         │ @unique                         │
│  │ name: String        │                                 │
│  │ description         │ String? @db.Text                │
│  │ blocks              │ Json (Array of {key, order})    │
│  │ metadata            │ Json?                           │
│  │ createdAt           │ DateTime @default(now())        │
│  │ updatedAt           │ DateTime @updatedAt             │
│  └─────────────────────┘                                 │
│    Indexes: key                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Repository → Database Mapping

```
Domain Entity                Prisma Model              Database Table
─────────────────────────────────────────────────────────────────────
Task                    →    Task                  →   tasks
  • id: string               • id: string               • id (CUID)
  • title: string            • title: string            • title (VARCHAR)
  • description: string|null • description: string|null • description (TEXT)
  • status: TaskStatus       • status: TaskStatus       • status (ENUM)
  • createdAt: Date          • createdAt: Date          • created_at (TIMESTAMP)
  • updatedAt: Date          • updatedAt: Date          • updated_at (TIMESTAMP)

Transformation happens in Repository:
  • toDomain(): Prisma Model → Domain Entity
  • toData(): Domain Entity → Prisma Create/Update Input
```

---

## AI Integration Architecture

### AI Service Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    AI INTEGRATION                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Use Case Layer                                       │ │
│  │  • GenerateContentUseCase (hypothetical)              │ │
│  │  • Depends on: IAIContentGeneratorService             │ │
│  └────────────────────┬──────────────────────────────────┘ │
│                       │                                     │
│                       ▼                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Service Interface (Domain Layer)                     │ │
│  │  • IAIContentGeneratorService                         │ │
│  │  • IAIPromptManagerService                            │ │
│  │  • IAIDebugTraceService                               │ │
│  └────────────────────┬──────────────────────────────────┘ │
│                       │                                     │
│                       ▼                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Service Implementation (Infrastructure)              │ │
│  │  • OpenAIContentGeneratorService                      │ │
│  │    - Uses OpenAI SDK                                  │ │
│  │    - Structured outputs with Zod schemas              │ │
│  │    - Extended caching (24h)                           │ │
│  │  • OpenAIPromptManagerService                         │ │
│  │    - Fetches prompt blocks from DB                    │ │
│  │    - Composes prompts in order                        │ │
│  │  • OpenAIDebugTraceService                            │ │
│  │    - Logs requests/responses                          │ │
│  └────────────────────┬──────────────────────────────────┘ │
│                       │                                     │
│                       ▼                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  External API                                         │ │
│  │  • OpenAI GPT-5 API                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Composition Flow

```
1. Use Case requests composed prompt
   │
   ▼
2. PromptManagerService.composePrompt("blog-post-generator")
   │
   ├──> Fetch PromptComposition by key
   │       │
   │       └──> SELECT * FROM prompt_compositions WHERE key = ?
   │
   ├──> Get blocks array: [{ key: "system-role", order: 1 }, ...]
   │
   ├──> For each block:
   │       │
   │       ├──> Fetch PromptBlock by key
   │       │       │
   │       │       └──> SELECT * FROM prompt_blocks WHERE key = ?
   │       │
   │       └──> Add content to composition
   │
   └──> Return concatenated prompt string

3. ContentGeneratorService.generateContent(prompt, schema)
   │
   ├──> Call OpenAI API with:
   │       • messages: [{ role: "system", content: prompt }]
   │       • cache_control: { type: "ephemeral" }
   │       • response_format: { type: "json_schema", schema }
   │
   └──> Parse response with Zod schema

4. Return structured data to use case
```

---

## Design Principles

### SOLID Principles

**Single Responsibility Principle (SRP)**

- Each class has one reason to change
- Entities: Business logic only
- Use Cases: Orchestration only
- Repositories: Data access only

**Open/Closed Principle (OCP)**

- Open for extension, closed for modification
- Add new features without changing existing code
- Example: Add new repository without changing entity

**Liskov Substitution Principle (LSP)**

- Implementations can replace interfaces
- PrismaTaskRepository can replace ITaskRepository
- No behavioral changes

**Interface Segregation Principle (ISP)**

- Clients shouldn't depend on unused methods
- Repositories have focused interfaces
- No "god interfaces"

**Dependency Inversion Principle (DIP)**

- **Most Important**: High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Use Cases depend on ITaskRepository, not PrismaTaskRepository

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                   CONCERN SEPARATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Business Logic      →  Domain Layer (Entities)             │
│  Application Logic   →  Use Cases Layer                     │
│  Data Validation     →  DTOs (Zod), Entities                │
│  Data Access         →  Repositories (Infrastructure)       │
│  External Services   →  Services (Infrastructure)           │
│  User Interface      →  Components (Presentation)           │
│  Request Handling    →  Controllers (Interface Adapters)    │
│  Data Transformation →  Presenters (Interface Adapters)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless Design**: No server-side sessions
- **Database Connection Pooling**: Prisma connection pooling
- **Caching**: OpenAI extended caching (24h)
- **Load Balancing**: Multiple Next.js instances

### Vertical Scaling

- **Database Optimization**: Indexes on frequently queried fields
- **Query Optimization**: Prisma query performance
- **Memory Management**: Singleton services, transient use cases

### Extensibility Points

```
Add New Entity:
  1. Create entity in domain/entities/
  2. Create repository interface in core/repositories/
  3. Implement repository in infrastructure/repositories/
  4. Create use cases in core/use-cases/
  5. Register in DI container
  6. Create controller in interface-adapters/
  7. Build UI components

Add New Data Source:
  1. Create new repository implementation
  2. Update DI bindings
  3. No changes to use cases or entities

Add New AI Provider (e.g., Anthropic):
  1. Implement IAIContentGeneratorService
  2. Update DI bindings
  3. No changes to use cases

Add New UI Framework (e.g., React Native):
  1. Keep Domain, Use Cases, Infrastructure layers
  2. Replace Presentation layer
  3. Create new controllers if needed
```

---

## Summary

This architecture prioritizes:

1. **Maintainability** - Clear separation of concerns
2. **Testability** - Mock dependencies easily
3. **Flexibility** - Swap implementations without breaking changes
4. **Scalability** - Add features without refactoring
5. **Developer Experience** - Type safety, validation, clear patterns

**Key Takeaway**: Dependencies point inward. Business logic (Domain) has ZERO dependencies on frameworks, UI, or databases.

---

**Next Steps**:

- Review [CLAUDE.md](CLAUDE.md) for development workflows
- Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for comprehensive guide
- Explore [src/app/tasks/](src/app/tasks/) for live example
- Study Task CRUD implementation for patterns
