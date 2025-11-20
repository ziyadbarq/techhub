/**
 * Task Presenter
 *
 * Transforms Task domain entities into DTOs for the UI layer.
 * Ensures clean separation between domain and presentation.
 */

import type { Task } from "@/core/domain/entities/task.entity";

/**
 * Task DTO for presentation layer
 */
export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert Task entity to DTO
 *
 * @param task - Domain Task entity
 * @returns TaskDTO for UI consumption
 */
export function presentTask(task: Task): TaskDTO {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdBy: task.createdBy,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * Convert array of Task entities to DTOs
 *
 * @param tasks - Array of domain Task entities
 * @returns Array of TaskDTOs for UI consumption
 */
export function presentTasks(tasks: Task[]): TaskDTO[] {
  return tasks.map(presentTask);
}
