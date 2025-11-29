/**
 * Prisma Field Definition Repository Implementation
 * Includes JSON field handling for validationRules and enumValues
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { FieldDefinition as PrismaFieldDefinition } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import {
  FieldDefinition,
  type FieldConditionalLogic,
} from "@/core/domain/entities/field-definition.entity";
import type {
  IFieldDefinitionRepository,
  FieldUsageStatistics,
} from "@/core/repositories/field-definition.repository.interface";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaFieldDefinitionRepository
  implements IFieldDefinitionRepository
{
  private readonly logger = createRepositoryLogger("FieldDefinitionRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(fieldDefinition: FieldDefinition): Promise<FieldDefinition> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.fieldDefinition.create({
        data: {
          name: fieldDefinition.name,
          label: fieldDefinition.label,
          description: fieldDefinition.description,
          dataType: fieldDefinition.dataType,
          entityType: fieldDefinition.entityType,
          isGlobal: fieldDefinition.isGlobal,
          isRequired: fieldDefinition.isRequired,
          isUnique: fieldDefinition.isUnique,
          isSearchable: fieldDefinition.isSearchable,
          isFilterable: fieldDefinition.isFilterable,
          defaultValue: toJsonValue(fieldDefinition.defaultValue),
          validationRules: toJsonValue(fieldDefinition.validationRules),
          enumOptions: toJsonValue(fieldDefinition.enumOptions),
          conditionalLogic: toJsonValue(fieldDefinition.conditionalLogic),
          uiOrder: fieldDefinition.uiOrder,
          uiGroup: fieldDefinition.uiGroup,
          displayOrder: fieldDefinition.displayOrder,
          isActive: fieldDefinition.isActive,
          metadata: toJsonValue(fieldDefinition.metadata),
        },
      });

      this.logger.timed("create", "Field definition created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create field definition", error);
      throw error;
    }
  }

  async findById(id: string): Promise<FieldDefinition | null> {
    const fieldDefinition = await this.prisma.fieldDefinition.findUnique({
      where: { id },
    });

    return fieldDefinition ? this.toDomain(fieldDefinition) : null;
  }

  async findByName(name: string): Promise<FieldDefinition | null> {
    const fieldDefinition = await this.prisma.fieldDefinition.findUnique({
      where: { name },
    });

    return fieldDefinition ? this.toDomain(fieldDefinition) : null;
  }

  async findByDataType(
    dataType: FieldDataTypeEnum,
  ): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { dataType },
      orderBy: { name: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findGlobal(options?: {
    dataType?: FieldDataTypeEnum;
  }): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: {
        isGlobal: true,
        ...(options?.dataType && { dataType: options.dataType }),
      },
      orderBy: { name: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findSearchable(): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { isSearchable: true },
      orderBy: { name: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findFilterable(): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { isFilterable: true },
      orderBy: { name: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findByUiGroup(uiGroup: string): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { uiGroup },
      orderBy: { uiOrder: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "label" | "dataType" | "uiOrder" | "createdAt";
    order?: "asc" | "desc";
    includeDeleted?: boolean;
    includeArchived?: boolean;
  }): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: {
        // Exclude soft-deleted records by default
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
        // Optionally exclude archived records
        ...(options?.includeArchived === false ? { archivedAt: null } : {}),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      dataType?: FieldDataTypeEnum;
      globalOnly?: boolean;
      includeDeleted?: boolean;
    },
  ): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: {
        // Exclude soft-deleted records by default
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
        ...(options?.dataType && { dataType: options.dataType }),
        ...(options?.globalOnly && { isGlobal: true }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { label: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async count(): Promise<number> {
    return await this.prisma.fieldDefinition.count();
  }

  async countByDataType(dataType: FieldDataTypeEnum): Promise<number> {
    return await this.prisma.fieldDefinition.count({
      where: { dataType },
    });
  }

  async update(fieldDefinition: FieldDefinition): Promise<FieldDefinition> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.fieldDefinition.update({
        where: { id: fieldDefinition.id },
        data: {
          label: fieldDefinition.label,
          description: fieldDefinition.description,
          entityType: fieldDefinition.entityType,
          isGlobal: fieldDefinition.isGlobal,
          isRequired: fieldDefinition.isRequired,
          isUnique: fieldDefinition.isUnique,
          isSearchable: fieldDefinition.isSearchable,
          isFilterable: fieldDefinition.isFilterable,
          defaultValue: toJsonValue(fieldDefinition.defaultValue),
          validationRules: toJsonValue(fieldDefinition.validationRules),
          enumOptions: toJsonValue(fieldDefinition.enumOptions),
          conditionalLogic: toJsonValue(fieldDefinition.conditionalLogic),
          uiOrder: fieldDefinition.uiOrder,
          uiGroup: fieldDefinition.uiGroup,
          displayOrder: fieldDefinition.displayOrder,
          isActive: fieldDefinition.isActive,
          metadata: toJsonValue(fieldDefinition.metadata),
          updatedAt: fieldDefinition.updatedAt,
        },
      });

      this.logger.timed("update", "Field definition updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update field definition", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.fieldDefinition.delete({
        where: { id },
      });

      this.logger.timed("delete", "Field definition deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete field definition", error);
      throw error;
    }
  }

  async isInUse(id: string): Promise<boolean> {
    const stats = await this.getUsageStatistics(id);
    return stats.isInUse;
  }

  async getUsageStatistics(id: string): Promise<FieldUsageStatistics> {
    const timer = this.logger.startTimer();

    try {
      // Get the field definition to access its name for JSON attribute checks
      const fieldDefinition = await this.prisma.fieldDefinition.findUnique({
        where: { id },
        select: { name: true },
      });

      if (!fieldDefinition) {
        return {
          isInUse: false,
          assetCategoryCount: 0,
          ciClassCount: 0,
          licenseProductCount: 0,
          assetValueCount: 0,
          ciValueCount: 0,
          licenseValueCount: 0,
          totalUsageCount: 0,
          usageDetails: {
            assetCategories: [],
            ciClasses: [],
            licenseProducts: [],
          },
        };
      }

      // Count junction table references with details
      const [assetCategoryFields, ciClassFields, licenseProductFields] =
        await Promise.all([
          this.prisma.assetCategoryField.findMany({
            where: { fieldDefinitionId: id },
            select: {
              assetCategory: {
                select: { id: true, name: true },
              },
            },
          }),
          this.prisma.cIClassField.findMany({
            where: { fieldDefinitionId: id },
            select: {
              ciClass: {
                select: { id: true, name: true },
              },
            },
          }),
          this.prisma.licenseProductField.findMany({
            where: { fieldDefinitionId: id },
            select: {
              licenseProduct: {
                select: { id: true, name: true },
              },
            },
          }),
        ]);

      // Check actual value usage in entity attributes using PostgreSQL JSON operators
      // The `?` operator checks if a key exists in a JSON object
      const fieldName = fieldDefinition.name;

      const [assetValueResult, ciValueResult, licenseValueResult] =
        await Promise.all([
          this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM assets
          WHERE attributes IS NOT NULL
          AND attributes ? ${fieldName}
          AND "deletedAt" IS NULL
        `,
          this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM configuration_items
          WHERE attributes IS NOT NULL
          AND attributes ? ${fieldName}
        `,
          this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM license_entitlements
          WHERE attributes IS NOT NULL
          AND attributes ? ${fieldName}
        `,
        ]);

      const assetCategoryCount = assetCategoryFields.length;
      const ciClassCount = ciClassFields.length;
      const licenseProductCount = licenseProductFields.length;
      const assetValueCount = Number(assetValueResult[0]?.count ?? 0);
      const ciValueCount = Number(ciValueResult[0]?.count ?? 0);
      const licenseValueCount = Number(licenseValueResult[0]?.count ?? 0);

      const totalUsageCount =
        assetCategoryCount +
        ciClassCount +
        licenseProductCount +
        assetValueCount +
        ciValueCount +
        licenseValueCount;

      const stats: FieldUsageStatistics = {
        isInUse: totalUsageCount > 0,
        assetCategoryCount,
        ciClassCount,
        licenseProductCount,
        assetValueCount,
        ciValueCount,
        licenseValueCount,
        totalUsageCount,
        usageDetails: {
          assetCategories: assetCategoryFields.map((f) => ({
            id: f.assetCategory.id,
            name: f.assetCategory.name,
          })),
          ciClasses: ciClassFields.map((f) => ({
            id: f.ciClass.id,
            name: f.ciClass.name,
          })),
          licenseProducts: licenseProductFields.map((f) => ({
            id: f.licenseProduct.id,
            name: f.licenseProduct.name,
          })),
        },
      };

      this.logger.timed(
        "getUsageStatistics",
        "Field usage statistics retrieved",
        timer(),
        { id, totalUsageCount, isInUse: stats.isInUse },
      );

      return stats;
    } catch (error) {
      this.logger.error(
        "getUsageStatistics",
        "Failed to get field usage statistics",
        error,
      );
      throw error;
    }
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const fieldDefinition = await this.prisma.fieldDefinition.findUnique({
      where: { name },
      select: { id: true },
    });

    if (!fieldDefinition) return false;
    if (excludeId && fieldDefinition.id === excludeId) return false;

    return true;
  }

  private toDomain(
    prismaFieldDefinition: PrismaFieldDefinition,
  ): FieldDefinition {
    return FieldDefinition.reconstitute({
      id: prismaFieldDefinition.id,
      name: prismaFieldDefinition.name,
      label: prismaFieldDefinition.label,
      description: prismaFieldDefinition.description,
      dataType: prismaFieldDefinition.dataType as FieldDataTypeEnum,
      entityType: prismaFieldDefinition.entityType,
      isGlobal: prismaFieldDefinition.isGlobal,
      isRequired: prismaFieldDefinition.isRequired,
      isUnique: prismaFieldDefinition.isUnique,
      isSearchable: prismaFieldDefinition.isSearchable,
      isFilterable: prismaFieldDefinition.isFilterable,
      defaultValue: fromJsonValue(
        prismaFieldDefinition.defaultValue,
      ) as unknown,
      validationRules: fromJsonValue(
        prismaFieldDefinition.validationRules,
      ) as Record<string, unknown> | null,
      enumOptions: fromJsonValue(prismaFieldDefinition.enumOptions) as
        | string[]
        | null,
      conditionalLogic: fromJsonValue(
        prismaFieldDefinition.conditionalLogic,
      ) as FieldConditionalLogic | null,
      uiOrder: prismaFieldDefinition.uiOrder,
      uiGroup: prismaFieldDefinition.uiGroup,
      displayOrder: prismaFieldDefinition.displayOrder,
      isActive: prismaFieldDefinition.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaFieldDefinition.metadata,
      ),
      createdAt: prismaFieldDefinition.createdAt,
      updatedAt: prismaFieldDefinition.updatedAt,
      // Soft delete fields
      deletedAt: prismaFieldDefinition.deletedAt,
      deletedById: prismaFieldDefinition.deletedById,
      // Archive fields
      archivedAt: prismaFieldDefinition.archivedAt,
      archivedById: prismaFieldDefinition.archivedById,
      archiveReason: prismaFieldDefinition.archiveReason,
    });
  }

  // Soft delete methods

  async softDelete(id: string, deletedById: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.fieldDefinition.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById,
          updatedAt: new Date(),
        },
      });

      this.logger.timed(
        "softDelete",
        "Field definition soft deleted",
        timer(),
        {
          id,
          deletedById,
        },
      );
    } catch (error) {
      this.logger.error(
        "softDelete",
        "Failed to soft delete field definition",
        error,
      );
      throw error;
    }
  }

  async restore(id: string): Promise<FieldDefinition> {
    const timer = this.logger.startTimer();

    try {
      const restored = await this.prisma.fieldDefinition.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
          updatedAt: new Date(),
        },
      });

      this.logger.timed("restore", "Field definition restored", timer(), {
        id,
      });
      return this.toDomain(restored);
    } catch (error) {
      this.logger.error("restore", "Failed to restore field definition", error);
      throw error;
    }
  }

  async archive(
    id: string,
    archivedById: string,
    reason?: string,
  ): Promise<FieldDefinition> {
    const timer = this.logger.startTimer();

    try {
      const archived = await this.prisma.fieldDefinition.update({
        where: { id },
        data: {
          archivedAt: new Date(),
          archivedById,
          archiveReason: reason?.trim() || null,
          updatedAt: new Date(),
        },
      });

      this.logger.timed("archive", "Field definition archived", timer(), {
        id,
        archivedById,
        reason,
      });
      return this.toDomain(archived);
    } catch (error) {
      this.logger.error("archive", "Failed to archive field definition", error);
      throw error;
    }
  }

  async unarchive(id: string): Promise<FieldDefinition> {
    const timer = this.logger.startTimer();

    try {
      const unarchived = await this.prisma.fieldDefinition.update({
        where: { id },
        data: {
          archivedAt: null,
          archivedById: null,
          archiveReason: null,
          updatedAt: new Date(),
        },
      });

      this.logger.timed("unarchive", "Field definition unarchived", timer(), {
        id,
      });
      return this.toDomain(unarchived);
    } catch (error) {
      this.logger.error(
        "unarchive",
        "Failed to unarchive field definition",
        error,
      );
      throw error;
    }
  }

  async findDeleted(): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }

  async findArchived(): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: { archivedAt: { not: null }, deletedAt: null },
      orderBy: { archivedAt: "desc" },
    });

    return fieldDefinitions.map((fd: PrismaFieldDefinition) =>
      this.toDomain(fd),
    );
  }
}
