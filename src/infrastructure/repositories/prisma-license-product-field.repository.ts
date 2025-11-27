/**
 * Prisma LicenseProductField Repository Implementation
 *
 * Implements ILicenseProductFieldRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient, Prisma } from "@/generated/prisma/server";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
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
