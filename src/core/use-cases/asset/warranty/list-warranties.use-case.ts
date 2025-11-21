/**
 * ListWarranties Use Case
 * Business Logic: List warranties with optional pagination and filters
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";
import type { WarrantySearchOptions } from "@/core/repositories/warranty.repository.interface";

@injectable()
export class ListWarrantiesUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(options?: WarrantySearchOptions): Promise<{
    warranties: Warranty[];
    total: number;
  }> {
    const warranties = options
      ? await this.warrantyRepository.search(options)
      : await this.warrantyRepository.findAll();

    const total = options
      ? await this.warrantyRepository.countBySearch(options)
      : await this.warrantyRepository.count();

    return { warranties, total };
  }
}
