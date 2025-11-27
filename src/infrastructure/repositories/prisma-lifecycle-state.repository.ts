/**
 * Prisma Lifecycle State Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";
import type { LifecycleState as PrismaLifecycleState } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { LifecycleState } from "@/core/domain/entities/lifecycle-state.entity";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type { StateType } from "@/core/domain/value-objects/foundation-enums";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaLifecycleStateRepository
  implements ILifecycleStateRepository
{
  private readonly logger = createRepositoryLogger("LifecycleStateRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(lifecycleState: LifecycleState): Promise<LifecycleState> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.lifecycleState.create({
        data: {
          lifecycleModelId: lifecycleState.lifecycleModelId,
          name: lifecycleState.name,
          code: lifecycleState.code,
          description: lifecycleState.description,
          stateType: lifecycleState.stateType as $Enums.StateType,
          isActiveState: lifecycleState.isActiveState,
          isTerminalState: lifecycleState.isTerminalState,
          sortOrder: lifecycleState.sortOrder,
          isActive: lifecycleState.isActive,
          metadata: toJsonValue(lifecycleState.metadata),
        },
      });

      this.logger.timed("create", "Lifecycle state created", timer(), {
        id: created.id,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create lifecycle state", error);
      throw error;
    }
  }

  async findById(id: string): Promise<LifecycleState | null> {
    const lifecycleState = await this.prisma.lifecycleState.findUnique({
      where: { id },
    });

    return lifecycleState ? this.toDomain(lifecycleState) : null;
  }

  async findByLifecycleModelId(
    lifecycleModelId: string,
  ): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      where: { lifecycleModelId },
      orderBy: { sortOrder: "asc" },
    });

    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async findInitial(lifecycleModelId: string): Promise<LifecycleState | null> {
    const lifecycleState = await this.prisma.lifecycleState.findFirst({
      where: {
        lifecycleModelId,
        stateType: "INITIAL",
      },
      orderBy: { sortOrder: "asc" },
    });

    return lifecycleState ? this.toDomain(lifecycleState) : null;
  }

  async findActive(isActive: boolean): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      where: { isActive },
      orderBy: { name: "asc" },
    });

    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async findTerminal(isTerminal: boolean): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      where: { isTerminalState: isTerminal },
      orderBy: { name: "asc" },
    });

    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "sortOrder" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number },
  ): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
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

    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async count(): Promise<number> {
    return await this.prisma.lifecycleState.count();
  }

  async countByLifecycleModelId(lifecycleModelId: string): Promise<number> {
    return await this.prisma.lifecycleState.count({
      where: { lifecycleModelId },
    });
  }

  async findByCode(
    lifecycleModelId: string,
    code: string,
  ): Promise<LifecycleState | null> {
    const lifecycleState = await this.prisma.lifecycleState.findFirst({
      where: { lifecycleModelId, code },
    });
    return lifecycleState ? this.toDomain(lifecycleState) : null;
  }

  async findActiveStates(lifecycleModelId: string): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      where: { lifecycleModelId, isActiveState: true },
      orderBy: { sortOrder: "asc" },
    });
    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async findTerminalStates(
    lifecycleModelId: string,
  ): Promise<LifecycleState[]> {
    const lifecycleStates = await this.prisma.lifecycleState.findMany({
      where: { lifecycleModelId, isTerminalState: true },
      orderBy: { sortOrder: "asc" },
    });
    return lifecycleStates.map((s: PrismaLifecycleState) => this.toDomain(s));
  }

  async update(lifecycleState: LifecycleState): Promise<LifecycleState> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.lifecycleState.update({
        where: { id: lifecycleState.id },
        data: {
          name: lifecycleState.name,
          code: lifecycleState.code,
          description: lifecycleState.description,
          stateType: lifecycleState.stateType as $Enums.StateType,
          isActiveState: lifecycleState.isActiveState,
          isTerminalState: lifecycleState.isTerminalState,
          sortOrder: lifecycleState.sortOrder,
          isActive: lifecycleState.isActive,
          metadata: toJsonValue(lifecycleState.metadata),
          updatedAt: lifecycleState.updatedAt,
        },
      });

      this.logger.timed("update", "Lifecycle state updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update lifecycle state", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.lifecycleState.delete({
        where: { id },
      });

      this.logger.timed("delete", "Lifecycle state deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete lifecycle state", error);
      throw error;
    }
  }

  async isInUse(id: string): Promise<boolean> {
    const transitionCount = await this.prisma.lifecycleTransition.count({
      where: {
        OR: [{ fromStateId: id }, { toStateId: id }],
      },
    });

    if (transitionCount > 0) return true;

    const ciCount = await this.prisma.configurationItem.count({
      where: { lifecycleStateId: id },
    });

    return ciCount > 0;
  }

  async hasTransitions(id: string): Promise<boolean> {
    const count = await this.prisma.lifecycleTransition.count({
      where: {
        OR: [{ fromStateId: id }, { toStateId: id }],
      },
    });
    return count > 0;
  }

  async existsByCode(
    lifecycleModelId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const result = await this.prisma.lifecycleState.findFirst({
      where: {
        lifecycleModelId,
        code,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!result;
  }

  private toDomain(prismaState: PrismaLifecycleState): LifecycleState {
    return LifecycleState.reconstitute({
      id: prismaState.id,
      lifecycleModelId: prismaState.lifecycleModelId,
      name: prismaState.name,
      code: prismaState.code,
      description: prismaState.description,
      stateType: prismaState.stateType as StateType,
      isActiveState: prismaState.isActiveState,
      isTerminalState: prismaState.isTerminalState,
      sortOrder: prismaState.sortOrder,
      isActive: prismaState.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(prismaState.metadata),
      createdAt: prismaState.createdAt,
      updatedAt: prismaState.updatedAt,
    });
  }
}
