/**
 * List Tasks Use Case
 *
 * Business logic for listing all tasks with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Task } from "@/core/domain/entities/task.entity";
import type {
  ITaskRepository,
  TaskFilterOptions,
} from "@/core/repositories/task.repository.interface";

@injectable()
export class ListTasksUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
  ) {}

  /**
   * Execute list tasks use case
   *
   * @param filter - Optional filter options
   * @returns Array of tasks
   */
  async execute(filter?: TaskFilterOptions): Promise<Task[]> {
    return await this.taskRepository.findAll(filter);
  }
}
