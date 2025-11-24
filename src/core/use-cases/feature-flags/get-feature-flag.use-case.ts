/**
 * Get Feature Flag Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "../../repositories/feature-flag.repository.interface";
import type { FeatureFlag } from "../../domain/entities/feature-flag.entity";

export interface GetFeatureFlagRequest {
  name: string;
}

@injectable()
export class GetFeatureFlagUseCase {
  constructor(
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  async execute(request: GetFeatureFlagRequest): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findByName(
      request.name,
    );

    if (!featureFlag) {
      throw new Error(`Feature flag not found: ${request.name}`);
    }

    return featureFlag;
  }
}
