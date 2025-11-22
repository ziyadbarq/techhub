/**
 * Service Presenters
 *
 * Transforms domain entities to presentation DTOs with computed fields
 */

import type { Service } from "@/core/domain/entities/service.entity";
import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import type { BusinessProcess } from "@/core/domain/entities/business-process.entity";
import type {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
  OwnershipType,
  ServiceLocation,
  AssetRelationship,
} from "@/generated/prisma";

// ==================== Service DTOs ====================

export interface ServiceDTO {
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

  // Computed fields
  isActive: boolean;
  isRetired: boolean;
  daysUntilDecommission: number | null;
  isRetiringSoon: boolean;

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

    // Computed fields
    isActive: service.isActive(),
    isRetired: service.isRetired(),
    daysUntilDecommission: service.getDaysUntilDecommission(),
    isRetiringSoon: service.isRetiringSoon(90),

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
