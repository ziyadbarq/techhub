/**
 * UserRole Entity
 * Represents the assignment of a role to a user
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface UserRoleProps {
  id: string;
  userId: string;
  roleId: string;
  expiresAt?: Date;
  createdAt: Date;
  createdBy?: string;
}

export class UserRole {
  private constructor(
    private readonly props: UserRoleProps,
    private readonly options: { allowExpired?: boolean } = {},
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!this.props.roleId || this.props.roleId.trim().length === 0) {
      throw new Error("Role ID is required");
    }

    if (
      this.props.expiresAt &&
      this.props.expiresAt < new Date() &&
      !this.options.allowExpired
    ) {
      throw new Error("Expiration date cannot be in the past");
    }
  }

  // Factory method for creating a new user role assignment
  static create(
    params: {
      userId: string;
      roleId: string;
      expiresAt?: Date;
      createdBy?: string;
    },
    idGenerator: IIdGenerator,
  ): UserRole {
    return new UserRole(
      {
        id: idGenerator.generateId(),
        userId: params.userId,
        roleId: params.roleId,
        expiresAt: params.expiresAt,
        createdAt: new Date(),
        createdBy: params.createdBy,
      },
      { allowExpired: false },
    );
  }

  // Factory method for reconstructing from database
  static fromPersistence(data: UserRoleProps): UserRole {
    return new UserRole(data, { allowExpired: true });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  // Business logic methods
  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }

    return this.props.expiresAt < new Date();
  }

  isActive(): boolean {
    return !this.isExpired();
  }

  setExpiration(expiresAt: Date): UserRole {
    if (expiresAt < new Date()) {
      throw new Error("Expiration date cannot be in the past");
    }

    return new UserRole(
      {
        ...this.props,
        expiresAt,
      },
      this.options,
    );
  }

  removeExpiration(): UserRole {
    return new UserRole(
      {
        ...this.props,
        expiresAt: undefined,
      },
      this.options,
    );
  }

  // Export to plain object
  toObject(): UserRoleProps {
    return { ...this.props };
  }
}
