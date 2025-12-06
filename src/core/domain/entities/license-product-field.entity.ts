/**
 * LicenseProductField Domain Entity
 *
 * Represents a custom field configuration for a license product.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateLicenseProductFieldProps {
  licenseProductId: string;
  fieldDefinitionId: string;
  isRequired?: boolean;
  isVisible?: boolean;
  uiOrder?: number;
  defaultValue?: Record<string, unknown> | null;
}

export interface LicenseProductFieldProps
  extends CreateLicenseProductFieldProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LicenseProductField {
  private readonly props: LicenseProductFieldProps;

  private constructor(props: LicenseProductFieldProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get licenseProductId(): string {
    return this.props.licenseProductId;
  }

  get fieldDefinitionId(): string {
    return this.props.fieldDefinitionId;
  }

  get isRequired(): boolean {
    return this.props.isRequired ?? false;
  }

  get isVisible(): boolean {
    return this.props.isVisible ?? true;
  }

  get uiOrder(): number {
    return this.props.uiOrder ?? 0;
  }

  get defaultValue(): Record<string, unknown> | null {
    return this.props.defaultValue ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public makeRequired(): void {
    this.props.isRequired = true;
  }

  public makeOptional(): void {
    this.props.isRequired = false;
  }

  public show(): void {
    this.props.isVisible = true;
  }

  public hide(): void {
    this.props.isVisible = false;
  }

  public setUIOrder(order: number): void {
    LicenseProductField.validateUIOrder(order);
    this.props.uiOrder = order;
  }

  public setDefaultValue(value: Record<string, unknown> | null): void {
    this.props.defaultValue = value;
  }

  // Factory method
  public static create(
    props: CreateLicenseProductFieldProps,
    idGenerator: IIdGenerator,
  ): LicenseProductField {
    // Validations
    LicenseProductField.validateLicenseProductId(props.licenseProductId);
    LicenseProductField.validateFieldDefinitionId(props.fieldDefinitionId);
    LicenseProductField.validateUIOrder(props.uiOrder ?? 0);

    const now = new Date();
    return new LicenseProductField({
      id: idGenerator.generateId(),
      licenseProductId: props.licenseProductId,
      fieldDefinitionId: props.fieldDefinitionId,
      isRequired: props.isRequired ?? false,
      isVisible: props.isVisible ?? true,
      uiOrder: props.uiOrder ?? 0,
      defaultValue: props.defaultValue ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: LicenseProductFieldProps): LicenseProductField {
    return new LicenseProductField(props);
  }

  // Validation methods
  private static validateLicenseProductId(licenseProductId: string): void {
    if (!licenseProductId || licenseProductId.trim() === "") {
      throw new Error("License product ID is required");
    }
  }

  private static validateFieldDefinitionId(fieldDefinitionId: string): void {
    if (!fieldDefinitionId || fieldDefinitionId.trim() === "") {
      throw new Error("Field definition ID is required");
    }
  }

  private static validateUIOrder(uiOrder: number): void {
    if (uiOrder < 0 || !Number.isInteger(uiOrder)) {
      throw new Error("UI order must be a non-negative integer");
    }
  }
}
