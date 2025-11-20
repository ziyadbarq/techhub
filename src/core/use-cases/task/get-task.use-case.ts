/**
 * Get Task Use Case
 *
 * Business logic for retrieving a single task by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Task } from "@/core/domain/entities/task.entity";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";

@injectable()
export class GetTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
  ) {}

  /**
   * Execute get task use case
   *
   * @param id - Task ID
   * @returns Task or null if not found
   */
  async execute(id: string): Promise<Task | null> {
    return await this.taskRepository.findById(id);
  }
}
