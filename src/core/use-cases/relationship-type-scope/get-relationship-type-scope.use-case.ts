/**
 * Get RelationshipTypeScope Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import type { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";

export interface GetRelationshipTypeScopeRequest {
  id: string;
}

@injectable()
export class GetRelationshipTypeScopeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeScopeRepository)
    private scopeRepository: IRelationshipTypeScopeRepository,
  ) {}

  async execute(
    request: GetRelationshipTypeScopeRequest,
  ): Promise<RelationshipTypeScope> {
    const scope = await this.scopeRepository.findById(request.id);

    if (!scope) {
      throw new Error("Relationship type scope not found");
    }

    return scope;
  }
}
