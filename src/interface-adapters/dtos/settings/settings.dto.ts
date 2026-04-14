/**
 * System Settings DTOs
 */

import { z } from "zod";

export const SettingResponseSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  tab: z.enum([
    "general",
    "authentication",
    "email",
    "integrations",
    "environment",
  ]),
  valueType: z.enum(["string", "number", "boolean", "enum", "secret"]),
  value: z.string().nullable(),
  isSecret: z.boolean(),
  isEditable: z.boolean(),
  requiresRestart: z.boolean(),
  enumOptions: z.array(z.string()).optional(),
  source: z.enum(["database", "env", "default", "not-set"]),
  updatedBy: z.string().nullable(),
  updatedByEmail: z.string().nullable(),
  updatedAt: z.date().nullable(),
  hasValue: z.boolean(),
  pendingRestart: z.boolean(),
});

export type SettingResponseDTO = z.infer<typeof SettingResponseSchema>;

export const UpdateSettingRequestSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().nullable(),
});

export type UpdateSettingRequestDTO = z.infer<
  typeof UpdateSettingRequestSchema
>;

export const UpdateSettingsBulkRequestSchema = z.object({
  settings: z.array(UpdateSettingRequestSchema),
});

export type UpdateSettingsBulkRequestDTO = z.infer<
  typeof UpdateSettingsBulkRequestSchema
>;

export const ListSettingsResponseSchema = z.object({
  settings: z.array(SettingResponseSchema),
  total: z.number(),
});

export type ListSettingsResponseDTO = z.infer<
  typeof ListSettingsResponseSchema
>;

export const UpdateSettingsBulkResponseSchema = z.object({
  updated: z.number(),
  errors: z.array(z.object({ key: z.string(), error: z.string() })),
});

export type UpdateSettingsBulkResponseDTO = z.infer<
  typeof UpdateSettingsBulkResponseSchema
>;
