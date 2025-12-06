/**
 * Update User Preferences Use Case
 * Partial updates with validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserPreferencesRepository } from "@/core/repositories/user-preferences.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { NotificationPreferences } from "@/core/domain/entities/user-preferences.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface UpdateUserPreferencesInput {
  userId: string;
  timezone?: string;
  dateFormat?: string;
  currencyDisplay?: string;
  notifications?: Partial<NotificationPreferences>;
}

@injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @inject(DI_TOKENS.IUserPreferencesRepository)
    private readonly preferencesRepository: IUserPreferencesRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("user-preferences.update")
  async execute(input: UpdateUserPreferencesInput) {
    const { userId, ...updates } = input;

    // Find existing preferences
    let preferences = await this.preferencesRepository.findByUserId(userId);

    if (!preferences) {
      throw new Error(`User preferences not found for user: ${userId}`);
    }

    // Update preferences using entity method
    preferences = preferences.update(updates);

    // Save to repository
    preferences = await this.preferencesRepository.update(preferences);

    this.logger.info("User preferences updated", {
      userId,
      preferencesId: preferences.id,
    });

    return preferences;
  }
}
