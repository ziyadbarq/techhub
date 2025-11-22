/**
 * Service Entity
 *
 * Represents an IT service in the service catalog (applications, infrastructure,
 * databases, APIs, etc.) with ownership, classification, and lifecycle management.
 */

import type {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
} from "@/generated/prisma";

export interface ServiceProps {
  id: string;
  name: string;
  serviceType: ServiceType;
  description: string | null;
  businessPurpose: string | null;
  gitlabRepoUrl: string | null;
  dataConfidentiality: DataConfidentiality;
  businessImpactLevel: BusinessImpactLevel;
  criticality: CriticalityLevel;
  isEssentialService: boolean;
  deploymentDate: Date | null;
  currentStatus: ServiceStatus;
  lastPatchDate: Date | null;
  plannedDecommissionDate: Date | null;
  vendorId: string | null;
  slaDetails: Record<string, unknown> | null;
  businessProcessId: string | null;
  isInCentralRegister: boolean;
  complianceNotes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateServiceProps {
  name: string;
  serviceType: ServiceType;
  description?: string | null;
  businessPurpose?: string | null;
  gitlabRepoUrl?: string | null;
  dataConfidentiality?: DataConfidentiality;
  businessImpactLevel?: BusinessImpactLevel;
  criticality?: CriticalityLevel;
  isEssentialService?: boolean;
  deploymentDate?: Date | null;
  currentStatus?: ServiceStatus;
  lastPatchDate?: Date | null;
  plannedDecommissionDate?: Date | null;
  vendorId?: string | null;
  slaDetails?: Record<string, unknown> | null;
  businessProcessId?: string | null;
  isInCentralRegister?: boolean;
  complianceNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export class Service {
  private constructor(private props: ServiceProps) {
    this.validate();
  }

  static create(props: CreateServiceProps): Service {
    Service.validateName(props.name);
    Service.validateServiceType(props.serviceType);

    // Business rule: Essential services must have Critical or High criticality
    if (props.isEssentialService) {
      const criticality = props.criticality || "MEDIUM";
      if (criticality !== "CRITICAL" && criticality !== "HIGH") {
        throw new Error(
          "Essential services must have Critical or High criticality level",
        );
      }
    }

    // Business rule: Services with Restricted data should have SLA
    if (props.dataConfidentiality === "RESTRICTED" && !props.slaDetails) {
      // This is a warning, not blocking
      console.warn(
        "Services with Restricted data should have SLA details defined",
      );
    }

    const now = new Date();

    return new Service({
      id: crypto.randomUUID(),
      name: props.name.trim(),
      serviceType: props.serviceType,
      description: props.description?.trim() || null,
      businessPurpose: props.businessPurpose?.trim() || null,
      gitlabRepoUrl: props.gitlabRepoUrl?.trim() || null,
      dataConfidentiality: props.dataConfidentiality || "INTERNAL",
      businessImpactLevel: props.businessImpactLevel || "MEDIUM",
      criticality: props.criticality || "MEDIUM",
      isEssentialService: props.isEssentialService || false,
      deploymentDate: props.deploymentDate || null,
      currentStatus: props.currentStatus || "PRODUCTION",
      lastPatchDate: props.lastPatchDate || null,
      plannedDecommissionDate: props.plannedDecommissionDate || null,
      vendorId: props.vendorId || null,
      slaDetails: props.slaDetails || null,
      businessProcessId: props.businessProcessId || null,
      isInCentralRegister: props.isInCentralRegister ?? true,
      complianceNotes: props.complianceNotes?.trim() || null,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy || null,
      updatedBy: null,
    });
  }

  static reconstitute(props: ServiceProps): Service {
    return new Service(props);
  }

  update(
    updates: Partial<
      Omit<ServiceProps, "id" | "createdAt" | "createdBy" | "updatedAt">
    >,
    updatedBy?: string,
  ): void {
    if (updates.name !== undefined) {
      Service.validateName(updates.name);
      this.props.name = updates.name.trim();
    }

    if (updates.serviceType !== undefined) {
      Service.validateServiceType(updates.serviceType);
      this.props.serviceType = updates.serviceType;
    }

    // Business rule: Essential services must have Critical or High criticality
    const newIsEssential =
      updates.isEssentialService ?? this.props.isEssentialService;
    const newCriticality = updates.criticality ?? this.props.criticality;
    if (
      newIsEssential &&
      newCriticality !== "CRITICAL" &&
      newCriticality !== "HIGH"
    ) {
      throw new Error(
        "Essential services must have Critical or High criticality level",
      );
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined && key !== "name" && key !== "serviceType") {
        (this.props as Record<string, unknown>)[key] = value;
      }
    });

    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy || null;
  }

  retire(reason?: string): void {
    if (!this.canBeRetired()) {
      throw new Error(
        "Cannot retire service: check dependencies and active asset relationships",
      );
    }

    this.props.currentStatus = "RETIRED";
    if (reason) {
      this.props.complianceNotes = reason;
    }
    this.props.updatedAt = new Date();
  }

  canBeRetired(): boolean {
    // Business rule: Cannot retire if status is PRODUCTION and is essential service
    if (
      this.props.currentStatus === "PRODUCTION" &&
      this.props.isEssentialService
    ) {
      return false;
    }
    return true;
  }

  isActive(): boolean {
    return (
      this.props.currentStatus === "PRODUCTION" ||
      this.props.currentStatus === "UAT" ||
      this.props.currentStatus === "DR" ||
      this.props.currentStatus === "DEVELOPMENT"
    );
  }

  isRetired(): boolean {
    return this.props.currentStatus === "RETIRED";
  }

  getDaysUntilDecommission(): number | null {
    if (!this.props.plannedDecommissionDate) {
      return null;
    }

    const now = new Date();
    const decommissionDate = this.props.plannedDecommissionDate;
    const diffTime = decommissionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  isRetiringSoon(daysThreshold: number = 90): boolean {
    const daysUntilDecommission = this.getDaysUntilDecommission();
    if (daysUntilDecommission === null) {
      return false;
    }
    return daysUntilDecommission > 0 && daysUntilDecommission <= daysThreshold;
  }

  static validateName(name: string): void {
    if (!name?.trim()) {
      throw new Error("Service name is required");
    }
    if (name.trim().length < 3) {
      throw new Error("Service name must be at least 3 characters");
    }
    if (name.trim().length > 200) {
      throw new Error("Service name must not exceed 200 characters");
    }
  }

  static validateServiceType(serviceType: ServiceType): void {
    if (!serviceType) {
      throw new Error("Service type is required");
    }
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error("Service ID is required");
    }
    Service.validateName(this.props.name);
    Service.validateServiceType(this.props.serviceType);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get serviceType(): ServiceType {
    return this.props.serviceType;
  }

  get description(): string | null {
    return this.props.description;
  }

  get businessPurpose(): string | null {
    return this.props.businessPurpose;
  }

  get gitlabRepoUrl(): string | null {
    return this.props.gitlabRepoUrl;
  }

  get dataConfidentiality(): DataConfidentiality {
    return this.props.dataConfidentiality;
  }

  get businessImpactLevel(): BusinessImpactLevel {
    return this.props.businessImpactLevel;
  }

  get criticality(): CriticalityLevel {
    return this.props.criticality;
  }

  get isEssentialService(): boolean {
    return this.props.isEssentialService;
  }

  get deploymentDate(): Date | null {
    return this.props.deploymentDate;
  }

  get currentStatus(): ServiceStatus {
    return this.props.currentStatus;
  }

  get lastPatchDate(): Date | null {
    return this.props.lastPatchDate;
  }

  get plannedDecommissionDate(): Date | null {
    return this.props.plannedDecommissionDate;
  }

  get vendorId(): string | null {
    return this.props.vendorId;
  }

  get slaDetails(): Record<string, unknown> | null {
    return this.props.slaDetails;
  }

  get businessProcessId(): string | null {
    return this.props.businessProcessId;
  }

  get isInCentralRegister(): boolean {
    return this.props.isInCentralRegister;
  }

  get complianceNotes(): string | null {
    return this.props.complianceNotes;
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

  get createdBy(): string | null {
    return this.props.createdBy;
  }

  get updatedBy(): string | null {
    return this.props.updatedBy;
  }

  toObject(): ServiceProps {
    return { ...this.props };
  }
}
