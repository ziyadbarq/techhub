/**
 * StockLocation DTOs
 */

import { z } from "zod";

export const CreateStockLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]*$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  locationId: z.string().optional().nullable(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
});

export const UpdateStockLocationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/i,
      "Code must contain only letters, numbers, hyphens, and underscores",
    )
    .optional(),
  locationId: z.string().optional().nullable(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
});

export const StockLocationIdSchema = z.object({
  id: z.string().min(1, "Stock location ID is required"),
});

// Type exports
export type CreateStockLocationDTO = z.infer<typeof CreateStockLocationSchema>;
export type UpdateStockLocationDTO = z.infer<typeof UpdateStockLocationSchema>;
export type StockLocationIdDTO = z.infer<typeof StockLocationIdSchema>;
