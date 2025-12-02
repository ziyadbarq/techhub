import { injectable } from "inversify";
import {
  detectRoleConflicts,
  validateRoleAddition,
} from "@/lib/rbac/role-conflicts";
import { validatePermissionDependencies } from "@/lib/rbac/permission-dependencies";
import type { IRbacPolicyService } from "@/core/services/rbac-policy.service.interface";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

@injectable()
export class RbacPolicyService implements IRbacPolicyService {
  validateRoleAddition(existingRoles: string[], newRole: string) {
    return validateRoleAddition(existingRoles, newRole);
  }

  detectRoleConflicts(roleNames: string[]) {
    return detectRoleConflicts(roleNames);
  }

  validatePermissionDependencies(selectedPermissions: PermissionKey[]) {
    return validatePermissionDependencies(selectedPermissions);
  }
}
