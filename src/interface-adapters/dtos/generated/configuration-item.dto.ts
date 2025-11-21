import { z } from "zod";

const _dateSchema = z.coerce.date().optional().nullable();

export const CreateConfigurationItemSchema = z.object({
  name: z.string().min(2).max(255),
  ciClassId: z.string().min(1, "CI class is required"),
  lifecycleStateId: z.string().optional().nullable(),
  criticality: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .nullable(),
  environment: z
    .enum(["PROD", "UAT", "DEV", "DR", "TEST", "OTHER"])
    .optional()
    .nullable(),
  primaryOwnerPersonId: z.string().optional().nullable(),
  primaryOwnerOrgUnitId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  linkedAssetId: z.string().optional().nullable(),
  ciKey: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional()
    .nullable(),
  description: z.string().max(2000).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const UpdateConfigurationItemSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  lifecycleStateId: z.string().optional().nullable(),
  criticality: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .nullable(),
  environment: z
    .enum(["PROD", "UAT", "DEV", "DR", "TEST", "OTHER"])
    .optional()
    .nullable(),
  primaryOwnerPersonId: z.string().optional().nullable(),
  primaryOwnerOrgUnitId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  linkedAssetId: z.string().optional().nullable(),
  ciKey: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional()
    .nullable(),
  description: z.string().max(2000).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateConfigurationItemDTO = z.infer<
  typeof CreateConfigurationItemSchema
>;
export type UpdateConfigurationItemDTO = z.infer<
  typeof UpdateConfigurationItemSchema
>;

export interface ConfigurationItemDTO {
  id: string;
  name: string;
  ciClassId: string;
  lifecycleStateId: string | null;
  criticality: string | null;
  environment: string | null;
  primaryOwnerPersonId: string | null;
  primaryOwnerOrgUnitId: string | null;
  locationId: string | null;
  linkedAssetId: string | null;
  ciKey: string | null;
  description: string | null;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  // Enrichment fields
  ciClassName?: string;
  lifecycleStateName?: string;
  primaryOwnerName?: string;
  locationName?: string;
  linkedAssetTag?: string;
}
