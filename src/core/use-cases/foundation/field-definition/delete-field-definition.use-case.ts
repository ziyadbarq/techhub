/**
 * Delete Field Definition Use Case
 *
 * Business logic for deleting a field definition.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type {
  IFieldDefinitionRepository,
  FieldUsageStatistics,
} from "@/core/repositories/field-definition.repository.interface";

/**
 * Error thrown when attempting to delete a field definition that is in use
 */
export class FieldDefinitionInUseError extends Error {
  constructor(
    public readonly fieldId: string,
    public readonly usageStats: FieldUsageStatistics,
  ) {
    const details: string[] = [];

    if (usageStats.assetCategoryCount > 0) {
      const names = usageStats.usageDetails.assetCategories
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");
      const more =
        usageStats.assetCategoryCount > 3
          ? ` (+${usageStats.assetCategoryCount - 3} more)`
          : "";
      details.push(
        `${usageStats.assetCategoryCount} asset categories: ${names}${more}`,
      );
    }

    if (usageStats.ciClassCount > 0) {
      const names = usageStats.usageDetails.ciClasses
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");
      const more =
        usageStats.ciClassCount > 3
          ? ` (+${usageStats.ciClassCount - 3} more)`
          : "";
      details.push(`${usageStats.ciClassCount} CI classes: ${names}${more}`);
    }

    if (usageStats.licenseProductCount > 0) {
      const names = usageStats.usageDetails.licenseProducts
        .slice(0, 3)
        .map((c) => c.name)
        .join(", ");
      const more =
        usageStats.licenseProductCount > 3
          ? ` (+${usageStats.licenseProductCount - 3} more)`
          : "";
      details.push(
        `${usageStats.licenseProductCount} license products: ${names}${more}`,
      );
    }

    if (usageStats.assetValueCount > 0) {
      details.push(`${usageStats.assetValueCount} assets with values`);
    }

    if (usageStats.ciValueCount > 0) {
      details.push(
        `${usageStats.ciValueCount} configuration items with values`,
      );
    }

    if (usageStats.licenseValueCount > 0) {
      details.push(
        `${usageStats.licenseValueCount} license entitlements with values`,
      );
    }

    const message = `Cannot delete field definition because it is in use by: ${details.join("; ")}`;
    super(message);
    this.name = "FieldDefinitionInUseError";
  }
}

@injectable()
export class DeleteFieldDefinitionUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldDefinitionRepository)
    private readonly fieldDefinitionRepository: IFieldDefinitionRepository,
  ) {}

  /**
   * Execute delete field definition use case
   *
   * @param id - Field definition ID to delete
   * @throws NotFoundError if field definition not found
   * @throws FieldDefinitionInUseError if field definition is in use
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const fieldDefinition = await this.fieldDefinitionRepository.findById(id);
    if (!fieldDefinition) {
      throw new NotFoundError(
        "Field definition not found",
        "FieldDefinition",
        id,
      );
    }

    // Check if in use with detailed statistics
    const usageStats =
      await this.fieldDefinitionRepository.getUsageStatistics(id);
    if (usageStats.isInUse) {
      throw new FieldDefinitionInUseError(id, usageStats);
    }

    await this.fieldDefinitionRepository.delete(id);
  }
}
