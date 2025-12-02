/**
 * Prisma LicenseProductField Repository Implementation
 *
 * Implements ILicenseProductFieldRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient, Prisma } from "@/generated/prisma/server";
import type {
  ILicenseProductFieldRepository,
  LicenseProductFieldWithDefinition,
} from "@/core/repositories/license-product-field.repository.interface";
import { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";
import type { ILoggerService } from "@/core/services";
import { fromJsonValue, toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaLicenseProductFieldRepository
  implements ILicenseProductFieldRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(field: LicenseProductField): Promise<LicenseProductField> {
    this.logger.debug("Creating license product field", { id: field.id });

    const data = await this.prisma.licenseProductField.create({
      data: {
        id: field.id,
        licenseProductId: field.licenseProductId,
        fieldDefinitionId: field.fieldDefinitionId,
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        uiOrder: field.uiOrder,
        defaultValue: toJsonValue(field.defaultValue),
        createdAt: field.createdAt,
        updatedAt: field.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<LicenseProductField | null> {
    this.logger.debug("Finding license product field by id", { id });

    const data = await this.prisma.licenseProductField.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByLicenseProductId(
    licenseProductId: string,
  ): Promise<LicenseProductField[]> {
    this.logger.debug("Finding fields for license product", {
      licenseProductId,
    });

    const data = await this.prisma.licenseProductField.findMany({
      where: { licenseProductId },
      orderBy: { uiOrder: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByLicenseProductAndFieldDefinition(
    licenseProductId: string,
    fieldDefinitionId: string,
  ): Promise<LicenseProductField | null> {
    this.logger.debug("Finding field for product and definition", {
      licenseProductId,
      fieldDefinitionId,
    });

    const data = await this.prisma.licenseProductField.findUnique({
      where: {
        licenseProductId_fieldDefinitionId: {
          licenseProductId,
          fieldDefinitionId,
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async update(field: LicenseProductField): Promise<LicenseProductField> {
    this.logger.debug("Updating license product field", { id: field.id });

    const data = await this.prisma.licenseProductField.update({
      where: { id: field.id },
      data: {
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        uiOrder: field.uiOrder,
        defaultValue: toJsonValue(field.defaultValue),
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting license product field", { id });

    await this.prisma.licenseProductField.delete({
      where: { id },
    });
  }

  async exists(
    licenseProductId: string,
    fieldDefinitionId: string,
  ): Promise<boolean> {
    const count = await this.prisma.licenseProductField.count({
      where: {
        licenseProductId,
        fieldDefinitionId,
      },
    });

    return count > 0;
  }

  /**
   * Find fields by license product ID with FieldDefinition included
   * Returns raw Prisma result for enriched DTO creation
   *
   * This method returns:
   * 1. Product-specific fields linked via LicenseProductField
   * 2. Global LICENSE_PRODUCT fields (isGlobal=true, entityType="LICENSE_PRODUCT")
   */
  async findByLicenseProductIdWithDefinition(
    licenseProductId: string,
  ): Promise<LicenseProductFieldWithDefinition[]> {
    // 1. Get product-specific fields from LicenseProductField
    const productFields = await this.prisma.licenseProductField.findMany({
      where: { licenseProductId },
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

    const productFieldsWithDefinition: LicenseProductFieldWithDefinition[] =
      productFields.map((pf) => ({
        id: pf.id,
        licenseProductId: pf.licenseProductId,
        fieldDefinitionId: pf.fieldDefinitionId,
        isRequired: pf.isRequired,
        isUnique: (pf as { isUnique?: boolean }).isUnique ?? false,
        isVisible: pf.isVisible,
        defaultValue: pf.defaultValue,
        uiOrder: pf.uiOrder,
        note: (pf as { note?: string | null }).note ?? null,
        createdAt: pf.createdAt,
        updatedAt: pf.updatedAt,
        fieldDefinition: pf.fieldDefinition,
      }));

    // 2. Get global LICENSE_PRODUCT fields that aren't already linked to this product
    const linkedFieldIds = productFields.map((f) => f.fieldDefinitionId);
    const globalFields = await this.prisma.fieldDefinition.findMany({
      where: {
        entityType: "LICENSE_PRODUCT",
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

    // 3. Convert global fields to the same structure as product fields
    const globalFieldsAsProductFields = globalFields.map((gf, index) => ({
      id: `global-${gf.id}`, // Virtual ID for global fields
      licenseProductId,
      fieldDefinitionId: gf.id,
      isRequired: gf.isRequired,
      isUnique: false,
      isVisible: true,
      defaultValue: gf.defaultValue,
      uiOrder: 1000 + (gf.uiOrder || index), // Put global fields after product fields
      note: null,
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
    return [...productFieldsWithDefinition, ...globalFieldsAsProductFields];
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    licenseProductId: string;
    fieldDefinitionId: string;
    isRequired: boolean;
    isVisible: boolean;
    uiOrder: number;
    defaultValue: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): LicenseProductField {
    return LicenseProductField.restore({
      id: data.id,
      licenseProductId: data.licenseProductId,
      fieldDefinitionId: data.fieldDefinitionId,
      isRequired: data.isRequired,
      isVisible: data.isVisible,
      uiOrder: data.uiOrder,
      defaultValue: fromJsonValue<Record<string, unknown>>(data.defaultValue),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
