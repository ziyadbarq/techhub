/**
 * Person DTOs
 * Zod schemas for validating Person inputs
 */

import { z } from "zod";

export const CreatePersonSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less"),
  middleName: z
    .string()
    .max(100, "Middle name must be 100 characters or less")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less"),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  mobile: z
    .string()
    .max(50, "Mobile must be 50 characters or less")
    .optional()
    .nullable(),
  employeeId: z
    .string()
    .max(50, "Employee ID must be 50 characters or less")
    .optional()
    .nullable(),
  organizationUnitId: z.string().min(1, "Organization unit is required"),
  locationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  title: z
    .string()
    .max(100, "Title must be 100 characters or less")
    .optional()
    .nullable(),
  department: z
    .string()
    .max(100, "Department must be 100 characters or less")
    .optional()
    .nullable(),
  hireDate: z.coerce.date().optional().nullable(),
  terminationDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreatePersonDTO = z.infer<typeof CreatePersonSchema>;

export const UpdatePersonSchema = z.object({
  id: z.string().min(1, "ID is required"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less")
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less")
    .optional(),
  middleName: z
    .string()
    .max(100, "Middle name must be 100 characters or less")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less")
    .optional(),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  mobile: z
    .string()
    .max(50, "Mobile must be 50 characters or less")
    .optional()
    .nullable(),
  employeeId: z
    .string()
    .max(50, "Employee ID must be 50 characters or less")
    .optional()
    .nullable(),
  organizationUnitId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  title: z
    .string()
    .max(100, "Title must be 100 characters or less")
    .optional()
    .nullable(),
  department: z
    .string()
    .max(100, "Department must be 100 characters or less")
    .optional()
    .nullable(),
  hireDate: z.coerce.date().optional().nullable(),
  terminationDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type UpdatePersonDTO = z.infer<typeof UpdatePersonSchema>;

export const PersonIdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type PersonIdDTO = z.infer<typeof PersonIdSchema>;
