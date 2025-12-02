/**
 * Update Conflict Status Use Case
 *
 * Allows admins to manually flag or clear conflicts on asset assignments.
 * Used when reviewing assignment discrepancies between Intune and manual sources.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { UpdateConflictStatusInput } from "./update-conflict-status.dto";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class UpdateConflictStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assignmentRepository: IAssetAssignmentRepository,
  ) {}

  @LogExecution()
  async execute(input: UpdateConflictStatusInput): Promise<void> {
    await this.assignmentRepository.updateConflictStatus(
      input.assignmentId,
      input.hasConflict,
      input.conflictNote,
    );
  }
}
