/**
 * Update LicenseAddon Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { LicenseAddon } from "@/core/domain/entities/license-addon.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateLicenseAddonRequest {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@injectable()
export class UpdateLicenseAddonUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
  ) {}

  async execute(request: UpdateLicenseAddonRequest): Promise<LicenseAddon> {
    const addon = await this.addonRepository.findById(request.id);
    if (!addon) {
      throw new NotFoundError("License addon not found");
    }

    addon.update({
      name: request.name,
      description: request.description,
      isActive: request.isActive,
    });

    return await this.addonRepository.update(addon);
  }
}
