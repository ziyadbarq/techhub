/**
 * Prisma Lifecycle Model Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { LifecycleModel as PrismaLifecycleModel } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaLifecycleModelRepository
  implements ILifecycleModelRepository
{
  private readonly logger = createRepositoryLogger("LifecycleModelRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(lifecycleModel: LifecycleModel): Promise<LifecycleModel> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.lifecycleModel.create({
        data: {
          name: lifecycleModel.name,
          description: lifecycleModel.description,
        },
      });

      this.logger.timed("create", "Lifecycle model created", timer(), {
        id: created.id,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create lifecycle model", error);
      throw error;
    }
  }

  async findById(id: string): Promise<LifecycleModel | null> {
    const lifecycleModel = await this.prisma.lifecycleModel.findUnique({
      where: { id },
    });

    return lifecycleModel ? this.toDomain(lifecycleModel) : null;
  }

  async findByName(name: string): Promise<LifecycleModel | null> {
    const lifecycleModel = await this.prisma.lifecycleModel.findUnique({
      where: { name },
    });

    return lifecycleModel ? this.toDomain(lifecycleModel) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<LifecycleModel[]> {
    const lifecycleModels = await this.prisma.lifecycleModel.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return lifecycleModels.map((m: PrismaLifecycleModel) => this.toDomain(m));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number },
  ): Promise<LifecycleModel[]> {
    const lifecycleModels = await this.prisma.lifecycleModel.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return lifecycleModels.map((m: PrismaLifecycleModel) => this.toDomain(m));
  }

  async count(): Promise<number> {
    return await this.prisma.lifecycleModel.count();
  }

  async hasStates(id: string): Promise<boolean> {
    const stateCount = await this.prisma.lifecycleState.count({
      where: { lifecycleModelId: id },
    });
    return stateCount > 0;
  }

  async hasTransitions(id: string): Promise<boolean> {
    const transitionCount = await this.prisma.lifecycleTransition.count({
      where: { lifecycleModelId: id },
    });
    return transitionCount > 0;
  }

  async update(lifecycleModel: LifecycleModel): Promise<LifecycleModel> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.lifecycleModel.update({
        where: { id: lifecycleModel.id },
        data: {
          name: lifecycleModel.name,
          description: lifecycleModel.description,
          updatedAt: lifecycleModel.updatedAt,
        },
      });

      this.logger.timed("update", "Lifecycle model updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update lifecycle model", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.lifecycleModel.delete({
        where: { id },
      });

      this.logger.timed("delete", "Lifecycle model deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete lifecycle model", error);
      throw error;
    }
  }

  async isInUse(id: string): Promise<boolean> {
    const count = await this.prisma.lifecycleState.count({
      where: { lifecycleModelId: id },
    });

    return count > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const lifecycleModel = await this.prisma.lifecycleModel.findUnique({
      where: { name },
      select: { id: true },
    });

    if (!lifecycleModel) return false;
    if (excludeId && lifecycleModel.id === excludeId) return false;

    return true;
  }

  private toDomain(prismaModel: PrismaLifecycleModel): LifecycleModel {
    return LifecycleModel.reconstitute({
      id: prismaModel.id,
      name: prismaModel.name,
      description: prismaModel.description,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }
}
