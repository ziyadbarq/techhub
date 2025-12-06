/**
 * Create RelationshipTypeScope Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateRelationshipTypeScopeRequest {
  relationshipTypeId: string;
  fromCiClassId: string;
  toCiClassId: string;
  note?: string | null;
}

@injectable()
export class CreateRelationshipTypeScopeUseCase {
  constructor(
    @inject(DI_TOKENS.IRelationshipTypeScopeRepository)
    private scopeRepository: IRelationshipTypeScopeRepository,
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private relationshipTypeRepository: IRelationshipTypeRepository,
    @inject(DI_TOKENS.ICIClassRepository)
    private ciClassRepository: ICIClassRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: CreateRelationshipTypeScopeRequest,
  ): Promise<RelationshipTypeScope> {
    // Verify relationship type exists
    const relationshipType = await this.relationshipTypeRepository.findById(
      request.relationshipTypeId,
    );
    if (!relationshipType) {
      throw new Error("Relationship type not found");
    }

    // Verify from CI class exists
    const fromClass = await this.ciClassRepository.findById(
      request.fromCiClassId,
    );
    if (!fromClass) {
      throw new Error("From CI class not found");
    }

    // Verify to CI class exists
    const toClass = await this.ciClassRepository.findById(request.toCiClassId);
    if (!toClass) {
      throw new Error("To CI class not found");
    }

    // Check for duplicate
    const existing = await this.scopeRepository.exists(
      request.relationshipTypeId,
      request.fromCiClassId,
      request.toCiClassId,
    );
    if (existing) {
      throw new Error("This scope already exists for the relationship type");
    }

    // Create entity
    const scope = RelationshipTypeScope.create({
      relationshipTypeId: request.relationshipTypeId,
      fromCiClassId: request.fromCiClassId,
      toCiClassId: request.toCiClassId,
      note: request.note,
    });

    // Persist
    return await this.scopeRepository.create(scope);
  }
}
