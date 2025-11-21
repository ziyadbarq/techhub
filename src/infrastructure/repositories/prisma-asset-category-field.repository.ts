/**
 * Prisma AssetCategoryField Repository Implementation
 */

import { injectable } from "inversify";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { AssetCategoryField as PrismaAssetCategoryField } from "@/generated/prisma";
import { toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaAssetCategoryFieldRepository
  implements IAssetCategoryFieldRepository
{
  async create(field: AssetCategoryField): Promise<AssetCategoryField> {
    const created = await prisma.assetCategoryField.create({
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
    const field = await prisma.assetCategoryField.findUnique({
      where: { id },
    });

    return field ? this.toDomain(field) : null;
  }

  async findByAssetCategoryId(
    assetCategoryId: string,
  ): Promise<AssetCategoryField[]> {
    const fields = await prisma.assetCategoryField.findMany({
      where: { assetCategoryId },
      orderBy: { uiOrder: "asc" },
    });

    return fields.map((f) => this.toDomain(f));
  }

  async findByAssetCategoryAndFieldDefinition(
    assetCategoryId: string,
    fieldDefinitionId: string,
  ): Promise<AssetCategoryField | null> {
    const field = await prisma.assetCategoryField.findUnique({
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
    const fields = await prisma.assetCategoryField.findMany({
      where: { fieldDefinitionId },
      orderBy: { assetCategoryId: "asc" },
    });

    return fields.map((f) => this.toDomain(f));
  }

  async findAll(): Promise<AssetCategoryField[]> {
    const fields = await prisma.assetCategoryField.findMany({
      orderBy: [{ assetCategoryId: "asc" }, { uiOrder: "asc" }],
    });

    return fields.map((f) => this.toDomain(f));
  }

  async update(field: AssetCategoryField): Promise<AssetCategoryField> {
    const updated = await prisma.assetCategoryField.update({
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
    await prisma.assetCategoryField.delete({
      where: { id },
    });
  }

  async exists(
    assetCategoryId: string,
    fieldDefinitionId: string,
  ): Promise<boolean> {
    const count = await prisma.assetCategoryField.count({
      where: {
        assetCategoryId,
        fieldDefinitionId,
      },
    });

    return count > 0;
  }

  async countByAssetCategoryId(assetCategoryId: string): Promise<number> {
    return await prisma.assetCategoryField.count({
      where: { assetCategoryId },
    });
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
