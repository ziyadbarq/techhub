/**
 * Use Cases Module - DI Bindings
 *
 * This module configures all use case dependencies.
 * Use cases orchestrate business logic and coordinate between repositories and services.
 *
 * Responsibilities:
 * - Bind use case classes to the container
 * - Use transient scope for use cases (new instance per request)
 * - Enable dependency injection of repositories and services
 *
 * Architecture:
 * - Follows Clean Architecture's use case pattern
 * - Use cases are stateless and receive dependencies via constructor
 * - Transient scope ensures no state is shared between requests
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Task Use Cases (Example CRUD)
import {
  CreateTaskUseCase,
  ListTasksUseCase,
  GetTaskUseCase,
  UpdateTaskUseCase,
  DeleteTaskUseCase,
  CompleteTaskUseCase,
  ScheduleTaskReminderUseCase,
} from "../../core/use-cases/task";

// NOTE: Permission use cases imported in rbac.module.ts

// Audit Log Use Cases
import {
  ListAuditLogsUseCase,
  CountAuditLogsUseCase,
} from "../../core/use-cases/audit-log";

// Realtime Use Cases
import { BroadcastTaskEventUseCase } from "../../core/use-cases/realtime/broadcast-task-event.use-case";

import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds all use case dependencies to the container
 *
 * This function is called during container initialization to register
 * all use cases with transient scope (new instance per request).
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindUseCaseDependencies } from './use-cases.module';
 *
 * const container = new Container();
 * bindUseCaseDependencies(container);
 * ```
 */
export function bindUseCaseDependencies(container: Container): void {
  // ==========================================
  // Task Use Cases (Example CRUD)
  // ==========================================

  // Bind CreateTaskUseCase
  // Creates a new task with validation
  container
    .bind<CreateTaskUseCase>(DI_TOKENS.CreateTaskUseCase)
    .to(CreateTaskUseCase)
    .inTransientScope();

  // Bind ListTasksUseCase
  // Lists all tasks with optional filtering
  container
    .bind<ListTasksUseCase>(DI_TOKENS.ListTasksUseCase)
    .to(ListTasksUseCase)
    .inTransientScope();

  // Bind GetTaskUseCase
  // Retrieves a single task by ID
  container
    .bind<GetTaskUseCase>(DI_TOKENS.GetTaskUseCase)
    .to(GetTaskUseCase)
    .inTransientScope();

  // Bind UpdateTaskUseCase
  // Updates task fields with validation
  container
    .bind<UpdateTaskUseCase>(DI_TOKENS.UpdateTaskUseCase)
    .to(UpdateTaskUseCase)
    .inTransientScope();

  // Bind DeleteTaskUseCase
  // Deletes a task by ID
  container
    .bind<DeleteTaskUseCase>(DI_TOKENS.DeleteTaskUseCase)
    .to(DeleteTaskUseCase)
    .inTransientScope();

  // Bind CompleteTaskUseCase
  // Marks a task as completed
  container
    .bind<CompleteTaskUseCase>(DI_TOKENS.CompleteTaskUseCase)
    .to(CompleteTaskUseCase)
    .inTransientScope();

  // Bind ScheduleTaskReminderUseCase
  // Schedules a reminder for a task using job queue
  container
    .bind<ScheduleTaskReminderUseCase>(DI_TOKENS.ScheduleTaskReminderUseCase)
    .to(ScheduleTaskReminderUseCase)
    .inTransientScope();

  // ==========================================
  // Realtime Use Cases
  // ==========================================

  // Bind BroadcastTaskEventUseCase
  // Broadcasts task events via SSE to connected clients
  container
    .bind<BroadcastTaskEventUseCase>(DI_TOKENS.BroadcastTaskEventUseCase)
    .to(BroadcastTaskEventUseCase)
    .inTransientScope();

  // ==========================================
  // NOTE: Permission use cases are registered in rbac.module.ts

  // ==========================================
  // Audit Log Use Cases
  // ==========================================

  // Bind ListAuditLogsUseCase
  // Lists audit logs with filtering and pagination
  container
    .bind<ListAuditLogsUseCase>(DI_TOKENS.ListAuditLogsUseCase)
    .to(ListAuditLogsUseCase)
    .inTransientScope();

  // Bind CountAuditLogsUseCase
  // Counts audit logs with filtering
  container
    .bind<CountAuditLogsUseCase>(DI_TOKENS.CountAuditLogsUseCase)
    .to(CountAuditLogsUseCase)
    .inTransientScope();

  diLogger.debug("bindUseCaseDependencies", "Use case dependencies bound");
}

/**
 * Implementation Notes:
 *
 * 1. Transient Scope for Use Cases:
 *    - Use cases MUST be transient (new instance per request)
 *    - This prevents state leakage between requests
 *    - Each execution gets fresh dependencies
 *    - Memory is cleaned up after each use
 *
 * 2. Use Case Pattern:
 *    - Each use case has a single execute() method
 *    - Dependencies injected via constructor with @inject decorator
 *    - All use cases are decorated with @injectable()
 *    - Input/output types are well-defined interfaces
 *
 * 3. Dependency Injection:
 *    - Use cases depend on repositories and services
 *    - Never depend on other use cases (composition over inheritance)
 *    - Example constructor:
 *      @injectable()
 *      class CreateTaskUseCase {
 *        constructor(
 *          @inject(DI_TOKENS.ITaskRepository) repo: ITaskRepository
 *        ) {}
 *      }
 *
 * 4. Testing Use Cases:
 *    - Easy to test in isolation by mocking dependencies
 *    - Create a test container with mock repositories/services
 *    - Example:
 *      const testContainer = new Container();
 *      testContainer.bind(DI_TOKENS.ITaskRepository)
 *                   .toConstantValue(mockRepo);
 *      testContainer.bind(CreateTaskUseCase).toSelf();
 *      const useCase = testContainer.get(CreateTaskUseCase);
 *
 * 5. Error Handling:
 *    - Use cases throw domain-specific errors
 *    - Controllers/handlers catch and transform to HTTP responses
 *    - Never expose internal error details to clients
 *
 * 6. Validation:
 *    - Input validation happens in use cases
 *    - Domain validation happens in entities
 *    - Use cases coordinate between the two
 *
 * 7. Performance:
 *    - Transient scope has minimal overhead
 *    - Dependencies (repos, services) are singletons
 *    - Only the use case instance is recreated
 */
