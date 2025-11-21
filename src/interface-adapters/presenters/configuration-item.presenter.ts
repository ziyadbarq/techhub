import type { ConfigurationItem } from "@/core/domain/entities/configuration-item.entity";
import type { ConfigurationItemDTO } from "../dtos/generated/configuration-item.dto";

export class ConfigurationItemPresenter {
  static toDTO(
    ci: ConfigurationItem,
    enrichment?: {
      ciClassName?: string;
      lifecycleStateName?: string;
      primaryOwnerName?: string;
      locationName?: string;
      linkedAssetTag?: string;
    },
  ): ConfigurationItemDTO {
    return {
      id: ci.id,
      name: ci.name,
      ciClassId: ci.ciClassId,
      lifecycleStateId: ci.lifecycleStateId,
      criticality: ci.criticality,
      environment: ci.environment,
      primaryOwnerPersonId: ci.primaryOwnerPersonId,
      primaryOwnerOrgUnitId: ci.primaryOwnerOrgUnitId,
      locationId: ci.locationId,
      linkedAssetId: ci.linkedAssetId,
      ciKey: ci.ciKey,
      description: ci.description,
      attributes: ci.attributes,
      createdAt: ci.createdAt.toISOString(),
      updatedAt: ci.updatedAt.toISOString(),
      ciClassName: enrichment?.ciClassName,
      lifecycleStateName: enrichment?.lifecycleStateName,
      primaryOwnerName: enrichment?.primaryOwnerName,
      locationName: enrichment?.locationName,
      linkedAssetTag: enrichment?.linkedAssetTag,
    };
  }

  static toDTOList(cis: ConfigurationItem[]): ConfigurationItemDTO[] {
    return cis.map((ci) => this.toDTO(ci));
  }
}
