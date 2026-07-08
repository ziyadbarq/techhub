/**
 * Prisma CIClassField Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  CIClassFieldWithDefinition,
  ICIClassFieldRepository,
} from "@/core/repositories/ci-class-field.repository.interface";
import { CIClassField } from "@/core/domain/entities/ci-class-field.entity";
import type { CIClassField as PrismaCIClassField } from "@/generated/prisma";
import { toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaCIClassFieldRepository implements ICIClassFieldRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async create(ciClassField: CIClassField): Promise<CIClassField> {
    const created = await this.prisma.cIClassField.create({
      data: {
        ciClassId: ciClassField.ciClassId,
        fieldDefinitionId: ciClassField.fieldDefinitionId,
        isRequired: ciClassField.isRequired,
        isUnique: ciClassField.isUnique,
        isVisible: ciClassField.isVisible,
        defaultValue: toJsonValue(ciClassField.defaultValue),
        uiOrder: ciClassField.uiOrder,
        note: ciClassField.note,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<CIClassField | null> {
    const ciClassField = await this.prisma.cIClassField.findUnique({
      where: { id },
    });

    return ciClassField ? this.toDomain(ciClassField) : null;
  }

  async findByCIClassId(ciClassId: string): Promise<CIClassField[]> {
    const ciClassFields = await this.prisma.cIClassField.findMany({
      where: { ciClassId },
      orderBy: { uiOrder: "asc" },
    });

    return ciClassFields.map((cf) => this.toDomain(cf));
  }

  async findByCIClassAndFieldDefinition(
    ciClassId: string,
    fieldDefinitionId: string,
  ): Promise<CIClassField | null> {
    const ciClassField = await this.prisma.cIClassField.findUnique({
      where: {
        ciClassId_fieldDefinitionId: {
          ciClassId,
          fieldDefinitionId,
        },
      },
    });

    return ciClassField ? this.toDomain(ciClassField) : null;
  }

  async findByFieldDefinitionId(
    fieldDefinitionId: string,
  ): Promise<CIClassField[]> {
    const ciClassFields = await this.prisma.cIClassField.findMany({
      where: { fieldDefinitionId },
      orderBy: { ciClassId: "asc" },
    });

    return ciClassFields.map((cf) => this.toDomain(cf));
  }

  async findAll(): Promise<CIClassField[]> {
    const ciClassFields = await this.prisma.cIClassField.findMany({
      orderBy: [{ ciClassId: "asc" }, { uiOrder: "asc" }],
    });

    return ciClassFields.map((cf) => this.toDomain(cf));
  }

  async update(ciClassField: CIClassField): Promise<CIClassField> {
    const updated = await this.prisma.cIClassField.update({
      where: { id: ciClassField.id },
      data: {
        isRequired: ciClassField.isRequired,
        isUnique: ciClassField.isUnique,
        isVisible: ciClassField.isVisible,
        defaultValue: toJsonValue(ciClassField.defaultValue),
        uiOrder: ciClassField.uiOrder,
        note: ciClassField.note,
        updatedAt: ciClassField.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cIClassField.delete({
      where: { id },
    });
  }

  async exists(ciClassId: string, fieldDefinitionId: string): Promise<boolean> {
    const count = await this.prisma.cIClassField.count({
      where: {
        ciClassId,
        fieldDefinitionId,
      },
    });

    return count > 0;
  }

  async countByCIClassId(ciClassId: string): Promise<number> {
    return await this.prisma.cIClassField.count({
      where: { ciClassId },
    });
  }

  /**
   * Find fields by CI class ID with FieldDefinition included
   * Returns raw Prisma result for enriched DTO creation
   *
   * This method returns:
   * 1. Class-specific fields linked via CIClassField
   * 2. Global CONFIGURATION_ITEM fields (isGlobal=true, entityType="CONFIGURATION_ITEM")
   */
  async findByCIClassIdWithDefinition(
    ciClassId: string,
  ): Promise<CIClassFieldWithDefinition[]> {
    // 1. Get class-specific fields from CIClassField
    const classFields = await this.prisma.cIClassField.findMany({
      where: { ciClassId },
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

    // 2. Get global CONFIGURATION_ITEM fields that aren't already linked to this class
    const linkedFieldIds = classFields.map((f) => f.fieldDefinitionId);
    const globalFields = await this.prisma.fieldDefinition.findMany({
      where: {
        entityType: "CONFIGURATION_ITEM",
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

    // 3. Convert global fields to the same structure as class fields
    const globalFieldsAsClassFields = globalFields.map((gf, index) => ({
      id: `global-${gf.id}`, // Virtual ID for global fields
      ciClassId,
      fieldDefinitionId: gf.id,
      isRequired: gf.isRequired,
      isUnique: false,
      isVisible: true,
      defaultValue: gf.defaultValue,
      uiOrder: 1000 + (gf.uiOrder || index), // Put global fields after class fields
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
    return [...classFields, ...globalFieldsAsClassFields];
  }

  private toDomain(prismaCF: PrismaCIClassField): CIClassField {
    return CIClassField.reconstitute({
      id: prismaCF.id,
      ciClassId: prismaCF.ciClassId,
      fieldDefinitionId: prismaCF.fieldDefinitionId,
      isRequired: prismaCF.isRequired,
      isUnique: prismaCF.isUnique,
      isVisible: prismaCF.isVisible,
      defaultValue: prismaCF.defaultValue as Record<string, unknown> | null,
      uiOrder: prismaCF.uiOrder,
      note: prismaCF.note,
      createdAt: prismaCF.createdAt,
      updatedAt: prismaCF.updatedAt,
    });
  }
}
