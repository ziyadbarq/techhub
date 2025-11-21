/**
 * LifecycleState Domain Entity
 * States within a lifecycle model (e.g., Planned, In Service, Retired)
 */

import type { StateType } from "@/core/domain/value-objects/foundation-enums";

export interface LifecycleStateProps {
  id: string;
  lifecycleModelId: string;
  name: string;
  code: string;
  description: string | null;
  stateType: StateType;
  isActiveState: boolean; // True if considered in-use/active
  isTerminalState: boolean; // True if end-of-life
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLifecycleStateProps {
  lifecycleModelId: string;
  name: string;
  code: string;
  description?: string | null;
  stateType: StateType;
  isActiveState?: boolean;
  isTerminalState?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
}

export class LifecycleState {
  private constructor(private props: LifecycleStateProps) {}

  /**
   * Factory method: Create a new lifecycle state
   */
  static create(props: CreateLifecycleStateProps): LifecycleState {
    // Validation
    LifecycleState.validateName(props.name);
    LifecycleState.validateCode(props.code);
    LifecycleState.validateLifecycleModelId(props.lifecycleModelId);
    LifecycleState.validateStateFlags(
      props.isActiveState,
      props.isTerminalState,
    );

    const now = new Date();

    return new LifecycleState({
      id: "", // Will be set by repository
      lifecycleModelId: props.lifecycleModelId,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      stateType: props.stateType,
      isActiveState: props.isActiveState ?? false,
      isTerminalState: props.isTerminalState ?? false,
      sortOrder: props.sortOrder ?? 0,
      isActive: true,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: LifecycleStateProps): LifecycleState {
    return new LifecycleState(props);
  }

  /**
   * Update lifecycle state
   */
  update(props: {
    name?: string;
    code?: string;
    description?: string | null;
    stateType?: StateType;
    isActiveState?: boolean;
    isTerminalState?: boolean;
    sortOrder?: number;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      LifecycleState.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      LifecycleState.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.stateType !== undefined) {
      this.props.stateType = props.stateType;
    }

    if (
      props.isActiveState !== undefined ||
      props.isTerminalState !== undefined
    ) {
      const newIsActive = props.isActiveState ?? this.props.isActiveState;
      const newIsTerminal = props.isTerminalState ?? this.props.isTerminalState;
      LifecycleState.validateStateFlags(newIsActive, newIsTerminal);

      if (props.isActiveState !== undefined) {
        this.props.isActiveState = props.isActiveState;
      }
      if (props.isTerminalState !== undefined) {
        this.props.isTerminalState = props.isTerminalState;
      }
    }

    if (props.sortOrder !== undefined) {
      this.props.sortOrder = props.sortOrder;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Lifecycle state name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Lifecycle state name must be at least 2 characters");
    }

    if (name.trim().length > 100) {
      throw new Error("Lifecycle state name cannot exceed 100 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Lifecycle state code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Lifecycle state code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Lifecycle state code cannot exceed 50 characters");
    }

    // Must be alphanumeric, hyphens, underscores
    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Lifecycle state code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateLifecycleModelId(modelId: string): void {
    if (!modelId || modelId.trim().length === 0) {
      throw new Error("Lifecycle model ID cannot be empty");
    }
  }

  private static validateStateFlags(
    isActiveState?: boolean,
    isTerminalState?: boolean,
  ): void {
    // Business rule: A state cannot be both active and terminal
    if (isActiveState && isTerminalState) {
      throw new Error("A state cannot be both active and terminal");
    }
  }

  /**
   * Check if this state allows transitions
   */
  allowsTransitions(): boolean {
    // Terminal states typically don't allow transitions out
    return !this.props.isTerminalState;
  }

  /**
   * Check if can be deleted
   * Business rule: Cannot delete if has transitions or CIs/Assets in this state
   */
  canBeDeleted(hasTransitions: boolean, hasEntitiesInState: boolean): boolean {
    return !hasTransitions && !hasEntitiesInState;
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get lifecycleModelId(): string {
    return this.props.lifecycleModelId;
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

  get stateType(): StateType {
    return this.props.stateType;
  }

  get isActiveState(): boolean {
    return this.props.isActiveState;
  }

  get isTerminalState(): boolean {
    return this.props.isTerminalState;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
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

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change lifecycle state ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): LifecycleStateProps {
    return { ...this.props };
  }

  /**
   * Compare with another lifecycle state
   */
  equals(other: LifecycleState): boolean {
    return this.props.id === other.id;
  }
}
