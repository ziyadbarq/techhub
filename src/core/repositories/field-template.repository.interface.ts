/**
 * IFieldTemplateRepository Interface
 * Data access contract for field templates (pre-built field configurations)
 */

import type { FieldTemplate } from "../domain/entities/field-template.entity";

export interface IFieldTemplateRepository {
  /**
   * Create a new field template
   */
  create(template: FieldTemplate): Promise<FieldTemplate>;

  /**
   * Find field template by ID
   */
  findById(id: string): Promise<FieldTemplate | null>;

  /**
   * Find field template by code
   */
  findByCode(code: string): Promise<FieldTemplate | null>;

  /**
   * Find field template by name
   */
  findByName(name: string): Promise<FieldTemplate | null>;

  /**
   * Find templates by entity type (e.g., "ASSET", "CI", "LICENSE")
   */
  findByEntityType(entityType: string): Promise<FieldTemplate[]>;

  /**
   * Find templates by category (e.g., "IT_HARDWARE", "COMPLIANCE")
   */
  findByCategory(category: string): Promise<FieldTemplate[]>;

  /**
   * Find templates by standard (e.g., "ISO_27001", "NIST")
   */
  findByStandard(standard: string): Promise<FieldTemplate[]>;

  /**
   * Find built-in templates
   */
  findBuiltIn(): Promise<FieldTemplate[]>;

  /**
   * Find user-created templates
   */
  findUserCreated(createdById?: string): Promise<FieldTemplate[]>;

  /**
   * Find active templates
   */
  findActive(options?: {
    entityType?: string;
    category?: string;
  }): Promise<FieldTemplate[]>;

  /**
   * Find all field templates
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "entityType" | "createdAt";
    order?: "asc" | "desc";
    includeInactive?: boolean;
  }): Promise<FieldTemplate[]>;

  /**
   * Search field templates by name or description
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      entityType?: string;
      category?: string;
      builtInOnly?: boolean;
    },
  ): Promise<FieldTemplate[]>;

  /**
   * Count all field templates
   */
  count(options?: {
    entityType?: string;
    category?: string;
    builtInOnly?: boolean;
    activeOnly?: boolean;
  }): Promise<number>;

  /**
   * Update field template
   */
  update(template: FieldTemplate): Promise<FieldTemplate>;

  /**
   * Delete field template
   */
  delete(id: string): Promise<void>;

  /**
   * Check if template is in use (applied to any entities)
   */
  isInUse(id: string): Promise<boolean>;

  /**
   * Check if code exists (for uniqueness validation)
   */
  existsByCode(code: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if name exists (for uniqueness validation)
   */
  existsByName(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Get usage count (how many entities have used this template)
   */
  getUsageCount(id: string): Promise<number>;

  /**
   * Clone a template with new name and code
   */
  clone(
    templateId: string,
    newName: string,
    newCode: string,
    createdById: string,
  ): Promise<FieldTemplate>;
}
