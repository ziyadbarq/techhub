/**
 * IUserPreferencesRepository Interface
 * Data access contract for user preferences
 */

import type { UserPreferences } from "../domain/entities/user-preferences.entity";

export interface IUserPreferencesRepository {
  /**
   * Find user preferences by user ID
   */
  findByUserId(userId: string): Promise<UserPreferences | null>;

  /**
   * Create new user preferences
   */
  create(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * Update existing user preferences
   */
  update(preferences: UserPreferences): Promise<UserPreferences>;

  /**
   * Delete user preferences
   */
  delete(userId: string): Promise<void>;
}
