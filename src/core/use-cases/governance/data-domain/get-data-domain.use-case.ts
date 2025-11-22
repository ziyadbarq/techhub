/**
 * Get DataDomain Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface GetDataDomainRequest {
  id: string;
}

@injectable()
export class GetDataDomainUseCase {
  constructor(
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: GetDataDomainRequest): Promise<DataDomain> {
    const dataDomain = await this.dataDomainRepository.findById(request.id);

    if (!dataDomain) {
      throw new Error("Data domain not found");
    }

    return dataDomain;
  }
}
