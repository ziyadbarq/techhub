/**
 * Delete DataDomain Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";

export interface DeleteDataDomainRequest {
  id: string;
}

@injectable()
export class DeleteDataDomainUseCase {
  constructor(
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: DeleteDataDomainRequest): Promise<void> {
    // Check if data domain exists
    const dataDomain = await this.dataDomainRepository.findById(request.id);

    if (!dataDomain) {
      throw new Error("Data domain not found");
    }

    await this.dataDomainRepository.delete(request.id);
  }
}
