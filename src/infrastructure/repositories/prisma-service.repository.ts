/**
 * Prisma Service Repository Implementation
 */

import { injectable } from "inversify";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { Service } from "@/core/domain/entities/service.entity";
import { prisma } from "@/infrastructure/database/prisma/client";
import type {
  Service as PrismaService,
  ServiceType,
  ServiceStatus,
  CriticalityLevel,
} from "@/generated/prisma";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaServiceRepository implements IServiceRepository {
  private readonly logger = createRepositoryLogger("ServiceRepository");

  async create(service: Service): Promise<Service> {
    const timer = this.logger.startTimer();

    try {
      const created = await prisma.service.create({
        data: {
          id: service.id,
          name: service.name,
          serviceType: service.serviceType,
          description: service.description,
          businessPurpose: service.businessPurpose,
          gitlabRepoUrl: service.gitlabRepoUrl,
          dataConfidentiality: service.dataConfidentiality,
          businessImpactLevel: service.businessImpactLevel,
          criticality: service.criticality,
          isEssentialService: service.isEssentialService,
          deploymentDate: service.deploymentDate,
          currentStatus: service.currentStatus,
          lastPatchDate: service.lastPatchDate,
          plannedDecommissionDate: service.plannedDecommissionDate,
          vendorId: service.vendorId,
          slaDetails: toJsonValue(service.slaDetails),
          businessProcessId: service.businessProcessId,
          isInCentralRegister: service.isInCentralRegister,
          complianceNotes: service.complianceNotes,
          metadata: toJsonValue(service.metadata),
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
          createdBy: service.createdBy,
          updatedBy: service.updatedBy,
        },
        include: {
          vendor: true,
          businessProcess: true,
          owners: {
            include: {
              person: true,
            },
          },
          infrastructure: true,
          assets: {
            include: {
              asset: true,
            },
          },
        },
      });

      this.logger.timed("create", "Service created", timer(), {
        id: created.id,
        name: created.name,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create service", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Service | null> {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return service ? this.toDomain(service) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "serviceType" | "currentStatus" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Service[]> {
    const services = await prisma.service.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async update(service: Service): Promise<Service> {
    const timer = this.logger.startTimer();

    try {
      const updated = await prisma.service.update({
        where: { id: service.id },
        data: {
          name: service.name,
          serviceType: service.serviceType,
          description: service.description,
          businessPurpose: service.businessPurpose,
          gitlabRepoUrl: service.gitlabRepoUrl,
          dataConfidentiality: service.dataConfidentiality,
          businessImpactLevel: service.businessImpactLevel,
          criticality: service.criticality,
          isEssentialService: service.isEssentialService,
          deploymentDate: service.deploymentDate,
          currentStatus: service.currentStatus,
          lastPatchDate: service.lastPatchDate,
          plannedDecommissionDate: service.plannedDecommissionDate,
          vendorId: service.vendorId,
          slaDetails: toJsonValue(service.slaDetails),
          businessProcessId: service.businessProcessId,
          isInCentralRegister: service.isInCentralRegister,
          complianceNotes: service.complianceNotes,
          metadata: toJsonValue(service.metadata),
          updatedAt: service.updatedAt,
          updatedBy: service.updatedBy,
        },
        include: {
          vendor: true,
          businessProcess: true,
          owners: {
            include: {
              person: true,
            },
          },
          infrastructure: true,
          assets: {
            include: {
              asset: true,
            },
          },
        },
      });

      this.logger.timed("update", "Service updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update service", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await prisma.service.delete({
        where: { id },
      });

      this.logger.timed("delete", "Service deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete service", error);
      throw error;
    }
  }

  async findByType(
    type: ServiceType,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { serviceType: type },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findByStatus(
    status: ServiceStatus,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { currentStatus: status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findByCriticality(
    criticality: CriticalityLevel,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { criticality },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findEssentialServices(options?: {
    skip?: number;
    take?: number;
  }): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { isEssentialService: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findByOwner(
    personId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        owners: {
          some: {
            personId,
          },
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findByVendor(
    vendorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { vendorId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findByBusinessProcess(
    businessProcessId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: { businessProcessId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async findRetiringSoon(
    daysThreshold: number,
    options?: { skip?: number; take?: number },
  ): Promise<Service[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysThreshold);

    const services = await prisma.service.findMany({
      where: {
        plannedDecommissionDate: {
          gte: now,
          lte: futureDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { plannedDecommissionDate: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
    },
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        OR: [
          {
            name: {
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
          {
            businessPurpose: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        businessProcess: true,
        owners: {
          include: {
            person: true,
          },
        },
        infrastructure: true,
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    return services.map((s) => this.toDomain(s));
  }

  async count(): Promise<number> {
    return prisma.service.count();
  }

  async countByType(type: ServiceType): Promise<number> {
    return prisma.service.count({
      where: { serviceType: type },
    });
  }

  async countByStatus(status: ServiceStatus): Promise<number> {
    return prisma.service.count({
      where: { currentStatus: status },
    });
  }

  async countEssential(): Promise<number> {
    return prisma.service.count({
      where: { isEssentialService: true },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: { name: string; id?: { not: string } } = {
      name,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.service.count({ where });
    return count > 0;
  }

  private toDomain(
    prismaService: PrismaService & {
      vendor?: unknown;
      businessProcess?: unknown;
      owners?: unknown;
      infrastructure?: unknown;
      assets?: unknown;
    },
  ): Service {
    const toNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === "number") {
        return value;
      }
      if (
        typeof (value as { toNumber?: () => number }).toNumber === "function"
      ) {
        return (value as { toNumber: () => number }).toNumber();
      }
      return Number(value);
    };

    return Service.reconstitute({
      id: prismaService.id,
      name: prismaService.name,
      serviceType: prismaService.serviceType,
      description: prismaService.description,
      businessPurpose: prismaService.businessPurpose,
      gitlabRepoUrl: prismaService.gitlabRepoUrl,
      url: prismaService.url,
      supportContact: prismaService.supportContact,
      supportHours: prismaService.supportHours,
      dataConfidentiality: prismaService.dataConfidentiality,
      businessImpactLevel: prismaService.businessImpactLevel,
      criticality: prismaService.criticality,
      isEssentialService: prismaService.isEssentialService,
      deploymentDate: prismaService.deploymentDate,
      currentStatus: prismaService.currentStatus,
      lastPatchDate: prismaService.lastPatchDate,
      plannedDecommissionDate: prismaService.plannedDecommissionDate,
      vendorId: prismaService.vendorId,
      slaDetails: fromJsonValue<Record<string, unknown>>(
        prismaService.slaDetails,
      ),
      businessProcessId: prismaService.businessProcessId,
      isInCentralRegister: prismaService.isInCentralRegister,
      complianceNotes: prismaService.complianceNotes,
      metadata: fromJsonValue<Record<string, unknown>>(prismaService.metadata),
      createdAt: prismaService.createdAt,
      updatedAt: prismaService.updatedAt,
      createdBy: prismaService.createdBy,
      updatedBy: prismaService.updatedBy,
      slaResponseTimeP50: prismaService.slaResponseTimeP50,
      slaResponseTimeP95: prismaService.slaResponseTimeP95,
      slaResponseTimeP99: prismaService.slaResponseTimeP99,
      slaResolutionTimeCritical: prismaService.slaResolutionTimeCritical,
      slaResolutionTimeHigh: prismaService.slaResolutionTimeHigh,
      slaResolutionTimeMedium: prismaService.slaResolutionTimeMedium,
      slaUptimePercentage: toNumber(prismaService.slaUptimePercentage),
      slaErrorRateThreshold: toNumber(prismaService.slaErrorRateThreshold),
      slaComplianceStatus: prismaService.slaComplianceStatus,
      lastSlaReviewDate: prismaService.lastSlaReviewDate,
      slaViolationCount: prismaService.slaViolationCount,
      slaSupportTier: prismaService.slaSupportTier,
      slaContactEmail: prismaService.slaContactEmail,
      slaEscalationPath: prismaService.slaEscalationPath,
      healthStatus: prismaService.healthStatus,
      lastHealthCheck: prismaService.lastHealthCheck,
      nextScheduledHealthCheck: prismaService.nextScheduledHealthCheck,
      uptimePercentage24h: toNumber(prismaService.uptimePercentage24h),
      uptimePercentage7d: toNumber(prismaService.uptimePercentage7d),
      uptimePercentage30d: toNumber(prismaService.uptimePercentage30d),
      healthCheckUrl: prismaService.healthCheckUrl,
      healthCheckInterval: prismaService.healthCheckInterval,
      healthCheckTimeout: prismaService.healthCheckTimeout,
      healthCheckEnabled: prismaService.healthCheckEnabled,
      currentResponseTimeP50: toNumber(prismaService.currentResponseTimeP50),
      currentResponseTimeP95: toNumber(prismaService.currentResponseTimeP95),
      currentErrorRate: toNumber(prismaService.currentErrorRate),
      lastIncidentDate: prismaService.lastIncidentDate,
      lastDowntimeDate: prismaService.lastDowntimeDate,
      lastDowntimeDuration: toNumber(prismaService.lastDowntimeDuration),
      mttrMinutes: toNumber(prismaService.mttrMinutes),
      mtbfHours: toNumber(prismaService.mtbfHours),
    });
  }
}
