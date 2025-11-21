/**
 * Delete LicenseProduct Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";

export interface DeleteLicenseProductRequest {
  id: string;
}

@injectable()
export class DeleteLicenseProductUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
  ) {}

  async execute(request: DeleteLicenseProductRequest): Promise<void> {
    const licenseProduct = await this.licenseProductRepository.findById(
      request.id,
    );

    if (!licenseProduct) {
      throw new Error("License product not found");
    }

    await this.licenseProductRepository.delete(request.id);
  }
}
