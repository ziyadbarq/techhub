/**
 * Relationship Type Scope Presenter
 * Transforms Relationship Type Scope entities to DTOs for the presentation layer
 */

import type { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";

export interface RelationshipTypeScopeDTO {
  id: string;
  relationshipTypeId: string;
  fromCiClassId: string;
  toCiClassId: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RelationshipTypeScopePresenter {
  static toDTO(scope: RelationshipTypeScope): RelationshipTypeScopeDTO {
    return {
      id: scope.id,
      relationshipTypeId: scope.relationshipTypeId,
      fromCiClassId: scope.fromCiClassId,
      toCiClassId: scope.toCiClassId,
      note: scope.note,
      createdAt: scope.createdAt,
      updatedAt: scope.updatedAt,
    };
  }

  static toDTOList(
    scopes: RelationshipTypeScope[],
  ): RelationshipTypeScopeDTO[] {
    return scopes.map((scope) => this.toDTO(scope));
  }
}
