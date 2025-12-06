/**
 * CI Class Field DTOs
 */

import { z } from "zod";

// Create CI Class Field DTO
export const CreateCIClassFieldSchema = z.object({
  ciClassId: z.string().min(24).max(25),
  fieldDefinitionId: z.string().min(24).max(25),
  isRequired: z.boolean().optional().default(false),
  isUnique: z.boolean().optional().default(false),
  isVisible: z.boolean().optional().default(true),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional()
    .default(0),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

// Update CI Class Field DTO
export const UpdateCIClassFieldSchema = z.object({
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  defaultValue: z.record(z.string(), z.unknown()).optional().nullable(),
  uiOrder: z
    .number()
    .int("UI order must be an integer")
    .nonnegative("UI order must be non-negative")
    .optional(),
  note: z
    .string()
    .max(5000, "Note must be 5000 characters or less")
    .optional()
    .nullable(),
});

// Type exports
export type CreateCIClassFieldDTO = z.infer<typeof CreateCIClassFieldSchema>;
export type UpdateCIClassFieldDTO = z.infer<typeof UpdateCIClassFieldSchema>;
