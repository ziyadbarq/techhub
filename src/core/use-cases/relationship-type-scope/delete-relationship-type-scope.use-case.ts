/**
 * Delete RelationshipTypeScope Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";

export interface DeleteRelationshipTypeScopeRequest {
  id: string;
}

@injectable()
export class DeleteRelationshipTypeScopeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeScopeRepository)
    private scopeRepository: IRelationshipTypeScopeRepository,
  ) {}

  async execute(request: DeleteRelationshipTypeScopeRequest): Promise<void> {
    const scope = await this.scopeRepository.findById(request.id);

    if (!scope) {
      throw new Error("Relationship type scope not found");
    }

    await this.scopeRepository.delete(request.id);
  }
}
