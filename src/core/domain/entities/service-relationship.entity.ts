/**
 * ServiceRelationship Entity
 *
 * Represents a relationship between two Services (service-to-service dependencies).
 * Supports dependency tracking, impact analysis, and temporal validity.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ServiceRelationshipType } from "@/generated/prisma";

export interface ServiceRelationshipProps {
  id: string;
  fromServiceId: string;
  toServiceId: string;
  relationshipType: ServiceRelationshipType;
  isCritical: boolean;
  description: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRelationshipProps {
  fromServiceId: string;
  toServiceId: string;
  relationshipType: ServiceRelationshipType;
  isCritical?: boolean;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  validFrom?: Date;
  validTo?: Date | null;
}

export interface UpdateServiceRelationshipProps {
  isCritical?: boolean;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  validTo?: Date | null;
  isActive?: boolean;
}

export class ServiceRelationship {
  private constructor(private props: ServiceRelationshipProps) {
    this.validate();
  }

  /**
   * Factory method to create a new service relationship
   */
  static create(
    props: CreateServiceRelationshipProps,
    idGenerator: IIdGenerator,
  ): ServiceRelationship {
    // Validation
    if (!props.fromServiceId?.trim()) {
      throw new Error("From Service ID is required");
    }
    if (!props.toServiceId?.trim()) {
      throw new Error("To Service ID is required");
    }
    if (!props.relationshipType) {
      throw new Error("Relationship Type is required");
    }
    if (props.fromServiceId === props.toServiceId) {
      throw new Error("Cannot create relationship from service to itself");
    }

    const now = new Date();
    const validFrom = props.validFrom || now;

    // Validate date range if validTo is provided
    if (props.validTo && props.validTo <= validFrom) {
      throw new Error("Valid to date must be after valid from date");
    }

    return new ServiceRelationship({
      id: idGenerator.generateId(),
      fromServiceId: props.fromServiceId,
      toServiceId: props.toServiceId,
      relationshipType: props.relationshipType,
      isCritical: props.isCritical ?? false,
      description: props.description?.trim() || null,
      metadata: props.metadata ?? null,
      isActive: true,
      validFrom,
      validTo: props.validTo ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an existing service relationship from persistence
   */
  static reconstitute(props: ServiceRelationshipProps): ServiceRelationship {
    return new ServiceRelationship(props);
  }

  /**
   * Update relationship properties
   */
  update(props: UpdateServiceRelationshipProps): void {
    if (props.validTo !== undefined) {
      if (props.validTo && props.validTo <= this.props.validFrom) {
        throw new Error("Valid to date must be after valid from date");
      }
      this.props.validTo = props.validTo;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.isCritical !== undefined) {
      this.props.isCritical = props.isCritical;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the relationship (soft delete)
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.validTo = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Activate the relationship
   */
  activate(): void {
    this.props.isActive = true;
    this.props.validTo = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if relationship is currently valid (within date range and active)
   */
  isCurrentlyValid(): boolean {
    if (!this.props.isActive) {
      return false;
    }

    const now = new Date();
    return this.isValidOn(now);
  }

  /**
   * Check if relationship is valid on a specific date
   */
  isValidOn(date: Date): boolean {
    if (!this.props.isActive) {
      return false;
    }

    const isAfterValidFrom = date >= this.props.validFrom;
    const isBeforeValidTo = !this.props.validTo || date <= this.props.validTo;

    return isAfterValidFrom && isBeforeValidTo;
  }

  /**
   * Check if relationship is expired
   */
  isExpired(): boolean {
    if (!this.props.validTo) {
      return false;
    }

    return new Date() > this.props.validTo;
  }

  /**
   * Validate relationship properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("Service Relationship ID is required");
    }
    if (!this.props.fromServiceId) {
      throw new Error("From Service ID is required");
    }
    if (!this.props.toServiceId) {
      throw new Error("To Service ID is required");
    }
    if (!this.props.relationshipType) {
      throw new Error("Relationship Type is required");
    }
    if (this.props.fromServiceId === this.props.toServiceId) {
      throw new Error("Cannot create relationship from service to itself");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get fromServiceId(): string {
    return this.props.fromServiceId;
  }

  get toServiceId(): string {
    return this.props.toServiceId;
  }

  get relationshipType(): ServiceRelationshipType {
    return this.props.relationshipType;
  }

  get isCritical(): boolean {
    return this.props.isCritical;
  }

  get description(): string | null {
    return this.props.description;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get validFrom(): Date {
    return this.props.validFrom;
  }

  get validTo(): Date | null {
    return this.props.validTo;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Convert entity to plain object for persistence
   */
  toObject(): ServiceRelationshipProps {
    return { ...this.props };
  }
}
