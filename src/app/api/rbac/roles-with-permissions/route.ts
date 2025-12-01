/**
 * Roles With Permissions API Route
 * Returns all active roles with their permission keys for preview/testing.
 * Restricted to users with ROLES_VIEW permission.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission as requirePermissionById } from "@/lib/permissions/check-permission";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { ILoggerService } from "@/core/services";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

const container = getContainer();
const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

export async function GET() {
  try {
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Restrict to admins who can view roles
    await requirePermissionById(user.id, PERMISSIONS.ROLES_VIEW);

    const roleRepository = container.get<IRoleRepository>(
      DI_TOKENS.IRoleRepository,
    );

    const roles = await roleRepository.findAll({ includeInactive: false });

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await roleRepository.getRolePermissions(role.id);
        return {
          id: role.id,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          isSystem: role.isSystem,
          isActive: role.isActive,
          permissions,
        };
      }),
    );

    return NextResponse.json({ roles: rolesWithPermissions });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err instanceof InsufficientPermissionsError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    logger.error("Failed to fetch roles with permissions", err);
    return NextResponse.json(
      { error: "Failed to fetch roles with permissions" },
      { status: 500 },
    );
  }
}
