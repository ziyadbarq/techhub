/**
 * Contract DTOs
 */

import { z } from "zod";

// Create Contract DTO
export const CreateContractSchema = z.object({
  contractTypeId: z.string().uuid("Invalid contract type ID"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  name: z
    .string()
    .trim()
    .min(1, "Contract name is required")
    .max(255, "Contract name must not exceed 255 characters"),
  contractNumber: z
    .string()
    .trim()
    .max(100, "Contract number must not exceed 100 characters")
    .optional()
    .nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  autoRenew: z.boolean().optional().default(false),
  renewalTerms: z
    .string()
    .trim()
    .max(2000, "Renewal terms must not exceed 2000 characters")
    .optional()
    .nullable(),
  slaDefinition: z.record(z.string(), z.unknown()).optional().nullable(),
  totalValue: z
    .number()
    .nonnegative("Total value must be non-negative")
    .finite("Total value must be a valid number")
    .optional()
    .nullable(),
  currency: z
    .string()
    .trim()
    .max(3, "Currency code must not exceed 3 characters")
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Update Contract DTO
export const UpdateContractSchema = z.object({
  contractTypeId: z.string().uuid("Invalid contract type ID").optional(),
  vendorId: z.string().uuid("Invalid vendor ID").optional(),
  name: z
    .string()
    .trim()
    .min(1, "Contract name is required")
    .max(255, "Contract name must not exceed 255 characters")
    .optional(),
  contractNumber: z
    .string()
    .trim()
    .max(100, "Contract number must not exceed 100 characters")
    .optional()
    .nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  autoRenew: z.boolean().optional(),
  renewalTerms: z
    .string()
    .trim()
    .max(2000, "Renewal terms must not exceed 2000 characters")
    .optional()
    .nullable(),
  slaDefinition: z.record(z.string(), z.unknown()).optional().nullable(),
  totalValue: z
    .number()
    .nonnegative("Total value must be non-negative")
    .finite("Total value must be a valid number")
    .optional()
    .nullable(),
  currency: z
    .string()
    .trim()
    .max(3, "Currency code must not exceed 3 characters")
    .optional()
    .nullable(),
  note: z
    .string()
    .trim()
    .max(2000, "Note must not exceed 2000 characters")
    .optional()
    .nullable(),
});

// Type exports
export type CreateContractDTO = z.infer<typeof CreateContractSchema>;
export type UpdateContractDTO = z.infer<typeof UpdateContractSchema>;
