/**
 * Toggle Feature Flag Use Case
 * Enables or disables a feature flag with dependency validation
 */

import { injectable, inject } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import type { IFeatureFlagRepository } from "../../repositories/feature-flag.repository.interface";
import type { FeatureFlag } from "../../domain/entities/feature-flag.entity";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface ToggleFeatureFlagRequest {
  name: string;
  userId: string;
  userEmail: string;
  reason?: string;
}

export interface ToggleFeatureFlagResponse {
  featureFlag: FeatureFlag;
  action: "ENABLED" | "DISABLED";
  warnings?: string[];
}

@injectable()
export class ToggleFeatureFlagUseCase {
  constructor(
    @inject(DI_TOKENS.IFeatureFlagRepository)
    private readonly featureFlagRepository: IFeatureFlagRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: ToggleFeatureFlagRequest,
  ): Promise<ToggleFeatureFlagResponse> {
    // 1. Get the feature flag
    const featureFlag = await this.featureFlagRepository.findByName(
      request.name,
    );

    if (!featureFlag) {
      throw new NotFoundError(`Feature flag not found: ${request.name}`);
    }

    const warnings: string[] = [];
    const newState = !featureFlag.isEnabled;
    const action = newState ? "ENABLED" : "DISABLED";

    // 2. If enabling, check if dependencies are satisfied
    if (newState) {
      const enabledFeatures =
        await this.featureFlagRepository.getEnabledFeatureNames();
      const unsatisfied =
        featureFlag.getUnsatisfiedDependencies(enabledFeatures);

      if (unsatisfied.length > 0) {
        throw new ValidationError(
          `Cannot enable ${request.name}: missing dependencies: ${unsatisfied.join(", ")}. Enable dependencies first.`,
        );
      }
    }

    // 3. If disabling, check for dependent features
    if (!newState) {
      const dependents = await this.featureFlagRepository.findDependentFlags(
        request.name,
      );
      const enabledDependents = dependents.filter((d) => d.isEnabled);

      if (enabledDependents.length > 0) {
        const dependentNames = enabledDependents
          .map((d) => d.displayName)
          .join(", ");
        throw new ValidationError(
          `Cannot disable ${featureFlag.displayName}: required by enabled features: ${dependentNames}. Disable dependents first.`,
        );
      }

      // Check for disabled dependents (show as warning)
      const disabledDependents = dependents.filter((d) => !d.isEnabled);
      if (disabledDependents.length > 0) {
        warnings.push(
          `Note: ${disabledDependents.length} disabled feature(s) depend on this: ${disabledDependents.map((d) => d.displayName).join(", ")}`,
        );
      }
    }

    // 4. Toggle the flag
    const toggled = featureFlag.toggle();
    const updated = await this.featureFlagRepository.update(toggled);

    // 5. Log the action
    this.logger.info(`Feature flag ${action.toLowerCase()}`, {
      featureName: request.name,
      action,
      userId: request.userId,
      userEmail: request.userEmail,
      reason: request.reason,
    });

    // 6. Create audit log entry (will be done in controller layer)
    // The audit log is created in the controller to keep use case pure

    return {
      featureFlag: updated,
      action,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
