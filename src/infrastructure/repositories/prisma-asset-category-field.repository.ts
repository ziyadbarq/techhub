/**
 * Prisma AssetCategoryField Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import type { AssetCategoryField as PrismaAssetCategoryField } from "@/generated/prisma";
import { toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetCategoryFieldRepository implements IAssetCategoryFieldRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async create(field: AssetCategoryField): Promise<AssetCategoryField> {
    const created = await this.prisma.assetCategoryField.create({
      data: {
        assetCategoryId: field.assetCategoryId,
        fieldDefinitionId: field.fieldDefinitionId,
        isRequired: field.isRequired,
        isUnique: field.isUnique,
        isVisible: field.isVisible,
        defaultValue: toJsonValue(field.defaultValue),
        uiOrder: field.uiOrder,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetCategoryField | null> {
    const field = await this.prisma.assetCategoryField.findUnique({
      where: { id },
    });

    return field ? this.toDomain(field) : null;
  }

  async findByAssetCategoryId(
    assetCategoryId: string,
  ): Promise<AssetCategoryField[]> {
    const fields = await this.prisma.assetCategoryField.findMany({
      where: { assetCategoryId },
      orderBy: { uiOrder: "asc" },
    });

    return fields.map((f) => this.toDomain(f));
  }

  async findByAssetCategoryAndFieldDefinition(
    assetCategoryId: string,
    fieldDefinitionId: string,
  ): Promise<AssetCategoryField | null> {
    const field = await this.prisma.assetCategoryField.findUnique({
      where: {
        assetCategoryId_fieldDefinitionId: {
          assetCategoryId,
          fieldDefinitionId,
        },
      },
    });

    return field ? this.toDomain(field) : null;
  }

  async findByFieldDefinitionId(
    fieldDefinitionId: string,
  ): Promise<AssetCategoryField[]> {
    const fields = await this.prisma.assetCategoryField.findMany({
      where: { fieldDefinitionId },
      orderBy: { assetCategoryId: "asc" },
    });

    return fields.map((f) => this.toDomain(f));
  }

  async findAll(): Promise<AssetCategoryField[]> {
    const fields = await this.prisma.assetCategoryField.findMany({
      orderBy: [{ assetCategoryId: "asc" }, { uiOrder: "asc" }],
    });

    return fields.map((f) => this.toDomain(f));
  }

  async update(field: AssetCategoryField): Promise<AssetCategoryField> {
    const updated = await this.prisma.assetCategoryField.update({
      where: { id: field.id },
      data: {
        isRequired: field.isRequired,
        isUnique: field.isUnique,
        isVisible: field.isVisible,
        defaultValue: toJsonValue(field.defaultValue),
        uiOrder: field.uiOrder,
        updatedAt: field.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetCategoryField.delete({
      where: { id },
    });
  }

  async exists(
    assetCategoryId: string,
    fieldDefinitionId: string,
  ): Promise<boolean> {
    const count = await this.prisma.assetCategoryField.count({
      where: {
        assetCategoryId,
        fieldDefinitionId,
      },
    });

    return count > 0;
  }

  async countByAssetCategoryId(assetCategoryId: string): Promise<number> {
    return await this.prisma.assetCategoryField.count({
      where: { assetCategoryId },
    });
  }

  /**
   * Find fields by asset category ID with FieldDefinition included
   * Returns raw Prisma result for enriched DTO creation
   *
   * This method returns:
   * 1. Category-specific fields linked via AssetCategoryField
   * 2. Global ASSET fields (isGlobal=true, entityType="ASSET")
   */
  async findByAssetCategoryIdWithDefinition(assetCategoryId: string) {
    // 1. Get category-specific fields from AssetCategoryField
    const categoryFields = await this.prisma.assetCategoryField.findMany({
      where: { assetCategoryId },
      orderBy: { uiOrder: "asc" },
      include: {
        fieldDefinition: {
          select: {
            id: true,
            name: true,
            label: true,
            description: true,
            dataType: true,
            enumOptions: true,
            validationRules: true,
            defaultValue: true,
            uiGroup: true,
          },
        },
      },
    });

    // 2. Get global ASSET fields that aren't already linked to this category
    const linkedFieldIds = categoryFields.map((f) => f.fieldDefinitionId);
    const globalFields = await this.prisma.fieldDefinition.findMany({
      where: {
        entityType: "ASSET",
        isGlobal: true,
        isActive: true,
        deletedAt: null,
        id: { notIn: linkedFieldIds },
      },
      orderBy: { uiOrder: "asc" },
      select: {
        id: true,
        name: true,
        label: true,
        description: true,
        dataType: true,
        enumOptions: true,
        validationRules: true,
        defaultValue: true,
        uiGroup: true,
        uiOrder: true,
        isRequired: true,
      },
    });

    // 3. Convert global fields to the same structure as category fields
    const globalFieldsAsCategory = globalFields.map((gf, index) => ({
      id: `global-${gf.id}`, // Virtual ID for global fields
      assetCategoryId,
      fieldDefinitionId: gf.id,
      isRequired: gf.isRequired,
      isUnique: false,
      isVisible: true,
      defaultValue: gf.defaultValue,
      uiOrder: 1000 + (gf.uiOrder || index), // Put global fields after category fields
      createdAt: new Date(),
      updatedAt: new Date(),
      fieldDefinition: {
        id: gf.id,
        name: gf.name,
        label: gf.label,
        description: gf.description,
        dataType: gf.dataType,
        enumOptions: gf.enumOptions,
        validationRules: gf.validationRules,
        defaultValue: gf.defaultValue,
        uiGroup: gf.uiGroup,
      },
    }));

    // 4. Combine and return all fields
    return [...categoryFields, ...globalFieldsAsCategory];
  }

  private toDomain(prismaField: PrismaAssetCategoryField): AssetCategoryField {
    return AssetCategoryField.reconstitute({
      id: prismaField.id,
      assetCategoryId: prismaField.assetCategoryId,
      fieldDefinitionId: prismaField.fieldDefinitionId,
      isRequired: prismaField.isRequired,
      isUnique: prismaField.isUnique,
      isVisible: prismaField.isVisible,
      defaultValue: prismaField.defaultValue as Record<string, unknown> | null,
      uiOrder: prismaField.uiOrder,
      createdAt: prismaField.createdAt,
      updatedAt: prismaField.updatedAt,
    });
  }
}
