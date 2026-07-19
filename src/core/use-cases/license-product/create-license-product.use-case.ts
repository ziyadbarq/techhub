/**
 * Create LicenseProduct Use Case
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { LicenseMetricType } from "@/core/domain/entities/license-product.entity";
import { LicenseProduct } from "@/core/domain/entities/license-product.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateLicenseProductRequest {
  name: string;
  code?: string;
  vendorId: string;
  metricType: LicenseMetricType;
  description?: string | null;
  lifecycleModelId?: string | null;
  attributes?: Record<string, unknown> | null;
}

@injectable()
export class CreateLicenseProductUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductRepository)
    private licenseProductRepository: ILicenseProductRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: CreateLicenseProductRequest): Promise<LicenseProduct> {
    // Auto-generate code if not provided or empty
    const code =
      request.code ||
      (await this.codeGenerator.generateCode("LICENSE_PRODUCT", "LIC"));

    // Validate vendor exists
    const vendor = await this.vendorRepository.findById(request.vendorId);
    if (!vendor) {
      throw new NotFoundError("Vendor not found");
    }

    // Check for duplicate name
    const existingByName = await this.licenseProductRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new ConflictError(
        "A license product with this name already exists",
      );
    }

    // Check for duplicate code
    const existingByCode =
      await this.licenseProductRepository.existsByCode(code);
    if (existingByCode) {
      throw new ConflictError(
        "A license product with this code already exists",
      );
    }

    // Create license product entity
    const licenseProduct = LicenseProduct.create(
      {
        name: request.name,
        code,
        vendorId: request.vendorId,
        metricType: request.metricType,
        description: request.description,
        lifecycleModelId: request.lifecycleModelId,
        attributes: request.attributes,
      },
      this.idGenerator,
    );

    return await this.licenseProductRepository.create(licenseProduct);
  }
}
