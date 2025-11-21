/**
 * CIClassField Entity
 * Represents custom field definitions attached to CI classes with configuration
 */

export interface CIClassFieldProps {
  id: string;
  ciClassId: string;
  fieldDefinitionId: string;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  defaultValue: Record<string, unknown> | null;
  uiOrder: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCIClassFieldProps {
  ciClassId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
  note?: string | null;
}

export interface UpdateCIClassFieldProps {
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  defaultValue?: Record<string, unknown> | null;
  uiOrder?: number;
  note?: string | null;
}

export class CIClassField {
  private constructor(private props: CIClassFieldProps) {}

  // Factory method for creating new CI class fields
  static create(props: CreateCIClassFieldProps): CIClassField {
    CIClassField.validateCIClassId(props.ciClassId);
    CIClassField.validateFieldDefinitionId(props.fieldDefinitionId);
    CIClassField.validateUIOrder(props.uiOrder ?? 0);

    const now = new Date();

    return new CIClassField({
      id: "",
      ciClassId: props.ciClassId,
      fieldDefinitionId: props.fieldDefinitionId,
      isRequired: props.isRequired ?? false,
      isUnique: props.isUnique ?? false,
      isVisible: props.isVisible ?? true,
      defaultValue: props.defaultValue ?? null,
      uiOrder: props.uiOrder ?? 0,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: CIClassFieldProps): CIClassField {
    return new CIClassField(props);
  }

  // Update method
  update(props: UpdateCIClassFieldProps): void {
    if (props.uiOrder !== undefined) {
      CIClassField.validateUIOrder(props.uiOrder);
      this.props.uiOrder = props.uiOrder;
    }

    if (props.isRequired !== undefined) {
      this.props.isRequired = props.isRequired;
    }

    if (props.isUnique !== undefined) {
      this.props.isUnique = props.isUnique;
    }

    if (props.isVisible !== undefined) {
      this.props.isVisible = props.isVisible;
    }

    if (props.defaultValue !== undefined) {
      this.props.defaultValue = props.defaultValue;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateCIClassId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("CI Class ID is required");
    }
  }

  private static validateFieldDefinitionId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Field Definition ID is required");
    }
  }

  private static validateUIOrder(order: number): void {
    if (order < 0) {
      throw new Error("UI Order must be non-negative");
    }
    if (!Number.isInteger(order)) {
      throw new Error("UI Order must be an integer");
    }
  }

  // Business logic methods
  makeRequired(): void {
    this.props.isRequired = true;
    this.props.updatedAt = new Date();
  }

  makeOptional(): void {
    this.props.isRequired = false;
    this.props.updatedAt = new Date();
  }

  makeUnique(): void {
    this.props.isUnique = true;
    this.props.updatedAt = new Date();
  }

  removeUniqueness(): void {
    this.props.isUnique = false;
    this.props.updatedAt = new Date();
  }

  show(): void {
    this.props.isVisible = true;
    this.props.updatedAt = new Date();
  }

  hide(): void {
    this.props.isVisible = false;
    this.props.updatedAt = new Date();
  }

  setDefaultValue(value: Record<string, unknown> | null): void {
    this.props.defaultValue = value;
    this.props.updatedAt = new Date();
  }

  setUIOrder(order: number): void {
    CIClassField.validateUIOrder(order);
    this.props.uiOrder = order;
    this.props.updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get ciClassId(): string {
    return this.props.ciClassId;
  }

  get fieldDefinitionId(): string {
    return this.props.fieldDefinitionId;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get isUnique(): boolean {
    return this.props.isUnique;
  }

  get isVisible(): boolean {
    return this.props.isVisible;
  }

  get defaultValue(): Record<string, unknown> | null {
    return this.props.defaultValue;
  }

  get uiOrder(): number {
    return this.props.uiOrder;
  }

  get note(): string | null {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
