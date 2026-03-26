/**
 * Prisma Configuration Item Repository Implementation
 */

import { injectable, inject } from "inversify";
import {
  Prisma,
  type PrismaClient,
  type ConfigurationItem as PrismaConfigurationItem,
} from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  CIDeletionContext,
  CIDeletionDependencies,
  FindStaleOptions,
  IConfigurationItemRepository,
  StaleCIRawRecord,
} from "@/core/repositories/configuration-item.repository.interface";
import {
  ConfigurationItem,
  type CriticalityEnum,
  type EnvironmentEnum,
} from "@/core/domain/entities/configuration-item.entity";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaConfigurationItemRepository implements IConfigurationItemRepository {
  private readonly logger = createRepositoryLogger(
    "ConfigurationItemRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(ci: ConfigurationItem): Promise<ConfigurationItem> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.configurationItem.create({
        data: {
          name: ci.name,
          ciClassId: ci.ciClassId,
          lifecycleStateId: ci.lifecycleStateId,
          criticality: ci.criticality,
          environment: ci.environment,
          primaryOwnerPersonId: ci.primaryOwnerPersonId,
          primaryOwnerOrgUnitId: ci.primaryOwnerOrgUnitId,
          locationId: ci.locationId,
          linkedAssetId: ci.linkedAssetId,
          ciKey: ci.ciKey,
          description: ci.description,
          attributes: toJsonValue(ci.attributes),
        },
      });

      this.logger.timed("create", "Configuration Item created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create configuration item", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ConfigurationItem | null> {
    const ci = await this.prisma.configurationItem.findUnique({
      where: { id },
    });

    return ci ? this.toDomain(ci) : null;
  }

  async findAll(): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByCiKey(ciKey: string): Promise<ConfigurationItem | null> {
    const ci = await this.prisma.configurationItem.findUnique({
      where: { ciKey },
    });

    return ci ? this.toDomain(ci) : null;
  }

  async findByCiClass(ciClassId: string): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { ciClassId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findOciManagedByServiceTypes(
    serviceTypes: string[],
  ): Promise<ConfigurationItem[]> {
    if (serviceTypes.length === 0) {
      return [];
    }

    const cis = await this.prisma.$queryRaw<PrismaConfigurationItem[]>(
      Prisma.sql`
        SELECT *
        FROM "configuration_items"
        WHERE "deletedAt" IS NULL
          AND attributes IS NOT NULL
          AND attributes->>'OCI_SERVICE_TYPE' IN (${Prisma.join(serviceTypes)})
        ORDER BY name ASC
      `,
    );

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByLinkedAsset(assetId: string): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { linkedAssetId: assetId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByOwnerPerson(personId: string): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { primaryOwnerPersonId: personId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByOwnerOrgUnit(orgUnitId: string): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { primaryOwnerOrgUnitId: orgUnitId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByLocation(locationId: string): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { locationId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByCriticality(
    criticality: CriticalityEnum,
  ): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { criticality },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByEnvironment(
    environment: EnvironmentEnum,
  ): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { environment },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findByLifecycleState(
    lifecycleStateId: string,
  ): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { lifecycleStateId },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findUnlinked(): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: { linkedAssetId: null },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async findUnowned(): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: {
        AND: [{ primaryOwnerPersonId: null }, { primaryOwnerOrgUnitId: null }],
      },
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      ciClassId?: string;
    },
  ): Promise<ConfigurationItem[]> {
    const cis = await this.prisma.configurationItem.findMany({
      where: {
        ...(options?.ciClassId && { ciClassId: options.ciClassId }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { ciKey: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return cis.map((ci) => this.toDomain(ci));
  }

  async update(ci: ConfigurationItem): Promise<ConfigurationItem> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.configurationItem.update({
        where: { id: ci.id },
        data: {
          name: ci.name,
          lifecycleStateId: ci.lifecycleStateId,
          criticality: ci.criticality,
          environment: ci.environment,
          primaryOwnerPersonId: ci.primaryOwnerPersonId,
          primaryOwnerOrgUnitId: ci.primaryOwnerOrgUnitId,
          locationId: ci.locationId,
          linkedAssetId: ci.linkedAssetId,
          ciKey: ci.ciKey,
          description: ci.description,
          attributes: toJsonValue(ci.attributes),
          updatedAt: ci.updatedAt,
        },
      });

      this.logger.timed("update", "Configuration Item updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update configuration item", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.configurationItem.delete({
        where: { id },
      });

      this.logger.timed("delete", "Configuration Item deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error("delete", "Failed to delete configuration item", error);
      throw error;
    }
  }

  async existsByCiKey(ciKey: string): Promise<boolean> {
    const count = await this.prisma.configurationItem.count({
      where: { ciKey },
    });

    return count > 0;
  }

  async getDeletionContext(ciId: string): Promise<CIDeletionContext | null> {
    const ci = await this.prisma.configurationItem.findUnique({
      where: { id: ciId },
      include: {
        ciClass: true,
      },
    });

    if (!ci) {
      return null;
    }

    const [
      relationshipsFrom,
      relationshipsTo,
      impactingRelationshipsTo,
      activeRelationshipsTo,
      activeRelationshipsFrom,
      relationships,
    ] = await Promise.all([
      this.prisma.cIRelationship.count({ where: { fromCiId: ciId } }),
      this.prisma.cIRelationship.count({ where: { toCiId: ciId } }),
      this.prisma.cIRelationship.count({
        where: {
          toCiId: ciId,
          isActive: true,
          relationshipType: { isImpacting: true },
        },
      }),
      this.prisma.cIRelationship.count({
        where: { toCiId: ciId, isActive: true },
      }),
      this.prisma.cIRelationship.count({
        where: { fromCiId: ciId, isActive: true },
      }),
      this.prisma.cIRelationship.findMany({
        where: { toCiId: ciId },
        include: {
          fromCi: true,
          relationshipType: true,
        },
      }),
    ]);

    const dependencies: CIDeletionDependencies = {
      relationshipsFrom,
      relationshipsTo,
      impactingRelationshipsTo,
      activeRelationshipsTo,
      activeRelationshipsFrom,
    };

    const impactingRelationships = relationships.map((rel) => ({
      relationshipType: rel.relationshipType.name,
      relatedCIKey: rel.fromCi.ciKey || "",
      relatedCIName: rel.fromCi.name,
      isImpacting: rel.relationshipType.isImpacting,
      isActive: rel.isActive,
    }));

    return {
      ci: {
        id: ci.id,
        ciKey: ci.ciKey,
        name: ci.name,
        ciClassName: ci.ciClass?.name ?? null,
        criticality: ci.criticality,
        environment: ci.environment,
      },
      dependencies,
      impactingRelationships,
    };
  }

  async deleteWithRelationships(ciId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.cIRelationship.deleteMany({
        where: {
          OR: [{ fromCiId: ciId }, { toCiId: ciId }],
        },
      });

      await tx.configurationItem.delete({
        where: { id: ciId },
      });
    });
  }

  async findStale(options: FindStaleOptions): Promise<StaleCIRawRecord[]> {
    const where: Record<string, unknown> = {
      updatedAt: { lt: options.thresholdDate },
      deletedAt: null,
    };

    if (options.environmentFilter) {
      where.environment = options.environmentFilter;
    }

    if (options.criticalityFilter) {
      where.criticality = options.criticalityFilter;
    }

    const staleCIs = await this.prisma.configurationItem.findMany({
      where,
      include: {
        ciClass: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    return staleCIs.map((ci) => ({
      id: ci.id,
      name: ci.name,
      ciKey: ci.ciKey,
      ciClassId: ci.ciClassId,
      ciClassName: ci.ciClass.name,
      criticality: ci.criticality,
      environment: ci.environment,
      updatedAt: ci.updatedAt,
      primaryOwnerPersonId: ci.primaryOwnerPersonId,
      primaryOwnerOrgUnitId: ci.primaryOwnerOrgUnitId,
    }));
  }

  async countActive(filters?: {
    environmentFilter?: string;
    criticalityFilter?: string;
  }): Promise<number> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.environmentFilter) {
      where.environment = filters.environmentFilter;
    }

    if (filters?.criticalityFilter) {
      where.criticality = filters.criticalityFilter;
    }

    return this.prisma.configurationItem.count({ where });
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaCI: PrismaConfigurationItem): ConfigurationItem {
    return ConfigurationItem.reconstitute({
      id: prismaCI.id,
      name: prismaCI.name,
      ciClassId: prismaCI.ciClassId,
      lifecycleStateId: prismaCI.lifecycleStateId,
      criticality: prismaCI.criticality as CriticalityEnum | null,
      environment: prismaCI.environment as EnvironmentEnum | null,
      primaryOwnerPersonId: prismaCI.primaryOwnerPersonId,
      primaryOwnerOrgUnitId: prismaCI.primaryOwnerOrgUnitId,
      locationId: prismaCI.locationId,
      linkedAssetId: prismaCI.linkedAssetId,
      ciKey: prismaCI.ciKey,
      description: prismaCI.description,
      attributes: fromJsonValue(prismaCI.attributes),
      createdAt: prismaCI.createdAt,
      updatedAt: prismaCI.updatedAt,
    });
  }
}
