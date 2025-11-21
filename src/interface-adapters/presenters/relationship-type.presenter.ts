import type { RelationshipType } from "@/core/domain/entities/relationship-type.entity";
import type { RelationshipTypeDTO } from "../dtos/generated/relationship-type.dto";

export class RelationshipTypePresenter {
  static toDTO(relationshipType: RelationshipType): RelationshipTypeDTO {
    return {
      id: relationshipType.id,
      name: relationshipType.name,
      code: relationshipType.code,
      description: relationshipType.description,
      direction: relationshipType.direction,
      isImpacting: relationshipType.impacting,
      createdAt: relationshipType.createdAt.toISOString(),
      updatedAt: relationshipType.updatedAt.toISOString(),
    };
  }

  static toDTOList(
    relationshipTypes: RelationshipType[],
  ): RelationshipTypeDTO[] {
    return relationshipTypes.map((rt) => this.toDTO(rt));
  }
}
