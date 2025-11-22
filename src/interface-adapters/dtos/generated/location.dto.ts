/**
 * Location DTOs
 * Zod schemas for validating Location inputs
 */

import { z } from "zod";
import { LocationType } from "@/core/domain/value-objects/foundation-enums";
import { coordinateField } from "../validation-helpers";

export const CreateLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  locationType: z.nativeEnum(LocationType),
  parentId: z.string().optional().nullable(),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .nullable(),
  latitude: coordinateField("Latitude", -90, 90),
  longitude: coordinateField("Longitude", -180, 180),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateLocationDTO = z.infer<typeof CreateLocationSchema>;

export const UpdateLocationSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less")
    .optional(),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  locationType: z.nativeEnum(LocationType).optional(),
  parentId: z.string().optional().nullable(),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .nullable(),
  latitude: coordinateField("Latitude", -90, 90),
  longitude: coordinateField("Longitude", -180, 180),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdateLocationDTO = z.infer<typeof UpdateLocationSchema>;

export const LocationIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type LocationIdDTO = z.infer<typeof LocationIdSchema>;
