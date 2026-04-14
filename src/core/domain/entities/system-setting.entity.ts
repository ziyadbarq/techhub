/**
 * SystemSetting Entity
 * Represents a database-backed application setting with env var fallback support.
 * Stores decrypted values — encryption happens at the repository boundary.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface SystemSettingProps {
  id: string;
  key: string;
  value: string | null;
  isEncrypted: boolean;
  updatedBy: string | null;
  updatedByEmail: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export class SystemSetting {
  private constructor(private readonly props: SystemSettingProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.key || this.props.key.trim().length === 0) {
      throw new Error("Setting key is required");
    }

    if (!/^[A-Z_][A-Z0-9_]*$/.test(this.props.key)) {
      throw new Error(
        "Setting key must be uppercase with underscores (e.g., LOG_LEVEL)",
      );
    }
  }

  static create(
    params: {
      key: string;
      value: string | null;
      isEncrypted: boolean;
      updatedBy: string | null;
      updatedByEmail: string | null;
    },
    idGenerator: IIdGenerator,
  ): SystemSetting {
    const now = new Date();
    return new SystemSetting({
      id: idGenerator.generateId(),
      key: params.key.trim(),
      value: params.value,
      isEncrypted: params.isEncrypted,
      updatedBy: params.updatedBy,
      updatedByEmail: params.updatedByEmail,
      updatedAt: now,
      createdAt: now,
    });
  }

  static fromPersistence(data: SystemSettingProps): SystemSetting {
    return new SystemSetting(data);
  }

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get value(): string | null {
    return this.props.value;
  }

  get isEncrypted(): boolean {
    return this.props.isEncrypted;
  }

  get updatedBy(): string | null {
    return this.props.updatedBy;
  }

  get updatedByEmail(): string | null {
    return this.props.updatedByEmail;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  hasValue(): boolean {
    return this.props.value !== null && this.props.value.length > 0;
  }

  updateValue(
    newValue: string | null,
    userId: string,
    userEmail: string,
  ): SystemSetting {
    return new SystemSetting({
      ...this.props,
      value: newValue,
      updatedBy: userId,
      updatedByEmail: userEmail,
      updatedAt: new Date(),
    });
  }

  toObject(): SystemSettingProps {
    return { ...this.props };
  }
}
