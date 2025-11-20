/**
 * RBAC Domain Errors
 * Custom error classes for RBAC business logic
 */

export class RBACError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RBACError";
  }
}

export class InsufficientPermissionsError extends RBACError {
  constructor(
    public readonly requiredPermission: string,
    public readonly userId?: string,
  ) {
    super(`Insufficient permissions: ${requiredPermission} required`);
    this.name = "InsufficientPermissionsError";
  }
}

export class RoleNotFoundError extends RBACError {
  constructor(public readonly roleIdentifier: string) {
    super(`Role not found: ${roleIdentifier}`);
    this.name = "RoleNotFoundError";
  }
}

export class PermissionNotFoundError extends RBACError {
  constructor(public readonly permissionIdentifier: string) {
    super(`Permission not found: ${permissionIdentifier}`);
    this.name = "PermissionNotFoundError";
  }
}

export class PermissionDeniedError extends RBACError {
  constructor(
    public readonly action: string,
    public readonly resource?: string,
  ) {
    super(`Permission denied: ${action}${resource ? ` on ${resource}` : ""}`);
    this.name = "PermissionDeniedError";
  }
}

export class SystemRoleModificationError extends RBACError {
  constructor(public readonly roleName: string) {
    super(`Cannot modify system role: ${roleName}`);
    this.name = "SystemRoleModificationError";
  }
}

export class SystemPermissionModificationError extends RBACError {
  constructor(public readonly permissionName: string) {
    super(`Cannot modify system permission: ${permissionName}`);
    this.name = "SystemPermissionModificationError";
  }
}

export class RoleAlreadyAssignedError extends RBACError {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {
    super(`Role already assigned to user`);
    this.name = "RoleAlreadyAssignedError";
  }
}

export class InvalidPermissionKeyError extends RBACError {
  constructor(public readonly key: string) {
    super(`Invalid permission key: ${key}`);
    this.name = "InvalidPermissionKeyError";
  }
}

export class DuplicateRoleError extends RBACError {
  constructor(public readonly roleName: string) {
    super(`Role already exists: ${roleName}`);
    this.name = "DuplicateRoleError";
  }
}

export class DuplicatePermissionError extends RBACError {
  constructor(public readonly permissionName: string) {
    super(`Permission already exists: ${permissionName}`);
    this.name = "DuplicatePermissionError";
  }
}
