/**
 * Update Task Use Case
 *
 * Business logic for updating an existing task.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Task } from "@/core/domain/entities/task.entity";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";

export interface UpdateTaskProps {
  id: string;
  title?: string;
  description?: string | null;
}

@injectable()
export class UpdateTaskUseCase {
  constructor(
    @inject(DI_TOKENS.ITaskRepository)
    private readonly taskRepository: ITaskRepository,
  ) {}

  /**
   * Execute update task use case
   *
   * @param props - Update properties
   * @returns Updated task
   * @throws NotFoundError if task not found
   */
  async execute(props: UpdateTaskProps): Promise<Task> {
    // Fetch existing task
    const task = await this.taskRepository.findById(props.id);
    if (!task) {
      throw new NotFoundError("Task not found", "Task", props.id);
    }

    // Update fields using domain methods (includes validation)
    if (props.title !== undefined) {
      task.updateTitle(props.title);
    }

    if (props.description !== undefined) {
      task.updateDescription(props.description);
    }

    // Persist changes
    return await this.taskRepository.update(task);
  }
}
