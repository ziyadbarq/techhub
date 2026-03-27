/**
 * Task Repository Interface
 *
 * This interface defines the contract for Task data access operations.
 * Follows the Repository Pattern from Clean Architecture.
 *
 * Example CRUD repository demonstrating the architecture.
 */

import type { Task, TaskStatus } from "../domain/entities/task.entity";

/**
 * Filter options for listing tasks
 */
export interface TaskFilterOptions {
  status?: TaskStatus;
  limit?: number;
}

/**
 * ITaskRepository
 *
 * Repository interface for Task entity.
 * Implementations handle database-specific logic.
 */
export interface ITaskRepository {
  /**
   * Find all tasks with optional filtering
   *
   * @param filter - Optional filter options
   * @returns Promise of Task array
   */
  findAll(filter?: TaskFilterOptions): Promise<Task[]>;

  /**
   * Find a task by ID
   *
   * @param id - Task ID
   * @returns Promise of Task or null if not found
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Create a new task
   *
   * @param task - Task entity to create
   * @returns Promise of created Task with generated ID
   */
  create(task: Task): Promise<Task>;

  /**
   * Update an existing task
   *
   * @param task - Task entity to update
   * @returns Promise of updated Task
   */
  update(task: Task): Promise<Task>;

  /**
   * Delete a task by ID
   *
   * @param id - Task ID to delete
   * @returns Promise that resolves when task is deleted
   */
  delete(id: string): Promise<void>;

  /**
   * Count tasks by status
   *
   * @returns Promise of count object with counts per status
   */
  countByStatus(): Promise<Record<TaskStatus, number>>;

  /**
   * Delete completed tasks older than the given date
   *
   * @param cutoffDate - Delete completed tasks older than this date
   * @param batchSize - Maximum number of tasks to delete in one call
   * @returns Promise of number of deleted tasks
   */
  deleteOldCompleted(cutoffDate: Date, batchSize: number): Promise<number>;
}
