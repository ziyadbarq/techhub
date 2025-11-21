/**
 * ListAssetAssignments Use Case
 * Business Logic: Retrieve asset assignments with optional filtering
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type {
  AssetAssignment,
  AssigneeType,
} from "@/core/domain/entities/asset-assignment.entity";

export interface ListAssetAssignmentsOptions {
  assetId?: string;
  assigneeType?: AssigneeType;
  assigneeId?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

@injectable()
export class ListAssetAssignmentsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  async execute(
    options?: ListAssetAssignmentsOptions,
  ): Promise<AssetAssignment[]> {
    // Filter by asset
    if (options?.assetId) {
      if (options.activeOnly) {
        return await this.assetAssignmentRepository.findActiveByAsset(
          options.assetId,
        );
      }
      return await this.assetAssignmentRepository.findByAsset(options.assetId);
    }

    // Filter by assignee
    if (options?.assigneeType && options.assigneeId) {
      if (options.activeOnly) {
        return await this.assetAssignmentRepository.findActiveByAssignee(
          options.assigneeType,
          options.assigneeId,
        );
      }
      return await this.assetAssignmentRepository.findByAssignee(
        options.assigneeType,
        options.assigneeId,
      );
    }

    // Filter by assignee type only
    if (options?.assigneeType) {
      return await this.assetAssignmentRepository.findByAssigneeType(
        options.assigneeType,
      );
    }

    // Default: list all
    return await this.assetAssignmentRepository.findAll(
      options?.limit,
      options?.offset,
    );
  }
}
