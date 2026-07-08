/**
 * Prisma BusinessProcess Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import type { BusinessProcess as PrismaBusinessProcess } from "@/generated/prisma";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaBusinessProcessRepository implements IBusinessProcessRepository {
  private readonly logger = createRepositoryLogger("BusinessProcessRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(businessProcess: BusinessProcess): Promise<BusinessProcess> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.businessProcess.create({
        data: {
          id: businessProcess.id,
          code: businessProcess.code,
          name: businessProcess.name,
          description: businessProcess.description,
          category: businessProcess.category,
          metadata: toJsonValue(businessProcess.metadata),
          createdAt: businessProcess.createdAt,
          updatedAt: businessProcess.updatedAt,
        },
      });

      this.logger.timed("create", "Business process created", timer(), {
        id: created.id,
        code: created.code,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create business process", error);
      throw error;
    }
  }

  async findById(id: string): Promise<BusinessProcess | null> {
    const businessProcess = await this.prisma.businessProcess.findUnique({
      where: { id },
    });

    return businessProcess ? this.toDomain(businessProcess) : null;
  }

  async findByCode(code: string): Promise<BusinessProcess | null> {
    const businessProcess = await this.prisma.businessProcess.findUnique({
      where: { code: code.toUpperCase() },
    });

    return businessProcess ? this.toDomain(businessProcess) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "category" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<BusinessProcess[]> {
    const businessProcesses = await this.prisma.businessProcess.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { name: "asc" },
    });

    return businessProcesses.map((bp) => this.toDomain(bp));
  }

  async update(businessProcess: BusinessProcess): Promise<BusinessProcess> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.businessProcess.update({
        where: { id: businessProcess.id },
        data: {
          code: businessProcess.code,
          name: businessProcess.name,
          description: businessProcess.description,
          category: businessProcess.category,
          metadata: toJsonValue(businessProcess.metadata),
          updatedAt: businessProcess.updatedAt,
        },
      });

      this.logger.timed("update", "Business process updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update business process", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.businessProcess.delete({
        where: { id },
      });

      this.logger.timed("delete", "Business process deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete business process", error);
      throw error;
    }
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: { code: string; id?: { not: string } } = {
      code: code.toUpperCase(),
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.businessProcess.count({ where });
    return count > 0;
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<BusinessProcess[]> {
    const businessProcesses = await this.prisma.businessProcess.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return businessProcesses.map((bp) => this.toDomain(bp));
  }

  async count(): Promise<number> {
    return this.prisma.businessProcess.count();
  }

  private toDomain(
    prismaBusinessProcess: PrismaBusinessProcess,
  ): BusinessProcess {
    return BusinessProcess.reconstitute({
      id: prismaBusinessProcess.id,
      code: prismaBusinessProcess.code,
      name: prismaBusinessProcess.name,
      description: prismaBusinessProcess.description,
      category: prismaBusinessProcess.category,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaBusinessProcess.metadata,
      ),
      createdAt: prismaBusinessProcess.createdAt,
      updatedAt: prismaBusinessProcess.updatedAt,
    });
  }
}
