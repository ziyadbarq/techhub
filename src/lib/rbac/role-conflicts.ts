/**
 * Role Conflict Detection Configuration
 *
 * Defines conflicting role pairs to enforce segregation of duties.
 * When a user is assigned conflicting roles, a warning is displayed.
 *
 * Business Rules:
 * - Auditor roles should not have administrative access
 * - Finance and procurement should be separate (SOD violation)
 * - Development and production access should be segregated
 * - Security and operations should have oversight separation
 *
 * Conflicts are bidirectional - if A conflicts with B, then B conflicts with A.
 *
 * @example
 * User with "auditor" role should not have "administrator" role
 * User with "finance-manager" role should not have "procurement-manager" role
 */

/**
 * Maps role names to their conflicting roles
 * Uses role.name (not ID) for configuration
 */
export const ROLE_CONFLICTS: Record<string, string[]> = {
  // Auditor conflicts (segregation of duties)
  auditor: ["administrator", "developer", "system-admin"],

  // Administrative conflicts
  administrator: ["auditor"],
  "system-admin": ["auditor", "external-auditor"],

  // Finance conflicts (SOD)
  "finance-manager": ["procurement-manager", "vendor-manager"],
  "procurement-manager": ["finance-manager", "accounts-payable"],
  "accounts-payable": ["procurement-manager", "vendor-manager"],

  // Vendor management conflicts
  "vendor-manager": ["finance-manager", "accounts-payable", "procurement"],

  // Development vs Production
  developer: ["auditor", "production-admin", "security-auditor"],
  "production-admin": ["developer"],

  // Security oversight
  "security-auditor": ["developer", "system-admin"],
  "external-auditor": ["system-admin", "developer", "administrator"],

  // Asset management conflicts
  "asset-approver": ["asset-requestor"],
  "disposal-approver": ["disposal-requestor"],
};

/**
 * Conflict reason descriptions for better UX
 */
export const CONFLICT_REASONS: Record<string, string> = {
  "auditor:administrator": "Auditors should not have administrative privileges",
  "auditor:developer": "Auditors should not have development access",
  "auditor:system-admin": "Auditors require independent oversight",
  "finance-manager:procurement-manager":
    "Finance and procurement require segregation of duties",
  "finance-manager:vendor-manager":
    "Finance approval and vendor management must be separate",
  "procurement-manager:accounts-payable":
    "Procurement and payment processing must be segregated",
  "accounts-payable:vendor-manager":
    "Payment processing and vendor management must be separate",
  "developer:production-admin":
    "Development and production access should be segregated",
  "developer:security-auditor": "Developers should not audit their own code",
  "asset-approver:asset-requestor":
    "Users cannot approve their own asset requests",
  "disposal-approver:disposal-requestor":
    "Users cannot approve their own disposal requests",
  "system-admin:external-auditor": "External auditors require independence",
};

/**
 * Severity levels for conflicts
 */
export type ConflictSeverity = "warning" | "error" | "critical";

export interface ConflictConfig {
  severity: ConflictSeverity;
  allowOverride: boolean;
  requireJustification: boolean;
}

/**
 * Configuration for conflict severity and override rules
 */
export const CONFLICT_CONFIG: Record<string, ConflictConfig> = {
  // Critical conflicts - no override allowed
  "auditor:administrator": {
    severity: "critical",
    allowOverride: false,
    requireJustification: false,
  },
  "external-auditor:system-admin": {
    severity: "critical",
    allowOverride: false,
    requireJustification: false,
  },

  // High severity - override with justification
  "finance-manager:procurement-manager": {
    severity: "error",
    allowOverride: true,
    requireJustification: true,
  },
  "procurement-manager:accounts-payable": {
    severity: "error",
    allowOverride: true,
    requireJustification: true,
  },

  // Medium severity - warning only
  "developer:production-admin": {
    severity: "warning",
    allowOverride: true,
    requireJustification: false,
  },
};

export interface RoleConflict {
  role1: string;
  role2: string;
  reason: string;
  severity: ConflictSeverity;
  config: ConflictConfig;
}

/**
 * Detects conflicts in a set of assigned roles
 *
 * @param roleNames - Array of role names (not IDs)
 * @returns Object with conflict detection results
 */
export function detectRoleConflicts(roleNames: string[]): {
  hasConflicts: boolean;
  conflicts: RoleConflict[];
} {
  const conflicts: RoleConflict[] = [];

  // Compare each pair of roles
  for (let i = 0; i < roleNames.length; i++) {
    for (let j = i + 1; j < roleNames.length; j++) {
      const role1 = roleNames[i];
      const role2 = roleNames[j];

      // Check if role1 conflicts with role2
      if (ROLE_CONFLICTS[role1]?.includes(role2)) {
        const conflictKey1 = `${role1}:${role2}`;
        const conflictKey2 = `${role2}:${role1}`;

        // Get reason (try both orderings)
        const reason =
          CONFLICT_REASONS[conflictKey1] ??
          CONFLICT_REASONS[conflictKey2] ??
          "Segregation of duties violation";

        // Get config (try both orderings, fallback to default)
        const config =
          CONFLICT_CONFIG[conflictKey1] ??
          CONFLICT_CONFIG[conflictKey2] ?? {
            severity: "warning",
            allowOverride: true,
            requireJustification: false,
          };

        conflicts.push({
          role1,
          role2,
          reason,
          severity: config.severity,
          config,
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Checks if a specific role pair conflicts
 *
 * @param role1 - First role name
 * @param role2 - Second role name
 * @returns True if roles conflict
 */
export function rolesConflict(role1: string, role2: string): boolean {
  return (
    ROLE_CONFLICTS[role1]?.includes(role2) ||
    ROLE_CONFLICTS[role2]?.includes(role1)
  );
}

/**
 * Gets all roles that conflict with a specific role
 *
 * @param roleName - Role name to check
 * @returns Array of conflicting role names
 */
export function getConflictingRoles(roleName: string): string[] {
  const directConflicts = ROLE_CONFLICTS[roleName] ?? [];

  // Also find roles that list this role as a conflict
  const reverseConflicts = Object.entries(ROLE_CONFLICTS)
    .filter(([_, conflicts]) => conflicts.includes(roleName))
    .map(([role]) => role);

  // Combine and deduplicate
  return Array.from(new Set([...directConflicts, ...reverseConflicts]));
}

/**
 * Validates if a new role can be added to existing roles
 *
 * @param existingRoles - Array of existing role names
 * @param newRole - New role name to add
 * @returns Validation result with conflicts
 */
export function validateRoleAddition(
  existingRoles: string[],
  newRole: string,
): {
  canAdd: boolean;
  conflicts: RoleConflict[];
} {
  const allRoles = [...existingRoles, newRole];
  const result = detectRoleConflicts(allRoles);

  // Filter to only conflicts involving the new role
  const relevantConflicts = result.conflicts.filter(
    (c) => c.role1 === newRole || c.role2 === newRole,
  );

  // Check if any critical conflicts prevent addition
  const hasCriticalConflicts = relevantConflicts.some(
    (c) => c.severity === "critical" && !c.config.allowOverride,
  );

  return {
    canAdd: !hasCriticalConflicts,
    conflicts: relevantConflicts,
  };
}
