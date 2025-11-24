/**
 * Feature Flag Presenter
 * Transforms domain entities to DTOs for API responses
 */

import type { FeatureFlag } from "@/core/domain/entities/feature-flag.entity";
import type { FeatureFlagResponseDTO } from "../../dtos/feature-flags/feature-flag.dto";

export class FeatureFlagPresenter {
  static toDTO(featureFlag: FeatureFlag): FeatureFlagResponseDTO {
    return {
      id: featureFlag.id,
      name: featureFlag.name,
      displayName: featureFlag.displayName,
      description: featureFlag.description,
      category: featureFlag.category,
      isEnabled: featureFlag.isEnabled,
      isSystem: featureFlag.isSystem,
      dependsOn: featureFlag.dependsOn,
      createdAt: featureFlag.createdAt,
      updatedAt: featureFlag.updatedAt,
    };
  }

  static toDTOList(featureFlags: FeatureFlag[]): FeatureFlagResponseDTO[] {
    return featureFlags.map((flag) => this.toDTO(flag));
  }
}
