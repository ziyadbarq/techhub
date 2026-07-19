/**
 * Get LicenseProductField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetLicenseProductFieldRequest {
  id: string;
}

@injectable()
export class GetLicenseProductFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductFieldRepository)
    private fieldRepository: ILicenseProductFieldRepository,
  ) {}

  async execute(
    request: GetLicenseProductFieldRequest,
  ): Promise<LicenseProductField> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new NotFoundError("License product field not found");
    }

    return field;
  }
}
