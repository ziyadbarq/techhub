/**
 * Contract Domain Entity
 *
 * Represents a legal contract or agreement with a vendor for services, licenses, or support.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateContractProps {
  contractTypeId: string;
  vendorId: string;
  name: string;
  contractNumber?: string | null;
  startDate: Date;
  endDate?: Date | null;
  autoRenew?: boolean;
  renewalTerms?: string | null;
  slaDefinition?: Record<string, unknown> | null;
  totalValue?: number | null;
  totalValueSar?: number | null; // Frozen SAR snapshot at create/update
  currency?: string | null;
  note?: string | null;
}

export interface ContractProps extends CreateContractProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Contract {
  private readonly props: ContractProps;

  private constructor(props: ContractProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get contractTypeId(): string {
    return this.props.contractTypeId;
  }

  get vendorId(): string {
    return this.props.vendorId;
  }

  get name(): string {
    return this.props.name;
  }

  get contractNumber(): string | null {
    return this.props.contractNumber ?? null;
  }

  set contractNumber(value: string | null) {
    this.props.contractNumber = value;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  set startDate(value: Date) {
    Contract.validateDateNotInFuture(value, "Start date");
    this.props.startDate = value;
  }

  get endDate(): Date | null {
    return this.props.endDate ?? null;
  }

  set endDate(value: Date | null) {
    if (value) {
      Contract.validateEndDateAfterStartDate(this.props.startDate, value);
    }
    this.props.endDate = value;
  }

  get autoRenew(): boolean {
    return this.props.autoRenew ?? false;
  }

  set autoRenew(value: boolean) {
    this.props.autoRenew = value;
  }

  get renewalTerms(): string | null {
    return this.props.renewalTerms ?? null;
  }

  set renewalTerms(value: string | null) {
    this.props.renewalTerms = value;
  }

  get slaDefinition(): Record<string, unknown> | null {
    return this.props.slaDefinition ?? null;
  }

  set slaDefinition(value: Record<string, unknown> | null) {
    this.props.slaDefinition = value;
  }

  get totalValue(): number | null {
    return this.props.totalValue ?? null;
  }

  set totalValue(value: number | null) {
    if (value !== null) {
      Contract.validateDecimalValue(value, "Total value");
    }
    this.props.totalValue = value;
  }

  get currency(): string | null {
    return this.props.currency ?? null;
  }

  set currency(value: string | null) {
    this.props.currency = value;
  }

  get totalValueSar(): number | null {
    return this.props.totalValueSar ?? null;
  }

  set totalValueSar(value: number | null) {
    this.props.totalValueSar = value;
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
  public isActive(asOfDate?: Date): boolean {
    const checkDate = asOfDate ?? new Date();
    const hasStarted = this.startDate <= checkDate;
    const notExpired = !this.endDate || this.endDate >= checkDate;
    return hasStarted && notExpired;
  }

  public isExpired(asOfDate?: Date): boolean {
    if (!this.endDate) {
      return false; // No end date means never expires
    }
    const checkDate = asOfDate ?? new Date();
    return this.endDate < checkDate;
  }

  public daysUntilExpiry(): number | null {
    if (!this.endDate) {
      return null; // No end date
    }
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public extend(newEndDate: Date): void {
    if (this.endDate && newEndDate <= this.endDate) {
      throw new Error("New end date must be after the current end date");
    }
    Contract.validateEndDateAfterStartDate(this.startDate, newEndDate);
    this.endDate = newEndDate;
  }

  // Factory method
  public static create(
    props: CreateContractProps,
    idGenerator: IIdGenerator,
  ): Contract {
    // Validations
    Contract.validateContractTypeId(props.contractTypeId);
    Contract.validateVendorId(props.vendorId);
    Contract.validateName(props.name);
    if (props.contractNumber) {
      Contract.validateContractNumber(props.contractNumber);
    }
    Contract.validateDateNotInFuture(props.startDate, "Start date");
    if (props.endDate) {
      Contract.validateEndDateAfterStartDate(props.startDate, props.endDate);
    }
    if (props.totalValue !== undefined && props.totalValue !== null) {
      Contract.validateDecimalValue(props.totalValue, "Total value");
    }

    const now = new Date();
    return new Contract({
      id: idGenerator.generateId(),
      contractTypeId: props.contractTypeId,
      vendorId: props.vendorId,
      name: props.name.trim(),
      contractNumber: props.contractNumber?.trim() || null,
      startDate: props.startDate,
      endDate: props.endDate ?? null,
      autoRenew: props.autoRenew ?? false,
      renewalTerms: props.renewalTerms?.trim() || null,
      slaDefinition: props.slaDefinition ?? null,
      totalValue: props.totalValue ?? null,
      totalValueSar: props.totalValueSar ?? null,
      currency: props.currency?.trim() || null,
      note: props.note?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: ContractProps): Contract {
    return new Contract(props);
  }

  // Validation methods
  private static validateContractTypeId(contractTypeId: string): void {
    if (!contractTypeId || contractTypeId.trim() === "") {
      throw new Error("Contract type ID is required");
    }
  }

  private static validateVendorId(vendorId: string): void {
    if (!vendorId || vendorId.trim() === "") {
      throw new Error("Vendor ID is required");
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim() === "") {
      throw new Error("Contract name is required");
    }
    if (name.length > 255) {
      throw new Error("Contract name must not exceed 255 characters");
    }
  }

  private static validateContractNumber(contractNumber: string): void {
    if (contractNumber.length > 100) {
      throw new Error("Contract number must not exceed 100 characters");
    }
  }

  private static validateDateNotInFuture(date: Date, fieldName: string): void {
    const now = new Date();
    // Allow same day
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateOnly > nowOnly) {
      throw new Error(`${fieldName} cannot be in the future`);
    }
  }

  private static validateEndDateAfterStartDate(
    startDate: Date,
    endDate: Date,
  ): void {
    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }
  }

  private static validateDecimalValue(value: number, fieldName: string): void {
    if (value < 0) {
      throw new Error(`${fieldName} must be non-negative`);
    }
    if (!Number.isFinite(value)) {
      throw new Error(`${fieldName} must be a valid number`);
    }
    // Validate decimal precision (12,2)
    const parts = value.toString().split(".");
    if (parts[0] && parts[0].length > 10) {
      throw new Error(`${fieldName} exceeds maximum precision`);
    }
  }
}
