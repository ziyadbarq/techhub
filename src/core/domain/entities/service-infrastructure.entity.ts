/**
 * ServiceInfrastructure Entity
 *
 * Represents infrastructure details for a service (cloud/on-prem location,
 * provider details, network configuration, backup settings).
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ServiceLocation } from "@/generated/prisma";

export interface ServiceInfrastructureProps {
  id: string;
  serviceId: string;
  location: ServiceLocation;
  cloudProvider: string | null;
  compartment: string | null;
  project: string | null;
  region: string | null;
  ipAddress: string | null;
  hostname: string | null;
  backupEnabled: boolean;
  backupSchedule: string | null;
  lastBackupDate: Date | null;
  cloudProviderDetails: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInfrastructureProps {
  serviceId: string;
  location: ServiceLocation;
  cloudProvider?: string | null;
  compartment?: string | null;
  project?: string | null;
  region?: string | null;
  ipAddress?: string | null;
  hostname?: string | null;
  backupEnabled?: boolean;
  backupSchedule?: string | null;
  lastBackupDate?: Date | null;
  cloudProviderDetails?: Record<string, unknown> | null;
}

export class ServiceInfrastructure {
  private constructor(private props: ServiceInfrastructureProps) {
    this.validate();
  }

  static create(
    props: CreateServiceInfrastructureProps,
    idGenerator: IIdGenerator,
  ): ServiceInfrastructure {
    ServiceInfrastructure.validateServiceId(props.serviceId);
    ServiceInfrastructure.validateLocation(props.location);

    // Business rule: Cloud services must have cloudProvider set
    if (
      (props.location === "OCI_CLOUD" ||
        props.location === "GCP_CLOUD" ||
        props.location === "AWS_CLOUD") &&
      !props.cloudProvider
    ) {
      throw new Error("Cloud services must have cloudProvider specified");
    }

    // Validate IP address format if provided
    if (props.ipAddress) {
      ServiceInfrastructure.validateIpAddress(props.ipAddress);
    }

    // Validate hostname format if provided
    if (props.hostname) {
      ServiceInfrastructure.validateHostname(props.hostname);
    }

    const now = new Date();

    return new ServiceInfrastructure({
      id: idGenerator.generateId(),
      serviceId: props.serviceId,
      location: props.location,
      cloudProvider: props.cloudProvider?.trim() || null,
      compartment: props.compartment?.trim() || null,
      project: props.project?.trim() || null,
      region: props.region?.trim() || null,
      ipAddress: props.ipAddress?.trim() || null,
      hostname: props.hostname?.trim() || null,
      backupEnabled: props.backupEnabled || false,
      backupSchedule: props.backupSchedule?.trim() || null,
      lastBackupDate: props.lastBackupDate || null,
      cloudProviderDetails: props.cloudProviderDetails || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(
    props: ServiceInfrastructureProps,
  ): ServiceInfrastructure {
    return new ServiceInfrastructure(props);
  }

  update(
    updates: Partial<
      Omit<
        ServiceInfrastructureProps,
        "id" | "serviceId" | "createdAt" | "updatedAt"
      >
    >,
  ): void {
    if (updates.location !== undefined) {
      ServiceInfrastructure.validateLocation(updates.location);

      // Business rule: Cloud services must have cloudProvider
      const newCloudProvider =
        updates.cloudProvider ?? this.props.cloudProvider;
      if (
        (updates.location === "OCI_CLOUD" ||
          updates.location === "GCP_CLOUD" ||
          updates.location === "AWS_CLOUD") &&
        !newCloudProvider
      ) {
        throw new Error("Cloud services must have cloudProvider specified");
      }

      this.props.location = updates.location;
    }

    if (updates.ipAddress !== undefined && updates.ipAddress !== null) {
      ServiceInfrastructure.validateIpAddress(updates.ipAddress);
      this.props.ipAddress = updates.ipAddress.trim();
    }

    if (updates.hostname !== undefined && updates.hostname !== null) {
      ServiceInfrastructure.validateHostname(updates.hostname);
      this.props.hostname = updates.hostname.trim();
    }

    // Apply other updates
    Object.keys(updates).forEach((key) => {
      const value = updates[key as keyof typeof updates];
      if (
        value !== undefined &&
        key !== "location" &&
        key !== "ipAddress" &&
        key !== "hostname"
      ) {
        (this.props as unknown as Record<string, unknown>)[key] = value;
      }
    });

    this.props.updatedAt = new Date();
  }

  enableBackup(schedule: string): void {
    this.props.backupEnabled = true;
    this.props.backupSchedule = schedule.trim();
    this.props.updatedAt = new Date();
  }

  disableBackup(): void {
    this.props.backupEnabled = false;
    this.props.backupSchedule = null;
    this.props.updatedAt = new Date();
  }

  recordBackup(date: Date = new Date()): void {
    this.props.lastBackupDate = date;
    this.props.updatedAt = new Date();
  }

  isCloudBased(): boolean {
    return (
      this.props.location === "OCI_CLOUD" ||
      this.props.location === "GCP_CLOUD" ||
      this.props.location === "AWS_CLOUD" ||
      this.props.location === "HYBRID"
    );
  }

  static validateServiceId(serviceId: string): void {
    if (!serviceId?.trim()) {
      throw new Error("Service ID is required");
    }
  }

  static validateLocation(location: ServiceLocation): void {
    if (!location) {
      throw new Error("Infrastructure location is required");
    }
  }

  static validateIpAddress(ipAddress: string): void {
    if (!ipAddress?.trim()) {
      return;
    }

    // Simple IP validation (IPv4)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ipAddress.trim())) {
      throw new Error("Invalid IP address format");
    }

    // Validate each octet is 0-255
    const octets = ipAddress.trim().split(".");
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        throw new Error("Invalid IP address: octets must be 0-255");
      }
    }
  }

  static validateHostname(hostname: string): void {
    if (!hostname?.trim()) {
      return;
    }

    const trimmedHostname = hostname.trim();

    // Hostname validation (simplified)
    if (trimmedHostname.length > 253) {
      throw new Error("Hostname must not exceed 253 characters");
    }

    const hostnamePattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnamePattern.test(trimmedHostname)) {
      throw new Error(
        "Invalid hostname format (must contain only letters, numbers, dots, and hyphens)",
      );
    }
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Infrastructure ID is required");
    }
    ServiceInfrastructure.validateServiceId(this.props.serviceId);
    ServiceInfrastructure.validateLocation(this.props.location);

    if (this.props.ipAddress) {
      ServiceInfrastructure.validateIpAddress(this.props.ipAddress);
    }

    if (this.props.hostname) {
      ServiceInfrastructure.validateHostname(this.props.hostname);
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get serviceId(): string {
    return this.props.serviceId;
  }

  get location(): ServiceLocation {
    return this.props.location;
  }

  get cloudProvider(): string | null {
    return this.props.cloudProvider;
  }

  get compartment(): string | null {
    return this.props.compartment;
  }

  get project(): string | null {
    return this.props.project;
  }

  get region(): string | null {
    return this.props.region;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get hostname(): string | null {
    return this.props.hostname;
  }

  get backupEnabled(): boolean {
    return this.props.backupEnabled;
  }

  get backupSchedule(): string | null {
    return this.props.backupSchedule;
  }

  get lastBackupDate(): Date | null {
    return this.props.lastBackupDate;
  }

  get cloudProviderDetails(): Record<string, unknown> | null {
    return this.props.cloudProviderDetails;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): ServiceInfrastructureProps {
    return { ...this.props };
  }
}
