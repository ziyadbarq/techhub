/**
 * Check Feature Enabled Use Case
 * Verifies if a feature is enabled and dependencies are satisfied
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "../../repositories/feature-flag.repository.interface";

export interface CheckFeatureEnabledRequest {
  name: string;
}

export interface CheckFeatureEnabledResponse {
  enabled: boolean;
  exists: boolean;
  dependenciesSatisfied: boolean;
  unsatisfiedDependencies?: string[];
}

@injectable()
export class CheckFeatureEnabledUseCase {
  constructor(
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  async execute(
    request: CheckFeatureEnabledRequest,
  ): Promise<CheckFeatureEnabledResponse> {
    const featureFlag = await this.featureFlagRepository.findByName(
      request.name,
    );

    if (!featureFlag) {
      return {
        enabled: false,
        exists: false,
        dependenciesSatisfied: false,
      };
    }

    // Get enabled features to check dependencies
    const enabledFeatures =
      await this.featureFlagRepository.getEnabledFeatureNames();
    const unsatisfied = featureFlag.getUnsatisfiedDependencies(enabledFeatures);

    return {
      enabled: featureFlag.isEnabled,
      exists: true,
      dependenciesSatisfied: unsatisfied.length === 0,
      unsatisfiedDependencies: unsatisfied.length > 0 ? unsatisfied : undefined,
    };
  }
}
