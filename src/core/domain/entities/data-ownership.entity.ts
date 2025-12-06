/**
 * DataOwnership Domain Entity
 *
 * Represents ownership assignment for data domains, mapping them to CI classes
 * or asset categories, with ownership assigned to persons or organizational units.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateDataOwnershipProps {
  dataDomainId: string;
  ciClassId?: string | null;
  assetCategoryId?: string | null;
  ownerPersonId?: string | null;
  ownerOrgUnitId?: string | null;
  note?: string | null;
}

export interface DataOwnershipProps extends CreateDataOwnershipProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DataOwnership {
  private readonly props: DataOwnershipProps;

  private constructor(props: DataOwnershipProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get dataDomainId(): string {
    return this.props.dataDomainId;
  }

  get ciClassId(): string | null {
    return this.props.ciClassId ?? null;
  }

  set ciClassId(value: string | null) {
    if (value) {
      this.props.ciClassId = value;
      this.props.assetCategoryId = null; // Clear the other target type
    } else {
      this.props.ciClassId = null;
    }
  }

  get assetCategoryId(): string | null {
    return this.props.assetCategoryId ?? null;
  }

  set assetCategoryId(value: string | null) {
    if (value) {
      this.props.assetCategoryId = value;
      this.props.ciClassId = null; // Clear the other target type
    } else {
      this.props.assetCategoryId = null;
    }
  }

  get ownerPersonId(): string | null {
    return this.props.ownerPersonId ?? null;
  }

  set ownerPersonId(value: string | null) {
    if (value) {
      this.props.ownerPersonId = value;
      this.props.ownerOrgUnitId = null; // Clear the other owner type
    } else {
      this.props.ownerPersonId = null;
    }
  }

  get ownerOrgUnitId(): string | null {
    return this.props.ownerOrgUnitId ?? null;
  }

  set ownerOrgUnitId(value: string | null) {
    if (value) {
      this.props.ownerOrgUnitId = value;
      this.props.ownerPersonId = null; // Clear the other owner type
    } else {
      this.props.ownerOrgUnitId = null;
    }
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

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public hasOwner(): boolean {
    return (
      this.props.ownerPersonId !== null || this.props.ownerOrgUnitId !== null
    );
  }

  public isOwnedByPerson(): boolean {
    return this.props.ownerPersonId !== null;
  }

  public isOwnedByOrgUnit(): boolean {
    return this.props.ownerOrgUnitId !== null;
  }

  public appliesToCIClass(): boolean {
    return this.props.ciClassId !== null;
  }

  public appliesToAssetCategory(): boolean {
    return this.props.assetCategoryId !== null;
  }

  public assignOwner(type: "person" | "orgunit", id: string): void {
    if (type === "person") {
      this.ownerPersonId = id;
    } else {
      this.ownerOrgUnitId = id;
    }
  }

  public setTarget(type: "ciClass" | "assetCategory", id: string): void {
    if (type === "ciClass") {
      this.ciClassId = id;
    } else {
      this.assetCategoryId = id;
    }
  }

  // Factory method
  public static create(
    props: CreateDataOwnershipProps,
    idGenerator: IIdGenerator,
  ): DataOwnership {
    // Validations
    DataOwnership.validateDataDomainId(props.dataDomainId);
    DataOwnership.validateTargetAssignment(
      props.ciClassId,
      props.assetCategoryId,
    );
    // Note: Owner is optional, so we don't validate it here

    const now = new Date();
    return new DataOwnership({
      id: idGenerator.generateId(),
      dataDomainId: props.dataDomainId,
      ciClassId: props.ciClassId ?? null,
      assetCategoryId: props.assetCategoryId ?? null,
      ownerPersonId: props.ownerPersonId ?? null,
      ownerOrgUnitId: props.ownerOrgUnitId ?? null,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: DataOwnershipProps): DataOwnership {
    return new DataOwnership(props);
  }

  // Validation methods
  private static validateDataDomainId(dataDomainId: string): void {
    if (!dataDomainId || dataDomainId.trim() === "") {
      throw new Error("Data domain ID is required");
    }
  }

  private static validateTargetAssignment(
    ciClassId?: string | null,
    assetCategoryId?: string | null,
  ): void {
    const hasCIClass = ciClassId !== null && ciClassId !== undefined;
    const hasAssetCategory =
      assetCategoryId !== null && assetCategoryId !== undefined;

    if (!hasCIClass && !hasAssetCategory) {
      throw new Error(
        "Data ownership must be assigned to either a CI class or an asset category",
      );
    }

    if (hasCIClass && hasAssetCategory) {
      throw new Error(
        "Data ownership cannot be assigned to both a CI class and an asset category",
      );
    }
  }
}
