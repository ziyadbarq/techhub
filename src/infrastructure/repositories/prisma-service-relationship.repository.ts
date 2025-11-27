/**
 * Prisma Service Relationship Repository Implementation
 */

import { injectable, inject } from "inversify";
import {
  Prisma,
  type PrismaClient,
  type ServiceRelationship as PrismaServiceRelationship,
  type ServiceRelationshipType,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRelationshipRepository } from "@/core/repositories/service-relationship.repository.interface";
import { ServiceRelationship } from "@/core/domain/entities/service-relationship.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaServiceRelationshipRepository
  implements IServiceRelationshipRepository
{
  private readonly logger = createRepositoryLogger(
    "ServiceRelationshipRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    relationship: ServiceRelationship,
  ): Promise<ServiceRelationship> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.serviceRelationship.create({
        data: {
          fromServiceId: relationship.fromServiceId,
          toServiceId: relationship.toServiceId,
          relationshipType: relationship.relationshipType,
          isCritical: relationship.isCritical,
          description: relationship.description,
          metadata:
            (relationship.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          isActive: relationship.isActive,
          validFrom: relationship.validFrom,
          validTo: relationship.validTo,
        },
      });

      this.logger.timed("create", "Service Relationship created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create service relationship",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<ServiceRelationship | null> {
    const relationship = await this.prisma.serviceRelationship.findUnique({
      where: { id },
    });

    return relationship ? this.toDomain(relationship) : null;
  }

  async findAll(): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByFromService(
    fromServiceId: string,
  ): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: { fromServiceId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByToService(toServiceId: string): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: { toServiceId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByService(serviceId: string): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: {
        OR: [{ fromServiceId: serviceId }, { toServiceId: serviceId }],
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByRelationshipType(
    relationshipType: ServiceRelationshipType,
  ): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: { relationshipType },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findActiveRelationships(): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findCurrentlyValidRelationships(): Promise<ServiceRelationship[]> {
    const now = new Date();

    const relationships = await this.prisma.serviceRelationship.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findCriticalRelationships(): Promise<ServiceRelationship[]> {
    const relationships = await this.prisma.serviceRelationship.findMany({
      where: {
        isCritical: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findImpactedServices(
    serviceId: string,
    maxDepth: number = 3,
  ): Promise<{ serviceId: string; serviceName: string; depth: number }[]> {
    const timer = this.logger.startTimer();

    try {
      // Use raw SQL with recursive CTE for impact analysis
      const result = await this.prisma.$queryRaw<
        { service_id: string; name: string; depth: number }[]
      >`
        WITH RECURSIVE impacted AS (
          -- Base case: direct dependents (services that depend on the target service)
          SELECT
            sr.from_service_id as service_id,
            1 as depth
          FROM service_relationships sr
          WHERE sr.to_service_id = ${serviceId}
            AND sr.is_active = true

          UNION

          -- Recursive case: dependents of dependents
          SELECT
            sr.from_service_id as service_id,
            i.depth + 1 as depth
          FROM service_relationships sr
          INNER JOIN impacted i ON sr.to_service_id = i.service_id
          WHERE sr.is_active = true
            AND i.depth < ${maxDepth}
            AND sr.from_service_id != ${serviceId}  -- Prevent cycles back to original
        )
        SELECT DISTINCT
          s.id as service_id,
          s.name,
          MIN(i.depth) as depth
        FROM services s
        INNER JOIN impacted i ON s.id = i.service_id
        GROUP BY s.id, s.name
        ORDER BY depth, s.name
      `;

      this.logger.timed(
        "findImpactedServices",
        "Impact analysis completed",
        timer(),
        { serviceId, count: result.length },
      );

      return result.map((r) => ({
        serviceId: r.service_id,
        serviceName: r.name,
        depth: Number(r.depth),
      }));
    } catch (error) {
      this.logger.error(
        "findImpactedServices",
        "Failed to find impacted services",
        error,
      );
      throw error;
    }
  }

  async update(
    relationship: ServiceRelationship,
  ): Promise<ServiceRelationship> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.serviceRelationship.update({
        where: { id: relationship.id },
        data: {
          isCritical: relationship.isCritical,
          description: relationship.description,
          metadata:
            (relationship.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          isActive: relationship.isActive,
          validTo: relationship.validTo,
          updatedAt: relationship.updatedAt,
        },
      });

      this.logger.timed("update", "Service Relationship updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "update",
        "Failed to update service relationship",
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.serviceRelationship.delete({
        where: { id },
      });

      this.logger.timed("delete", "Service Relationship deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error(
        "delete",
        "Failed to delete service relationship",
        error,
      );
      throw error;
    }
  }

  async existsBetweenServices(
    fromServiceId: string,
    toServiceId: string,
    relationshipType: ServiceRelationshipType,
  ): Promise<boolean> {
    const count = await this.prisma.serviceRelationship.count({
      where: {
        fromServiceId,
        toServiceId,
        relationshipType,
        isActive: true,
      },
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.serviceRelationship.count();
  }

  async countByService(serviceId: string): Promise<number> {
    return this.prisma.serviceRelationship.count({
      where: {
        OR: [{ fromServiceId: serviceId }, { toServiceId: serviceId }],
        isActive: true,
      },
    });
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(
    prismaRelationship: PrismaServiceRelationship,
  ): ServiceRelationship {
    return ServiceRelationship.reconstitute({
      id: prismaRelationship.id,
      fromServiceId: prismaRelationship.fromServiceId,
      toServiceId: prismaRelationship.toServiceId,
      relationshipType: prismaRelationship.relationshipType,
      isCritical: prismaRelationship.isCritical,
      description: prismaRelationship.description,
      metadata: prismaRelationship.metadata as Record<string, unknown> | null,
      isActive: prismaRelationship.isActive,
      validFrom: prismaRelationship.validFrom,
      validTo: prismaRelationship.validTo,
      createdAt: prismaRelationship.createdAt,
      updatedAt: prismaRelationship.updatedAt,
    });
  }
}
