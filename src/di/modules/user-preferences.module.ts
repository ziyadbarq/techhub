/**
 * User Preferences Module
 * Binds all user preferences-related dependencies (repository and use cases)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// Repository
import type { IUserPreferencesRepository } from "@/core/repositories/user-preferences.repository.interface";
import { PrismaUserPreferencesRepository } from "@/infrastructure/repositories/prisma-user-preferences.repository";

// Use Cases
import { GetUserPreferencesUseCase } from "@/core/use-cases/user-preferences/get-user-preferences.use-case";
import { UpdateUserPreferencesUseCase } from "@/core/use-cases/user-preferences/update-user-preferences.use-case";

/**
 * Bind all User Preferences dependencies to the container
 */
export function bindUserPreferencesDependencies(container: Container): void {
  // ==========================================
  // User Preferences Repository
  // ==========================================

  container
    .bind<IUserPreferencesRepository>(DI_TOKENS.IUserPreferencesRepository)
    .to(PrismaUserPreferencesRepository)
    .inSingletonScope();

  // ==========================================
  // User Preferences Use Cases
  // ==========================================

  container
    .bind(DI_TOKENS.GetUserPreferencesUseCase)
    .to(GetUserPreferencesUseCase)
    .inTransientScope();

  container
    .bind(DI_TOKENS.UpdateUserPreferencesUseCase)
    .to(UpdateUserPreferencesUseCase)
    .inTransientScope();
}
