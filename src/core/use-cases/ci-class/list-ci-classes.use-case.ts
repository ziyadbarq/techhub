/**
 * List CI Classes Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { CIClass } from "@/core/domain/entities/ci-class.entity";

export interface ListCIClassesRequest {
  parentId?: string | null; // If provided, list children; if null explicitly, list root; if undefined, list all
}

@injectable()
export class ListCIClassesUseCase {
  constructor(
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
  ) {}

  async execute(request: ListCIClassesRequest = {}): Promise<CIClass[]> {
    if (request.parentId) {
      return this.ciClassRepository.findChildClasses(request.parentId);
    }

    if (request.parentId === null) {
      return this.ciClassRepository.findRootClasses();
    }

    return this.ciClassRepository.findAll();
  }
}
