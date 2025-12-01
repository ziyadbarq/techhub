/**
 * Service Presenters
 *
 * Transforms domain entities to presentation DTOs with computed fields
 */

import type { Service } from "@/core/domain/entities/service.entity";
import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import type { ServiceHealthHistory } from "@/core/domain/entities/service-health-history.entity";
import type { ServiceSlaMetric } from "@/core/domain/entities/service-sla-metric.entity";
import type {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
  OwnershipType,
  ServiceLocation,
  AssetRelationship,
  ServiceHealthStatus,
  SlaComplianceStatus,
  SlaMetricType,
} from "@/generated/prisma";

// ==================== Service DTOs ====================

export interface ServiceDTO {
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
  deploymentDate: string | null;
  currentStatus: ServiceStatus;
  lastPatchDate: string | null;
  plannedDecommissionDate: string | null;
  vendorId: string | null;
  slaDetails: Record<string, unknown> | null;
  businessProcessId: string | null;
  isInCentralRegister: boolean;
  complianceNotes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
  lastSlaReviewDate: string | null;
  slaViolationCount: number;
  slaSupportTier: string | null;
  slaContactEmail: string | null;
  slaEscalationPath: string | null;

  // Health Monitoring Fields
  healthStatus: ServiceHealthStatus;
  lastHealthCheck: string | null;
  nextScheduledHealthCheck: string | null;
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
  lastIncidentDate: string | null;
  lastDowntimeDate: string | null;
  lastDowntimeDuration: number | null;
  mttrMinutes: number | null;
  mtbfHours: number | null;

  // Computed fields
  isActive: boolean;
  isRetired: boolean;
  daysUntilDecommission: number | null;
  isRetiringSoon: boolean;
  isSlaCompliant: boolean;
  hasSlaTargets: boolean;
  isHealthy: boolean;
  isUnhealthy: boolean;
  needsHealthCheck: boolean;

  // Optional enriched data
  vendorName?: string;
  businessProcessName?: string;
}

export interface ServiceOwnerDTO {
  id: string;
  serviceId: string;
  personId: string;
  ownershipType: OwnershipType;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;

  // Optional enriched data
  personName?: string;
  personEmail?: string;
}

export interface BusinessProcessDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInfrastructureDTO {
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
  lastBackupDate: string | null;
  cloudProviderDetails: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  isCloudBased: boolean;
}

export interface ServiceAssetDTO {
  id: string;
  serviceId: string;
  assetId: string | null;
  relationship: AssetRelationship;
  description: string | null;
  createdAt: string;
  updatedAt: string;

  // Optional enriched data
  assetName?: string;
  assetTag?: string;
  serviceName?: string;
}

// ==================== Service Presenter ====================

export function presentService(
  service: Service,
  enrichment?: {
    vendorName?: string;
    businessProcessName?: string;
  },
): ServiceDTO {
  return {
    id: service.id,
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    businessPurpose: service.businessPurpose,
    gitlabRepoUrl: service.gitlabRepoUrl,
    url: service.url,
    supportContact: service.supportContact,
    supportHours: service.supportHours,
    dataConfidentiality: service.dataConfidentiality,
    businessImpactLevel: service.businessImpactLevel,
    criticality: service.criticality,
    isEssentialService: service.isEssentialService,
    deploymentDate: service.deploymentDate?.toISOString() || null,
    currentStatus: service.currentStatus,
    lastPatchDate: service.lastPatchDate?.toISOString() || null,
    plannedDecommissionDate:
      service.plannedDecommissionDate?.toISOString() || null,
    vendorId: service.vendorId,
    slaDetails: service.slaDetails,
    businessProcessId: service.businessProcessId,
    isInCentralRegister: service.isInCentralRegister,
    complianceNotes: service.complianceNotes,
    metadata: service.metadata,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
    createdBy: service.createdBy,
    updatedBy: service.updatedBy,

    // SLA Fields
    slaResponseTimeP50: service.slaResponseTimeP50,
    slaResponseTimeP95: service.slaResponseTimeP95,
    slaResponseTimeP99: service.slaResponseTimeP99,
    slaResolutionTimeCritical: service.slaResolutionTimeCritical,
    slaResolutionTimeHigh: service.slaResolutionTimeHigh,
    slaResolutionTimeMedium: service.slaResolutionTimeMedium,
    slaUptimePercentage: service.slaUptimePercentage,
    slaErrorRateThreshold: service.slaErrorRateThreshold,
    slaComplianceStatus: service.slaComplianceStatus,
    lastSlaReviewDate: service.lastSlaReviewDate?.toISOString() || null,
    slaViolationCount: service.slaViolationCount,
    slaSupportTier: service.slaSupportTier,
    slaContactEmail: service.slaContactEmail,
    slaEscalationPath: service.slaEscalationPath,

    // Health Monitoring Fields
    healthStatus: service.healthStatus,
    lastHealthCheck: service.lastHealthCheck?.toISOString() || null,
    nextScheduledHealthCheck:
      service.nextScheduledHealthCheck?.toISOString() || null,
    uptimePercentage24h: service.uptimePercentage24h,
    uptimePercentage7d: service.uptimePercentage7d,
    uptimePercentage30d: service.uptimePercentage30d,
    healthCheckUrl: service.healthCheckUrl,
    healthCheckInterval: service.healthCheckInterval,
    healthCheckTimeout: service.healthCheckTimeout,
    healthCheckEnabled: service.healthCheckEnabled,
    currentResponseTimeP50: service.currentResponseTimeP50,
    currentResponseTimeP95: service.currentResponseTimeP95,
    currentErrorRate: service.currentErrorRate,
    lastIncidentDate: service.lastIncidentDate?.toISOString() || null,
    lastDowntimeDate: service.lastDowntimeDate?.toISOString() || null,
    lastDowntimeDuration: service.lastDowntimeDuration,
    mttrMinutes: service.mttrMinutes,
    mtbfHours: service.mtbfHours,

    // Computed fields
    isActive: service.isActive(),
    isRetired: service.isRetired(),
    daysUntilDecommission: service.getDaysUntilDecommission(),
    isRetiringSoon: service.isRetiringSoon(90),
    isSlaCompliant: service.isSlaCompliant(),
    hasSlaTargets: service.hasSlaTargets(),
    isHealthy: service.isHealthy(),
    isUnhealthy: service.isUnhealthy(),
    needsHealthCheck: service.needsHealthCheck(),

    // Enriched data
    vendorName: enrichment?.vendorName,
    businessProcessName: enrichment?.businessProcessName,
  };
}

export function presentServiceList(
  services: Service[],
  enrichment?: Map<
    string,
    { vendorName?: string; businessProcessName?: string }
  >,
): ServiceDTO[] {
  return services.map((service) =>
    presentService(service, enrichment?.get(service.id)),
  );
}

// ==================== Service Owner Presenter ====================

export function presentServiceOwner(
  owner: {
    id: string;
    serviceId: string;
    personId: string;
    ownershipType: OwnershipType;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  enrichment?: {
    personName?: string;
    personEmail?: string;
  },
): ServiceOwnerDTO {
  return {
    id: owner.id,
    serviceId: owner.serviceId,
    personId: owner.personId,
    ownershipType: owner.ownershipType,
    isPrimary: owner.isPrimary,
    createdAt: owner.createdAt.toISOString(),
    updatedAt: owner.updatedAt.toISOString(),

    // Enriched data
    personName: enrichment?.personName,
    personEmail: enrichment?.personEmail,
  };
}

export function presentServiceOwnerList(
  owners: Array<{
    id: string;
    serviceId: string;
    personId: string;
    ownershipType: OwnershipType;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>,
  enrichment?: Map<string, { personName?: string; personEmail?: string }>,
): ServiceOwnerDTO[] {
  return owners.map((owner) =>
    presentServiceOwner(owner, enrichment?.get(owner.personId)),
  );
}

// ==================== Business Process Presenter ====================

export function presentBusinessProcess(
  process: BusinessProcess,
): BusinessProcessDTO {
  return {
    id: process.id,
    code: process.code,
    name: process.name,
    description: process.description,
    category: process.category,
    metadata: process.metadata,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
  };
}

export function presentBusinessProcessList(
  processes: BusinessProcess[],
): BusinessProcessDTO[] {
  return processes.map((process) => presentBusinessProcess(process));
}

// ==================== Service Infrastructure Presenter ====================

export function presentServiceInfrastructure(
  infrastructure: ServiceInfrastructure,
): ServiceInfrastructureDTO {
  return {
    id: infrastructure.id,
    serviceId: infrastructure.serviceId,
    location: infrastructure.location,
    cloudProvider: infrastructure.cloudProvider,
    compartment: infrastructure.compartment,
    project: infrastructure.project,
    region: infrastructure.region,
    ipAddress: infrastructure.ipAddress,
    hostname: infrastructure.hostname,
    backupEnabled: infrastructure.backupEnabled,
    backupSchedule: infrastructure.backupSchedule,
    lastBackupDate: infrastructure.lastBackupDate?.toISOString() || null,
    cloudProviderDetails: infrastructure.cloudProviderDetails,
    createdAt: infrastructure.createdAt.toISOString(),
    updatedAt: infrastructure.updatedAt.toISOString(),

    // Computed fields
    isCloudBased: infrastructure.isCloudBased(),
  };
}

export function presentServiceInfrastructureList(
  infrastructures: ServiceInfrastructure[],
): ServiceInfrastructureDTO[] {
  return infrastructures.map((infrastructure) =>
    presentServiceInfrastructure(infrastructure),
  );
}

// ==================== Service Asset Presenter ====================

export function presentServiceAsset(
  serviceAsset: {
    id: string;
    serviceId: string;
    assetId: string | null;
    relationship: AssetRelationship;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  enrichment?: {
    assetName?: string;
    assetTag?: string;
    serviceName?: string;
  },
): ServiceAssetDTO {
  return {
    id: serviceAsset.id,
    serviceId: serviceAsset.serviceId,
    assetId: serviceAsset.assetId,
    relationship: serviceAsset.relationship,
    description: serviceAsset.description,
    createdAt: serviceAsset.createdAt.toISOString(),
    updatedAt: serviceAsset.updatedAt.toISOString(),

    // Enriched data
    assetName: enrichment?.assetName,
    assetTag: enrichment?.assetTag,
    serviceName: enrichment?.serviceName,
  };
}

export function presentServiceAssetList(
  serviceAssets: Array<{
    id: string;
    serviceId: string;
    assetId: string | null;
    relationship: AssetRelationship;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
  enrichment?: Map<
    string,
    { assetName?: string; assetTag?: string; serviceName?: string }
  >,
): ServiceAssetDTO[] {
  return serviceAssets.map((serviceAsset) =>
    presentServiceAsset(serviceAsset, enrichment?.get(serviceAsset.id)),
  );
}

// ==================== Service Health History Presenter ====================

export interface ServiceHealthHistoryDTO {
  id: string;
  serviceId: string;
  previousStatus: ServiceHealthStatus;
  newStatus: ServiceHealthStatus;
  checkTimestamp: string;
  responseTime: number | null;
  errorMessage: string | null;
  statusCode: number | null;
  checkDuration: number | null;
  triggeredBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;

  // Computed fields
  isStatusChange: boolean;
  isImprovement: boolean;
  isDegradation: boolean;
  hasError: boolean;
  isSlowResponse: boolean;
}

export function presentServiceHealthHistory(
  history: ServiceHealthHistory,
): ServiceHealthHistoryDTO {
  return {
    id: history.id,
    serviceId: history.serviceId,
    previousStatus: history.previousStatus,
    newStatus: history.newStatus,
    checkTimestamp: history.checkTimestamp.toISOString(),
    responseTime: history.responseTime,
    errorMessage: history.errorMessage,
    statusCode: history.statusCode,
    checkDuration: history.checkDuration,
    triggeredBy: history.triggeredBy,
    metadata: history.metadata,
    createdAt: history.createdAt.toISOString(),

    // Computed fields
    isStatusChange: history.isStatusChange(),
    isImprovement: history.isImprovement(),
    isDegradation: history.isDegradation(),
    hasError: history.hasError(),
    isSlowResponse: history.isSlowResponse(1000),
  };
}

export function presentServiceHealthHistoryList(
  histories: ServiceHealthHistory[],
): ServiceHealthHistoryDTO[] {
  return histories.map((history) => presentServiceHealthHistory(history));
}

// ==================== Service SLA Metric Presenter ====================

export interface ServiceSlaMetricDTO {
  id: string;
  serviceId: string;
  metricType: SlaMetricType;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  actualValue: number;
  complianceStatus: SlaComplianceStatus;
  breachDuration: number | null;
  incidentCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Computed fields
  isBreached: boolean;
  isCompliant: boolean;
  isAtRisk: boolean;
  hasBreachDuration: boolean;
  hasIncidents: boolean;
  breachPercentage: number;
  compliancePercentage: number;
  periodDurationHours: number;
  periodDurationDays: number;
  isCurrentPeriod: boolean;
  isPastPeriod: boolean;
}

export function presentServiceSlaMetric(
  metric: ServiceSlaMetric,
): ServiceSlaMetricDTO {
  return {
    id: metric.id,
    serviceId: metric.serviceId,
    metricType: metric.metricType,
    periodStart: metric.periodStart.toISOString(),
    periodEnd: metric.periodEnd.toISOString(),
    targetValue: metric.targetValue,
    actualValue: metric.actualValue,
    complianceStatus: metric.complianceStatus,
    breachDuration: metric.breachDuration,
    incidentCount: metric.incidentCount,
    notes: metric.notes,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString(),

    // Computed fields
    isBreached: metric.isBreached(),
    isCompliant: metric.isCompliant(),
    isAtRisk: metric.isAtRisk(),
    hasBreachDuration: metric.hasBreachDuration(),
    hasIncidents: metric.hasIncidents(),
    breachPercentage: metric.getBreachPercentage(),
    compliancePercentage: metric.getCompliancePercentage(),
    periodDurationHours: metric.getPeriodDurationHours(),
    periodDurationDays: metric.getPeriodDurationDays(),
    isCurrentPeriod: metric.isCurrentPeriod(),
    isPastPeriod: metric.isPastPeriod(),
  };
}

export function presentServiceSlaMetricList(
  metrics: ServiceSlaMetric[],
): ServiceSlaMetricDTO[] {
  return metrics.map((metric) => presentServiceSlaMetric(metric));
}
