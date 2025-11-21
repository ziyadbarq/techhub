/**
 * GetAssetAssignment Use Case
 * Business Logic: Retrieve a single asset assignment by ID
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";

@injectable()
export class GetAssetAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  async execute(id: string): Promise<AssetAssignment | null> {
    return await this.assetAssignmentRepository.findById(id);
  }
}
