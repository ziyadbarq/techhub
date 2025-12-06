/**
 * Two-Factor Authentication DI Module
 *
 * Registers all 2FA-related services in the dependency injection container.
 *
 * Layer: DI Configuration
 * Scope: Application-wide
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "@/di/types";

// Repositories
import { PrismaTwoFactorRepository } from "@/infrastructure/repositories/prisma-two-factor.repository";
import type { ITwoFactorRepository } from "@/core/repositories/two-factor.repository.interface";

// Use Cases
import { GetTwoFactorStatusUseCase } from "@/core/use-cases/two-factor";

export function bindTwoFactorDependencies(container: Container): void {
  // ============================================================================
  // Repositories
  // ============================================================================

  container
    .bind<ITwoFactorRepository>(DI_TOKENS.ITwoFactorRepository)
    .to(PrismaTwoFactorRepository)
    .inSingletonScope();

  // ============================================================================
  // Use Cases
  // ============================================================================

  container
    .bind<GetTwoFactorStatusUseCase>(DI_TOKENS.GetTwoFactorStatusUseCase)
    .to(GetTwoFactorStatusUseCase)
    .inSingletonScope();
}
