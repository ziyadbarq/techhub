/**
 * Get LicenseAddon Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { LicenseAddon } from "@/core/domain/entities/license-addon.entity";

@injectable()
export class GetLicenseAddonUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseAddonRepository)
    private addonRepository: ILicenseAddonRepository,
  ) {}

  async execute(id: string): Promise<LicenseAddon | null> {
    return await this.addonRepository.findById(id);
  }
}
