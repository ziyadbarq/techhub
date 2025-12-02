/**
 * List Assignment Conflicts Use Case
 *
 * Lists asset assignments that have conflicts between Intune and manual sources.
 * Used by admins to review and resolve assignment discrepancies.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import type { ListConflictsInput } from "./list-conflicts.dto";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class ListConflictsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assignmentRepository: IAssetAssignmentRepository,
  ) {}

  @LogExecution()
  async execute(input: ListConflictsInput): Promise<AssetAssignment[]> {
    return this.assignmentRepository.findConflicts({
      assetId: input.assetId,
      personId: input.personId,
      source: input.source,
      limit: input.limit,
      offset: input.offset,
    });
  }
}
