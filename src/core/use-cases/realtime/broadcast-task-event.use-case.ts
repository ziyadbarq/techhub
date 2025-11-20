/**
 * Broadcast Task Event Use Case
 *
 * Broadcasts task-related events to all connected clients via SSE.
 * This use case demonstrates how to integrate real-time features with business logic.
 *
 * Usage:
 * - Called after successful task mutations (create, update, delete, complete)
 * - Broadcasts to the 'tasks' SSE channel
 * - All connected clients receive the event immediately
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ISSEService } from "@/core/services/sse.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { Task } from "@/core/domain/entities/task.entity";

/**
 * Task event types
 */
export enum TaskEventType {
  CREATED = "task:created",
  UPDATED = "task:updated",
  DELETED = "task:deleted",
  COMPLETED = "task:completed",
}

/**
 * Task event payload
 */
export interface TaskEventPayload {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  timestamp: number;
}

/**
 * Broadcast Task Event Use Case
 */
@injectable()
export class BroadcastTaskEventUseCase {
  constructor(
    @inject(DI_TOKENS.ISSEService)
    private readonly sseService: ISSEService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  /**
   * Broadcasts a task event to all connected clients
   *
   * @param eventType - Type of task event
   * @param task - Task entity or task data
   * @param channel - SSE channel to broadcast to (default: 'tasks')
   */
  async execute(
    eventType: TaskEventType,
    task: Task | TaskEventPayload,
    channel: string = "tasks",
  ): Promise<void> {
    try {
      // Convert Task entity to payload if needed
      const timestamp = Date.now();
      const payload: TaskEventPayload =
        "toJSON" in task
          ? {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              timestamp,
            }
          : {
              ...task,
              timestamp:
                "timestamp" in task && task.timestamp
                  ? task.timestamp
                  : timestamp,
            };

      // Broadcast event
      await this.sseService.broadcastEvent(channel, {
        event: eventType,
        data: payload,
        id: crypto.randomUUID(),
      });

      this.logger.info("Broadcasted task event", {
        eventType,
        taskId: payload.id,
        channel,
      });
    } catch (error) {
      // Log error but don't fail the operation
      // Real-time broadcasting is non-critical
      this.logger.error(
        "Failed to broadcast task event",
        error instanceof Error ? error : new Error(String(error)),
        { eventType, channel },
      );
    }
  }

  /**
   * Broadcasts task created event
   */
  async broadcastCreated(
    task: Task | TaskEventPayload,
    channel?: string,
  ): Promise<void> {
    return this.execute(TaskEventType.CREATED, task, channel);
  }

  /**
   * Broadcasts task updated event
   */
  async broadcastUpdated(
    task: Task | TaskEventPayload,
    channel?: string,
  ): Promise<void> {
    return this.execute(TaskEventType.UPDATED, task, channel);
  }

  /**
   * Broadcasts task deleted event
   */
  async broadcastDeleted(taskId: string, channel?: string): Promise<void> {
    return this.execute(
      TaskEventType.DELETED,
      {
        id: taskId,
        title: "",
        status: "",
        timestamp: Date.now(),
      },
      channel,
    );
  }

  /**
   * Broadcasts task completed event
   */
  async broadcastCompleted(
    task: Task | TaskEventPayload,
    channel?: string,
  ): Promise<void> {
    return this.execute(TaskEventType.COMPLETED, task, channel);
  }
}
