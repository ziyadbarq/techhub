/**
 * Prisma Organization Unit Repository Implementation
 * Includes hierarchical query support with recursive CTEs
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";
import type { OrganizationUnit as PrismaOrganizationUnit } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { OrganizationUnit } from "@/core/domain/entities/organization-unit.entity";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaOrganizationUnitRepository
  implements IOrganizationUnitRepository
{
  private readonly logger = createRepositoryLogger(
    "OrganizationUnitRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(orgUnit: OrganizationUnit): Promise<OrganizationUnit> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.organizationUnit.create({
        data: {
          code: orgUnit.code,
          name: orgUnit.name,
          description: orgUnit.description,
          parentId: orgUnit.parentId,
          unitType: orgUnit.unitType as $Enums.OrganizationUnitType,
          managerId: orgUnit.managerId,
          costCenter: orgUnit.costCenter,
          level: orgUnit.level,
          isActive: orgUnit.isActive,
          note: orgUnit.note,
          metadata: toJsonValue(orgUnit.metadata),
        },
      });

      this.logger.timed("create", "Organization unit created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create organization unit", error);
      throw error;
    }
  }

  async findById(id: string): Promise<OrganizationUnit | null> {
    const orgUnit = await this.prisma.organizationUnit.findUnique({
      where: { id },
    });

    return orgUnit ? this.toDomain(orgUnit) : null;
  }

  async findByCode(code: string): Promise<OrganizationUnit | null> {
    const orgUnit = await this.prisma.organizationUnit.findUnique({
      where: { code },
    });

    return orgUnit ? this.toDomain(orgUnit) : null;
  }

  async findByCodes(codes: string[]): Promise<OrganizationUnit[]> {
    if (codes.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values and normalize to uppercase
      const validCodes = codes
        .filter((c) => c !== null && c !== undefined && c.trim() !== "")
        .map((c) => c.toUpperCase().trim());

      if (validCodes.length === 0) return [];

      const orgUnits = await this.prisma.organizationUnit.findMany({
        where: { code: { in: validCodes } },
      });

      this.logger.timed(
        "findByCodes",
        "Organization units fetched by codes",
        timer(),
        {
          requestedCount: validCodes.length,
          foundCount: orgUnits.length,
        },
      );

      return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
    } catch (error) {
      this.logger.error(
        "findByCodes",
        "Failed to fetch organization units by codes",
        error,
      );
      throw error;
    }
  }

  async findRoots(): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async findChildren(parentId: string): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async findParent(id: string): Promise<OrganizationUnit | null> {
    const orgUnit = await this.prisma.organizationUnit.findUnique({
      where: { id },
      select: { parent: true },
    });

    return orgUnit?.parent ? this.toDomain(orgUnit.parent) : null;
  }

  async findAncestors(id: string): Promise<OrganizationUnit[]> {
    // Use recursive CTE to find all ancestors
    const ancestors = await this.prisma.$queryRaw<PrismaOrganizationUnit[]>`
      WITH RECURSIVE ancestors AS (
        SELECT *
        FROM "organization_units"
        WHERE id = ${id}

        UNION ALL

        SELECT ou.*
        FROM "organization_units" ou
        INNER JOIN ancestors a ON ou.id = a."parentId"
      )
      SELECT * FROM ancestors
      WHERE id != ${id}
      ORDER BY level ASC
    `;

    return ancestors.map((a: PrismaOrganizationUnit) => this.toDomain(a));
  }

  async findDescendants(id: string): Promise<OrganizationUnit[]> {
    // Use recursive CTE to find all descendants
    const descendants = await this.prisma.$queryRaw<PrismaOrganizationUnit[]>`
      WITH RECURSIVE descendants AS (
        SELECT *
        FROM "organization_units"
        WHERE id = ${id}

        UNION ALL

        SELECT ou.*
        FROM "organization_units" ou
        INNER JOIN descendants d ON ou."parentId" = d.id
      )
      SELECT * FROM descendants
      WHERE id != ${id}
      ORDER BY level ASC
    `;

    return descendants.map((d: PrismaOrganizationUnit) => this.toDomain(d));
  }

  async findSiblings(id: string): Promise<OrganizationUnit[]> {
    const orgUnit = await this.prisma.organizationUnit.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!orgUnit) return [];

    const siblings = await this.prisma.organizationUnit.findMany({
      where: {
        parentId: orgUnit.parentId,
        id: { not: id },
      },
      orderBy: { name: "asc" },
    });

    return siblings.map((s: PrismaOrganizationUnit) => this.toDomain(s));
  }

  async findByLevel(level: number): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: { level },
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: { isActive: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async findInactive(options?: {
    skip?: number;
    take?: number;
  }): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: { isActive: false },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "level" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number; activeOnly?: boolean },
  ): Promise<OrganizationUnit[]> {
    const orgUnits = await this.prisma.organizationUnit.findMany({
      where: {
        ...(options?.activeOnly && { isActive: true }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return orgUnits.map((ou: PrismaOrganizationUnit) => this.toDomain(ou));
  }

  async count(): Promise<number> {
    return await this.prisma.organizationUnit.count();
  }

  async countChildren(parentId: string): Promise<number> {
    return await this.prisma.organizationUnit.count({
      where: { parentId },
    });
  }

  async update(orgUnit: OrganizationUnit): Promise<OrganizationUnit> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.organizationUnit.update({
        where: { id: orgUnit.id },
        data: {
          code: orgUnit.code,
          name: orgUnit.name,
          description: orgUnit.description,
          parentId: orgUnit.parentId,
          unitType: orgUnit.unitType as $Enums.OrganizationUnitType,
          managerId: orgUnit.managerId,
          costCenter: orgUnit.costCenter,
          level: orgUnit.level,
          isActive: orgUnit.isActive,
          note: orgUnit.note,
          metadata: toJsonValue(orgUnit.metadata),
          updatedAt: orgUnit.updatedAt,
        },
      });

      this.logger.timed("update", "Organization unit updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update organization unit", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.organizationUnit.delete({
        where: { id },
      });

      this.logger.timed("delete", "Organization unit deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete organization unit", error);
      throw error;
    }
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.organizationUnit.count({
      where: { parentId: id },
    });

    return count > 0;
  }

  async hasActiveChildren(id: string): Promise<boolean> {
    const count = await this.prisma.organizationUnit.count({
      where: { parentId: id, isActive: true },
    });

    return count > 0;
  }

  async hasPeople(id: string): Promise<boolean> {
    const count = await this.prisma.person.count({
      where: { orgUnitId: id },
    });

    return count > 0;
  }

  async hasActivePeople(id: string): Promise<boolean> {
    const count = await this.prisma.person.count({
      where: { orgUnitId: id, isActive: true },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const orgUnit = await this.prisma.organizationUnit.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!orgUnit) return false;
    if (excludeId && orgUnit.id === excludeId) return false;

    return true;
  }

  private toDomain(prismaOrgUnit: PrismaOrganizationUnit): OrganizationUnit {
    return OrganizationUnit.reconstitute({
      id: prismaOrgUnit.id,
      code: prismaOrgUnit.code,
      name: prismaOrgUnit.name,
      description: prismaOrgUnit.description,
      parentId: prismaOrgUnit.parentId,
      unitType: prismaOrgUnit.unitType as OrganizationUnitType,
      managerId: prismaOrgUnit.managerId,
      costCenter: prismaOrgUnit.costCenter,
      level: prismaOrgUnit.level,
      isActive: prismaOrgUnit.isActive,
      note: prismaOrgUnit.note,
      metadata: fromJsonValue<Record<string, unknown>>(prismaOrgUnit.metadata),
      createdAt: prismaOrgUnit.createdAt,
      updatedAt: prismaOrgUnit.updatedAt,
    });
  }
}
