/**
 * List LicenseProducts Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { LicenseProduct } from "@/core/domain/entities/license-product.entity";

export interface ListLicenseProductsRequest {
  vendorId?: string;
}

@injectable()
export class ListLicenseProductsUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
  ) {}

  async execute(
    request: ListLicenseProductsRequest,
  ): Promise<LicenseProduct[]> {
    // Filter by vendor if specified
    if (request.vendorId) {
      return await this.licenseProductRepository.findByVendorId(
        request.vendorId,
      );
    }

    // Return all license products
    return await this.licenseProductRepository.findAll();
  }
}
