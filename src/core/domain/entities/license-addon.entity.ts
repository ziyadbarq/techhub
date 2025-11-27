/**
 * LicenseAddon Entity
 * Represents a product-level addon template (e.g., premium support, training)
 * that can be attached to license entitlements
 */

export interface CreateLicenseAddonProps {
  licenseProductId: string;
  name: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface LicenseAddonProps {
  id: string;
  licenseProductId: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLicenseAddonProps {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export class LicenseAddon {
  private constructor(private props: LicenseAddonProps) {}

  // Factory method for creating new addons
  static create(props: CreateLicenseAddonProps): LicenseAddon {
    // Validate required fields
    LicenseAddon.validateLicenseProductId(props.licenseProductId);
    LicenseAddon.validateName(props.name);

    // Generate code if not provided
    const code = props.code?.trim() || LicenseAddon.generateCode(props.name);
    LicenseAddon.validateCode(code);

    const now = new Date();

    return new LicenseAddon({
      id: "", // Will be set by repository
      licenseProductId: props.licenseProductId,
      name: props.name.trim(),
      code,
      description: props.description?.trim() ?? null,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: LicenseAddonProps): LicenseAddon {
    return new LicenseAddon(props);
  }

  // Generate a code from the name
  private static generateCode(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get licenseProductId(): string {
    return this.props.licenseProductId;
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
  public update(updates: UpdateLicenseAddonProps): void {
    if (updates.name !== undefined) {
      LicenseAddon.validateName(updates.name);
      this.props.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      this.props.description = updates.description?.trim() ?? null;
    }

    if (updates.isActive !== undefined) {
      this.props.isActive = updates.isActive;
    }

    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateLicenseProductId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("License product ID is required");
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Addon name is required");
    }
    if (name.trim().length > 255) {
      throw new Error("Addon name cannot exceed 255 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Addon code is required");
    }
    if (code.length > 50) {
      throw new Error("Addon code cannot exceed 50 characters");
    }
    if (!/^[A-Z0-9]([A-Z0-9_-]*[A-Z0-9])?$/i.test(code)) {
      throw new Error(
        "Addon code must be alphanumeric (hyphens and underscores allowed, but not at start/end)",
      );
    }
  }

  // Equality
  public equals(other: LicenseAddon): boolean {
    if (!(other instanceof LicenseAddon)) {
      return false;
    }
    return this.props.id === other.props.id;
  }
}
