/**
 * Prisma Feature Flag Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  FeatureFlag as PrismaFeatureFlag,
  FeatureFlagCategory,
} from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { FeatureFlag } from "@/core/domain/entities/feature-flag.entity";
import type { IFeatureFlagRepository } from "@/core/repositories/feature-flag.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaFeatureFlagRepository implements IFeatureFlagRepository {
  private readonly logger = createRepositoryLogger("FeatureFlagRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(featureFlag: FeatureFlag): Promise<FeatureFlag> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.featureFlag.create({
        data: {
          name: featureFlag.name,
          displayName: featureFlag.displayName,
          description: featureFlag.description,
          category: featureFlag.category,
          isEnabled: featureFlag.isEnabled,
          isSystem: featureFlag.isSystem,
          dependsOn: featureFlag.dependsOn,
        },
      });

      this.logger.timed("create", "Feature flag created", timer(), {
        id: created.id,
        name: created.name,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create feature flag", error);
      throw error;
    }
  }

  async findById(id: string): Promise<FeatureFlag | null> {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    return featureFlag ? this.toDomain(featureFlag) : null;
  }

  async findByName(name: string): Promise<FeatureFlag | null> {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { name: name.toUpperCase() },
    });

    return featureFlag ? this.toDomain(featureFlag) : null;
  }

  async findAll(options?: {
    onlyEnabled?: boolean;
    category?: FeatureFlagCategory;
    orderBy?: "name" | "displayName" | "category" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<FeatureFlag[]> {
    const featureFlags = await this.prisma.featureFlag.findMany({
      where: {
        ...(options?.onlyEnabled !== undefined && {
          isEnabled: options.onlyEnabled,
        }),
        ...(options?.category && { category: options.category }),
      },
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { name: "asc" },
    });

    return featureFlags.map((flag) => this.toDomain(flag));
  }

  async findByNames(names: string[]): Promise<FeatureFlag[]> {
    const upperNames = names.map((name) => name.toUpperCase());
    const featureFlags = await this.prisma.featureFlag.findMany({
      where: {
        name: { in: upperNames },
      },
    });

    return featureFlags.map((flag) => this.toDomain(flag));
  }

  async findAllEnabled(): Promise<FeatureFlag[]> {
    return this.findAll({ onlyEnabled: true });
  }

  async findDependentFlags(featureName: string): Promise<FeatureFlag[]> {
    const upperName = featureName.toUpperCase();
    const featureFlags = await this.prisma.featureFlag.findMany({
      where: {
        dependsOn: {
          has: upperName,
        },
      },
    });

    return featureFlags.map((flag) => this.toDomain(flag));
  }

  async getEnabledFeatureNames(): Promise<Set<string>> {
    const enabledFlags = await this.prisma.featureFlag.findMany({
      where: { isEnabled: true },
      select: { name: true },
    });

    return new Set(enabledFlags.map((flag) => flag.name));
  }

  async count(onlyEnabled?: boolean): Promise<number> {
    return await this.prisma.featureFlag.count({
      where: onlyEnabled ? { isEnabled: true } : undefined,
    });
  }

  async update(featureFlag: FeatureFlag): Promise<FeatureFlag> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.featureFlag.update({
        where: { id: featureFlag.id },
        data: {
          displayName: featureFlag.displayName,
          description: featureFlag.description,
          isEnabled: featureFlag.isEnabled,
          dependsOn: featureFlag.dependsOn,
          updatedAt: featureFlag.updatedAt,
        },
      });

      this.logger.timed("update", "Feature flag updated", timer(), {
        id: updated.id,
        name: updated.name,
        isEnabled: updated.isEnabled,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update feature flag", error);
      throw error;
    }
  }

  async toggle(name: string): Promise<FeatureFlag> {
    const timer = this.logger.startTimer();

    try {
      // First get current state
      const current = await this.findByName(name);
      if (!current) {
        throw new Error(`Feature flag not found: ${name}`);
      }

      // Toggle it
      const toggled = current.toggle();

      // Save and return
      const result = await this.update(toggled);

      this.logger.timed("toggle", "Feature flag toggled", timer(), {
        name: result.name,
        isEnabled: result.isEnabled,
      });

      return result;
    } catch (error) {
      this.logger.error("toggle", "Failed to toggle feature flag", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.featureFlag.delete({
        where: { id },
      });

      this.logger.timed("delete", "Feature flag deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete feature flag", error);
      throw error;
    }
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const featureFlag = await this.prisma.featureFlag.findFirst({
      where: {
        name: name.toUpperCase(),
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!featureFlag;
  }

  async isFeatureEnabled(name: string): Promise<boolean> {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { name: name.toUpperCase() },
      select: { isEnabled: true },
    });

    return featureFlag?.isEnabled ?? false;
  }

  async isMaintenanceModeEnabled(): Promise<boolean> {
    return this.isFeatureEnabled("MAINTENANCE_MODE");
  }

  private toDomain(prismaFeatureFlag: PrismaFeatureFlag): FeatureFlag {
    return FeatureFlag.fromPersistence({
      id: prismaFeatureFlag.id,
      name: prismaFeatureFlag.name,
      displayName: prismaFeatureFlag.displayName,
      description: prismaFeatureFlag.description,
      category: prismaFeatureFlag.category,
      isEnabled: prismaFeatureFlag.isEnabled,
      isSystem: prismaFeatureFlag.isSystem,
      dependsOn: prismaFeatureFlag.dependsOn,
      createdAt: prismaFeatureFlag.createdAt,
      updatedAt: prismaFeatureFlag.updatedAt,
    });
  }
}
