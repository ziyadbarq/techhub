/**
 * Service Management DTOs
 *
 * Zod schemas and type inferences for Service Management System
 */

import { z } from "zod";
import {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
  OwnershipType,
  ServiceLocation,
  AssetRelationship,
} from "@/generated/prisma/enums";

// ==================== Service DTOs ====================

export const CreateServiceSchema = z.object({
  name: z
    .string()
    .min(3, "Service name must be at least 3 characters")
    .max(200, "Service name must not exceed 200 characters"),
  serviceType: z.nativeEnum(ServiceType),
  description: z.string().nullish(),
  businessPurpose: z.string().nullish(),
  gitlabRepoUrl: z.string().url("Invalid GitLab repository URL").nullish(),
  url: z.string().url("Invalid service URL").nullish(),
  supportContact: z.string().max(200).nullish(),
  supportHours: z.string().max(100).nullish(),
  dataConfidentiality: z.nativeEnum(DataConfidentiality).default("INTERNAL"),
  businessImpactLevel: z.nativeEnum(BusinessImpactLevel).default("MEDIUM"),
  criticality: z.nativeEnum(CriticalityLevel).default("MEDIUM"),
  isEssentialService: z.boolean().default(false),
  deploymentDate: z.coerce.date().nullish(),
  currentStatus: z.nativeEnum(ServiceStatus).default("PRODUCTION"),
  lastPatchDate: z.coerce.date().nullish(),
  plannedDecommissionDate: z.coerce.date().nullish(),
  vendorId: z.string().min(24).max(25).nullish(),
  slaDetails: z.record(z.string(), z.unknown()).nullish(),
  businessProcessId: z.string().min(24).max(25).nullish(),
  isInCentralRegister: z.boolean().default(true),
  complianceNotes: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),

  // SLA Fields (optional for create/update)
  slaResponseTimeP50: z.number().int().positive().nullish(),
  slaResponseTimeP95: z.number().int().positive().nullish(),
  slaResponseTimeP99: z.number().int().positive().nullish(),
  slaResolutionTimeCritical: z.number().int().positive().nullish(),
  slaResolutionTimeHigh: z.number().int().positive().nullish(),
  slaResolutionTimeMedium: z.number().int().positive().nullish(),
  slaUptimePercentage: z.number().min(0).max(100).nullish(),
  slaErrorRateThreshold: z.number().min(0).max(100).nullish(),
  slaSupportTier: z.string().max(100).nullish(),
  slaContactEmail: z.string().email("Invalid email").nullish(),
  slaEscalationPath: z.string().nullish(),

  // Health Monitoring Fields (optional for create/update)
  healthCheckUrl: z.string().url("Invalid URL").nullish(),
  healthCheckInterval: z.number().int().positive().max(1440).nullish(), // Max 24 hours
  healthCheckTimeout: z.number().int().positive().max(300).nullish(), // Max 5 minutes
  healthCheckEnabled: z.boolean().default(false),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceDTO = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDTO = z.infer<typeof UpdateServiceSchema>;

// ==================== Service Ownership DTOs ====================

export const AddServiceOwnerSchema = z.object({
  serviceId: z.string().min(24).max(25),
  personId: z.string().min(24).max(25),
  ownershipType: z.nativeEnum(OwnershipType),
  isPrimary: z.boolean().default(false),
});

export const RemoveServiceOwnerSchema = z.object({
  serviceId: z.string().min(24).max(25),
  personId: z.string().min(24).max(25),
  ownershipType: z.nativeEnum(OwnershipType),
});

export const SetPrimaryOwnerSchema = z.object({
  serviceId: z.string().min(24).max(25),
  personId: z.string().min(24).max(25),
  ownershipType: z.nativeEnum(OwnershipType),
});

export type AddServiceOwnerDTO = z.infer<typeof AddServiceOwnerSchema>;
export type RemoveServiceOwnerDTO = z.infer<typeof RemoveServiceOwnerSchema>;
export type SetPrimaryOwnerDTO = z.infer<typeof SetPrimaryOwnerSchema>;

// ==================== Business Process DTOs ====================

export const CreateBusinessProcessSchema = z.object({
  code: z
    .string()
    .min(2, "Business process code must be at least 2 characters")
    .max(100, "Business process code must not exceed 100 characters")
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Business process code must be uppercase letters, numbers, and underscores",
    ),
  name: z
    .string()
    .min(2, "Business process name must be at least 2 characters")
    .max(200, "Business process name must not exceed 200 characters"),
  description: z.string().nullish(),
  category: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export const UpdateBusinessProcessSchema = z.object({
  code: z
    .string()
    .min(2, "Business process code must be at least 2 characters")
    .max(100, "Business process code must not exceed 100 characters")
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      "Business process code must be uppercase letters, numbers, and underscores",
    )
    .optional(),
  name: z
    .string()
    .min(2, "Business process name must be at least 2 characters")
    .max(200, "Business process name must not exceed 200 characters")
    .optional(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export type CreateBusinessProcessDTO = z.infer<
  typeof CreateBusinessProcessSchema
>;
export type UpdateBusinessProcessDTO = z.infer<
  typeof UpdateBusinessProcessSchema
>;

// ==================== Service Infrastructure DTOs ====================

export const CreateServiceInfrastructureSchema = z.object({
  serviceId: z.string().min(24).max(25),
  location: z.nativeEnum(ServiceLocation),
  cloudProvider: z.string().nullish(),
  compartment: z.string().nullish(),
  project: z.string().nullish(),
  region: z.string().nullish(),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IPv4 address")
    .nullish(),
  hostname: z
    .string()
    .max(253, "Hostname must not exceed 253 characters")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      "Invalid hostname format (must contain only letters, numbers, dots, and hyphens)",
    )
    .nullish(),
  backupEnabled: z.boolean().default(false),
  backupSchedule: z.string().nullish(),
  lastBackupDate: z.coerce.date().nullish(),
  cloudProviderDetails: z.record(z.string(), z.unknown()).nullish(),
});

export const UpdateServiceInfrastructureSchema = z.object({
  location: z.nativeEnum(ServiceLocation).optional(),
  cloudProvider: z.string().nullish(),
  compartment: z.string().nullish(),
  project: z.string().nullish(),
  region: z.string().nullish(),
  ipAddress: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/, "Invalid IPv4 address")
    .nullish(),
  hostname: z
    .string()
    .max(253, "Hostname must not exceed 253 characters")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      "Invalid hostname format (must contain only letters, numbers, dots, and hyphens)",
    )
    .nullish(),
  backupEnabled: z.boolean().optional(),
  backupSchedule: z.string().nullish(),
  lastBackupDate: z.coerce.date().nullish(),
  cloudProviderDetails: z.record(z.string(), z.unknown()).nullish(),
});

export type CreateServiceInfrastructureDTO = z.infer<
  typeof CreateServiceInfrastructureSchema
>;
export type UpdateServiceInfrastructureDTO = z.infer<
  typeof UpdateServiceInfrastructureSchema
>;

// ==================== Service Asset Linking DTOs ====================

export const LinkServiceToAssetSchema = z.object({
  serviceId: z.string().min(24).max(25),
  assetId: z.string().min(24).max(25).nullish(),
  relationship: z.nativeEnum(AssetRelationship),
  description: z.string().nullish(),
});

export type LinkServiceToAssetDTO = z.infer<typeof LinkServiceToAssetSchema>;

// ==================== Search and Filter DTOs ====================

export const SearchServicesSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  serviceType: z.nativeEnum(ServiceType).optional(),
  currentStatus: z.nativeEnum(ServiceStatus).optional(),
  criticality: z.nativeEnum(CriticalityLevel).optional(),
  isEssentialService: z.boolean().optional(),
  vendorId: z.string().min(24).max(25).optional(),
  businessProcessId: z.string().min(24).max(25).optional(),
});

export type SearchServicesDTO = z.infer<typeof SearchServicesSchema>;

export const ListServicesSchema = z.object({
  serviceType: z.nativeEnum(ServiceType).optional(),
  currentStatus: z.nativeEnum(ServiceStatus).optional(),
  criticality: z.nativeEnum(CriticalityLevel).optional(),
  isEssentialService: z.boolean().optional(),
  vendorId: z.string().min(24).max(25).optional(),
  businessProcessId: z.string().min(24).max(25).optional(),
});

export type ListServicesDTO = z.infer<typeof ListServicesSchema>;
