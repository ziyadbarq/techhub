/**
 * List DataDomains Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface ListDataDomainsRequest {
  activeOnly?: boolean;
}

@injectable()
export class ListDataDomainsUseCase {
  constructor(
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: ListDataDomainsRequest = {}): Promise<DataDomain[]> {
    if (request.activeOnly) {
      return await this.dataDomainRepository.findActive();
    }

    return await this.dataDomainRepository.findAll();
  }
}
