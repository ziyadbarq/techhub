/**
 * Apply Field Template Use Case
 *
 * Business logic for applying a field template to create field definitions
 * and link them to an entity (AssetCategory, CIClass, LicenseProduct).
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { FieldDefinition } from "@/core/domain/entities/field-definition.entity";
import { AssetCategoryField } from "@/core/domain/entities/asset-category-field.entity";
import { CIClassField } from "@/core/domain/entities/ci-class-field.entity";
import { LicenseProductField } from "@/core/domain/entities/license-product-field.entity";
import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { IAssetCategoryFieldRepository } from "@/core/repositories/asset-category-field.repository.interface";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type TargetEntityType = "AssetCategory" | "CIClass" | "LicenseProduct";

export interface ApplyFieldTemplateInput {
  templateId: string;
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  /** Optional: only apply specific fields from the template */
  fieldNames?: string[];
  /** Optional: skip fields that already exist */
  skipExisting?: boolean;
}

export interface ApplyFieldTemplateResult {
  template: FieldTemplate;
  createdFieldDefinitions: FieldDefinition[];
  linkedFieldDefinitions: FieldDefinition[];
  skippedFields: Array<{ fieldName: string; reason: string }>;
}

@injectable()
export class ApplyFieldTemplateUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
    @inject(DI_TOKENS.IAssetCategoryFieldRepository)
    private readonly assetCategoryFieldRepository: IAssetCategoryFieldRepository,
    @inject(DI_TOKENS.ICIClassFieldRepository)
    private readonly ciClassFieldRepository: ICIClassFieldRepository,
    @inject(DI_TOKENS.ILicenseProductFieldRepository)
    private readonly licenseProductFieldRepository: ILicenseProductFieldRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  /**
   * Execute apply field template use case
   *
   * Creates field definitions from template items and links them to the target entity.
   *
   * @param input - Apply template input
   * @returns Result with created/linked fields and any skipped fields
   * @throws NotFoundError if template not found
   */
  async execute(
    input: ApplyFieldTemplateInput,
  ): Promise<ApplyFieldTemplateResult> {
    const template = await this.fieldTemplateRepository.findById(
      input.templateId,
    );
    if (!template) {
      throw new NotFoundError(
        "Field template not found",
        "FieldTemplate",
        input.templateId,
      );
    }

    const createdFieldDefinitions: FieldDefinition[] = [];
    const linkedFieldDefinitions: FieldDefinition[] = [];
    const skippedFields: Array<{ fieldName: string; reason: string }> = [];

    // Filter items if specific field names provided
    let itemsToApply = template.items;
    if (input.fieldNames && input.fieldNames.length > 0) {
      itemsToApply = template.items.filter((item) =>
        input.fieldNames!.includes(item.fieldName),
      );
    }

    for (const item of itemsToApply) {
      try {
        let fieldDefinition: FieldDefinition | null = null;

        // Check if field definition already exists by name
        const existingField = await this.fieldDefinitionRepository.findByName(
          item.fieldName,
        );

        if (existingField) {
          if (input.skipExisting) {
            // Use existing field definition
            fieldDefinition = existingField;
            linkedFieldDefinitions.push(fieldDefinition);
          } else {
            skippedFields.push({
              fieldName: item.fieldName,
              reason: `Field "${item.fieldName}" already exists. Use skipExisting: true to link existing fields.`,
            });
            continue;
          }
        } else {
          // Create new field definition from template item
          const newFieldDefinition = FieldDefinition.create({
            name: item.fieldName,
            label: item.fieldLabel,
            dataType: item.fieldDataType,
            description: item.description ?? undefined,
            entityType: this.mapTargetToEntityType(input.targetEntityType),
            isGlobal: false,
            isRequired: item.isRequired,
            isUnique: item.isUnique,
            isSearchable: item.isSearchable,
            isFilterable: item.isFilterable,
            validationRules: item.validationRules ?? undefined,
            defaultValue: item.defaultValue ?? undefined,
            enumOptions: item.enumOptions ?? undefined,
            uiOrder: item.uiOrder,
            uiGroup: item.uiGroup ?? undefined,
            metadata: {
              ...(item.metadata ?? {}),
              sourceTemplateId: template.id,
              sourceTemplateName: template.name,
            },
          });

          fieldDefinition =
            await this.fieldDefinitionRepository.create(newFieldDefinition);
          createdFieldDefinitions.push(fieldDefinition);
        }

        // Link field definition to target entity
        await this.linkFieldToEntity(
          fieldDefinition,
          input.targetEntityType,
          input.targetEntityId,
          item.uiOrder,
          item.isRequired,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        skippedFields.push({
          fieldName: item.fieldName,
          reason: `Error: ${message}`,
        });
      }
    }

    return {
      template,
      createdFieldDefinitions,
      linkedFieldDefinitions,
      skippedFields,
    };
  }

  private mapTargetToEntityType(target: TargetEntityType): string {
    switch (target) {
      case "AssetCategory":
        return "Asset";
      case "CIClass":
        return "ConfigurationItem";
      case "LicenseProduct":
        return "LicenseEntitlement";
      default:
        return target;
    }
  }

  private async linkFieldToEntity(
    fieldDefinition: FieldDefinition,
    targetEntityType: TargetEntityType,
    targetEntityId: string,
    displayOrder: number,
    isRequired: boolean,
  ): Promise<void> {
    switch (targetEntityType) {
      case "AssetCategory": {
        // Check if already linked
        const existingAssetLink =
          await this.assetCategoryFieldRepository.findByAssetCategoryAndFieldDefinition(
            targetEntityId,
            fieldDefinition.id,
          );
        if (!existingAssetLink) {
          const assetCategoryField = AssetCategoryField.create({
            assetCategoryId: targetEntityId,
            fieldDefinitionId: fieldDefinition.id,
            uiOrder: displayOrder,
            isRequired,
          });
          await this.assetCategoryFieldRepository.create(assetCategoryField);
        }
        break;
      }

      case "CIClass": {
        // Check if already linked
        const existingCILink =
          await this.ciClassFieldRepository.findByCIClassAndFieldDefinition(
            targetEntityId,
            fieldDefinition.id,
          );
        if (!existingCILink) {
          const ciClassField = CIClassField.create({
            ciClassId: targetEntityId,
            fieldDefinitionId: fieldDefinition.id,
            uiOrder: displayOrder,
            isRequired,
          });
          await this.ciClassFieldRepository.create(ciClassField);
        }
        break;
      }

      case "LicenseProduct": {
        // Check if already linked
        const existingLicenseLink =
          await this.licenseProductFieldRepository.findByLicenseProductAndFieldDefinition(
            targetEntityId,
            fieldDefinition.id,
          );
        if (!existingLicenseLink) {
          const licenseProductField = LicenseProductField.create(
            {
              licenseProductId: targetEntityId,
              fieldDefinitionId: fieldDefinition.id,
              uiOrder: displayOrder,
              isRequired,
            },
            this.idGenerator,
          );
          await this.licenseProductFieldRepository.create(licenseProductField);
        }
        break;
      }
    }
  }
}
