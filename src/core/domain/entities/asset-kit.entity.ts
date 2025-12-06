/**
 * AssetKit Entity
 *
 * Represents a reusable kit template (e.g., "New Hire Kit", "Executive Package").
 * Defines what categories/models of assets should be included in the kit.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export type KitType =
  | "NEW_HIRE"
  | "CONTRACTOR"
  | "EXECUTIVE"
  | "PROJECT"
  | "TEMPORARY"
  | "OTHER";

export interface AssetKitProps {
  id: string;
  name: string;
  code: string;
  description: string | null;
  kitType: KitType;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetKitProps {
  name: string;
  code: string;
  description?: string | null;
  kitType?: KitType;
  isActive?: boolean;
}

export class AssetKit {
  private constructor(private props: AssetKitProps) {
    this.validate();
  }

  static create(
    props: CreateAssetKitProps,
    idGenerator: IIdGenerator,
  ): AssetKit {
    AssetKit.validateName(props.name);
    AssetKit.validateCode(props.code);

    const now = new Date();

    return new AssetKit({
      id: idGenerator.generateId(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      kitType: props.kitType || "OTHER",
      isActive: props.isActive ?? true,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: AssetKitProps): AssetKit {
    return new AssetKit(props);
  }

  update(updates: {
    name?: string;
    code?: string;
    description?: string | null;
    kitType?: KitType;
    isActive?: boolean;
  }): void {
    if (updates.name !== undefined) {
      AssetKit.validateName(updates.name);
      this.props.name = updates.name.trim();
    }

    if (updates.code !== undefined) {
      AssetKit.validateCode(updates.code);
      this.props.code = updates.code.trim().toUpperCase();
    }

    if (updates.description !== undefined) {
      this.props.description = updates.description?.trim() || null;
    }

    if (updates.kitType !== undefined) {
      this.props.kitType = updates.kitType;
    }

    if (updates.isActive !== undefined) {
      this.props.isActive = updates.isActive;
    }

    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  static validateName(name: string): void {
    if (!name?.trim()) {
      throw new Error("Kit name is required");
    }
    if (name.trim().length < 2) {
      throw new Error("Kit name must be at least 2 characters");
    }
    if (name.trim().length > 100) {
      throw new Error("Kit name must not exceed 100 characters");
    }
  }

  static validateCode(code: string): void {
    if (!code?.trim()) {
      throw new Error("Kit code is required");
    }
    const trimmedCode = code.trim();
    if (trimmedCode.length < 2 || trimmedCode.length > 50) {
      throw new Error("Kit code must be 2-50 characters");
    }
    const codePattern = /^[A-Z0-9_-]+$/i;
    if (!codePattern.test(trimmedCode)) {
      throw new Error(
        "Kit code must contain only letters, numbers, underscores, and hyphens",
      );
    }
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Kit ID is required");
    }
    AssetKit.validateName(this.props.name);
    AssetKit.validateCode(this.props.code);
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

  get kitType(): KitType {
    return this.props.kitType;
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

  toObject(): AssetKitProps {
    return { ...this.props };
  }
}
