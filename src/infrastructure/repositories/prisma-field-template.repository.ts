/**
 * Prisma FieldTemplate Repository Implementation
 * Handles persistence for field templates and their items
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { Prisma } from "@/generated/prisma/server";
import type {
  FieldTemplate as PrismaFieldTemplate,
  FieldTemplateItem as PrismaFieldTemplateItem,
} from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import type { FieldDataTypeEnum } from "@/core/domain/value-objects/foundation-enums";
import {
  FieldTemplate,
  type FieldTemplateProps,
  type FieldTemplateItemProps,
} from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

type PrismaFieldTemplateWithItems = PrismaFieldTemplate & {
  items: PrismaFieldTemplateItem[];
};

@injectable()
export class PrismaFieldTemplateRepository implements IFieldTemplateRepository {
  private readonly logger = createRepositoryLogger("FieldTemplateRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(template: FieldTemplate): Promise<FieldTemplate> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.fieldTemplate.create({
        data: {
          name: template.name,
          code: template.code,
          description: template.description,
          entityType: template.entityType,
          category: template.category,
          standard: template.standard,
          isBuiltIn: template.isBuiltIn,
          isActive: template.isActive,
          metadata:
            (template.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          createdById: template.createdById,
          items: {
            create: template.items.map((item) => ({
              fieldDefinitionId: item.fieldDefinitionId,
              fieldName: item.fieldName,
              fieldLabel: item.fieldLabel,
              fieldDataType: item.fieldDataType,
              description: item.description,
              isRequired: item.isRequired,
              isUnique: item.isUnique,
              validationRules:
                (item.validationRules as Prisma.InputJsonValue) ??
                Prisma.JsonNull,
              defaultValue:
                (item.defaultValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              enumOptions:
                (item.enumOptions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              uiOrder: item.uiOrder,
              uiGroup: item.uiGroup,
              isSearchable: item.isSearchable,
              isFilterable: item.isFilterable,
              metadata:
                (item.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            })),
          },
        },
        include: { items: true },
      });

      this.logger.timed("create", "FieldTemplate created", timer(), {
        id: created.id,
        itemCount: created.items.length,
      });

      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create field template", error);
      throw error;
    }
  }

  async findById(id: string): Promise<FieldTemplate | null> {
    const template = await this.prisma.fieldTemplate.findUnique({
      where: { id },
      include: { items: { orderBy: { uiOrder: "asc" } } },
    });

    return template ? this.toDomain(template) : null;
  }

  async findByCode(code: string): Promise<FieldTemplate | null> {
    const template = await this.prisma.fieldTemplate.findUnique({
      where: { code },
      include: { items: { orderBy: { uiOrder: "asc" } } },
    });

    return template ? this.toDomain(template) : null;
  }

  async findByName(name: string): Promise<FieldTemplate | null> {
    const template = await this.prisma.fieldTemplate.findUnique({
      where: { name },
      include: { items: { orderBy: { uiOrder: "asc" } } },
    });

    return template ? this.toDomain(template) : null;
  }

  async findByEntityType(entityType: string): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: { entityType, isActive: true },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findByCategory(category: string): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: { category, isActive: true },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findByStandard(standard: string): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: { standard, isActive: true },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findBuiltIn(): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: { isBuiltIn: true, isActive: true },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findUserCreated(createdById?: string): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: {
        isBuiltIn: false,
        isActive: true,
        ...(createdById ? { createdById } : {}),
      },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findActive(options?: {
    entityType?: string;
    category?: string;
  }): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: {
        isActive: true,
        ...(options?.entityType ? { entityType: options.entityType } : {}),
        ...(options?.category ? { category: options.category } : {}),
      },
      include: { items: { orderBy: { uiOrder: "asc" } } },
      orderBy: { name: "asc" },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "entityType" | "createdAt";
    order?: "asc" | "desc";
    includeInactive?: boolean;
  }): Promise<FieldTemplate[]> {
    const orderBy = options?.orderBy || "name";
    const order = options?.order || "asc";

    const templates = await this.prisma.fieldTemplate.findMany({
      where: options?.includeInactive ? {} : { isActive: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: { [orderBy]: order },
      include: { items: { orderBy: { uiOrder: "asc" } } },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      entityType?: string;
      category?: string;
      builtInOnly?: boolean;
    },
  ): Promise<FieldTemplate[]> {
    const templates = await this.prisma.fieldTemplate.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          { isActive: true },
          options?.entityType ? { entityType: options.entityType } : {},
          options?.category ? { category: options.category } : {},
          options?.builtInOnly ? { isBuiltIn: true } : {},
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
      include: { items: { orderBy: { uiOrder: "asc" } } },
    });

    return templates.map((t) => this.toDomain(t));
  }

  async count(options?: {
    entityType?: string;
    category?: string;
    builtInOnly?: boolean;
    activeOnly?: boolean;
  }): Promise<number> {
    return this.prisma.fieldTemplate.count({
      where: {
        ...(options?.entityType ? { entityType: options.entityType } : {}),
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.builtInOnly ? { isBuiltIn: true } : {}),
        ...(options?.activeOnly !== false ? { isActive: true } : {}),
      },
    });
  }

  async update(template: FieldTemplate): Promise<FieldTemplate> {
    const timer = this.logger.startTimer();

    try {
      // Get existing items to compare
      const existing = await this.prisma.fieldTemplate.findUnique({
        where: { id: template.id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error(`Field template not found: ${template.id}`);
      }

      const existingItemIds = new Set(existing.items.map((i) => i.id));
      const newItemIds = new Set(
        template.items.filter((i) => i.id).map((i) => i.id),
      );

      // Items to delete (in existing but not in new)
      const itemsToDelete = [...existingItemIds].filter(
        (id) => !newItemIds.has(id),
      );

      // Items to update (in both)
      const itemsToUpdate = template.items.filter(
        (i) => i.id && existingItemIds.has(i.id),
      );

      // Items to create (new items without ID)
      const itemsToCreate = template.items.filter((i) => !i.id);

      // Use transaction for atomicity
      const updated = await this.prisma.$transaction(async (tx) => {
        // Delete removed items
        if (itemsToDelete.length > 0) {
          await tx.fieldTemplateItem.deleteMany({
            where: { id: { in: itemsToDelete } },
          });
        }

        // Update existing items
        for (const item of itemsToUpdate) {
          await tx.fieldTemplateItem.update({
            where: { id: item.id },
            data: {
              fieldDefinitionId: item.fieldDefinitionId,
              fieldName: item.fieldName,
              fieldLabel: item.fieldLabel,
              fieldDataType: item.fieldDataType,
              description: item.description,
              isRequired: item.isRequired,
              isUnique: item.isUnique,
              validationRules:
                (item.validationRules as Prisma.InputJsonValue) ??
                Prisma.JsonNull,
              defaultValue:
                (item.defaultValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              enumOptions:
                (item.enumOptions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              uiOrder: item.uiOrder,
              uiGroup: item.uiGroup,
              isSearchable: item.isSearchable,
              isFilterable: item.isFilterable,
              metadata:
                (item.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            },
          });
        }

        // Create new items
        if (itemsToCreate.length > 0) {
          await tx.fieldTemplateItem.createMany({
            data: itemsToCreate.map((item) => ({
              fieldTemplateId: template.id,
              fieldDefinitionId: item.fieldDefinitionId,
              fieldName: item.fieldName,
              fieldLabel: item.fieldLabel,
              fieldDataType: item.fieldDataType,
              description: item.description,
              isRequired: item.isRequired,
              isUnique: item.isUnique,
              validationRules:
                (item.validationRules as Prisma.InputJsonValue) ??
                Prisma.JsonNull,
              defaultValue:
                (item.defaultValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              enumOptions:
                (item.enumOptions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              uiOrder: item.uiOrder,
              uiGroup: item.uiGroup,
              isSearchable: item.isSearchable,
              isFilterable: item.isFilterable,
              metadata:
                (item.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            })),
          });
        }

        // Update template itself
        return tx.fieldTemplate.update({
          where: { id: template.id },
          data: {
            name: template.name,
            description: template.description,
            category: template.category,
            standard: template.standard,
            isActive: template.isActive,
            metadata:
              (template.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          },
          include: { items: { orderBy: { uiOrder: "asc" } } },
        });
      });

      this.logger.timed("update", "FieldTemplate updated", timer(), {
        id: updated.id,
        itemCount: updated.items.length,
      });

      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update field template", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      // Items are deleted via CASCADE
      await this.prisma.fieldTemplate.delete({
        where: { id },
      });

      this.logger.timed("delete", "FieldTemplate deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete field template", error);
      throw error;
    }
  }

  async isInUse(_id: string): Promise<boolean> {
    // Templates are considered "in use" if they've been applied to create fields
    // For now, templates are just blueprints and not tracked after application
    // This could be extended to track which categories/classes used a template
    return false;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const template = await this.prisma.fieldTemplate.findFirst({
      where: {
        code,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return template !== null;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const template = await this.prisma.fieldTemplate.findFirst({
      where: {
        name,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    return template !== null;
  }

  async getUsageCount(_id: string): Promise<number> {
    // Future: track when templates are applied to create fields
    return 0;
  }

  async clone(
    templateId: string,
    newName: string,
    newCode: string,
    createdById: string,
  ): Promise<FieldTemplate> {
    const timer = this.logger.startTimer();

    try {
      const source = await this.prisma.fieldTemplate.findUnique({
        where: { id: templateId },
        include: { items: { orderBy: { uiOrder: "asc" } } },
      });

      if (!source) {
        throw new Error(`Source template not found: ${templateId}`);
      }

      const cloned = await this.prisma.fieldTemplate.create({
        data: {
          name: newName,
          code: newCode,
          description: source.description
            ? `Cloned from: ${source.name}. ${source.description}`
            : `Cloned from: ${source.name}`,
          entityType: source.entityType,
          category: source.category,
          standard: source.standard,
          isBuiltIn: false, // Clones are always user-created
          isActive: true,
          metadata:
            (source.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          createdById,
          items: {
            create: source.items.map((item) => ({
              fieldDefinitionId: item.fieldDefinitionId,
              fieldName: item.fieldName,
              fieldLabel: item.fieldLabel,
              fieldDataType: item.fieldDataType,
              description: item.description,
              isRequired: item.isRequired,
              isUnique: item.isUnique,
              validationRules:
                (item.validationRules as Prisma.InputJsonValue) ??
                Prisma.JsonNull,
              defaultValue:
                (item.defaultValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              enumOptions:
                (item.enumOptions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              uiOrder: item.uiOrder,
              uiGroup: item.uiGroup,
              isSearchable: item.isSearchable,
              isFilterable: item.isFilterable,
              metadata:
                (item.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            })),
          },
        },
        include: { items: { orderBy: { uiOrder: "asc" } } },
      });

      this.logger.timed("clone", "FieldTemplate cloned", timer(), {
        sourceId: templateId,
        clonedId: cloned.id,
        itemCount: cloned.items.length,
      });

      return this.toDomain(cloned);
    } catch (error) {
      this.logger.error("clone", "Failed to clone field template", error);
      throw error;
    }
  }

  private toDomain(
    prismaTemplate: PrismaFieldTemplateWithItems,
  ): FieldTemplate {
    const items: FieldTemplateItemProps[] = prismaTemplate.items.map(
      (item) => ({
        id: item.id,
        fieldTemplateId: item.fieldTemplateId,
        fieldDefinitionId: item.fieldDefinitionId,
        fieldName: item.fieldName,
        fieldLabel: item.fieldLabel,
        fieldDataType: item.fieldDataType as FieldDataTypeEnum,
        description: item.description,
        isRequired: item.isRequired,
        isUnique: item.isUnique,
        validationRules: item.validationRules as Record<string, unknown> | null,
        defaultValue: item.defaultValue,
        enumOptions: item.enumOptions as string[] | null,
        uiOrder: item.uiOrder,
        uiGroup: item.uiGroup,
        isSearchable: item.isSearchable,
        isFilterable: item.isFilterable,
        metadata: item.metadata as Record<string, unknown> | null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }),
    );

    const props: FieldTemplateProps = {
      id: prismaTemplate.id,
      name: prismaTemplate.name,
      code: prismaTemplate.code,
      description: prismaTemplate.description,
      entityType: prismaTemplate.entityType,
      category: prismaTemplate.category,
      standard: prismaTemplate.standard,
      isBuiltIn: prismaTemplate.isBuiltIn,
      isActive: prismaTemplate.isActive,
      metadata: prismaTemplate.metadata as Record<string, unknown> | null,
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt,
      createdById: prismaTemplate.createdById,
      items,
    };

    return FieldTemplate.reconstitute(props);
  }
}
