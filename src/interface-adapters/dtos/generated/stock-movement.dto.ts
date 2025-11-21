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
});

export const StockMovementIdSchema = z.object({
  id: z.string().min(1, "Stock movement ID is required"),
});

export const ListStockMovementsSchema = z.object({
  assetId: z.string().optional(),
  stockLocationId: z.string().optional(),
  performedById: z.string().optional(),
  movementType: StockMovementTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type CreateStockMovementDTO = z.infer<typeof CreateStockMovementSchema>;
export type StockMovementIdDTO = z.infer<typeof StockMovementIdSchema>;
export type ListStockMovementsDTO = z.infer<typeof ListStockMovementsSchema>;
export type StockMovementTypeDTO = z.infer<typeof StockMovementTypeSchema>;
