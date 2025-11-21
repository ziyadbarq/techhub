/**
 * DeleteAssetAssignment Use Case
 * Business Logic: Delete an asset assignment
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";

@injectable()
export class DeleteAssetAssignmentUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Check if assignment exists
    const assignment = await this.assetAssignmentRepository.findById(id);
    if (!assignment) {
      throw new Error(`Asset assignment with ID "${id}" not found`);
    }

    // Delete the assignment
    await this.assetAssignmentRepository.delete(id);
  }
}
