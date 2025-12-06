/**
 * ContractLinkedObject Domain Entity
 *
 * Represents a polymorphic link between a contract and another object
 * (Configuration Item, Asset, or License Entitlement).
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export enum TargetObjectType {
  CONFIGURATION_ITEM = "CONFIGURATION_ITEM",
  ASSET = "ASSET",
  LICENSE_ENTITLEMENT = "LICENSE_ENTITLEMENT",
}

export interface CreateContractLinkedObjectProps {
  contractId: string;
  targetType: TargetObjectType;
  targetId: string;
  note?: string | null;
}

export interface ContractLinkedObjectProps
  extends CreateContractLinkedObjectProps {
  id: string;
  createdAt: Date;
}

export class ContractLinkedObject {
  private readonly props: ContractLinkedObjectProps;

  private constructor(props: ContractLinkedObjectProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get contractId(): string {
    return this.props.contractId;
  }

  get targetType(): TargetObjectType {
    return this.props.targetType;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get note(): string | null {
    return this.props.note ?? null;
  }

  set note(value: string | null) {
    this.props.note = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business logic methods
  public isConfigurationItem(): boolean {
    return this.targetType === TargetObjectType.CONFIGURATION_ITEM;
  }

  public isAsset(): boolean {
    return this.targetType === TargetObjectType.ASSET;
  }

  public isLicenseEntitlement(): boolean {
    return this.targetType === TargetObjectType.LICENSE_ENTITLEMENT;
  }

  // Factory method
  public static create(
    props: CreateContractLinkedObjectProps,
    idGenerator: IIdGenerator,
  ): ContractLinkedObject {
    // Validations
    ContractLinkedObject.validateContractId(props.contractId);
    ContractLinkedObject.validateTargetType(props.targetType);
    ContractLinkedObject.validateTargetId(props.targetId);

    return new ContractLinkedObject({
      id: idGenerator.generateId(),
      contractId: props.contractId,
      targetType: props.targetType,
      targetId: props.targetId,
      note: props.note?.trim() || null,
      createdAt: new Date(),
    });
  }

  // Restore from persistence
  public static restore(
    props: ContractLinkedObjectProps,
  ): ContractLinkedObject {
    return new ContractLinkedObject(props);
  }

  // Validation methods
  private static validateContractId(contractId: string): void {
    if (!contractId || contractId.trim() === "") {
      throw new Error("Contract ID is required");
    }
  }

  private static validateTargetType(targetType: TargetObjectType): void {
    if (!Object.values(TargetObjectType).includes(targetType)) {
      throw new Error(
        `Invalid target type. Must be one of: ${Object.values(TargetObjectType).join(", ")}`,
      );
    }
  }

  private static validateTargetId(targetId: string): void {
    if (!targetId || targetId.trim() === "") {
      throw new Error("Target ID is required");
    }
  }
}
