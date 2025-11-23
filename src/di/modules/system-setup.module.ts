/**
 * System Setup Module
 * Binds all system setup-related dependencies (repositories and use cases)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repositories
import type { ISystemSetupRepository } from "@/core/repositories/system-setup-repository.interface";
import { PrismaSystemSetupRepository } from "@/infrastructure/repositories/prisma-system-setup.repository";

// Use Cases
import { CheckSystemHealthUseCase } from "@/core/use-cases/system-setup/check-system-health.use-case";
import { GetMigrationStatusUseCase } from "@/core/use-cases/system-setup/get-migration-status.use-case";
import { CreateFirstUserUseCase } from "@/core/use-cases/system-setup/create-first-user.use-case";
import { SeedMinimalDataUseCase } from "@/core/use-cases/system-setup/seed-minimal-data.use-case";
import { ResetDatabaseUseCase } from "@/core/use-cases/system-setup/reset-database.use-case";
import { GetSystemInfoUseCase } from "@/core/use-cases/system-setup/get-system-info.use-case";

/**
 * Bind all System Setup dependencies to the container
 */
export function bindSystemSetupDependencies(container: Container): void {
  // ==========================================
  // System Setup Repository
  // ==========================================

  container
    .bind<ISystemSetupRepository>(DI_TOKENS.ISystemSetupRepository)
    .to(PrismaSystemSetupRepository)
    .inSingletonScope();

  // ==========================================
  // System Setup Use Cases
  // ==========================================

  container
    .bind(DI_TOKENS.CheckSystemHealthUseCase)
    .to(CheckSystemHealthUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.GetMigrationStatusUseCase)
    .to(GetMigrationStatusUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.CreateFirstUserUseCase)
    .to(CreateFirstUserUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.SeedMinimalDataUseCase)
    .to(SeedMinimalDataUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.ResetDatabaseUseCase)
    .to(ResetDatabaseUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.GetSystemInfoUseCase)
    .to(GetSystemInfoUseCase)
    .inTransientScope();
}
