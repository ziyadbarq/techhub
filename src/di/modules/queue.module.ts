/**
 * Queue Module - DI Bindings
 *
 * This module configures all job queue-related dependencies:
 * - Job Queue Service (BullMQ implementation)
 * - Use cases that depend on job queue
 *
 * Responsibilities:
 * - Bind IJobQueueService interface to BullMQ implementation
 * - Register queue-related use cases
 * - Ensure singleton scope for queue service (shared connection)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Service interfaces from core layer
import type { IJobQueueService } from "@/core/services/job-queue.service.interface";

// Service implementations from infrastructure layer
import { BullMQService } from "@/infrastructure/services/queue/bullmq.service";

// Use cases
import { ScheduleTaskReminderUseCase } from "@/core/use-cases/task/schedule-task-reminder.use-case";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds all job queue-related dependencies to the container
 *
 * @param container - InversifyJS container instance
 */
export function bindQueueDependencies(container: Container): void {
  // ==========================================
  // Bind Queue Service
  // ==========================================

  // Bind IJobQueueService to BullMQService
  // Singleton ensures we reuse the same Redis connection and queue instances
  container
    .bind<IJobQueueService>(DI_TOKENS.IJobQueueService)
    .to(BullMQService)
    .inSingletonScope();

  // ==========================================
  // Bind Queue-Related Use Cases
  // ==========================================

  // Bind ScheduleTaskReminderUseCase
  // Use cases MUST be transient to avoid state leakage between requests
  container
    .bind<ScheduleTaskReminderUseCase>(DI_TOKENS.ScheduleTaskReminderUseCase)
    .to(ScheduleTaskReminderUseCase)
    .inTransientScope();

  diLogger.debug("bindQueueDependencies", "Queue dependencies bound");
}

/**
 * Implementation Notes:
 *
 * 1. Service Scope:
 *    - IJobQueueService: MUST be singleton (shared connection pool)
 *    - Use Cases: MUST be transient (avoid state leakage between requests)
 *
 * 2. Connection Management:
 *    - BullMQService manages Redis connection internally
 *    - Connection is lazily initialized on first queue access
 *    - Shared across all queue instances for efficiency
 *
 * 3. Graceful Shutdown:
 *    - Call jobQueueService.close() during app shutdown
 *    - Ensures all pending jobs complete and connections close
 *
 * 4. Testing:
 *    - In tests, rebind IJobQueueService to mock implementation
 *    - InversifyJS v7: Use `await container.rebind()` or `container.rebindSync()` to replace bindings
 *    - Reset container between tests using resetContainer()
 */
