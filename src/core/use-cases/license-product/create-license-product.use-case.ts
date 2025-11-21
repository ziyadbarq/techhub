/**
 * Create LicenseProduct Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type {
  LicenseMetricType} from "@/core/domain/entities/license-product.entity";
import {
  LicenseProduct
} from "@/core/domain/entities/license-product.entity";

export interface CreateLicenseProductRequest {
  name: string;
  code: string;
  vendorId: string;
  metricType: LicenseMetricType;
  description?: string | null;
  lifecycleModelId?: string | null;
}

@injectable()
export class CreateLicenseProductUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private vendorRepository: IVendorRepository,
  ) {}

  async execute(request: CreateLicenseProductRequest): Promise<LicenseProduct> {
    // Validate vendor exists
    const vendor = await this.vendorRepository.findById(request.vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Check for duplicate name
    const existingByName = await this.licenseProductRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error("A license product with this name already exists");
    }

    // Check for duplicate code
    const existingByCode = await this.licenseProductRepository.existsByCode(
      request.code,
    );
    if (existingByCode) {
      throw new Error("A license product with this code already exists");
    }

    // Create license product entity
    const licenseProduct = LicenseProduct.create({
      name: request.name,
      code: request.code,
      vendorId: request.vendorId,
      metricType: request.metricType,
      description: request.description,
      lifecycleModelId: request.lifecycleModelId,
    });

    return await this.licenseProductRepository.create(licenseProduct);
  }
}
