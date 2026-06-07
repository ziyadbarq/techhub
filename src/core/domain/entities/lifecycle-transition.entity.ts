/**
 * LifecycleTransition Domain Entity
 * Defines allowed state transitions in a lifecycle model
 */

export interface ApprovalPolicy {
  approvers?: string[]; // Role IDs
  minimumApprovals?: number;
  [key: string]: unknown;
}

export interface LifecycleTransitionProps {
  id: string;
  lifecycleModelId: string;
  fromStateId: string;
  toStateId: string;
  name: string;
  description: string | null;
  requiredRoleId: string | null; // Optional: role required to execute
  requiresApproval: boolean;
  approvalPolicy: ApprovalPolicy | null;
  conditions: Record<string, unknown> | null;
  isAutomated: boolean;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLifecycleTransitionProps {
  lifecycleModelId: string;
  fromStateId: string;
  toStateId: string;
  name: string;
  description?: string | null;
  requiredRoleId?: string | null;
  requiresApproval?: boolean;
  approvalPolicy?: ApprovalPolicy | null;
  conditions?: Record<string, unknown> | null;
  isAutomated?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export class LifecycleTransition {
  private constructor(private props: LifecycleTransitionProps) {}

  static create(props: CreateLifecycleTransitionProps): LifecycleTransition {
    LifecycleTransition.validateLifecycleModelId(props.lifecycleModelId);
    LifecycleTransition.validateStateIds(props.fromStateId, props.toStateId);
    LifecycleTransition.validateName(props.name);
    if (props.requiresApproval && props.approvalPolicy) {
      LifecycleTransition.validateApprovalPolicy(props.approvalPolicy);
    }

    const now = new Date();

    return new LifecycleTransition({
      id: "",
      lifecycleModelId: props.lifecycleModelId,
      fromStateId: props.fromStateId,
      toStateId: props.toStateId,
      name: props.name.trim(),
      description: props.description?.trim() || null,
      requiredRoleId: props.requiredRoleId || null,
      requiresApproval: props.requiresApproval ?? false,
      approvalPolicy: props.approvalPolicy || null,
      conditions: props.conditions || null,
      isAutomated: props.isAutomated ?? false,
      isActive: props.isActive ?? true,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: LifecycleTransitionProps): LifecycleTransition {
    return new LifecycleTransition(props);
  }

  update(props: {
    name?: string;
    description?: string | null;
    requiredRoleId?: string | null;
    requiresApproval?: boolean;
    approvalPolicy?: ApprovalPolicy | null;
    conditions?: Record<string, unknown> | null;
    isAutomated?: boolean;
    isActive?: boolean;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      LifecycleTransition.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.requiredRoleId !== undefined) {
      this.props.requiredRoleId = props.requiredRoleId;
    }

    if (props.requiresApproval !== undefined) {
      this.props.requiresApproval = props.requiresApproval;
    }

    if (props.approvalPolicy !== undefined) {
      if (props.approvalPolicy) {
        LifecycleTransition.validateApprovalPolicy(props.approvalPolicy);
      }
      this.props.approvalPolicy = props.approvalPolicy;
    }

    if (props.conditions !== undefined) {
      this.props.conditions = props.conditions;
    }

    if (props.isAutomated !== undefined) {
      this.props.isAutomated = props.isAutomated;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  private static validateLifecycleModelId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Lifecycle model ID cannot be empty");
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Transition name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Transition name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Transition name cannot exceed 200 characters");
    }
  }

  private static validateStateIds(fromId: string, toId: string): void {
    if (!fromId || fromId.trim().length === 0) {
      throw new Error("From state ID cannot be empty");
    }
    if (!toId || toId.trim().length === 0) {
      throw new Error("To state ID cannot be empty");
    }
    if (fromId === toId) {
      throw new Error("Transition from and to states cannot be the same");
    }
  }

  private static validateApprovalPolicy(policy: ApprovalPolicy): void {
    if (policy.minimumApprovals !== undefined) {
      if (
        !Number.isInteger(policy.minimumApprovals) ||
        policy.minimumApprovals < 1
      ) {
        throw new Error("Minimum approvals must be a positive integer");
      }

      if (
        policy.approvers &&
        policy.minimumApprovals > policy.approvers.length
      ) {
        throw new Error("Minimum approvals cannot exceed number of approvers");
      }
    }
  }

  canBeExecutedBy(userRoleId: string): boolean {
    if (!this.props.requiredRoleId) {
      return true; // No role restriction
    }
    return userRoleId === this.props.requiredRoleId;
  }

  needsApproval(): boolean {
    return this.props.requiresApproval;
  }

  isCircular(otherTransitions: LifecycleTransition[]): boolean {
    // Check if this transition creates a circular path
    const visited = new Set<string>();
    const stack = [this.props.toStateId];

    while (stack.length > 0) {
      const currentStateId = stack.pop()!;

      if (visited.has(currentStateId)) {
        continue;
      }

      if (currentStateId === this.props.fromStateId) {
        return true; // Found circular path
      }

      visited.add(currentStateId);

      // Find transitions from current state
      const nextTransitions = otherTransitions.filter(
        (t) => t.fromStateId === currentStateId && t.id !== this.props.id,
      );

      for (const trans of nextTransitions) {
        stack.push(trans.toStateId);
      }
    }

    return false;
  }

  get id(): string {
    return this.props.id;
  }
  get lifecycleModelId(): string {
    return this.props.lifecycleModelId;
  }
  get fromStateId(): string {
    return this.props.fromStateId;
  }
  get toStateId(): string {
    return this.props.toStateId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get requiredRoleId(): string | null {
    return this.props.requiredRoleId;
  }

  get requiresApproval(): boolean {
    return this.props.requiresApproval;
  }

  get approvalPolicy(): ApprovalPolicy | null {
    return this.props.approvalPolicy;
  }

  get conditions(): Record<string, unknown> | null {
    return this.props.conditions;
  }

  get isAutomated(): boolean {
    return this.props.isAutomated;
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

  setId(id: string): void {
    if (this.props.id)
      throw new Error("Cannot change transition ID after it has been set");
    this.props.id = id;
  }
  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  toObject(): LifecycleTransitionProps {
    return { ...this.props };
  }

  equals(other: LifecycleTransition): boolean {
    return this.props.id === other.id;
  }
}
