/**
 * StockMovement DTOs
 */

import { z } from "zod";

export const StockMovementTypeSchema = z.enum([
  "IN",
  "OUT",
  "TRANSFER",
  "ADJUSTMENT",
]);

export const StockMovementStatusSchema = z.enum(["ACTIVE", "VOIDED"]);

export const StockMovementSourceSchema = z.enum([
  "MANUAL",
  "ASSIGNMENT",
  "RETURN",
  "DISPOSAL",
  "IMPORT",
  "LOCATION_CHANGE",
  "SYSTEM",
]);

export const CreateStockMovementSchema = z.object({
  movementType: StockMovementTypeSchema,
  stockLocationFromId: z.string().optional().nullable(),
  stockLocationToId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  reason: z
    .string()
    .max(5000, "Reason must be 5000 characters or less")
    .optional()
    .nullable(),
  performedById: z.string().min(1, "Performed by is required"),
  occurredAt: z.coerce.date().optional(),
  // Source tracking (optional, defaults to MANUAL)
  source: StockMovementSourceSchema.optional(),
  sourceReferenceType: z.string().optional().nullable(),
  sourceReferenceId: z.string().optional().nullable(),
});

export const StockMovementIdSchema = z.object({
  id: z.string().min(1, "Stock movement ID is required"),
});

export const VoidStockMovementSchema = z.object({
  id: z.string().min(1, "Stock movement ID is required"),
  voidedById: z.string().min(1, "Voided by ID is required"),
  voidReason: z
    .string()
    .min(1, "Void reason is required")
    .max(5000, "Void reason must be 5000 characters or less"),
});

export const ListStockMovementsSchema = z.object({
  assetId: z.string().optional(),
  stockLocationId: z.string().optional(),
  performedById: z.string().optional(),
  movementType: StockMovementTypeSchema.optional(),
  status: StockMovementStatusSchema.optional(),
  includeVoided: z.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type CreateStockMovementDTO = z.infer<typeof CreateStockMovementSchema>;
export type StockMovementIdDTO = z.infer<typeof StockMovementIdSchema>;
export type VoidStockMovementDTO = z.infer<typeof VoidStockMovementSchema>;
export type ListStockMovementsDTO = z.infer<typeof ListStockMovementsSchema>;
export type StockMovementTypeDTO = z.infer<typeof StockMovementTypeSchema>;
export type StockMovementStatusDTO = z.infer<typeof StockMovementStatusSchema>;
export type StockMovementSourceDTO = z.infer<typeof StockMovementSourceSchema>;
