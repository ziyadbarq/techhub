/**
 * Prisma Service SLA Metric Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IServiceSlaMetricRepository } from "@/core/repositories/service-sla-metric.repository.interface";
import { ServiceSlaMetric } from "@/core/domain/entities/service-sla-metric.entity";
import type { ServiceSlaMetric as PrismaServiceSlaMetric } from "@/generated/prisma";
import type { SlaMetricType, SlaComplianceStatus } from "@/generated/prisma";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaServiceSlaMetricRepository implements IServiceSlaMetricRepository {
  private readonly logger = createRepositoryLogger(
    "ServiceSlaMetricRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(metric: ServiceSlaMetric): Promise<ServiceSlaMetric> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.serviceSlaMetric.create({
        data: {
          id: metric.id,
          serviceId: metric.serviceId,
          metricType: metric.metricType,
          periodStart: metric.periodStart,
          periodEnd: metric.periodEnd,
          targetValue: metric.targetValue,
          actualValue: metric.actualValue,
          complianceStatus: metric.complianceStatus,
          breachDuration: metric.breachDuration,
          incidentCount: metric.incidentCount,
          notes: metric.notes,
          createdAt: metric.createdAt,
          updatedAt: metric.updatedAt,
        },
      });

      this.logger.timed("create", "Service SLA metric created", timer(), {
        id: created.id,
        serviceId: created.serviceId,
        metricType: created.metricType,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create SLA metric", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ServiceSlaMetric | null> {
    const metric = await this.prisma.serviceSlaMetric.findUnique({
      where: { id },
    });

    return metric ? this.toDomain(metric) : null;
  }

  async findByServiceId(
    serviceId: string,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]> {
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: { serviceId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { periodStart: "desc" },
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async findByType(
    serviceId: string,
    metricType: SlaMetricType,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]> {
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: { serviceId, metricType },
      skip: options?.skip,
      take: options?.take,
      orderBy: { periodStart: "desc" },
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async findByComplianceStatus(
    serviceId: string,
    status: SlaComplianceStatus,
    options?: { skip?: number; take?: number },
  ): Promise<ServiceSlaMetric[]> {
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: { serviceId, complianceStatus: status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { periodStart: "desc" },
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async findCurrentPeriod(serviceId: string): Promise<ServiceSlaMetric[]> {
    const now = new Date();
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: {
        serviceId,
        periodEnd: { gte: now },
      },
      orderBy: { periodStart: "desc" },
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async findByDateRange(
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ServiceSlaMetric[]> {
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: {
        serviceId,
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate },
      },
      orderBy: { periodStart: "desc" },
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async findRecent(
    serviceId: string,
    limit: number,
  ): Promise<ServiceSlaMetric[]> {
    const metrics = await this.prisma.serviceSlaMetric.findMany({
      where: { serviceId },
      orderBy: { periodStart: "desc" },
      take: limit,
    });

    return metrics.map((metric) => this.toDomain(metric));
  }

  async update(metric: ServiceSlaMetric): Promise<ServiceSlaMetric> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.serviceSlaMetric.update({
        where: { id: metric.id },
        data: {
          metricType: metric.metricType,
          periodStart: metric.periodStart,
          periodEnd: metric.periodEnd,
          targetValue: metric.targetValue,
          actualValue: metric.actualValue,
          complianceStatus: metric.complianceStatus,
          breachDuration: metric.breachDuration,
          incidentCount: metric.incidentCount,
          notes: metric.notes,
          updatedAt: metric.updatedAt,
        },
      });

      this.logger.timed("update", "Service SLA metric updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update SLA metric", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.serviceSlaMetric.delete({ where: { id } });

      this.logger.timed("delete", "Service SLA metric deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error("delete", "Failed to delete SLA metric", error);
      throw error;
    }
  }

  async countByServiceId(serviceId: string): Promise<number> {
    return this.prisma.serviceSlaMetric.count({ where: { serviceId } });
  }

  async countBreached(serviceId: string): Promise<number> {
    return this.prisma.serviceSlaMetric.count({
      where: { serviceId, complianceStatus: "BREACHED" },
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.serviceSlaMetric.deleteMany({
      where: { periodEnd: { lt: date } },
    });

    return result.count;
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof (value as { toNumber?: () => number }).toNumber === "function") {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value);
  }

  private toDomain(metric: PrismaServiceSlaMetric): ServiceSlaMetric {
    return ServiceSlaMetric.reconstitute({
      id: metric.id,
      serviceId: metric.serviceId,
      metricType: metric.metricType,
      periodStart: metric.periodStart,
      periodEnd: metric.periodEnd,
      targetValue: this.toNumber(metric.targetValue),
      actualValue: this.toNumber(metric.actualValue),
      complianceStatus: metric.complianceStatus,
      breachDuration: metric.breachDuration,
      incidentCount: metric.incidentCount,
      notes: metric.notes,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    });
  }
}
