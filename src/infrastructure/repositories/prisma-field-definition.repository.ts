/**
 * Prisma Field Definition Repository Implementation
 * Includes JSON field handling for validationRules and enumValues
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { FieldDefinition as PrismaFieldDefinition } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
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
  }): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
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
    },
  ): Promise<FieldDefinition[]> {
    const fieldDefinitions = await this.prisma.fieldDefinition.findMany({
      where: {
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

  async isInUse(_id: string): Promise<boolean> {
    // TODO: Implement check for linked CI classes and asset categories
    // when these relationships are properly set up in the schema
    // For now, return false as field definitions are not yet linked
    return false;
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
      uiOrder: prismaFieldDefinition.uiOrder,
      uiGroup: prismaFieldDefinition.uiGroup,
      displayOrder: prismaFieldDefinition.displayOrder,
      isActive: prismaFieldDefinition.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaFieldDefinition.metadata,
      ),
      createdAt: prismaFieldDefinition.createdAt,
      updatedAt: prismaFieldDefinition.updatedAt,
    });
  }
}
