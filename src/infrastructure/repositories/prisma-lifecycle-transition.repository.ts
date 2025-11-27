/**
 * Prisma Lifecycle Transition Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { LifecycleTransition as PrismaLifecycleTransition } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { LifecycleTransition } from "@/core/domain/entities/lifecycle-transition.entity";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";
import type { ApprovalPolicy } from "@/core/domain/entities/lifecycle-transition.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaLifecycleTransitionRepository
  implements ILifecycleTransitionRepository
{
  private readonly logger = createRepositoryLogger(
    "LifecycleTransitionRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    lifecycleTransition: LifecycleTransition,
  ): Promise<LifecycleTransition> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.lifecycleTransition.create({
        data: {
          lifecycleModelId: lifecycleTransition.lifecycleModelId,
          fromStateId: lifecycleTransition.fromStateId,
          toStateId: lifecycleTransition.toStateId,
          name: lifecycleTransition.name,
          description: lifecycleTransition.description,
          requiredRoleId: lifecycleTransition.requiredRoleId,
          requiresApproval: lifecycleTransition.requiresApproval,
          approvalPolicy: toJsonValue(lifecycleTransition.approvalPolicy),
          conditions: toJsonValue(lifecycleTransition.conditions),
          isAutomated: lifecycleTransition.isAutomated,
          isActive: lifecycleTransition.isActive,
          metadata: toJsonValue(lifecycleTransition.metadata),
        },
      });

      this.logger.timed("create", "Lifecycle transition created", timer(), {
        id: created.id,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create lifecycle transition",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<LifecycleTransition | null> {
    const lifecycleTransition =
      await this.prisma.lifecycleTransition.findUnique({
        where: { id },
      });

    return lifecycleTransition ? this.toDomain(lifecycleTransition) : null;
  }

  async findByLifecycleModelId(
    lifecycleModelId: string,
  ): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        where: { lifecycleModelId },
        orderBy: { name: "asc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async findByFromStateId(fromStateId: string): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        where: { fromStateId },
        orderBy: { name: "asc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async findByToStateId(toStateId: string): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        where: { toStateId },
        orderBy: { name: "asc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async findRequiringApproval(
    requiresApproval: boolean,
  ): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        where: { requiresApproval },
        orderBy: { name: "asc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        skip: options?.skip,
        take: options?.take,
        orderBy: options?.orderBy
          ? { [options.orderBy]: options.order ?? "asc" }
          : { createdAt: "desc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number },
  ): Promise<LifecycleTransition[]> {
    const lifecycleTransitions = await this.prisma.lifecycleTransition.findMany(
      {
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        skip: options?.skip,
        take: options?.take,
        orderBy: { name: "asc" },
      },
    );

    return lifecycleTransitions.map((t: PrismaLifecycleTransition) =>
      this.toDomain(t),
    );
  }

  async count(): Promise<number> {
    return await this.prisma.lifecycleTransition.count();
  }

  async countByLifecycleModelId(lifecycleModelId: string): Promise<number> {
    return await this.prisma.lifecycleTransition.count({
      where: { lifecycleModelId },
    });
  }

  async findByStates(
    lifecycleModelId: string,
    fromStateId: string,
    toStateId: string,
  ): Promise<LifecycleTransition | null> {
    const transition = await this.prisma.lifecycleTransition.findFirst({
      where: { lifecycleModelId, fromStateId, toStateId },
    });
    return transition ? this.toDomain(transition) : null;
  }

  async findValidTransitionsFromState(
    lifecycleModelId: string,
    fromStateId: string,
  ): Promise<LifecycleTransition[]> {
    const transitions = await this.prisma.lifecycleTransition.findMany({
      where: { lifecycleModelId, fromStateId, isActive: true },
      orderBy: { name: "asc" },
    });
    return transitions.map((t: PrismaLifecycleTransition) => this.toDomain(t));
  }

  async findValidTransitionsToState(
    lifecycleModelId: string,
    toStateId: string,
  ): Promise<LifecycleTransition[]> {
    const transitions = await this.prisma.lifecycleTransition.findMany({
      where: { lifecycleModelId, toStateId, isActive: true },
      orderBy: { name: "asc" },
    });
    return transitions.map((t: PrismaLifecycleTransition) => this.toDomain(t));
  }

  async findAutomatedTransitions(
    lifecycleModelId: string,
  ): Promise<LifecycleTransition[]> {
    const transitions = await this.prisma.lifecycleTransition.findMany({
      where: { lifecycleModelId, isAutomated: true },
      orderBy: { name: "asc" },
    });
    return transitions.map((t: PrismaLifecycleTransition) => this.toDomain(t));
  }

  async findByRequiredRole(roleId: string): Promise<LifecycleTransition[]> {
    const transitions = await this.prisma.lifecycleTransition.findMany({
      where: { requiredRoleId: roleId },
      orderBy: { name: "asc" },
    });
    return transitions.map((t: PrismaLifecycleTransition) => this.toDomain(t));
  }

  async update(
    lifecycleTransition: LifecycleTransition,
  ): Promise<LifecycleTransition> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.lifecycleTransition.update({
        where: { id: lifecycleTransition.id },
        data: {
          name: lifecycleTransition.name,
          description: lifecycleTransition.description,
          requiredRoleId: lifecycleTransition.requiredRoleId,
          requiresApproval: lifecycleTransition.requiresApproval,
          approvalPolicy: toJsonValue(lifecycleTransition.approvalPolicy),
          conditions: toJsonValue(lifecycleTransition.conditions),
          isAutomated: lifecycleTransition.isAutomated,
          isActive: lifecycleTransition.isActive,
          metadata: toJsonValue(lifecycleTransition.metadata),
          updatedAt: lifecycleTransition.updatedAt,
        },
      });

      this.logger.timed("update", "Lifecycle transition updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "update",
        "Failed to update lifecycle transition",
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.lifecycleTransition.delete({
        where: { id },
      });

      this.logger.timed("delete", "Lifecycle transition deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error(
        "delete",
        "Failed to delete lifecycle transition",
        error,
      );
      throw error;
    }
  }

  async existsByStates(
    lifecycleModelId: string,
    fromStateId: string,
    toStateId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.lifecycleTransition.findFirst({
      where: {
        lifecycleModelId,
        fromStateId,
        toStateId,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!existing;
  }

  private toDomain(
    prismaTransition: PrismaLifecycleTransition,
  ): LifecycleTransition {
    return LifecycleTransition.reconstitute({
      id: prismaTransition.id,
      lifecycleModelId: prismaTransition.lifecycleModelId,
      fromStateId: prismaTransition.fromStateId,
      toStateId: prismaTransition.toStateId,
      name: prismaTransition.name,
      description: prismaTransition.description,
      requiredRoleId: prismaTransition.requiredRoleId,
      requiresApproval: prismaTransition.requiresApproval,
      approvalPolicy: fromJsonValue<ApprovalPolicy>(
        prismaTransition.approvalPolicy,
      ),
      conditions: fromJsonValue<Record<string, unknown>>(
        prismaTransition.conditions,
      ),
      isAutomated: prismaTransition.isAutomated,
      isActive: prismaTransition.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaTransition.metadata,
      ),
      createdAt: prismaTransition.createdAt,
      updatedAt: prismaTransition.updatedAt,
    });
  }
}
