/**
 * Delete CIClassField Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";

export interface DeleteCIClassFieldRequest {
  id: string;
}

@injectable()
export class DeleteCIClassFieldUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private ciClassFieldRepository: ICIClassFieldRepository,
  ) {}

  async execute(request: DeleteCIClassFieldRequest): Promise<void> {
    const ciClassField = await this.ciClassFieldRepository.findById(request.id);

    if (!ciClassField) {
      throw new Error("CI class field not found");
    }

    await this.ciClassFieldRepository.delete(request.id);
  }
}
