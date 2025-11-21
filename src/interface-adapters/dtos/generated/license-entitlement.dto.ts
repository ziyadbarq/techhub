/**
 * LicenseEntitlement DTOs
 */

import { z } from "zod";

// Create Schema
export const CreateLicenseEntitlementSchema = z
  .object({
    licenseProductId: z.string().uuid("Invalid license product ID"),
    contractId: z.string().uuid("Invalid contract ID").optional().nullable(),
    purchasedQuantity: z
      .number()
      .int("Purchased quantity must be an integer")
      .positive("Purchased quantity must be greater than 0"),
    effectiveStart: z.coerce.date({ message: "Invalid effective start date" }),
    effectiveEnd: z.coerce
      .date({ message: "Invalid effective end date" })
      .optional()
      .nullable(),
    allowedScope: z.record(z.string(), z.unknown()).optional().nullable(),
    note: z
      .string()
      .max(5000, "Note must be 5000 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.effectiveEnd) {
        return data.effectiveEnd > data.effectiveStart;
      }
      return true;
    },
    {
      message: "Effective end date must be after effective start date",
      path: ["effectiveEnd"],
    },
  );

export type CreateLicenseEntitlementDTO = z.infer<
  typeof CreateLicenseEntitlementSchema
>;

// Update Schema
export const UpdateLicenseEntitlementSchema = z
  .object({
    id: z.string().uuid("Invalid entitlement ID"),
    purchasedQuantity: z
      .number()
      .int("Purchased quantity must be an integer")
      .positive("Purchased quantity must be greater than 0")
      .optional(),
    effectiveStart: z.coerce
      .date({ message: "Invalid effective start date" })
      .optional(),
    effectiveEnd: z.coerce
      .date({ message: "Invalid effective end date" })
      .optional()
      .nullable(),
    allowedScope: z.record(z.string(), z.unknown()).optional().nullable(),
    note: z
      .string()
      .max(5000, "Note must be 5000 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.effectiveStart && data.effectiveEnd) {
        return data.effectiveEnd > data.effectiveStart;
      }
      return true;
    },
    {
      message: "Effective end date must be after effective start date",
      path: ["effectiveEnd"],
    },
  );

export type UpdateLicenseEntitlementDTO = z.infer<
  typeof UpdateLicenseEntitlementSchema
>;

// Response DTO
export interface LicenseEntitlementDTO {
  id: string;
  licenseProductId: string;
  contractId: string | null;
  purchasedQuantity: number;
  effectiveStart: Date;
  effectiveEnd: Date | null;
  allowedScope: Record<string, unknown> | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  isExpired?: boolean;
}
