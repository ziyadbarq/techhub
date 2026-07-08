/**
 * Prisma ServiceInfrastructure Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import type { ServiceInfrastructure as PrismaServiceInfrastructure } from "@/generated/prisma";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaServiceInfrastructureRepository implements IServiceInfrastructureRepository {
  private readonly logger = createRepositoryLogger(
    "ServiceInfrastructureRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    infrastructure: ServiceInfrastructure,
  ): Promise<ServiceInfrastructure> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.serviceInfrastructure.create({
        data: {
          id: infrastructure.id,
          serviceId: infrastructure.serviceId,
          location: infrastructure.location,
          cloudProvider: infrastructure.cloudProvider,
          compartment: infrastructure.compartment,
          project: infrastructure.project,
          region: infrastructure.region,
          ipAddress: infrastructure.ipAddress,
          hostname: infrastructure.hostname,
          backupEnabled: infrastructure.backupEnabled,
          backupSchedule: infrastructure.backupSchedule,
          lastBackupDate: infrastructure.lastBackupDate,
          cloudProviderDetails: toJsonValue(
            infrastructure.cloudProviderDetails,
          ),
          createdAt: infrastructure.createdAt,
          updatedAt: infrastructure.updatedAt,
        },
      });

      this.logger.timed("create", "Service infrastructure created", timer(), {
        id: created.id,
        serviceId: created.serviceId,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create service infrastructure",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ServiceInfrastructure | null> {
    const infrastructure = await this.prisma.serviceInfrastructure.findUnique({
      where: { id },
    });

    return infrastructure ? this.toDomain(infrastructure) : null;
  }

  async findByServiceId(serviceId: string): Promise<ServiceInfrastructure[]> {
    const infrastructures = await this.prisma.serviceInfrastructure.findMany({
      where: { serviceId },
      orderBy: { createdAt: "asc" },
    });

    return infrastructures.map((i) => this.toDomain(i));
  }

  async update(
    infrastructure: ServiceInfrastructure,
  ): Promise<ServiceInfrastructure> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.serviceInfrastructure.update({
        where: { id: infrastructure.id },
        data: {
          location: infrastructure.location,
          cloudProvider: infrastructure.cloudProvider,
          compartment: infrastructure.compartment,
          project: infrastructure.project,
          region: infrastructure.region,
          ipAddress: infrastructure.ipAddress,
          hostname: infrastructure.hostname,
          backupEnabled: infrastructure.backupEnabled,
          backupSchedule: infrastructure.backupSchedule,
          lastBackupDate: infrastructure.lastBackupDate,
          cloudProviderDetails: toJsonValue(
            infrastructure.cloudProviderDetails,
          ),
          updatedAt: infrastructure.updatedAt,
        },
      });

      this.logger.timed("update", "Service infrastructure updated", timer(), {
        id: updated.id,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "update",
        "Failed to update service infrastructure",
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.serviceInfrastructure.delete({
        where: { id },
      });

      this.logger.timed("delete", "Service infrastructure deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error(
        "delete",
        "Failed to delete service infrastructure",
        error,
      );
      throw error;
    }
  }

  private toDomain(
    prismaInfrastructure: PrismaServiceInfrastructure,
  ): ServiceInfrastructure {
    return ServiceInfrastructure.reconstitute({
      id: prismaInfrastructure.id,
      serviceId: prismaInfrastructure.serviceId,
      location: prismaInfrastructure.location,
      cloudProvider: prismaInfrastructure.cloudProvider,
      compartment: prismaInfrastructure.compartment,
      project: prismaInfrastructure.project,
      region: prismaInfrastructure.region,
      ipAddress: prismaInfrastructure.ipAddress,
      hostname: prismaInfrastructure.hostname,
      backupEnabled: prismaInfrastructure.backupEnabled,
      backupSchedule: prismaInfrastructure.backupSchedule,
      lastBackupDate: prismaInfrastructure.lastBackupDate,
      cloudProviderDetails: fromJsonValue<Record<string, unknown>>(
        prismaInfrastructure.cloudProviderDetails,
      ),
      createdAt: prismaInfrastructure.createdAt,
      updatedAt: prismaInfrastructure.updatedAt,
    });
  }
}
