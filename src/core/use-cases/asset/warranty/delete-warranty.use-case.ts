/**
 * DeleteWarranty Use Case
 * Business Logic: Delete a warranty after validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

@injectable()
export class DeleteWarrantyUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Business Rule: Warranty must exist
    const warranty = await this.warrantyRepository.findById(id);
    if (!warranty) {
      throw new NotFoundError(`Warranty with ID "${id}" not found.`);
    }

    // Additional business rules can be added here, for example:
    // - Cannot delete active warranties
    // - Cannot delete warranties with claims (if claims feature is added)

    // Delete the warranty
    await this.warrantyRepository.delete(id);
  }
}
