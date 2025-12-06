/**
 * Prisma User Preferences Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { UserPreferences as PrismaUserPreferences } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import {
  UserPreferences,
  type NotificationPreferences,
} from "@/core/domain/entities/user-preferences.entity";
import type { IUserPreferencesRepository } from "@/core/repositories/user-preferences.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaUserPreferencesRepository
  implements IUserPreferencesRepository
{
  private readonly logger = createRepositoryLogger("UserPreferencesRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return preferences ? this.toDomain(preferences) : null;
  }

  async create(preferences: UserPreferences): Promise<UserPreferences> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.userPreferences.create({
        data: {
          userId: preferences.userId,
          timezone: preferences.timezone,
          dateFormat: preferences.dateFormat,
          currencyDisplay: preferences.currencyDisplay,
          notifications: preferences.notifications as object,
        },
      });

      this.logger.timed("create", "User preferences created", timer(), {
        userId: created.userId,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create user preferences", error);
      throw error;
    }
  }

  async update(preferences: UserPreferences): Promise<UserPreferences> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.userPreferences.update({
        where: { userId: preferences.userId },
        data: {
          timezone: preferences.timezone,
          dateFormat: preferences.dateFormat,
          currencyDisplay: preferences.currencyDisplay,
          notifications: preferences.notifications as object,
          updatedAt: preferences.updatedAt,
        },
      });

      this.logger.timed("update", "User preferences updated", timer(), {
        userId: updated.userId,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update user preferences", error);
      throw error;
    }
  }

  async delete(userId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.userPreferences.delete({
        where: { userId },
      });

      this.logger.timed("delete", "User preferences deleted", timer(), {
        userId,
      });
    } catch (error) {
      this.logger.error("delete", "Failed to delete user preferences", error);
      throw error;
    }
  }

  private toDomain(prismaPreferences: PrismaUserPreferences): UserPreferences {
    // Parse JSON notifications field
    const notifications =
      typeof prismaPreferences.notifications === "string"
        ? (JSON.parse(
            prismaPreferences.notifications,
          ) as NotificationPreferences)
        : (prismaPreferences.notifications as unknown as NotificationPreferences);

    return UserPreferences.fromPersistence({
      id: prismaPreferences.id,
      userId: prismaPreferences.userId,
      timezone: prismaPreferences.timezone,
      dateFormat: prismaPreferences.dateFormat,
      currencyDisplay: prismaPreferences.currencyDisplay,
      notifications,
      createdAt: prismaPreferences.createdAt,
      updatedAt: prismaPreferences.updatedAt,
    });
  }
}
