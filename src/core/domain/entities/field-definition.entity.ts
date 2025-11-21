/**
 * FieldDefinition Domain Entity
 * Meta-model for dynamic attributes across CMDB/ITAM entities
 */

import { FieldDataTypeEnum } from "../value-objects/foundation-enums";

export interface ValidationRules {
  min?: number;
  max?: number;
  regex?: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface FieldDefinitionProps {
  id: string;
  name: string; // Internal name (e.g., cpu_cores)
  label: string; // Display label
  dataType: FieldDataTypeEnum;
  description: string | null;
  entityType: string;
  isGlobal: boolean; // True if reusable across domains
  isRequired: boolean;
  isUnique: boolean;
  validationRules: ValidationRules | null;
  defaultValue: unknown;
  enumOptions: string[] | null; // For ENUM data_type
  uiGroup: string | null; // Group/tab in UI
  uiOrder: number;
  displayOrder: number;
  isSearchable: boolean;
  isFilterable: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFieldDefinitionProps {
  name: string;
  label: string;
  dataType: FieldDataTypeEnum;
  description?: string | null;
  entityType: string;
  isGlobal?: boolean;
  isRequired?: boolean;
  isUnique?: boolean;
  validationRules?: ValidationRules | null;
  defaultValue?: unknown;
  enumOptions?: string[] | null;
  uiGroup?: string | null;
  uiOrder?: number;
  displayOrder?: number;
  isSearchable?: boolean;
  isFilterable?: boolean;
  metadata?: Record<string, unknown> | null;
}

export class FieldDefinition {
  private constructor(private props: FieldDefinitionProps) {}

  /**
   * Factory method: Create a new field definition
   */
  static create(props: CreateFieldDefinitionProps): FieldDefinition {
    // Validation
    FieldDefinition.validateName(props.name);
    FieldDefinition.validateLabel(props.label);
    FieldDefinition.validateDataType(props.dataType);
    FieldDefinition.validateEntityType(props.entityType);

    if (props.dataType === FieldDataTypeEnum.ENUM) {
      FieldDefinition.validateEnumOptions(props.enumOptions);
    }

    if (props.validationRules) {
      FieldDefinition.validateValidationRules(
        props.validationRules,
        props.dataType,
      );
    }

    const now = new Date();

    return new FieldDefinition({
      id: "", // Will be set by repository
      name: props.name.trim().toLowerCase(),
      label: props.label.trim(),
      dataType: props.dataType,
      description: props.description?.trim() || null,
      entityType: props.entityType.trim(),
      isGlobal: props.isGlobal ?? false,
      isRequired: props.isRequired ?? false,
      isUnique: props.isUnique ?? false,
      validationRules: props.validationRules || null,
      defaultValue: props.defaultValue ?? null,
      enumOptions: props.enumOptions || null,
      uiGroup: props.uiGroup?.trim() || null,
      uiOrder: props.uiOrder ?? 0,
      displayOrder: props.displayOrder ?? 0,
      isSearchable: props.isSearchable ?? false,
      isFilterable: props.isFilterable ?? false,
      isActive: true,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: FieldDefinitionProps): FieldDefinition {
    return new FieldDefinition(props);
  }

  /**
   * Update field definition
   */
  update(props: {
    label?: string;
    description?: string | null;
    entityType?: string;
    isRequired?: boolean;
    isUnique?: boolean;
    validationRules?: ValidationRules | null;
    defaultValue?: unknown;
    enumOptions?: string[] | null;
    uiGroup?: string | null;
    uiOrder?: number;
    displayOrder?: number;
    isSearchable?: boolean;
    isFilterable?: boolean;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.label !== undefined) {
      FieldDefinition.validateLabel(props.label);
      this.props.label = props.label.trim();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.entityType !== undefined) {
      FieldDefinition.validateEntityType(props.entityType);
      this.props.entityType = props.entityType.trim();
    }

    if (props.isRequired !== undefined) {
      this.props.isRequired = props.isRequired;
    }

    if (props.isUnique !== undefined) {
      this.props.isUnique = props.isUnique;
    }

    if (props.validationRules !== undefined) {
      if (props.validationRules) {
        FieldDefinition.validateValidationRules(
          props.validationRules,
          this.props.dataType,
        );
      }
      this.props.validationRules = props.validationRules;
    }

    if (props.defaultValue !== undefined) {
      this.props.defaultValue = props.defaultValue;
    }

    if (props.enumOptions !== undefined) {
      if (this.props.dataType === FieldDataTypeEnum.ENUM) {
        FieldDefinition.validateEnumOptions(props.enumOptions);
      }
      this.props.enumOptions = props.enumOptions;
    }

    if (props.uiGroup !== undefined) {
      this.props.uiGroup = props.uiGroup?.trim() || null;
    }

    if (props.uiOrder !== undefined) {
      this.props.uiOrder = props.uiOrder;
    }

    if (props.displayOrder !== undefined) {
      this.props.displayOrder = props.displayOrder;
    }

    if (props.isSearchable !== undefined) {
      this.props.isSearchable = props.isSearchable;
    }

    if (props.isFilterable !== undefined) {
      this.props.isFilterable = props.isFilterable;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Field name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Field name must be at least 2 characters");
    }

    if (name.trim().length > 100) {
      throw new Error("Field name cannot exceed 100 characters");
    }

    // Must be snake_case (lowercase letters, numbers, underscores)
    if (!/^[a-z][a-z0-9_]*$/.test(name.trim().toLowerCase())) {
      throw new Error(
        "Field name must be snake_case (lowercase letters, numbers, underscores)",
      );
    }
  }

  private static validateLabel(label: string): void {
    if (!label || label.trim().length === 0) {
      throw new Error("Field label cannot be empty");
    }

    if (label.trim().length > 200) {
      throw new Error("Field label cannot exceed 200 characters");
    }
  }

  private static validateEntityType(entityType: string): void {
    if (!entityType || entityType.trim().length === 0) {
      throw new Error("Entity type cannot be empty");
    }

    if (entityType.trim().length > 100) {
      throw new Error("Entity type cannot exceed 100 characters");
    }
  }

  private static validateDataType(dataType: FieldDataTypeEnum): void {
    if (!Object.values(FieldDataTypeEnum).includes(dataType)) {
      throw new Error(`Invalid field data type: ${dataType}`);
    }
  }

  private static validateEnumOptions(
    options: string[] | null | undefined,
  ): void {
    if (!options || options.length === 0) {
      throw new Error("Enum field must have at least one option");
    }

    if (options.length > 100) {
      throw new Error("Enum field cannot have more than 100 options");
    }

    // Check for duplicates
    const uniqueOptions = new Set(options.map((o) => o.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      throw new Error("Enum options must be unique");
    }

    // Check each option
    for (const option of options) {
      if (!option || option.trim().length === 0) {
        throw new Error("Enum option cannot be empty");
      }
      if (option.trim().length > 100) {
        throw new Error("Enum option cannot exceed 100 characters");
      }
    }
  }

  private static validateValidationRules(
    rules: ValidationRules,
    dataType: FieldDataTypeEnum,
  ): void {
    // Validate min/max for numeric types
    if (
      [FieldDataTypeEnum.INTEGER, FieldDataTypeEnum.DECIMAL].includes(dataType)
    ) {
      if (rules.min !== undefined && rules.max !== undefined) {
        if (rules.min > rules.max) {
          throw new Error("Validation rule: min cannot be greater than max");
        }
      }
    }

    // Validate regex if present
    if (rules.regex) {
      try {
        new RegExp(rules.regex);
      } catch {
        throw new Error("Validation rule: invalid regex pattern");
      }
    }
  }

  /**
   * Validate a field value against this definition
   */
  validateValue(value: unknown): { valid: boolean; error?: string } {
    // Check required
    if (
      this.props.validationRules?.required &&
      (value === null || value === undefined)
    ) {
      return { valid: false, error: "Field is required" };
    }

    if (value === null || value === undefined) {
      return { valid: true };
    }

    // Type-specific validation
    switch (this.props.dataType) {
      case FieldDataTypeEnum.STRING:
        if (typeof value !== "string") {
          return { valid: false, error: "Value must be a string" };
        }
        if (
          this.props.validationRules?.max &&
          value.length > this.props.validationRules.max
        ) {
          return {
            valid: false,
            error: `String exceeds maximum length of ${this.props.validationRules.max}`,
          };
        }
        if (this.props.validationRules?.regex) {
          const regex = new RegExp(this.props.validationRules.regex);
          if (!regex.test(value)) {
            return {
              valid: false,
              error: "String does not match required pattern",
            };
          }
        }
        break;

      case FieldDataTypeEnum.INTEGER:
        if (!Number.isInteger(value)) {
          return { valid: false, error: "Value must be an integer" };
        }
        if (
          this.props.validationRules?.min !== undefined &&
          (value as number) < this.props.validationRules.min
        ) {
          return {
            valid: false,
            error: `Value must be at least ${this.props.validationRules.min}`,
          };
        }
        if (
          this.props.validationRules?.max !== undefined &&
          (value as number) > this.props.validationRules.max
        ) {
          return {
            valid: false,
            error: `Value must be at most ${this.props.validationRules.max}`,
          };
        }
        break;

      case FieldDataTypeEnum.DECIMAL:
        if (typeof value !== "number") {
          return { valid: false, error: "Value must be a number" };
        }
        if (
          this.props.validationRules?.min !== undefined &&
          (value as number) < this.props.validationRules.min
        ) {
          return {
            valid: false,
            error: `Value must be at least ${this.props.validationRules.min}`,
          };
        }
        if (
          this.props.validationRules?.max !== undefined &&
          (value as number) > this.props.validationRules.max
        ) {
          return {
            valid: false,
            error: `Value must be at most ${this.props.validationRules.max}`,
          };
        }
        break;

      case FieldDataTypeEnum.BOOLEAN:
        if (typeof value !== "boolean") {
          return { valid: false, error: "Value must be a boolean" };
        }
        break;

      case FieldDataTypeEnum.ENUM:
        if (typeof value !== "string") {
          return { valid: false, error: "Enum value must be a string" };
        }
        if (!this.props.enumOptions?.includes(value)) {
          return {
            valid: false,
            error: `Value must be one of: ${this.props.enumOptions?.join(", ")}`,
          };
        }
        break;

      case FieldDataTypeEnum.DATE:
      case FieldDataTypeEnum.DATETIME:
        if (!(value instanceof Date) && typeof value !== "string") {
          return { valid: false, error: "Value must be a date" };
        }
        break;

      default:
        // JSON, references - basic validation only
        break;
    }

    return { valid: true };
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get label(): string {
    return this.props.label;
  }

  get dataType(): FieldDataTypeEnum {
    return this.props.dataType;
  }

  get description(): string | null {
    return this.props.description;
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get isGlobal(): boolean {
    return this.props.isGlobal;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get isUnique(): boolean {
    return this.props.isUnique;
  }

  get validationRules(): ValidationRules | null {
    return this.props.validationRules;
  }

  get defaultValue(): unknown {
    return this.props.defaultValue;
  }

  get enumOptions(): string[] | null {
    return this.props.enumOptions;
  }

  get uiGroup(): string | null {
    return this.props.uiGroup;
  }

  get uiOrder(): number {
    return this.props.uiOrder;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isSearchable(): boolean {
    return this.props.isSearchable;
  }

  get isFilterable(): boolean {
    return this.props.isFilterable;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error(
        "Cannot change field definition ID after it has been set",
      );
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): FieldDefinitionProps {
    return { ...this.props };
  }

  /**
   * Compare with another field definition
   */
  equals(other: FieldDefinition): boolean {
    return this.props.id === other.id;
  }
}
