/**
 * Update LicenseProduct Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type {
  LicenseProduct,
  LicenseMetricType,
} from "@/core/domain/entities/license-product.entity";

export interface UpdateLicenseProductRequest {
  id: string;
  name?: string;
  code?: string;
  vendorId?: string;
  metricType?: LicenseMetricType;
  description?: string | null;
  lifecycleModelId?: string | null;
}

@injectable()
export class UpdateLicenseProductUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private vendorRepository: IVendorRepository,
  ) {}

  async execute(request: UpdateLicenseProductRequest): Promise<LicenseProduct> {
    const licenseProduct = await this.licenseProductRepository.findById(
      request.id,
    );

    if (!licenseProduct) {
      throw new Error("License product not found");
    }

    // Validate vendor if being updated
    if (
      request.vendorId !== undefined &&
      request.vendorId !== licenseProduct.vendorId
    ) {
      const vendor = await this.vendorRepository.findById(request.vendorId);
      if (!vendor) {
        throw new Error("Vendor not found");
      }
    }

    // Check for duplicate name if being updated
    if (request.name !== undefined && request.name !== licenseProduct.name) {
      const existingByName = await this.licenseProductRepository.existsByName(
        request.name,
        request.id,
      );
      if (existingByName) {
        throw new Error("A license product with this name already exists");
      }
    }

    // Check for duplicate code if being updated
    if (request.code !== undefined && request.code !== licenseProduct.code) {
      const existingByCode = await this.licenseProductRepository.existsByCode(
        request.code,
        request.id,
      );
      if (existingByCode) {
        throw new Error("A license product with this code already exists");
      }
    }

    // Update license product fields
    if (request.name !== undefined) {
      licenseProduct.name = request.name;
    }
    if (request.code !== undefined) {
      licenseProduct.code = request.code;
    }
    if (request.vendorId !== undefined) {
      licenseProduct.vendorId = request.vendorId;
    }
    if (request.metricType !== undefined) {
      licenseProduct.metricType = request.metricType;
    }
    if (request.description !== undefined) {
      licenseProduct.description = request.description;
    }
    if (request.lifecycleModelId !== undefined) {
      licenseProduct.lifecycleModelId = request.lifecycleModelId;
    }

    return await this.licenseProductRepository.update(licenseProduct);
  }
}
