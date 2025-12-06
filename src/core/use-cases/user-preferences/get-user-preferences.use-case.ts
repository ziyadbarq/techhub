/**
 * Get User Preferences Use Case
 * Fetches user preferences, creates defaults if missing
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserPreferencesRepository } from "@/core/repositories/user-preferences.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { UserPreferences } from "@/core/domain/entities/user-preferences.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

@injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @inject(DI_TOKENS.IUserPreferencesRepository)
    private readonly preferencesRepository: IUserPreferencesRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  @LogExecution("user-preferences.get")
  async execute(userId: string): Promise<UserPreferences> {
    // Try to find existing preferences
    let preferences = await this.preferencesRepository.findByUserId(userId);

    // If not found, create default preferences
    if (!preferences) {
      this.logger.info("Creating default preferences for user", { userId });

      preferences = UserPreferences.create({ userId }, this.idGenerator);
      preferences = await this.preferencesRepository.create(preferences);

      this.logger.info("Default preferences created", {
        userId,
        preferencesId: preferences.id,
      });
    }

    return preferences;
  }
}
