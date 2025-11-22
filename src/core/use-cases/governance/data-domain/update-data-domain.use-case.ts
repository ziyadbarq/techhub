/**
 * Update DataDomain Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { DataDomain } from "@/core/domain/entities/data-domain.entity";

export interface UpdateDataDomainRequest {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class UpdateDataDomainUseCase {
  constructor(
    @inject(DI_TOKENS.IDataDomainRepository)
    private dataDomainRepository: IDataDomainRepository,
  ) {}

  async execute(request: UpdateDataDomainRequest): Promise<DataDomain> {
    // Fetch existing data domain
    const dataDomain = await this.dataDomainRepository.findById(request.id);

    if (!dataDomain) {
      throw new Error("Data domain not found");
    }

    // Check for duplicate name if name is being updated
    if (
      request.name !== undefined &&
      request.name !== dataDomain.name
    ) {
      const existingByName = await this.dataDomainRepository.existsByName(
        request.name,
        request.id,
      );
      if (existingByName) {
        throw new Error("A data domain with this name already exists");
      }
      dataDomain.name = request.name;
    }

    // Check for duplicate code if code is being updated
    if (
      request.code !== undefined &&
      request.code !== dataDomain.code
    ) {
      const existingByCode = await this.dataDomainRepository.existsByCode(
        request.code,
        request.id,
      );
      if (existingByCode) {
        throw new Error("A data domain with this code already exists");
      }
      dataDomain.code = request.code;
    }

    // Update other fields
    if (request.description !== undefined) {
      dataDomain.description = request.description;
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        dataDomain.activate();
      } else {
        dataDomain.deactivate();
      }
    }

    return await this.dataDomainRepository.update(dataDomain);
  }
}
