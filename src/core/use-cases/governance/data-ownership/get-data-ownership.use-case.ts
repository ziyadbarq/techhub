/**
 * Get DataOwnership Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import type { DataOwnership } from "@/core/domain/entities/data-ownership.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetDataOwnershipRequest {
  id: string;
}

@injectable()
export class GetDataOwnershipUseCase {
  constructor(
    @inject(DI_TOKENS.IDataOwnershipRepository)
    private dataOwnershipRepository: IDataOwnershipRepository,
  ) {}

  async execute(request: GetDataOwnershipRequest): Promise<DataOwnership> {
    const dataOwnership = await this.dataOwnershipRepository.findById(
      request.id,
    );

    if (!dataOwnership) {
      throw new NotFoundError("Data ownership not found");
    }

    return dataOwnership;
  }
}
