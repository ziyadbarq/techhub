/**
 * CreateAssetAssignment Use Case
 * Business Logic: Create a new asset assignment with overlap checking
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import {
  AssetAssignment,
  type CreateAssetAssignmentProps,
} from "@/core/domain/entities/asset-assignment.entity";

@injectable()
export class CreateAssetAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  async execute(props: CreateAssetAssignmentProps): Promise<AssetAssignment> {
    // Business Rule: Check for overlapping assignments (prevent double-booking)
    const startDate = props.startDate || new Date();
    const hasOverlap =
      await this.assetAssignmentRepository.hasOverlappingAssignments(
        props.assetId,
        startDate,
        props.endDate || null,
      );

    if (hasOverlap) {
      throw new Error(
        "Cannot create assignment: Asset already has an overlapping assignment during this period",
      );
    }

    // Create the entity (validation happens in entity factory)
    const assignment = AssetAssignment.create(props);

    // Persist to database
    const created = await this.assetAssignmentRepository.create(assignment);

    // Business Rule: If marked as primary, unset other primary assignments
    if (props.isPrimary) {
      await this.assetAssignmentRepository.setPrimaryAssignment(created.id);
    }

    return created;
  }
}
