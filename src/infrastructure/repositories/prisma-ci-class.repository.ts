/**
 * Prisma CIClass Repository Implementation
 * Handles persistence for CI classes
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { CIClass as PrismaCIClass } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import {
  CIClass,
  type CriticalityLevel,
  type EnvironmentType,
} from "@/core/domain/entities/ci-class.entity";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaCIClassRepository implements ICIClassRepository {
  private readonly logger = createRepositoryLogger("CIClassRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(ciClass: CIClass): Promise<CIClass> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.cIClass.create({
        data: {
          name: ciClass.name,
          code: ciClass.code,
          parentClassId: ciClass.parentClassId,
          description: ciClass.description,
          lifecycleModelId: ciClass.lifecycleModelId,
          defaultCriticality: ciClass.defaultCriticality,
          defaultEnvironment: ciClass.defaultEnvironment,
          isDiscoverable: ciClass.isDiscoverable,
        },
      });

      this.logger.timed("create", "CIClass created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create CI class", error);
      throw error;
    }
  }

  async findById(id: string): Promise<CIClass | null> {
    const ciClass = await this.prisma.cIClass.findUnique({
      where: { id },
    });

    return ciClass ? this.toDomain(ciClass) : null;
  }

  async findByCode(code: string): Promise<CIClass | null> {
    const ciClass = await this.prisma.cIClass.findUnique({
      where: { code },
    });

    return ciClass ? this.toDomain(ciClass) : null;
  }

  async findAll(): Promise<CIClass[]> {
    const ciClasses = await this.prisma.cIClass.findMany({
      orderBy: { name: "asc" },
    });

    return ciClasses.map((c: PrismaCIClass) => this.toDomain(c));
  }

  async findRootClasses(): Promise<CIClass[]> {
    const ciClasses = await this.prisma.cIClass.findMany({
      where: { parentClassId: null },
      orderBy: { name: "asc" },
    });

    return ciClasses.map((c: PrismaCIClass) => this.toDomain(c));
  }

  async findChildClasses(parentId: string): Promise<CIClass[]> {
    const ciClasses = await this.prisma.cIClass.findMany({
      where: { parentClassId: parentId },
      orderBy: { name: "asc" },
    });

    return ciClasses.map((c: PrismaCIClass) => this.toDomain(c));
  }

  async update(ciClass: CIClass): Promise<CIClass> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.cIClass.update({
        where: { id: ciClass.id },
        data: {
          name: ciClass.name,
          code: ciClass.code,
          parentClassId: ciClass.parentClassId,
          description: ciClass.description,
          lifecycleModelId: ciClass.lifecycleModelId,
          defaultCriticality: ciClass.defaultCriticality,
          defaultEnvironment: ciClass.defaultEnvironment,
          isDiscoverable: ciClass.isDiscoverable,
          updatedAt: ciClass.updatedAt,
        },
      });

      this.logger.timed("update", "CIClass updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update CI class", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.cIClass.delete({
        where: { id },
      });

      this.logger.timed("delete", "CIClass deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete CI class", error);
      throw error;
    }
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const ciClass = await this.prisma.cIClass.findFirst({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    return ciClass !== null;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const ciClass = await this.prisma.cIClass.findFirst({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    return ciClass !== null;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaCI: PrismaCIClass): CIClass {
    return CIClass.reconstitute({
      id: prismaCI.id,
      name: prismaCI.name,
      code: prismaCI.code,
      parentClassId: prismaCI.parentClassId,
      description: prismaCI.description,
      lifecycleModelId: prismaCI.lifecycleModelId,
      defaultCriticality:
        prismaCI.defaultCriticality as CriticalityLevel | null,
      defaultEnvironment: prismaCI.defaultEnvironment as EnvironmentType | null,
      isDiscoverable: prismaCI.isDiscoverable,
      createdAt: prismaCI.createdAt,
      updatedAt: prismaCI.updatedAt,
    });
  }
}
