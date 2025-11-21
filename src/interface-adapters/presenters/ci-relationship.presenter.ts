import type { CIRelationship } from "@/core/domain/entities/ci-relationship.entity";
import type { CIRelationshipDTO } from "../dtos/generated/ci-relationship.dto";

export class CIRelationshipPresenter {
  static toDTO(
    relationship: CIRelationship,
    enrichment?: {
      fromCiName?: string;
      toCiName?: string;
      relationshipTypeName?: string;
    },
  ): CIRelationshipDTO {
    return {
      id: relationship.id,
      fromCiId: relationship.fromCiId,
      toCiId: relationship.toCiId,
      relationshipTypeId: relationship.relationshipTypeId,
      isActive: relationship.isActive,
      validFrom: relationship.validFrom.toISOString(),
      validTo: relationship.validTo?.toISOString() ?? null,
      note: relationship.note,
      createdAt: relationship.createdAt.toISOString(),
      updatedAt: relationship.updatedAt.toISOString(),
      fromCiName: enrichment?.fromCiName,
      toCiName: enrichment?.toCiName,
      relationshipTypeName: enrichment?.relationshipTypeName,
    };
  }

  static toDTOList(relationships: CIRelationship[]): CIRelationshipDTO[] {
    return relationships.map((r) => this.toDTO(r));
  }
}
