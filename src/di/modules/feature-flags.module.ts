/**
 * Feature Flags Module
 * Binds all feature flag-related dependencies (repositories and use cases)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repositories
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import { PrismaFeatureFlagRepository } from "@/infrastructure/repositories/prisma-feature-flag.repository";

// Use Cases
import { ListFeatureFlagsUseCase } from "@/core/use-cases/feature-flags/list-feature-flags.use-case";
import { GetFeatureFlagUseCase } from "@/core/use-cases/feature-flags/get-feature-flag.use-case";
import { ToggleFeatureFlagUseCase } from "@/core/use-cases/feature-flags/toggle-feature-flag.use-case";
import { CheckFeatureEnabledUseCase } from "@/core/use-cases/feature-flags/check-feature-enabled.use-case";

/**
 * Bind all Feature Flag dependencies to the container
 */
export function bindFeatureFlagsDependencies(container: Container): void {
  // ==========================================
  // Feature Flag Repository
  // ==========================================

  container
    .bind<IFeatureFlagRepository>(DI_TOKENS.IFeatureFlagRepository)
    .to(PrismaFeatureFlagRepository)
    .inSingletonScope();

  // ==========================================
  // Feature Flag Use Cases
  // ==========================================

  container
    .bind(DI_TOKENS.ListFeatureFlagsUseCase)
    .to(ListFeatureFlagsUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.GetFeatureFlagUseCase)
    .to(GetFeatureFlagUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.ToggleFeatureFlagUseCase)
    .to(ToggleFeatureFlagUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.CheckFeatureEnabledUseCase)
    .to(CheckFeatureEnabledUseCase)
    .inTransientScope();
}
