/**
 * Get LicenseProduct Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { LicenseProduct } from "@/core/domain/entities/license-product.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GetLicenseProductRequest {
  id: string;
}

@injectable()
export class GetLicenseProductUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
  ) {}

  async execute(request: GetLicenseProductRequest): Promise<LicenseProduct> {
    const licenseProduct = await this.licenseProductRepository.findById(
      request.id,
    );

    if (!licenseProduct) {
      throw new NotFoundError("License product not found");
    }

    return licenseProduct;
  }
}
