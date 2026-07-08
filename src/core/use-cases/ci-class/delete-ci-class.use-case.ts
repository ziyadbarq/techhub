/**
 * Delete CI Class Use Case
 */

import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface DeleteCIClassRequest {
  ciClassId: string;
}

@injectable()
export class DeleteCIClassUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
  ) {}

  async execute(request: DeleteCIClassRequest): Promise<void> {
    // Verify existence
    const ciClass = await this.ciClassRepository.findById(request.ciClassId);
    if (!ciClass) {
      throw new NotFoundError(
        `CI class with ID "${request.ciClassId}" not found`,
      );
    }

    // Check for child classes
    const childClasses = await this.ciClassRepository.findChildClasses(
      request.ciClassId,
    );
    if (childClasses.length > 0) {
      throw new ValidationError(
        `Cannot delete CI class "${ciClass.name}" because it has ${childClasses.length} child class(es)`,
      );
    }

    // Delete
    await this.ciClassRepository.delete(request.ciClassId);
  }
}
