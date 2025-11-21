import type { EnvironmentEnum } from "./configuration-item.entity";

/**
 * CIClass Domain Entity
 * Represents Configuration Item classes in the CMDB system
 * Defines types of CIs (Server, Database, Application, Network Device, etc.)
 * Supports hierarchical classification and links to lifecycle models
 */

export type CriticalityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EnvironmentType = EnvironmentEnum;

export interface CIClassProps {
  id: string;
  name: string;
  code: string;
  parentClassId: string | null;
  description: string | null;
  lifecycleModelId: string | null;
  defaultCriticality: CriticalityLevel | null;
  defaultEnvironment: EnvironmentType | null;
  isDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCIClassProps {
  name: string;
  code: string;
  parentClassId?: string | null;
  description?: string | null;
  lifecycleModelId?: string | null;
  defaultCriticality?: CriticalityLevel | null;
  defaultEnvironment?: EnvironmentType | null;
  isDiscoverable?: boolean;
}

export class CIClass {
  private constructor(private props: CIClassProps) {}

  /**
   * Factory method: Create a new CI class
   */
  static create(props: CreateCIClassProps): CIClass {
    // Validation
    CIClass.validateName(props.name);
    CIClass.validateCode(props.code);

    const now = new Date();

    return new CIClass({
      id: "", // Will be set by repository
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      parentClassId: props.parentClassId || null,
      description: props.description?.trim() || null,
      lifecycleModelId: props.lifecycleModelId || null,
      defaultCriticality: props.defaultCriticality || null,
      defaultEnvironment: props.defaultEnvironment || null,
      isDiscoverable: props.isDiscoverable ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: CIClassProps): CIClass {
    return new CIClass(props);
  }

  /**
   * Update CI class details
   */
  update(props: {
    name?: string;
    code?: string;
    parentClassId?: string | null;
    description?: string | null;
    lifecycleModelId?: string | null;
    defaultCriticality?: CriticalityLevel | null;
    defaultEnvironment?: EnvironmentType | null;
    isDiscoverable?: boolean;
  }): void {
    if (props.name !== undefined) {
      CIClass.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      CIClass.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.parentClassId !== undefined) {
      this.props.parentClassId = props.parentClassId;
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.lifecycleModelId !== undefined) {
      this.props.lifecycleModelId = props.lifecycleModelId;
    }

    if (props.defaultCriticality !== undefined) {
      this.props.defaultCriticality = props.defaultCriticality;
    }

    if (props.defaultEnvironment !== undefined) {
      this.props.defaultEnvironment = props.defaultEnvironment;
    }

    if (props.isDiscoverable !== undefined) {
      this.props.isDiscoverable = props.isDiscoverable;
    }

    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("CI class name is required");
    }
    if (name.trim().length > 200) {
      throw new Error("CI class name must be 200 characters or less");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("CI class code is required");
    }
    if (code.trim().length > 50) {
      throw new Error("CI class code must be 50 characters or less");
    }
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      throw new Error(
        "CI class code must contain only letters, numbers, hyphens, and underscores",
      );
    }
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

  get parentClassId(): string | null {
    return this.props.parentClassId;
  }

  get description(): string | null {
    return this.props.description;
  }

  get lifecycleModelId(): string | null {
    return this.props.lifecycleModelId;
  }

  get defaultCriticality(): CriticalityLevel | null {
    return this.props.defaultCriticality;
  }

  get defaultEnvironment(): EnvironmentType | null {
    return this.props.defaultEnvironment;
  }

  get isDiscoverable(): boolean {
    return this.props.isDiscoverable;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  isRootClass(): boolean {
    return this.props.parentClassId === null;
  }

  hasLifecycleModel(): boolean {
    return this.props.lifecycleModelId !== null;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): CIClassProps {
    return { ...this.props };
  }
}
