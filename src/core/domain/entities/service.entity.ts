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
  ServiceHealthStatus,
  SlaComplianceStatus,
} from "@/generated/prisma";

export interface ServiceProps {
  id: string;
  name: string;
  serviceType: ServiceType;
  description: string | null;
  businessPurpose: string | null;
  gitlabRepoUrl: string | null;
  url: string | null;
  supportContact: string | null;
  supportHours: string | null;
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

  // SLA Fields
  slaResponseTimeP50: number | null;
  slaResponseTimeP95: number | null;
  slaResponseTimeP99: number | null;
  slaResolutionTimeCritical: number | null;
  slaResolutionTimeHigh: number | null;
  slaResolutionTimeMedium: number | null;
  slaUptimePercentage: number | null;
  slaErrorRateThreshold: number | null;
  slaComplianceStatus: SlaComplianceStatus;
  lastSlaReviewDate: Date | null;
  slaViolationCount: number;
  slaSupportTier: string | null;
  slaContactEmail: string | null;
  slaEscalationPath: string | null;

  // Health Monitoring Fields
  healthStatus: ServiceHealthStatus;
  lastHealthCheck: Date | null;
  nextScheduledHealthCheck: Date | null;
  uptimePercentage24h: number | null;
  uptimePercentage7d: number | null;
  uptimePercentage30d: number | null;
  healthCheckUrl: string | null;
  healthCheckInterval: number | null;
  healthCheckTimeout: number | null;
  healthCheckEnabled: boolean;
  currentResponseTimeP50: number | null;
  currentResponseTimeP95: number | null;
  currentErrorRate: number | null;
  lastIncidentDate: Date | null;
  lastDowntimeDate: Date | null;
  lastDowntimeDuration: number | null;
  mttrMinutes: number | null;
  mtbfHours: number | null;
}

export interface CreateServiceProps {
  name: string;
  serviceType: ServiceType;
  description?: string | null;
  businessPurpose?: string | null;
  gitlabRepoUrl?: string | null;
  url?: string | null;
  supportContact?: string | null;
  supportHours?: string | null;
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
      url: props.url?.trim() || null,
      supportContact: props.supportContact?.trim() || null,
      supportHours: props.supportHours?.trim() || null,
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

      // Initialize SLA fields
      slaResponseTimeP50: null,
      slaResponseTimeP95: null,
      slaResponseTimeP99: null,
      slaResolutionTimeCritical: null,
      slaResolutionTimeHigh: null,
      slaResolutionTimeMedium: null,
      slaUptimePercentage: null,
      slaErrorRateThreshold: null,
      slaComplianceStatus: "NOT_APPLICABLE",
      lastSlaReviewDate: null,
      slaViolationCount: 0,
      slaSupportTier: null,
      slaContactEmail: null,
      slaEscalationPath: null,

      // Initialize Health Monitoring fields
      healthStatus: "UNKNOWN",
      lastHealthCheck: null,
      nextScheduledHealthCheck: null,
      uptimePercentage24h: null,
      uptimePercentage7d: null,
      uptimePercentage30d: null,
      healthCheckUrl: null,
      healthCheckInterval: null,
      healthCheckTimeout: null,
      healthCheckEnabled: false,
      currentResponseTimeP50: null,
      currentResponseTimeP95: null,
      currentErrorRate: null,
      lastIncidentDate: null,
      lastDowntimeDate: null,
      lastDowntimeDuration: null,
      mttrMinutes: null,
      mtbfHours: null,
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
        (this.props as unknown as Record<string, unknown>)[key] = value;
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

  // ============ SLA Business Logic ============

  isSlaCompliant(): boolean {
    return this.props.slaComplianceStatus === "COMPLIANT";
  }

  hasSlaTargets(): boolean {
    return (
      this.props.slaResponseTimeP50 !== null ||
      this.props.slaResponseTimeP95 !== null ||
      this.props.slaResponseTimeP99 !== null ||
      this.props.slaUptimePercentage !== null ||
      this.props.slaErrorRateThreshold !== null
    );
  }

  calculateSlaCompliance(): SlaComplianceStatus {
    if (!this.hasSlaTargets()) {
      return "NOT_APPLICABLE";
    }

    // Check response time compliance
    if (this.props.slaResponseTimeP95 && this.props.currentResponseTimeP95) {
      if (this.props.currentResponseTimeP95 > this.props.slaResponseTimeP95) {
        return "BREACHED";
      }
      // At risk if within 10% of threshold
      const threshold = this.props.slaResponseTimeP95 * 0.9;
      if (this.props.currentResponseTimeP95 > threshold) {
        return "AT_RISK";
      }
    }

    // Check error rate compliance
    if (this.props.slaErrorRateThreshold && this.props.currentErrorRate) {
      if (this.props.currentErrorRate > this.props.slaErrorRateThreshold) {
        return "BREACHED";
      }
      // At risk if within 80% of threshold
      const threshold = this.props.slaErrorRateThreshold * 0.8;
      if (this.props.currentErrorRate > threshold) {
        return "AT_RISK";
      }
    }

    // Check uptime compliance
    if (this.props.slaUptimePercentage && this.props.uptimePercentage30d) {
      if (this.props.uptimePercentage30d < this.props.slaUptimePercentage) {
        return "BREACHED";
      }
      // At risk if within 1% of threshold
      const threshold = this.props.slaUptimePercentage - 1.0;
      if (this.props.uptimePercentage30d < threshold) {
        return "AT_RISK";
      }
    }

    return "COMPLIANT";
  }

  updateSlaCompliance(): void {
    this.props.slaComplianceStatus = this.calculateSlaCompliance();
    this.props.lastSlaReviewDate = new Date();
  }

  recordSlaViolation(): void {
    this.props.slaViolationCount += 1;
    this.props.slaComplianceStatus = "BREACHED";
    this.props.lastSlaReviewDate = new Date();
  }

  // ============ Health Monitoring Business Logic ============

  isHealthy(): boolean {
    return (
      this.props.healthStatus === "HEALTHY" ||
      this.props.healthStatus === "MAINTENANCE"
    );
  }

  isUnhealthy(): boolean {
    return (
      this.props.healthStatus === "UNHEALTHY" ||
      this.props.healthStatus === "DOWN"
    );
  }

  needsHealthCheck(): boolean {
    if (!this.props.healthCheckEnabled) {
      return false;
    }
    if (!this.props.nextScheduledHealthCheck) {
      return true;
    }
    return new Date() >= this.props.nextScheduledHealthCheck;
  }

  updateHealthStatus(
    newStatus: ServiceHealthStatus,
    responseTime?: number,
  ): void {
    this.props.healthStatus = newStatus;
    this.props.lastHealthCheck = new Date();

    // Calculate next scheduled check
    if (this.props.healthCheckEnabled && this.props.healthCheckInterval) {
      const nextCheck = new Date();
      nextCheck.setMinutes(
        nextCheck.getMinutes() + this.props.healthCheckInterval,
      );
      this.props.nextScheduledHealthCheck = nextCheck;
    }

    // Update current response time if provided
    if (responseTime !== undefined) {
      this.props.currentResponseTimeP50 = responseTime;
      this.props.currentResponseTimeP95 = responseTime; // Simplified for now
    }

    // Track incidents
    if (newStatus === "DOWN" || newStatus === "UNHEALTHY") {
      this.props.lastIncidentDate = new Date();
      if (!this.props.lastDowntimeDate) {
        this.props.lastDowntimeDate = new Date();
      }
    }

    this.props.updatedAt = new Date();
  }

  calculateUptimePercentage(_periodHours: number): number {
    // This is a simplified calculation
    // In practice, this would be calculated from ServiceHealthHistory records
    if (this.isHealthy()) {
      return 99.9; // Default high uptime for healthy services
    } else if (this.props.healthStatus === "DEGRADED") {
      return 95.0;
    } else if (this.isUnhealthy()) {
      return 50.0;
    }
    return 0.0;
  }

  updateUptimeMetrics(): void {
    this.props.uptimePercentage24h = this.calculateUptimePercentage(24);
    this.props.uptimePercentage7d = this.calculateUptimePercentage(24 * 7);
    this.props.uptimePercentage30d = this.calculateUptimePercentage(24 * 30);
    this.props.updatedAt = new Date();
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

  get url(): string | null {
    return this.props.url;
  }

  get supportContact(): string | null {
    return this.props.supportContact;
  }

  get supportHours(): string | null {
    return this.props.supportHours;
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

  // SLA Fields Getters
  get slaResponseTimeP50(): number | null {
    return this.props.slaResponseTimeP50;
  }

  get slaResponseTimeP95(): number | null {
    return this.props.slaResponseTimeP95;
  }

  get slaResponseTimeP99(): number | null {
    return this.props.slaResponseTimeP99;
  }

  get slaResolutionTimeCritical(): number | null {
    return this.props.slaResolutionTimeCritical;
  }

  get slaResolutionTimeHigh(): number | null {
    return this.props.slaResolutionTimeHigh;
  }

  get slaResolutionTimeMedium(): number | null {
    return this.props.slaResolutionTimeMedium;
  }

  get slaUptimePercentage(): number | null {
    return this.props.slaUptimePercentage;
  }

  get slaErrorRateThreshold(): number | null {
    return this.props.slaErrorRateThreshold;
  }

  get slaComplianceStatus(): SlaComplianceStatus {
    return this.props.slaComplianceStatus;
  }

  get lastSlaReviewDate(): Date | null {
    return this.props.lastSlaReviewDate;
  }

  get slaViolationCount(): number {
    return this.props.slaViolationCount;
  }

  get slaSupportTier(): string | null {
    return this.props.slaSupportTier;
  }

  get slaContactEmail(): string | null {
    return this.props.slaContactEmail;
  }

  get slaEscalationPath(): string | null {
    return this.props.slaEscalationPath;
  }

  // Health Monitoring Fields Getters
  get healthStatus(): ServiceHealthStatus {
    return this.props.healthStatus;
  }

  get lastHealthCheck(): Date | null {
    return this.props.lastHealthCheck;
  }

  get nextScheduledHealthCheck(): Date | null {
    return this.props.nextScheduledHealthCheck;
  }

  get uptimePercentage24h(): number | null {
    return this.props.uptimePercentage24h;
  }

  get uptimePercentage7d(): number | null {
    return this.props.uptimePercentage7d;
  }

  get uptimePercentage30d(): number | null {
    return this.props.uptimePercentage30d;
  }

  get healthCheckUrl(): string | null {
    return this.props.healthCheckUrl;
  }

  get healthCheckInterval(): number | null {
    return this.props.healthCheckInterval;
  }

  get healthCheckTimeout(): number | null {
    return this.props.healthCheckTimeout;
  }

  get healthCheckEnabled(): boolean {
    return this.props.healthCheckEnabled;
  }

  get currentResponseTimeP50(): number | null {
    return this.props.currentResponseTimeP50;
  }

  get currentResponseTimeP95(): number | null {
    return this.props.currentResponseTimeP95;
  }

  get currentErrorRate(): number | null {
    return this.props.currentErrorRate;
  }

  get lastIncidentDate(): Date | null {
    return this.props.lastIncidentDate;
  }

  get lastDowntimeDate(): Date | null {
    return this.props.lastDowntimeDate;
  }

  get lastDowntimeDuration(): number | null {
    return this.props.lastDowntimeDuration;
  }

  get mttrMinutes(): number | null {
    return this.props.mttrMinutes;
  }

  get mtbfHours(): number | null {
    return this.props.mtbfHours;
  }

  toObject(): ServiceProps {
    return { ...this.props };
  }
}
