/**
 * Role Entity
 * Represents a role in the RBAC system
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { PermissionKey } from "../value-objects/permission-key";

export interface RoleProps {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  permissions?: PermissionKey[];
  // Role Hierarchy
  parentId?: string | null;
  parent?: Role | null;
  children?: Role[];
}

export class Role {
  private constructor(private readonly props: RoleProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error("Role name is required");
    }

    if (!this.props.displayName || this.props.displayName.trim().length === 0) {
      throw new Error("Role display name is required");
    }

    // Role name should be lowercase with no spaces
    if (!/^[a-z0-9-]+$/.test(this.props.name)) {
      throw new Error(
        "Role name must be lowercase alphanumeric with hyphens only",
      );
    }
  }

  // Factory method for creating a new role
  static create(
    params: {
      name: string;
      displayName: string;
      description?: string;
      isSystem?: boolean;
      isActive?: boolean;
      createdBy?: string;
      parentId?: string | null;
    },
    idGenerator: IIdGenerator,
  ): Role {
    const now = new Date();
    return new Role({
      id: idGenerator.generateId(),
      name: params.name.toLowerCase().trim(),
      displayName: params.displayName.trim(),
      description: params.description?.trim(),
      isSystem: params.isSystem ?? false,
      isActive: params.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: params.createdBy,
      permissions: [],
      parentId: params.parentId,
      parent: null,
      children: [],
    });
  }

  // Factory method for reconstructing from database
  static fromPersistence(data: RoleProps): Role {
    return new Role(data);
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

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get permissions(): PermissionKey[] {
    return this.props.permissions || [];
  }

  get parentId(): string | null | undefined {
    return this.props.parentId;
  }

  get parent(): Role | null | undefined {
    return this.props.parent;
  }

  get children(): Role[] {
    return this.props.children || [];
  }

  /**
   * Get all permissions including inherited from parent roles
   * This recursively collects permissions from the entire hierarchy
   */
  getAllPermissions(): PermissionKey[] {
    const permissionsSet = new Set<PermissionKey>();

    // Add own permissions
    for (const permission of this.permissions) {
      permissionsSet.add(permission);
    }

    // Recursively add parent permissions
    let currentParent = this.parent;
    while (currentParent) {
      for (const permission of currentParent.permissions) {
        permissionsSet.add(permission);
      }
      currentParent = currentParent.parent;
    }

    return Array.from(permissionsSet);
  }

  /**
   * Check if this role has a parent in its hierarchy
   * Used to prevent circular dependencies
   */
  hasParentInHierarchy(potentialParentId: string): boolean {
    if (this.id === potentialParentId) {
      return true;
    }

    let currentParent = this.parent;
    while (currentParent) {
      if (currentParent.id === potentialParentId) {
        return true;
      }
      currentParent = currentParent.parent;
    }

    return false;
  }

  // Business logic methods
  update(params: {
    displayName?: string;
    description?: string;
    isActive?: boolean;
  }): Role {
    return new Role({
      ...this.props,
      displayName: params.displayName?.trim() ?? this.props.displayName,
      description: params.description?.trim() ?? this.props.description,
      isActive: params.isActive ?? this.props.isActive,
      updatedAt: new Date(),
    });
  }

  deactivate(): Role {
    if (this.props.isSystem) {
      throw new Error("Cannot deactivate system role");
    }

    return new Role({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  activate(): Role {
    return new Role({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  canBeDeleted(): boolean {
    return !this.props.isSystem;
  }

  // Export to plain object
  toObject(): RoleProps {
    return { ...this.props };
  }
}
