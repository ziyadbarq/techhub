/**
 * OrganizationUnit Domain Entity
 * Hierarchical organization structure: Company > Business Unit > Department > Team
 */

import type { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

export interface OrganizationUnitProps {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  description: string | null;
  unitType: OrganizationUnitType;
  managerId: string | null;
  costCenter: string | null;
  level: number; // 1=Company, 2=BU, 3=Dept, 4=Team
  isActive: boolean;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationUnitProps {
  parentId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  unitType: OrganizationUnitType;
  managerId?: string | null;
  costCenter?: string | null;
  level: number;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class OrganizationUnit {
  private constructor(private props: OrganizationUnitProps) {}

  /**
   * Factory method: Create a new organization unit
   */
  static create(props: CreateOrganizationUnitProps): OrganizationUnit {
    // Validation
    OrganizationUnit.validateName(props.name);
    OrganizationUnit.validateCode(props.code);
    OrganizationUnit.validateLevel(props.level, props.parentId);

    const now = new Date();

    return new OrganizationUnit({
      id: "", // Will be set by repository
      parentId: props.parentId || null,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      unitType: props.unitType,
      managerId: props.managerId || null,
      costCenter: props.costCenter?.trim() || null,
      level: props.level,
      isActive: true,
      note: props.note?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: OrganizationUnitProps): OrganizationUnit {
    return new OrganizationUnit(props);
  }

  /**
   * Update organization unit details
   */
  update(props: {
    name?: string;
    code?: string;
    description?: string | null;
    unitType?: OrganizationUnitType;
    managerId?: string | null;
    costCenter?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      OrganizationUnit.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      OrganizationUnit.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.unitType !== undefined) {
      this.props.unitType = props.unitType;
    }

    if (props.managerId !== undefined) {
      this.props.managerId = props.managerId;
    }

    if (props.costCenter !== undefined) {
      this.props.costCenter = props.costCenter?.trim() || null;
    }

    if (props.note !== undefined) {
      this.props.note = props.note?.trim() || null;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Move to a different parent
   * Business rule: Cannot move to own child (circular reference)
   * @param newParentId - New parent ID (null for root)
   * @param childIds - IDs of all descendants (for circular reference check)
   * @param newLevel - New level based on new parent's level + 1
   */
  moveTo(
    newParentId: string | null,
    childIds: string[],
    newLevel: number,
  ): void {
    // Cannot move to self
    if (newParentId === this.props.id) {
      throw new Error("Cannot move organization unit to itself");
    }

    // Cannot move to own child (circular reference)
    if (newParentId && childIds.includes(newParentId)) {
      throw new Error(
        "Cannot move organization unit to its own child (circular reference)",
      );
    }

    // Validate level
    OrganizationUnit.validateLevel(newLevel, newParentId);

    this.props.parentId = newParentId;
    this.props.level = newLevel;
    this.props.updatedAt = new Date();
  }

  /**
   * Update level (used when parent's level changes)
   */
  setLevel(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > 10) {
      throw new Error("Organization unit level must be between 1 and 10");
    }
    this.props.level = level;
    this.props.updatedAt = new Date();
  }

  /**
   * Activate the organization unit
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the organization unit
   * Business rule: Cannot deactivate if has active children or people
   */
  deactivate(hasActiveChildren: boolean, hasActivePeople: boolean): void {
    if (hasActiveChildren) {
      throw new Error(
        "Cannot deactivate organization unit with active children",
      );
    }

    if (hasActivePeople) {
      throw new Error("Cannot deactivate organization unit with active people");
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Organization unit name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Organization unit name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Organization unit name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Organization unit code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Organization unit code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Organization unit code cannot exceed 50 characters");
    }

    // Must be alphanumeric, hyphens, underscores
    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Organization unit code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateLevel(level: number, parentId?: string | null): void {
    if (!Number.isInteger(level) || level < 1 || level > 10) {
      throw new Error("Organization unit level must be between 1 and 10");
    }

    // Level 1 (Company) must not have parent
    if (level === 1 && parentId) {
      throw new Error("Company level (1) cannot have a parent");
    }

    // Level > 1 must have parent
    if (level > 1 && !parentId) {
      throw new Error(`Level ${level} must have a parent organization unit`);
    }
  }

  /**
   * Check if this is a root organization unit (Company)
   */
  isRoot(): boolean {
    return this.props.level === 1 && this.props.parentId === null;
  }

  /**
   * Check if can be deleted
   * Business rule: Cannot delete if has children or people
   */
  canBeDeleted(hasChildren: boolean, hasPeople: boolean): boolean {
    return !hasChildren && !hasPeople;
  }

  /**
   * Get level name
   */
  getLevelName(): string {
    const levelNames: Record<number, string> = {
      1: "Company",
      2: "Business Unit",
      3: "Department",
      4: "Team",
      5: "Sub-Team",
    };

    return levelNames[this.props.level] || `Level ${this.props.level}`;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get parentId(): string | null {
    return this.props.parentId;
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

  get unitType(): OrganizationUnitType {
    return this.props.unitType;
  }

  get managerId(): string | null {
    return this.props.managerId;
  }

  get costCenter(): string | null {
    return this.props.costCenter;
  }

  get level(): number {
    return this.props.level;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get note(): string | null {
    return this.props.note;
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

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error(
        "Cannot change organization unit ID after it has been set",
      );
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): OrganizationUnitProps {
    return { ...this.props };
  }

  /**
   * Compare with another organization unit
   */
  equals(other: OrganizationUnit): boolean {
    return this.props.id === other.id;
  }
}
