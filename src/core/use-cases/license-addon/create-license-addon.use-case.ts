/**
 * Create LicenseAddon Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { LicenseAddon } from "@/core/domain/entities/license-addon.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CreateLicenseAddonRequest {
  licenseProductId: string;
  name: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class CreateLicenseAddonUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
    @inject(DI_TOKENS.ILicenseProductRepository)
    private productRepository: ILicenseProductRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(request: CreateLicenseAddonRequest): Promise<LicenseAddon> {
    // Validate license product exists
    const product = await this.productRepository.findById(
      request.licenseProductId,
    );
    if (!product) {
      throw new NotFoundError("License product not found");
    }

    // Auto-generate code if not provided
    const code =
      request.code ||
      (await this.codeGenerator.generateCode("LICENSE_ADDON", "ADDON"));

    // Check for duplicate code within product
    const existingByCode = await this.addonRepository.existsByCode(
      request.licenseProductId,
      code,
    );
    if (existingByCode) {
      throw new Error(
        "An addon with this code already exists for this product",
      );
    }

    // Create addon entity
    const addon = LicenseAddon.create({
      licenseProductId: request.licenseProductId,
      name: request.name,
      code,
      description: request.description,
      isActive: request.isActive,
    });

    return await this.addonRepository.create(addon);
  }
}
