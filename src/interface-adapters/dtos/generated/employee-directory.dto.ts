/**
 * Employee Directory DTOs
 * Zod schemas for employee directory filtering and validation
 */

import { z } from "zod";

/**
 * Schema for filtering employees in the directory
 */
export const EmployeeDirectoryFilterSchema = z.object({
  search: z.string().optional(),
  orgUnitIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isExcluded: z.boolean().optional(),
  hasManager: z.boolean().optional(),
  managerId: z.string().optional(),
});

export type EmployeeDirectoryFilterDTO = z.infer<
  typeof EmployeeDirectoryFilterSchema
>;

/**
 * Schema for getting org hierarchy
 */
export const GetOrgHierarchySchema = z.object({
  rootPersonId: z.string().optional(),
  maxDepth: z.number().min(1).max(10).optional().default(10),
  includeInactive: z.boolean().optional().default(false),
});

export type GetOrgHierarchyDTO = z.infer<typeof GetOrgHierarchySchema>;

/**
 * Schema for getting reporting chain
 */
export const GetReportingChainSchema = z.object({
  personId: z.string().min(1, "Person ID is required"),
});

export type GetReportingChainDTO = z.infer<typeof GetReportingChainSchema>;

/**
 * Schema for filter options response
 */
export const DirectoryFilterOptionsSchema = z.object({
  departments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string().nullable(),
    }),
  ),
  locations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      city: z.string().nullable(),
    }),
  ),
});

export type DirectoryFilterOptionsDTO = z.infer<
  typeof DirectoryFilterOptionsSchema
>;
