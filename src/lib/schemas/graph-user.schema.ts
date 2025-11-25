/**
 * Microsoft Graph User Schema
 *
 * Zod validation schemas for Microsoft Graph API user responses.
 * These schemas validate data received from the Graph API and provide
 * type-safe transformation to Person entity format.
 */

import { z } from "zod";

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
 * Checks if a user is an internal user (not a guest/external)
 *
 * @param user - Graph user to check
 * @returns true if user is internal, false if guest/external
 */
export function isInternalUser(user: GraphUser): boolean {
  return !user.userPrincipalName.includes("#EXT#");
}

/**
 * Transforms a Microsoft Graph user to Person sync input
 *
 * @param graphUser - Validated Graph user data
 * @param defaults - Default values for required fields
 * @returns Data ready for Person upsert
 */
export function transformGraphUserToPerson(
  graphUser: GraphUser,
  defaults: { orgUnitId: string; primaryRoleId: string },
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

  return {
    azureAdId: graphUser.id, // Immutable source of truth
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: graphUser.businessPhones[0] || null,
    mobile: graphUser.mobilePhone,
    employeeId: graphUser.employeeId,
    title: graphUser.jobTitle,
    department: graphUser.department,
    office: graphUser.officeLocation,
    isActive: graphUser.accountEnabled,
    hireDate: graphUser.employeeHireDate
      ? new Date(graphUser.employeeHireDate)
      : null,
    orgUnitId: defaults.orgUnitId,
    primaryRoleId: defaults.primaryRoleId,
  };
}
