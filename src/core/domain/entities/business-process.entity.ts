/**
 * BusinessProcess Entity
 *
 * Represents a business process that services support (e.g., "Digital Payments",
 * "Identity Management"). Used for service-to-business alignment mapping.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface BusinessProcessProps {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessProcessProps {
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class BusinessProcess {
  private constructor(private props: BusinessProcessProps) {
    this.validate();
  }

  static create(
    props: CreateBusinessProcessProps,
    idGenerator: IIdGenerator,
  ): BusinessProcess {
    BusinessProcess.validateCode(props.code);
    BusinessProcess.validateName(props.name);

    const now = new Date();

    return new BusinessProcess({
      id: idGenerator.generateId(),
      code: props.code.trim().toUpperCase(),
      name: props.name.trim(),
      description: props.description?.trim() || null,
      category: props.category?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BusinessProcessProps): BusinessProcess {
    return new BusinessProcess(props);
  }

  update(updates: {
    code?: string;
    name?: string;
    description?: string | null;
    category?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (updates.code !== undefined) {
      BusinessProcess.validateCode(updates.code);
      this.props.code = updates.code.trim().toUpperCase();
    }

    if (updates.name !== undefined) {
      BusinessProcess.validateName(updates.name);
      this.props.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      this.props.description = updates.description?.trim() || null;
    }

    if (updates.category !== undefined) {
      this.props.category = updates.category?.trim() || null;
    }

    if (updates.metadata !== undefined) {
      this.props.metadata = updates.metadata;
    }

    this.props.updatedAt = new Date();
  }

  static validateCode(code: string): void {
    if (!code?.trim()) {
      throw new Error("Business process code is required");
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length < 2 || trimmedCode.length > 100) {
      throw new Error("Business process code must be 2-100 characters");
    }

    // Format: UPPERCASE_UNDERSCORE (e.g., "DIGITAL_PAYMENTS", "IDENTITY_MGMT")
    const codePattern = /^[A-Z][A-Z0-9_]*$/;
    if (!codePattern.test(trimmedCode.toUpperCase())) {
      throw new Error(
        "Business process code must be uppercase letters, numbers, and underscores",
      );
    }
  }

  static validateName(name: string): void {
    if (!name?.trim()) {
      throw new Error("Business process name is required");
    }

    if (name.trim().length < 2) {
      throw new Error("Business process name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Business process name must not exceed 200 characters");
    }
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Business process ID is required");
    }
    BusinessProcess.validateCode(this.props.code);
    BusinessProcess.validateName(this.props.name);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get category(): string | null {
    return this.props.category;
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

  toObject(): BusinessProcessProps {
    return { ...this.props };
  }
}
