/**
 * List Feature Flags Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "../../repositories/feature-flag.repository.interface";
import type { FeatureFlag } from "../../domain/entities/feature-flag.entity";

export interface ListFeatureFlagsRequest {
  onlyEnabled?: boolean;
  category?: string;
}

export interface ListFeatureFlagsResponse {
  flags: FeatureFlag[];
  total: number;
}

@injectable()
export class ListFeatureFlagsUseCase {
  constructor(
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
  ) {}

  async execute(
    request: ListFeatureFlagsRequest = {},
  ): Promise<ListFeatureFlagsResponse> {
    const flags = await this.featureFlagRepository.findAll({
      onlyEnabled: request.onlyEnabled,
      category: request.category,
      orderBy: "category",
      order: "asc",
    });

    return {
      flags,
      total: flags.length,
    };
  }
}
