/**
 * Permission Entity
 * Represents a permission in the RBAC system
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { PermissionKey } from "../value-objects/permission-key";

export interface PermissionProps {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Permission {
  private constructor(private readonly props: PermissionProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error("Permission name is required");
    }

    if (!this.props.displayName || this.props.displayName.trim().length === 0) {
      throw new Error("Permission display name is required");
    }

    if (!this.props.resource || this.props.resource.trim().length === 0) {
      throw new Error("Permission resource is required");
    }

    if (!this.props.action || this.props.action.trim().length === 0) {
      throw new Error("Permission action is required");
    }

    // Permission name should follow resource:action pattern
    const expectedName = `${this.props.resource}:${this.props.action}`;
    if (this.props.name !== expectedName) {
      throw new Error(
        `Permission name must follow resource:action pattern (expected: ${expectedName})`,
      );
    }
  }

  // Factory method for creating a new permission
  static create(
    params: {
      resource: string;
      action: string;
      displayName: string;
      description?: string;
      isSystem?: boolean;
      isActive?: boolean;
    },
    idGenerator: IIdGenerator,
  ): Permission {
    const now = new Date();
    const resource = params.resource.toLowerCase().trim();
    const action = params.action.toLowerCase().trim();
    const name = `${resource}:${action}`;

    return new Permission({
      id: idGenerator.generateId(),
      name,
      displayName: params.displayName.trim(),
      description: params.description?.trim(),
      resource,
      action,
      isSystem: params.isSystem ?? false,
      isActive: params.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstructing from database
  static fromPersistence(data: PermissionProps): Permission {
    return new Permission(data);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get resource(): string {
    return this.props.resource;
  }

  get action(): string {
    return this.props.action;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
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
  update(params: {
    displayName?: string;
    description?: string;
    isActive?: boolean;
  }): Permission {
    return new Permission({
      ...this.props,
      displayName: params.displayName?.trim() ?? this.props.displayName,
      description: params.description?.trim() ?? this.props.description,
      isActive: params.isActive ?? this.props.isActive,
      updatedAt: new Date(),
    });
  }

  deactivate(): Permission {
    if (this.props.isSystem) {
      throw new Error("Cannot deactivate system permission");
    }

    return new Permission({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  activate(): Permission {
    return new Permission({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  canBeDeleted(): boolean {
    return !this.props.isSystem;
  }

  // Get permission as PermissionKey
  toPermissionKey(): PermissionKey {
    return this.props.name as PermissionKey;
  }

  // Export to plain object
  toObject(): PermissionProps {
    return { ...this.props };
  }
}
