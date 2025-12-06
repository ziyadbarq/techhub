/**
 * LicenseEntitlementAddon DTOs
 */

import { z } from "zod";

// Attach Schema (create attachment)
export const AttachAddonToEntitlementSchema = z.object({
  licenseEntitlementId: z.string().min(24).max(25),
  licenseAddonId: z.string().min(24).max(25),
  cost: z.number().nonnegative("Cost cannot be negative").optional().nullable(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .optional()
    .nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type AttachAddonToEntitlementDTO = z.infer<
  typeof AttachAddonToEntitlementSchema
>;

// Update Schema
export const UpdateEntitlementAddonSchema = z.object({
  id: z.string().min(24).max(25),
  cost: z.number().nonnegative("Cost cannot be negative").optional().nullable(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .optional()
    .nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type UpdateEntitlementAddonDTO = z.infer<
  typeof UpdateEntitlementAddonSchema
>;

// Response DTO
export interface LicenseEntitlementAddonDTO {
  id: string;
  licenseEntitlementId: string;
  licenseAddonId: string;
  cost: number | null;
  currency: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Cost aggregation DTO for reporting
export interface CostAggregationDTO {
  currency: string;
  total: number;
}

// Full cost breakdown DTO
export interface EntitlementCostBreakdownDTO {
  entitlementId: string;
  baseCost: CostAggregationDTO | null;
  addonCosts: CostAggregationDTO[];
  totalByCurrency: CostAggregationDTO[];
}
