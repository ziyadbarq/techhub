import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

export type ConflictSeverity = "warning" | "error" | "critical";

export interface RoleConflict {
  role1: string;
  role2: string;
  reason: string;
  severity: ConflictSeverity;
  config: {
    severity: ConflictSeverity;
    allowOverride: boolean;
    requireJustification: boolean;
  };
}

export interface PermissionDependencyValidation {
  valid: boolean;
  missing: Array<{
    permission: PermissionKey;
    requiredDependencies: PermissionKey[];
  }>;
}

export interface IRbacPolicyService {
  validateRoleAddition(
    existingRoles: string[],
    newRole: string,
  ): {
    canAdd: boolean;
    conflicts: RoleConflict[];
  };

  detectRoleConflicts(roleNames: string[]): {
    hasConflicts: boolean;
    conflicts: RoleConflict[];
  };

  validatePermissionDependencies(
    selectedPermissions: PermissionKey[],
  ): PermissionDependencyValidation;
}
