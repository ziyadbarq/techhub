/**
 * Update CIClassField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { CIClassField } from "@/core/domain/entities/ci-class-field.entity";

export interface UpdateCIClassFieldRequest {
  id: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
  note?: string | null;
}

@injectable()
export class UpdateCIClassFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private ciClassFieldRepository: ICIClassFieldRepository,
  ) {}

  async execute(request: UpdateCIClassFieldRequest): Promise<CIClassField> {
    const ciClassField = await this.ciClassFieldRepository.findById(request.id);

    if (!ciClassField) {
      throw new Error("CI class field not found");
    }

    ciClassField.update({
      isRequired: request.isRequired,
      isUnique: request.isUnique,
      isVisible: request.isVisible,
      defaultValue: request.defaultValue,
      uiOrder: request.uiOrder,
      note: request.note,
    });

    return await this.ciClassFieldRepository.update(ciClassField);
  }
}
