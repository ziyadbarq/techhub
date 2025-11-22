/**
 * DataDomain Domain Entity
 *
 * Represents a logical data classification (e.g., "Customer PII", "Financial Data")
 * for compliance and governance purposes (SAMA, GDPR, PCI-DSS).
 */

import { v4 as uuid } from "uuid";

export interface CreateDataDomainProps {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
}

export interface DataDomainProps extends CreateDataDomainProps {
  id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DataDomain {
  private readonly props: DataDomainProps;

  private constructor(props: DataDomainProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    DataDomain.validateName(value);
    this.props.name = value.trim();
  }

  get code(): string {
    return this.props.code;
  }

  set code(value: string) {
    DataDomain.validateCode(value);
    this.props.code = value.trim().toUpperCase();
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(value: string | null) {
    this.props.description = value;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public activate(): void {
    this.props.isActive = true;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public updateCode(code: string): void {
    DataDomain.validateCode(code);
    this.props.code = code.trim().toUpperCase();
  }

  // Factory method
  public static create(props: CreateDataDomainProps): DataDomain {
    // Validations
    DataDomain.validateName(props.name);
    DataDomain.validateCode(props.code);

    const now = new Date();
    return new DataDomain({
      id: uuid(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: DataDomainProps): DataDomain {
    return new DataDomain(props);
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim() === "") {
      throw new Error("Data domain name is required");
    }
    if (name.length > 255) {
      throw new Error("Data domain name must not exceed 255 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim() === "") {
      throw new Error("Data domain code is required");
    }
    if (code.length > 50) {
      throw new Error("Data domain code must not exceed 50 characters");
    }
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      throw new Error(
        "Data domain code must contain only letters, numbers, hyphens, and underscores",
      );
    }
  }
}
