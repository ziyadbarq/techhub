/**
 * Organization Unit DTOs
 * Zod schemas for validating Organization Unit inputs
 */

import { z } from "zod";
import { OrganizationUnitType } from "@/core/domain/value-objects/foundation-enums";

export const CreateOrganizationUnitSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50, "Code must be 50 characters or less")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, hyphens, and underscores",
    ),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .nullable(),
  unitType: z.nativeEnum(OrganizationUnitType),
  level: z.number().int().min(0).optional().default(0),
  parentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  costCenter: z
    .string()
    .max(50, "Cost center must be 50 characters or less")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type CreateOrganizationUnitDTO = z.infer<
  typeof CreateOrganizationUnitSchema
>;

export const UpdateOrganizationUnitSchema = z.object({
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
  unitType: z.nativeEnum(OrganizationUnitType).optional(),
  parentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  costCenter: z
    .string()
    .max(50, "Cost center must be 50 characters or less")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

export type UpdateOrganizationUnitDTO = z.infer<
  typeof UpdateOrganizationUnitSchema
>;

export const OrganizationUnitIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type OrganizationUnitIdDTO = z.infer<typeof OrganizationUnitIdSchema>;
