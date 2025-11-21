/**
 * Warranty Domain Entity
 * Represents warranty coverage for assets
 * Supports multiple warranties per asset including third-party coverage
 */

import type { WarrantyCoverageType } from "@/generated/prisma";

export interface WarrantyProps {
  id: string;
  assetId: string;
  vendorId: string | null;
  coverageType: WarrantyCoverageType;
  coverageDetails: string | null;
  policyReference: string | null;
  slaDetails: Record<string, unknown> | null;
  startDate: Date;
  endDate: Date;
  cost: number | null;
  currency: string | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWarrantyProps {
  assetId: string;
  vendorId?: string | null;
  coverageType?: WarrantyCoverageType;
  coverageDetails?: string | null;
  policyReference?: string | null;
  slaDetails?: Record<string, unknown> | null;
  startDate: Date;
  endDate: Date;
  cost?: number | null;
  currency?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class Warranty {
  private constructor(private props: WarrantyProps) {}

  /**
   * Factory method: Create a new warranty
   */
  static create(props: CreateWarrantyProps): Warranty {
    // Validation
    Warranty.validateDates(props.startDate, props.endDate);

    if (props.policyReference !== undefined && props.policyReference !== null) {
      Warranty.validatePolicyReference(props.policyReference);
    }

    if (props.cost !== undefined && props.cost !== null) {
      Warranty.validateCost(props.cost);
    }

    if (props.currency !== undefined && props.currency !== null) {
      Warranty.validateCurrency(props.currency);
    }

    const now = new Date();

    return new Warranty({
      id: "", // Will be set by repository
      assetId: props.assetId,
      vendorId: props.vendorId || null,
      coverageType: props.coverageType || "STANDARD",
      coverageDetails: props.coverageDetails?.trim() || null,
      policyReference: props.policyReference?.trim() || null,
      slaDetails: props.slaDetails || null,
      startDate: props.startDate,
      endDate: props.endDate,
      cost: props.cost || null,
      currency: props.currency?.toUpperCase() || null,
      note: props.note?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: WarrantyProps): Warranty {
    return new Warranty(props);
  }

  /**
   * Update warranty details
   */
  update(props: {
    vendorId?: string | null;
    coverageType?: WarrantyCoverageType;
    coverageDetails?: string | null;
    policyReference?: string | null;
    slaDetails?: Record<string, unknown> | null;
    startDate?: Date;
    endDate?: Date;
    cost?: number | null;
    currency?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    // If dates are being updated, validate them
    const newStartDate =
      props.startDate !== undefined ? props.startDate : this.props.startDate;
    const newEndDate =
      props.endDate !== undefined ? props.endDate : this.props.endDate;

    if (props.startDate !== undefined || props.endDate !== undefined) {
      Warranty.validateDates(newStartDate, newEndDate);
    }

    if (props.policyReference !== undefined && props.policyReference !== null) {
      Warranty.validatePolicyReference(props.policyReference);
    }

    if (props.cost !== undefined && props.cost !== null) {
      Warranty.validateCost(props.cost);
    }

    if (props.currency !== undefined && props.currency !== null) {
      Warranty.validateCurrency(props.currency);
    }

    if (props.vendorId !== undefined) {
      this.props.vendorId = props.vendorId;
    }

    if (props.coverageType !== undefined) {
      this.props.coverageType = props.coverageType;
    }

    if (props.coverageDetails !== undefined) {
      this.props.coverageDetails = props.coverageDetails?.trim() || null;
    }

    if (props.policyReference !== undefined) {
      this.props.policyReference = props.policyReference?.trim() || null;
    }

    if (props.slaDetails !== undefined) {
      this.props.slaDetails = props.slaDetails;
    }

    if (props.startDate !== undefined) {
      this.props.startDate = props.startDate;
    }

    if (props.endDate !== undefined) {
      this.props.endDate = props.endDate;
    }

    if (props.cost !== undefined) {
      this.props.cost = props.cost;
    }

    if (props.currency !== undefined) {
      this.props.currency = props.currency?.toUpperCase() || null;
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
   * Check if warranty is currently active
   * Business rule: Current date must be within start and end dates
   */
  isActive(): boolean {
    const now = new Date();
    return now >= this.props.startDate && now <= this.props.endDate;
  }

  /**
   * Check if warranty is expiring soon
   * Business rule: Returns true if warranty expires within specified days
   */
  isExpiringSoon(days: number = 30): boolean {
    if (!this.isActive()) {
      return false;
    }

    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (this.props.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiration <= days && daysUntilExpiration >= 0;
  }

  /**
   * Check if warranty has expired
   */
  isExpired(): boolean {
    return new Date() > this.props.endDate;
  }

  /**
   * Get days remaining until expiration
   * Returns negative number if expired
   */
  getDaysRemaining(): number {
    const now = new Date();
    return Math.ceil(
      (this.props.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Get warranty duration in days
   */
  getDurationDays(): number {
    return Math.ceil(
      (this.props.endDate.getTime() - this.props.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  /**
   * Check if this warranty conflicts with another warranty
   * Business rule: Warranties shouldn't overlap for the same asset
   */
  conflictsWith(other: Warranty): boolean {
    if (this.props.assetId !== other.assetId) {
      return false;
    }

    // Check for date overlap
    return (
      this.props.startDate <= other.endDate &&
      this.props.endDate >= other.startDate
    );
  }

  // Business Rules & Validation

  private static validateDates(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error("Start date must be a valid date");
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error("End date must be a valid date");
    }

    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // Reasonable maximum duration (e.g., 20 years)
    const maxDurationDays = 20 * 365;
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (durationDays > maxDurationDays) {
      throw new Error("Warranty duration cannot exceed 20 years");
    }
  }

  private static validatePolicyReference(policyReference: string): void {
    if (policyReference.trim().length === 0) {
      throw new Error("Policy reference cannot be empty if provided");
    }

    if (policyReference.trim().length > 200) {
      throw new Error("Policy reference cannot exceed 200 characters");
    }
  }

  private static validateCost(cost: number): void {
    if (cost < 0) {
      throw new Error("Warranty cost cannot be negative");
    }

    // Max 9999999999.99 (12 digits total, 2 decimal places)
    if (cost > 9999999999.99) {
      throw new Error("Warranty cost cannot exceed 9999999999.99");
    }
  }

  private static validateCurrency(currency: string): void {
    if (currency.trim().length !== 3) {
      throw new Error("Currency must be a 3-letter ISO code (e.g., USD, EUR)");
    }

    if (!/^[A-Z]{3}$/i.test(currency.trim())) {
      throw new Error("Currency must be 3 uppercase letters");
    }
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get assetId(): string {
    return this.props.assetId;
  }

  get vendorId(): string | null {
    return this.props.vendorId;
  }

  get coverageType(): WarrantyCoverageType {
    return this.props.coverageType;
  }

  get coverageDetails(): string | null {
    return this.props.coverageDetails;
  }

  get policyReference(): string | null {
    return this.props.policyReference;
  }

  get slaDetails(): Record<string, unknown> | null {
    return this.props.slaDetails;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get cost(): number | null {
    return this.props.cost;
  }

  get currency(): string | null {
    return this.props.currency;
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
      throw new Error("Cannot change warranty ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): WarrantyProps {
    return { ...this.props };
  }

  /**
   * Compare with another warranty
   */
  equals(other: Warranty): boolean {
    return this.props.id === other.id;
  }
}
