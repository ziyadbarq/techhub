/**
 * UpdateAssetAssignment Use Case
 * Business Logic: Update an existing asset assignment with validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type {
  AssetAssignment,
  AssigneeType,
} from "@/core/domain/entities/asset-assignment.entity";

export interface UpdateAssetAssignmentInput {
  id: string;
  assigneeType?: AssigneeType;
  assigneeId?: string;
  startDate?: Date;
  endDate?: Date | null;
  isPrimary?: boolean;
  note?: string | null;
}

@injectable()
export class UpdateAssetAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  async execute(input: UpdateAssetAssignmentInput): Promise<AssetAssignment> {
    // Find existing assignment
    const assignment = await this.assetAssignmentRepository.findById(input.id);
    if (!assignment) {
      throw new Error(`Asset assignment with ID "${input.id}" not found`);
    }

    // Business Rule: Check for overlapping assignments if dates changed
    if (input.startDate || input.endDate !== undefined) {
      const startDate = input.startDate || assignment.startDate;
      const endDate =
        input.endDate !== undefined ? input.endDate : assignment.endDate;

      const hasOverlap =
        await this.assetAssignmentRepository.hasOverlappingAssignments(
          assignment.assetId,
          startDate,
          endDate,
          input.id, // Exclude current assignment from overlap check
        );

      if (hasOverlap) {
        throw new Error(
          "Cannot update assignment: This would create an overlapping assignment period",
        );
      }
    }

    // Update the entity (validation happens in entity method)
    assignment.update({
      assigneeType: input.assigneeType,
      assigneeId: input.assigneeId,
      startDate: input.startDate,
      endDate: input.endDate,
      isPrimary: input.isPrimary,
      note: input.note,
    });

    // Persist changes
    const updated = await this.assetAssignmentRepository.update(assignment);

    // Business Rule: If marked as primary, unset other primary assignments
    if (input.isPrimary) {
      await this.assetAssignmentRepository.setPrimaryAssignment(updated.id);
    }

    return updated;
  }
}
