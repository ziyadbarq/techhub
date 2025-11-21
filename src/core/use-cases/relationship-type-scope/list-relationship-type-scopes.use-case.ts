/**
 * List RelationshipTypeScopes Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import type { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";

export interface ListRelationshipTypeScopesRequest {
  relationshipTypeId?: string;
  fromCiClassId?: string;
  toCiClassId?: string;
}

@injectable()
export class ListRelationshipTypeScopesUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeScopeRepository)
    private scopeRepository: IRelationshipTypeScopeRepository,
  ) {}

  async execute(
    request: ListRelationshipTypeScopesRequest,
  ): Promise<RelationshipTypeScope[]> {
    // Filter by relationship type if specified
    if (request.relationshipTypeId) {
      return await this.scopeRepository.findByRelationshipTypeId(
        request.relationshipTypeId,
      );
    }

    // Filter by from CI class if specified
    if (request.fromCiClassId) {
      return await this.scopeRepository.findByFromCiClassId(
        request.fromCiClassId,
      );
    }

    // Filter by to CI class if specified
    if (request.toCiClassId) {
      return await this.scopeRepository.findByToCiClassId(request.toCiClassId);
    }

    // Return all if no filters
    return await this.scopeRepository.findAll();
  }
}
