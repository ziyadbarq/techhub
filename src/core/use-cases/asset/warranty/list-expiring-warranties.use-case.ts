/**
 * ListExpiringWarranties Use Case
 * Business Logic: Get warranties expiring within specified days
 * Used for notification and dashboard widgets
 */

import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";

@injectable()
export class ListExpiringWarrantiesUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(days: number = 30): Promise<Warranty[]> {
    if (days <= 0) {
      throw new ValidationError("Days parameter must be greater than 0");
    }

    if (days > 365) {
      throw new ValidationError("Days parameter cannot exceed 365");
    }

    return await this.warrantyRepository.findExpiringSoon(days);
  }
}
