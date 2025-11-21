/**
 * List LicenseProductFields Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import type { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";

const TOKENS = DI_TOKENS as Record<string, symbol>;

export interface ListLicenseProductFieldsRequest {
  licenseProductId: string;
}

@injectable()
export class ListLicenseProductFieldsUseCase {
  constructor(
    @inject(TOKENS.ILicenseProductFieldRepository)
    private fieldRepository: ILicenseProductFieldRepository,
  ) {}

  async execute(
    request: ListLicenseProductFieldsRequest,
  ): Promise<LicenseProductField[]> {
    return await this.fieldRepository.findByLicenseProductId(
      request.licenseProductId,
    );
  }
}
