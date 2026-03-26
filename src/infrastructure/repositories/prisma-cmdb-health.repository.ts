/**
 * Prisma CMDB Health Repository Implementation
 *
 * Provides efficient aggregate queries for CMDB data quality metrics
 * using Prisma count, groupBy, and raw SQL for complex queries.
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  ICMDBHealthRepository,
  CIsByClassRecord,
  GroupByRecord,
} from "@/core/repositories/cmdb-health.repository.interface";

@injectable()
export class PrismaCMDBHealthRepository implements ICMDBHealthRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async countActiveCIs(): Promise<number> {
    return this.prisma.configurationItem.count({
      where: { deletedAt: null },
    });
  }

  async countActiveRelationships(): Promise<number> {
    return this.prisma.cIRelationship.count({
      where: { isActive: true },
    });
  }

  async countActiveCIClasses(): Promise<number> {
    return this.prisma.cIClass.count({
      where: { deletedAt: null },
    });
  }

  async countCIsWithoutOwner(): Promise<number> {
    return this.prisma.configurationItem.count({
      where: {
        deletedAt: null,
        primaryOwnerPersonId: null,
        primaryOwnerOrgUnitId: null,
      },
    });
  }

  async countCIsWithoutLifecycleState(): Promise<number> {
    return this.prisma.configurationItem.count({
      where: {
        deletedAt: null,
        lifecycleStateId: null,
      },
    });
  }

  async countCIsWithoutCriticality(): Promise<number> {
    return this.prisma.configurationItem.count({
      where: {
        deletedAt: null,
        criticality: null,
      },
    });
  }

  async countStaleCIs(olderThan: Date): Promise<number> {
    return this.prisma.configurationItem.count({
      where: {
        deletedAt: null,
        updatedAt: { lt: olderThan },
      },
    });
  }

  async countOrphanCIs(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "configuration_items" ci
      WHERE ci."deletedAt" IS NULL
        AND ci."id" NOT IN (
          SELECT "fromCiId" FROM "ci_relationships" WHERE "isActive" = true
          UNION
          SELECT "toCiId" FROM "ci_relationships" WHERE "isActive" = true
        )
    `;
    return Number(result[0].count);
  }

  async countCIsMissingRequiredFields(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT ci."id") as count
      FROM "configuration_items" ci
      JOIN "ci_class_fields" ccf ON ccf."ciClassId" = ci."ciClassId"
      JOIN "field_definitions" fd ON fd."id" = ccf."fieldDefinitionId"
      WHERE ci."deletedAt" IS NULL
        AND ccf."isRequired" = true
        AND (
          ci."attributes" IS NULL
          OR NOT (ci."attributes"::jsonb ? fd."name")
        )
    `;
    return Number(result[0].count);
  }

  async getCIsByClass(): Promise<CIsByClassRecord[]> {
    const result = await this.prisma.$queryRaw<
      Array<{ ciClassId: string; ciClassName: string; count: bigint }>
    >`
      SELECT ci."ciClassId", cc."name" as "ciClassName", COUNT(*)::bigint as count
      FROM "configuration_items" ci
      JOIN "ci_classes" cc ON cc."id" = ci."ciClassId"
      WHERE ci."deletedAt" IS NULL
      GROUP BY ci."ciClassId", cc."name"
      ORDER BY count DESC
    `;
    return result.map((row) => ({
      ciClassId: row.ciClassId,
      ciClassName: row.ciClassName,
      count: Number(row.count),
    }));
  }

  async getCIsByCriticality(): Promise<GroupByRecord[]> {
    const result = await this.prisma.configurationItem.groupBy({
      by: ["criticality"],
      where: { deletedAt: null },
      _count: true,
    });
    return result.map((row) => ({
      key: row.criticality as string | null,
      count: row._count,
    }));
  }

  async getCIsByEnvironment(): Promise<GroupByRecord[]> {
    const result = await this.prisma.configurationItem.groupBy({
      by: ["environment"],
      where: { deletedAt: null },
      _count: true,
    });
    return result.map((row) => ({
      key: row.environment as string | null,
      count: row._count,
    }));
  }
}
