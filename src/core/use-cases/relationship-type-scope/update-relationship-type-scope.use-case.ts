/**
 * Update RelationshipTypeScope Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import type { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";

export interface UpdateRelationshipTypeScopeRequest {
  id: string;
  note?: string | null;
}

@injectable()
export class UpdateRelationshipTypeScopeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeScopeRepository)
    private scopeRepository: IRelationshipTypeScopeRepository,
  ) {}

  async execute(
    request: UpdateRelationshipTypeScopeRequest,
  ): Promise<RelationshipTypeScope> {
    const scope = await this.scopeRepository.findById(request.id);

    if (!scope) {
      throw new Error("Relationship type scope not found");
    }

    scope.update({
      note: request.note,
    });

    return await this.scopeRepository.update(scope);
  }
}
