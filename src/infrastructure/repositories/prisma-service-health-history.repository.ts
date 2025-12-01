/**
 * Prisma Service Health History Repository Implementation
 */

import { injectable } from "inversify";
import type { IServiceHealthHistoryRepository } from "@/core/repositories/service-health-history.repository.interface";
import { ServiceHealthHistory } from "@/core/domain/entities/service-health-history.entity";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { ServiceHealthHistory as PrismaServiceHealthHistory } from "@/generated/prisma";
import type { ServiceHealthStatus } from "@/generated/prisma";
import { createRepositoryLogger } from "./repository-logger";
import { fromJsonValue, toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaServiceHealthHistoryRepository
  implements IServiceHealthHistoryRepository
{
  private readonly logger = createRepositoryLogger(
    "ServiceHealthHistoryRepository",
  );

  async create(history: ServiceHealthHistory): Promise<ServiceHealthHistory> {
    const timer = this.logger.startTimer();

    try {
      const created = await prisma.serviceHealthHistory.create({
        data: {
          id: history.id,
          serviceId: history.serviceId,
          previousStatus: history.previousStatus,
          newStatus: history.newStatus,
          checkTimestamp: history.checkTimestamp,
          responseTime: history.responseTime,
          errorMessage: history.errorMessage,
          statusCode: history.statusCode,
          checkDuration: history.checkDuration,
          triggeredBy: history.triggeredBy,
          metadata: toJsonValue(history.metadata),
          createdAt: history.createdAt,
        },
      });

      this.logger.timed("create", "Service health history created", timer(), {
        id: created.id,
        serviceId: created.serviceId,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create service health history",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ServiceHealthHistory | null> {
    const history = await prisma.serviceHealthHistory.findUnique({
      where: { id },
    });

    return history ? this.toDomain(history) : null;
  }

  async findByServiceId(
    serviceId: string,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceHealthHistory[]> {
    const histories = await prisma.serviceHealthHistory.findMany({
      where: { serviceId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkTimestamp: "desc" },
    });

    return histories.map((history) => this.toDomain(history));
  }

  async findByStatus(
    serviceId: string,
    status: ServiceHealthStatus,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceHealthHistory[]> {
    const histories = await prisma.serviceHealthHistory.findMany({
      where: { serviceId, newStatus: status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { checkTimestamp: "desc" },
    });

    return histories.map((history) => this.toDomain(history));
  }

  async findRecent(
    serviceId: string,
    limit: number,
  ): Promise<ServiceHealthHistory[]> {
    const histories = await prisma.serviceHealthHistory.findMany({
      where: { serviceId },
      orderBy: { checkTimestamp: "desc" },
      take: limit,
    });

    return histories.map((history) => this.toDomain(history));
  }

  async findByDateRange(
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceHealthHistory[]> {
    const histories = await prisma.serviceHealthHistory.findMany({
      where: {
        serviceId,
        checkTimestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { checkTimestamp: "desc" },
    });

    return histories.map((history) => this.toDomain(history));
  }

  async countByServiceId(serviceId: string): Promise<number> {
    return prisma.serviceHealthHistory.count({ where: { serviceId } });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.serviceHealthHistory.deleteMany({
      where: { checkTimestamp: { lt: date } },
    });

    return result.count;
  }

  private toDomain(history: PrismaServiceHealthHistory): ServiceHealthHistory {
    return ServiceHealthHistory.reconstitute({
      id: history.id,
      serviceId: history.serviceId,
      previousStatus: history.previousStatus,
      newStatus: history.newStatus,
      checkTimestamp: history.checkTimestamp,
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      statusCode: history.statusCode,
      checkDuration: history.checkDuration,
      triggeredBy: history.triggeredBy,
      metadata: fromJsonValue<Record<string, unknown>>(history.metadata),
      createdAt: history.createdAt,
    });
  }
}
