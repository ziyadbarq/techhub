/**
 * Roles With Permissions API Route
 * Returns all active roles with their permission keys for preview/testing.
 * Restricted to users with ROLES_VIEW permission.
 */

import { NextResponse } from "next/server";
import { listRolesWithPermissionsAction } from "@/interface-adapters/controllers/rbac.controller";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

export async function GET() {
  try {
    const result = await listRolesWithPermissionsAction();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch roles with permissions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ roles: result.data });
  } catch (error) {
    if (error instanceof InsufficientPermissionsError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch roles with permissions" },
      { status: 500 },
    );
  }
}
