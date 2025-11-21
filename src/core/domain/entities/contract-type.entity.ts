/**
 * ContractType Entity
 * Represents a category or type of contract (e.g., SLA, License, Service Agreement)
 */

export interface ContractTypeProps {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractTypeProps {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateContractTypeProps {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
}

export class ContractType {
  private constructor(private props: ContractTypeProps) {}

  // Factory method for creating new contract types
  static create(props: CreateContractTypeProps): ContractType {
    ContractType.validateName(props.name);
    ContractType.validateCode(props.code);

    const now = new Date();

    return new ContractType({
      id: "",
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: ContractTypeProps): ContractType {
    return new ContractType(props);
  }

  // Update method
  update(props: UpdateContractTypeProps): void {
    if (props.name !== undefined) {
      ContractType.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      ContractType.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    this.props.updatedAt = new Date();
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Contract type name is required");
    }
    if (name.trim().length > 200) {
      throw new Error("Contract type name must be 200 characters or less");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Contract type code is required");
    }
    if (code.trim().length > 50) {
      throw new Error("Contract type code must be 50 characters or less");
    }
    if (!/^[A-Z0-9_-]+$/i.test(code.trim())) {
      throw new Error(
        "Contract type code must contain only letters, numbers, hyphens, and underscores",
      );
    }
  }

  // Business logic methods
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
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

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
