/**
 * GetWarranty Use Case
 * Business Logic: Retrieve a warranty by ID
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class GetWarrantyUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(id: string): Promise<Warranty> {
    const warranty = await this.warrantyRepository.findById(id);

    if (!warranty) {
      throw new NotFoundError(`Warranty with ID "${id}" not found.`);
    }

    return warranty;
  }
}
