/**
 * LicenseProduct Domain Entity
 *
 * Represents a licensable software product with its licensing metric type.
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export enum LicenseMetricType {
  PER_DEVICE = "per_device",
  PER_USER = "per_user",
  PER_CORE = "per_core",
  PER_VM = "per_vm",
  PER_CLUSTER = "per_cluster",
}

export interface CreateLicenseProductProps {
  name: string;
  code: string;
  vendorId: string;
  metricType: LicenseMetricType;
  description?: string | null;
  lifecycleModelId?: string | null;
}

export interface LicenseProductProps extends CreateLicenseProductProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LicenseProduct {
  private readonly props: LicenseProductProps;

  private constructor(props: LicenseProductProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    LicenseProduct.validateName(value);
    this.props.name = value.trim();
  }

  get code(): string {
    return this.props.code;
  }

  set code(value: string) {
    LicenseProduct.validateCode(value);
    this.props.code = value.trim().toUpperCase();
  }

  get vendorId(): string {
    return this.props.vendorId;
  }

  set vendorId(value: string) {
    LicenseProduct.validateVendorId(value);
    this.props.vendorId = value;
  }

  get metricType(): LicenseMetricType {
    return this.props.metricType;
  }

  set metricType(value: LicenseMetricType) {
    LicenseProduct.validateMetricType(value);
    this.props.metricType = value;
  }

  get description(): string | null {
    return this.props.description ?? null;
  }

  set description(value: string | null) {
    this.props.description = value;
  }

  get lifecycleModelId(): string | null {
    return this.props.lifecycleModelId ?? null;
  }

  set lifecycleModelId(value: string | null) {
    this.props.lifecycleModelId = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  public isPerDevice(): boolean {
    return this.metricType === LicenseMetricType.PER_DEVICE;
  }

  public isPerUser(): boolean {
    return this.metricType === LicenseMetricType.PER_USER;
  }

  public isPerCore(): boolean {
    return this.metricType === LicenseMetricType.PER_CORE;
  }

  public isPerVM(): boolean {
    return this.metricType === LicenseMetricType.PER_VM;
  }

  public isPerCluster(): boolean {
    return this.metricType === LicenseMetricType.PER_CLUSTER;
  }

  // Factory method
  public static create(
    props: CreateLicenseProductProps,
    idGenerator: IIdGenerator,
  ): LicenseProduct {
    // Validations
    LicenseProduct.validateName(props.name);
    LicenseProduct.validateCode(props.code);
    LicenseProduct.validateVendorId(props.vendorId);
    LicenseProduct.validateMetricType(props.metricType);

    const now = new Date();
    return new LicenseProduct({
      id: idGenerator.generateId(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      vendorId: props.vendorId,
      metricType: props.metricType,
      description: props.description?.trim() || null,
      lifecycleModelId: props.lifecycleModelId || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Restore from persistence
  public static restore(props: LicenseProductProps): LicenseProduct {
    return new LicenseProduct(props);
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim() === "") {
      throw new Error("License product name is required");
    }
    if (name.length > 255) {
      throw new Error("License product name must not exceed 255 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim() === "") {
      throw new Error("License product code is required");
    }
    if (code.length > 50) {
      throw new Error("License product code must not exceed 50 characters");
    }
    if (!/^[A-Z0-9_-]+$/i.test(code)) {
      throw new Error(
        "License product code must contain only letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateVendorId(vendorId: string): void {
    if (!vendorId || vendorId.trim() === "") {
      throw new Error("Vendor ID is required");
    }
  }

  private static validateMetricType(metricType: LicenseMetricType): void {
    if (!Object.values(LicenseMetricType).includes(metricType)) {
      throw new Error(
        `Invalid metric type. Must be one of: ${Object.values(LicenseMetricType).join(", ")}`,
      );
    }
  }
}
