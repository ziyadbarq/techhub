/**
 * List Field Templates Use Case
 *
 * Business logic for listing and searching field templates.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { FieldTemplate } from "@/core/domain/entities/field-template.entity";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";

export interface ListFieldTemplatesInput {
  search?: string;
  entityType?: string;
  category?: string;
  standard?: string;
  builtInOnly?: boolean;
  userCreatedOnly?: boolean;
  createdById?: string;
  activeOnly?: boolean;
  skip?: number;
  take?: number;
  orderBy?: "name" | "code" | "entityType" | "createdAt";
  order?: "asc" | "desc";
}

export interface ListFieldTemplatesOutput {
  items: FieldTemplate[];
  total: number;
  skip: number;
  take: number;
}

@injectable()
export class ListFieldTemplatesUseCase {
  constructor(
    @inject(DI_TOKENS.IFieldTemplateRepository)
    private readonly fieldTemplateRepository: IFieldTemplateRepository,
  ) {}

  /**
   * Execute list field templates
   *
   * @param input - Filter and pagination options
   * @returns Paginated list of field templates
   */
  async execute(
    input: ListFieldTemplatesInput = {},
  ): Promise<ListFieldTemplatesOutput> {
    const skip = input.skip ?? 0;
    const take = input.take ?? 50;

    let items: FieldTemplate[];

    if (input.search) {
      // Search mode
      items = await this.fieldTemplateRepository.search(input.search, {
        skip,
        take,
        entityType: input.entityType,
        category: input.category,
        builtInOnly: input.builtInOnly,
      });
    } else if (input.builtInOnly) {
      // Built-in templates only
      items = await this.fieldTemplateRepository.findBuiltIn();
    } else if (input.userCreatedOnly) {
      // User-created templates only
      items = await this.fieldTemplateRepository.findUserCreated(
        input.createdById,
      );
    } else if (input.entityType && input.activeOnly !== false) {
      // Filter by entity type (active templates)
      items = await this.fieldTemplateRepository.findActive({
        entityType: input.entityType,
        category: input.category,
      });
    } else if (input.category) {
      // Filter by category
      items = await this.fieldTemplateRepository.findByCategory(input.category);
    } else if (input.standard) {
      // Filter by standard
      items = await this.fieldTemplateRepository.findByStandard(input.standard);
    } else {
      // Default list all
      items = await this.fieldTemplateRepository.findAll({
        skip,
        take,
        orderBy: input.orderBy,
        order: input.order,
        includeInactive: input.activeOnly === false,
      });
    }

    const total = await this.fieldTemplateRepository.count({
      entityType: input.entityType,
      category: input.category,
      builtInOnly: input.builtInOnly,
      activeOnly: input.activeOnly,
    });

    return {
      items,
      total,
      skip,
      take,
    };
  }

  /**
   * Get templates for a specific entity type (for template selector)
   */
  async executeForEntityType(entityType: string): Promise<FieldTemplate[]> {
    return this.fieldTemplateRepository.findByEntityType(entityType);
  }
}
