/**
 * FieldTemplate Domain Entity
 * Pre-built templates for common field configurations
 */

import type { FieldDataTypeEnum } from "../value-objects/foundation-enums";

export interface FieldTemplateItemProps {
  id: string;
  fieldTemplateId: string;
  fieldDefinitionId: string | null;
  fieldName: string;
  fieldLabel: string;
  fieldDataType: FieldDataTypeEnum;
  description: string | null;
  isRequired: boolean;
  isUnique: boolean;
  validationRules: Record<string, unknown> | null;
  defaultValue: unknown;
  enumOptions: string[] | null;
  uiOrder: number;
  uiGroup: string | null;
  isSearchable: boolean;
  isFilterable: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldTemplateProps {
  id: string;
  name: string;
  code: string;
  description: string | null;
  entityType: string;
  category: string | null;
  standard: string | null;
  isBuiltIn: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  items: FieldTemplateItemProps[];
}

export interface CreateFieldTemplateProps {
  name: string;
  code: string;
  description?: string | null;
  entityType: string;
  category?: string | null;
  standard?: string | null;
  isBuiltIn?: boolean;
  metadata?: Record<string, unknown> | null;
  createdById?: string | null;
  items?: CreateFieldTemplateItemProps[];
}

export interface CreateFieldTemplateItemProps {
  fieldDefinitionId?: string | null;
  fieldName: string;
  fieldLabel: string;
  fieldDataType: FieldDataTypeEnum;
  description?: string | null;
  isRequired?: boolean;
  isUnique?: boolean;
  validationRules?: Record<string, unknown> | null;
  defaultValue?: unknown;
  enumOptions?: string[] | null;
  uiOrder?: number;
  uiGroup?: string | null;
  isSearchable?: boolean;
  isFilterable?: boolean;
  metadata?: Record<string, unknown> | null;
}

export class FieldTemplateItem {
  private constructor(private props: FieldTemplateItemProps) {}

  static create(
    props: CreateFieldTemplateItemProps,
    fieldTemplateId: string,
  ): FieldTemplateItem {
    FieldTemplateItem.validateFieldName(props.fieldName);
    FieldTemplateItem.validateFieldLabel(props.fieldLabel);

    const now = new Date();

    return new FieldTemplateItem({
      id: "",
      fieldTemplateId,
      fieldDefinitionId: props.fieldDefinitionId ?? null,
      fieldName: props.fieldName.trim().toLowerCase(),
      fieldLabel: props.fieldLabel.trim(),
      fieldDataType: props.fieldDataType,
      description: props.description?.trim() ?? null,
      isRequired: props.isRequired ?? false,
      isUnique: props.isUnique ?? false,
      validationRules: props.validationRules ?? null,
      defaultValue: props.defaultValue ?? null,
      enumOptions: props.enumOptions ?? null,
      uiOrder: props.uiOrder ?? 0,
      uiGroup: props.uiGroup?.trim() ?? null,
      isSearchable: props.isSearchable ?? false,
      isFilterable: props.isFilterable ?? false,
      metadata: props.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: FieldTemplateItemProps): FieldTemplateItem {
    return new FieldTemplateItem(props);
  }

  private static validateFieldName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Field name cannot be empty");
    }
    if (name.trim().length > 100) {
      throw new Error("Field name cannot exceed 100 characters");
    }
    if (!/^[a-z][a-z0-9_]*$/.test(name.trim().toLowerCase())) {
      throw new Error("Field name must be snake_case");
    }
  }

  private static validateFieldLabel(label: string): void {
    if (!label || label.trim().length === 0) {
      throw new Error("Field label cannot be empty");
    }
    if (label.trim().length > 200) {
      throw new Error("Field label cannot exceed 200 characters");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get fieldTemplateId(): string {
    return this.props.fieldTemplateId;
  }

  get fieldDefinitionId(): string | null {
    return this.props.fieldDefinitionId;
  }

  get fieldName(): string {
    return this.props.fieldName;
  }

  get fieldLabel(): string {
    return this.props.fieldLabel;
  }

  get fieldDataType(): FieldDataTypeEnum {
    return this.props.fieldDataType;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get isUnique(): boolean {
    return this.props.isUnique;
  }

  get validationRules(): Record<string, unknown> | null {
    return this.props.validationRules;
  }

  get defaultValue(): unknown {
    return this.props.defaultValue;
  }

  get enumOptions(): string[] | null {
    return this.props.enumOptions;
  }

  get uiOrder(): number {
    return this.props.uiOrder;
  }

  get uiGroup(): string | null {
    return this.props.uiGroup;
  }

  get isSearchable(): boolean {
    return this.props.isSearchable;
  }

  get isFilterable(): boolean {
    return this.props.isFilterable;
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

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change template item ID after it has been set");
    }
    this.props.id = id;
  }

  toObject(): FieldTemplateItemProps {
    return { ...this.props };
  }
}

export class FieldTemplate {
  private constructor(private props: FieldTemplateProps) {}

  static create(props: CreateFieldTemplateProps): FieldTemplate {
    FieldTemplate.validateName(props.name);
    FieldTemplate.validateCode(props.code);
    FieldTemplate.validateEntityType(props.entityType);

    const now = new Date();

    const template = new FieldTemplate({
      id: "",
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() ?? null,
      entityType: props.entityType.trim(),
      category: props.category?.trim().toUpperCase() ?? null,
      standard: props.standard?.trim().toUpperCase() ?? null,
      isBuiltIn: props.isBuiltIn ?? false,
      isActive: true,
      metadata: props.metadata ?? null,
      createdAt: now,
      updatedAt: now,
      createdById: props.createdById ?? null,
      items: [],
    });

    // Add items if provided
    if (props.items && props.items.length > 0) {
      for (const itemProps of props.items) {
        template.addItem(itemProps);
      }
    }

    return template;
  }

  static reconstitute(props: FieldTemplateProps): FieldTemplate {
    return new FieldTemplate(props);
  }

  // Validation
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Template name cannot be empty");
    }
    if (name.trim().length > 200) {
      throw new Error("Template name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Template code cannot be empty");
    }
    if (code.trim().length > 50) {
      throw new Error("Template code cannot exceed 50 characters");
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(code.trim().toUpperCase())) {
      throw new Error(
        "Template code must be SCREAMING_SNAKE_CASE (uppercase letters, numbers, underscores)",
      );
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

  // Update method
  update(props: {
    name?: string;
    description?: string | null;
    category?: string | null;
    standard?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      FieldTemplate.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() ?? null;
    }

    if (props.category !== undefined) {
      this.props.category = props.category?.trim().toUpperCase() ?? null;
    }

    if (props.standard !== undefined) {
      this.props.standard = props.standard?.trim().toUpperCase() ?? null;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  // Item management
  addItem(itemProps: CreateFieldTemplateItemProps): FieldTemplateItem {
    // Check for duplicate field names
    if (this.props.items.some((i) => i.fieldName === itemProps.fieldName)) {
      throw new Error(
        `Field "${itemProps.fieldName}" already exists in template`,
      );
    }

    const item = FieldTemplateItem.create(itemProps, this.props.id);
    this.props.items.push(item.toObject());
    this.props.updatedAt = new Date();
    return item;
  }

  removeItem(fieldName: string): void {
    const index = this.props.items.findIndex((i) => i.fieldName === fieldName);
    if (index === -1) {
      throw new Error(`Field "${fieldName}" not found in template`);
    }
    this.props.items.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  reorderItems(fieldNames: string[]): void {
    // Validate all field names exist
    for (const name of fieldNames) {
      if (!this.props.items.some((i) => i.fieldName === name)) {
        throw new Error(`Field "${name}" not found in template`);
      }
    }

    // Update uiOrder based on new order
    for (let i = 0; i < fieldNames.length; i++) {
      const item = this.props.items.find(
        (it) => it.fieldName === fieldNames[i],
      );
      if (item) {
        item.uiOrder = i;
      }
    }

    this.props.updatedAt = new Date();
  }

  // Activation
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | null {
    return this.props.description;
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get category(): string | null {
    return this.props.category;
  }

  get standard(): string | null {
    return this.props.standard;
  }

  get isBuiltIn(): boolean {
    return this.props.isBuiltIn;
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

  get createdById(): string | null {
    return this.props.createdById;
  }

  get items(): FieldTemplateItemProps[] {
    return [...this.props.items].sort((a, b) => a.uiOrder - b.uiOrder);
  }

  get itemCount(): number {
    return this.props.items.length;
  }

  // Internal setters
  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change template ID after it has been set");
    }
    this.props.id = id;
    // Update fieldTemplateId for all items
    for (const item of this.props.items) {
      item.fieldTemplateId = id;
    }
  }

  toObject(): FieldTemplateProps {
    return {
      ...this.props,
      items: [...this.props.items],
    };
  }

  equals(other: FieldTemplate): boolean {
    return this.props.id === other.id;
  }
}
