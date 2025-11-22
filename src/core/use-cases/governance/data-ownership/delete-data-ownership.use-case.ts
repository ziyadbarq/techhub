/**
 * Delete DataOwnership Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";

export interface DeleteDataOwnershipRequest {
  id: string;
}

@injectable()
export class DeleteDataOwnershipUseCase {
  constructor(
    @inject(DI_TOKENS.IDataOwnershipRepository)
    private dataOwnershipRepository: IDataOwnershipRepository,
  ) {}

  async execute(request: DeleteDataOwnershipRequest): Promise<void> {
    // Check if data ownership exists
    const dataOwnership = await this.dataOwnershipRepository.findById(
      request.id,
    );

    if (!dataOwnership) {
      throw new Error("Data ownership not found");
    }

    await this.dataOwnershipRepository.delete(request.id);
  }
}
