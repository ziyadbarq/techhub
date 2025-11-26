/**
 * Microsoft Graph User Schema
 *
 * Zod validation schemas for Microsoft Graph API user responses.
 * These schemas validate data received from the Graph API and provide
 * type-safe transformation to Person entity format.
 *
 * Features:
 * - Email domain filtering (only @barq.com and @barraq.com.sa)
 * - Department/office normalization for messy Graph data
 * - Automatic role assignment based on department and title
 */

import { z } from "zod";
import {
  isValidEmailDomain,
  normalizeDepartment,
  normalizeOffice,
  determineRoleFromDeptTitle,
} from "./graph-normalization";

/**
 * Schema for a single user from Microsoft Graph API
 *
 * Based on the /users endpoint response with selected fields:
 * $select=id,givenName,surname,displayName,mail,userPrincipalName,
 *         businessPhones,mobilePhone,employeeId,jobTitle,department,
 *         officeLocation,accountEnabled,employeeHireDate
 */
export const GraphUserSchema = z.object({
  // Always present (100% populated)
  id: z.string().uuid(), // Azure AD Object ID (GUID)
  displayName: z.string(),
  userPrincipalName: z.string(), // Login UPN (always present)
  accountEnabled: z.boolean(),
  businessPhones: z.array(z.string()).default([]),

  // Usually present for internal users (~60-100%)
  givenName: z.string().nullable().default(null),
  surname: z.string().nullable().default(null),
  mail: z.string().email().nullable().default(null),
  jobTitle: z.string().nullable().default(null),
  department: z.string().nullable().default(null),
  mobilePhone: z.string().nullable().default(null),
  officeLocation: z.string().nullable().default(null),

  // Requires AD admin to populate (0% by default)
  employeeId: z.string().nullable().default(null),
  employeeHireDate: z.string().datetime().nullable().default(null),
});

/**
 * Schema for paginated Graph API users response
 */
export const GraphUsersResponseSchema = z.object({
  "@odata.context": z.string(),
  "@odata.nextLink": z.string().optional(),
  value: z.array(GraphUserSchema),
});

/**
 * Schema for manager response from Graph API
 */
export const GraphManagerResponseSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().optional(),
});

/**
 * Type for a validated Graph user
 */
export type GraphUser = z.infer<typeof GraphUserSchema>;

/**
 * Type for paginated Graph API response
 */
export type GraphUsersResponse = z.infer<typeof GraphUsersResponseSchema>;

/**
 * Type for manager response
 */
export type GraphManagerResponse = z.infer<typeof GraphManagerResponseSchema>;

/**
 * Options for fetching users from Graph API
 */
export interface FetchUsersOptions {
  /**
   * Include disabled (accountEnabled: false) users
   * @default false
   */
  includeDisabled?: boolean;

  /**
   * Include guest/external users (#EXT# in UPN)
   * @default false
   */
  includeGuests?: boolean;
}

/**
 * Input data for creating/updating a Person from Graph user
 */
export interface PersonSyncInput {
  azureAdId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  employeeId: string | null;
  title: string | null;
  department: string | null;
  office: string | null;
  isActive: boolean;
  hireDate: Date | null;
  orgUnitId: string;
  primaryRoleId: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: Array<{
    azureAdId: string;
    email?: string;
    error: string;
  }>;
}

/**
 * Checks if a user is an internal Barq user.
 *
 * A user is considered internal if:
 * 1. Not a guest/external user (no #EXT# in UPN)
 * 2. Has a valid Barq email domain (@barq.com or @barraq.com.sa)
 *
 * @param user - Graph user to check
 * @returns true if user is internal Barq employee, false otherwise
 */
export function isInternalUser(user: GraphUser): boolean {
  // Check for guest/external flag
  if (user.userPrincipalName.includes("#EXT#")) {
    return false;
  }

  // Check email domain (use mail if available, otherwise extract from UPN)
  const email = user.mail || user.userPrincipalName;
  return isValidEmailDomain(email);
}

/**
 * Transforms a Microsoft Graph user to Person sync input
 *
 * Features:
 * - Normalizes department and office values (handles typos, variations)
 * - Automatically assigns role based on department and job title
 * - Stores raw department/office for reference, uses normalized codes internally
 *
 * @param graphUser - Validated Graph user data
 * @param defaults - Default values for required fields
 * @param defaults.orgUnitId - Default organization unit ID
 * @param defaults.roleMap - Map of role names to role IDs (for automatic assignment)
 * @returns Data ready for Person upsert
 */
export function transformGraphUserToPerson(
  graphUser: GraphUser,
  defaults: { orgUnitId: string; roleMap: Map<string, string> },
): PersonSyncInput {
  // Extract name parts with fallbacks
  const nameParts = graphUser.displayName.split(" ");
  const firstName = graphUser.givenName || nameParts[0] || "Unknown";
  const lastName = graphUser.surname || nameParts.slice(1).join(" ") || "User";

  // Determine email (mail preferred, UPN fallback for guests)
  let email = graphUser.mail || graphUser.userPrincipalName;

  // Clean up guest UPN format: user_domain.com#EXT#@tenant.onmicrosoft.com
  if (email.includes("#EXT#")) {
    email = email.split("#EXT#")[0].replace("_", "@");
  }

  // Normalize department and office for internal matching
  const normalizedDeptCode = normalizeDepartment(graphUser.department);
  const normalizedOfficeCode = normalizeOffice(graphUser.officeLocation);

  // Determine role based on department and title
  const roleName = determineRoleFromDeptTitle(
    normalizedDeptCode,
    graphUser.jobTitle,
  );

  // Get role ID from map, fallback to viewer
  const primaryRoleId =
    defaults.roleMap.get(roleName) ||
    defaults.roleMap.get("viewer") ||
    // Last resort: just use the first role ID in the map
    Array.from(defaults.roleMap.values())[0];

  return {
    azureAdId: graphUser.id, // Immutable source of truth
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: graphUser.businessPhones[0] || null,
    mobile: graphUser.mobilePhone,
    employeeId: graphUser.employeeId,
    title: graphUser.jobTitle,
    // Store raw department/office for display, but use normalized codes internally
    department: graphUser.department,
    office: normalizedOfficeCode, // Use normalized office code for location matching
    isActive: graphUser.accountEnabled,
    hireDate: graphUser.employeeHireDate
      ? new Date(graphUser.employeeHireDate)
      : null,
    orgUnitId: defaults.orgUnitId,
    primaryRoleId,
  };
}
