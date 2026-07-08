/**
 * Delete LicenseProductField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteLicenseProductFieldRequest {
  id: string;
}

@injectable()
export class DeleteLicenseProductFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ILicenseProductFieldRepository)
    private fieldRepository: ILicenseProductFieldRepository,
  ) {}

  async execute(request: DeleteLicenseProductFieldRequest): Promise<void> {
    const field = await this.fieldRepository.findById(request.id);

    if (!field) {
      throw new NotFoundError("License product field not found");
    }

    await this.fieldRepository.delete(request.id);
  }
}
