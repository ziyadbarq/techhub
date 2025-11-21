/**
 * Warranty DTOs
 */

import { z } from "zod";
import { WarrantyCoverageType } from "@/generated/prisma/enums";

// Helper schema for date coercion
const dateSchema = z.coerce.date();

// Coverage type enum validation
const coverageTypeSchema = z.nativeEnum(WarrantyCoverageType);

export const CreateWarrantySchema = z
  .object({
    assetId: z.string().min(1, "Asset ID is required"),
    vendorId: z.string().optional().nullable(),
    coverageType: coverageTypeSchema.optional(),
    coverageDetails: z
      .string()
      .max(5000, "Coverage details must be 5000 characters or less")
      .optional()
      .nullable(),
    policyReference: z
      .string()
      .max(200, "Policy reference must be 200 characters or less")
      .optional()
      .nullable(),
    slaDetails: z.record(z.string(), z.unknown()).optional().nullable(),
    startDate: dateSchema,
    endDate: dateSchema,
    cost: z
      .number()
      .min(0, "Warranty cost cannot be negative")
      .max(9999999999.99, "Warranty cost cannot exceed 9999999999.99")
      .optional()
      .nullable(),
    currency: z
      .string()
      .length(3, "Currency must be a 3-letter ISO code")
      .regex(
        /^[A-Z]{3}$/,
        "Currency must be 3 uppercase letters (e.g., USD, EUR)",
      )
      .optional()
      .nullable(),
    note: z
      .string()
      .max(5000, "Note must be 5000 characters or less")
      .optional()
      .nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine(
    (data) => {
      return data.endDate > data.startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const UpdateWarrantySchema = z.object({
  vendorId: z.string().optional().nullable(),
  coverageType: coverageTypeSchema.optional(),
  coverageDetails: z
    .string()
    .max(5000, "Coverage details must be 5000 characters or less")
    .optional()
    .nullable(),
  policyReference: z
    .string()
    .max(200, "Policy reference must be 200 characters or less")
    .optional()
    .nullable(),
  slaDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  cost: z
    .number()
    .min(0, "Warranty cost cannot be negative")
    .max(9999999999.99, "Warranty cost cannot exceed 9999999999.99")
    .optional()
    .nullable(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .regex(
      /^[A-Z]{3}$/,
      "Currency must be 3 uppercase letters (e.g., USD, EUR)",
    )
    .optional()
    .nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const WarrantyFilterSchema = z.object({
  assetId: z.string().optional(),
  vendorId: z.string().optional(),
  coverageType: coverageTypeSchema.optional(),
  status: z.enum(["active", "expired", "future", "expiring_soon"]).optional(),
  expiringInDays: z.number().min(1).max(365).optional(),
  searchTerm: z.string().optional(),
  startDateFrom: dateSchema.optional(),
  startDateTo: dateSchema.optional(),
  endDateFrom: dateSchema.optional(),
  endDateTo: dateSchema.optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Type exports
export type CreateWarrantyDTO = z.infer<typeof CreateWarrantySchema>;
export type UpdateWarrantyDTO = z.infer<typeof UpdateWarrantySchema>;
export type WarrantyFilterDTO = z.infer<typeof WarrantyFilterSchema>;
