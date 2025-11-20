/**
 * Delete Task Use Case
 *
 * Business logic for deleting a task.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";

@injectable()
export class DeleteTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
  ) {}

  /**
   * Execute delete task use case
   *
   * @param id - Task ID to delete
   */
  async execute(id: string): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
