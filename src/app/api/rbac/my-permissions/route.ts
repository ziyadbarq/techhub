/**
 * My Permissions API Route
 * Returns the current user's permissions
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { GetUserPermissionsUseCase } from "@/core/use-cases/rbac/get-user-permissions.use-case";

export async function GET() {
  try {
    // Get current user session
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get use case from DI container
    const container = getContainer();
    const getUserPermissions = container.get<GetUserPermissionsUseCase>(
      DI_TOKENS.GetUserPermissionsUseCase,
    );

    // Execute use case
    const result = await getUserPermissions.execute({
      userId: user.id,
    });

    return NextResponse.json({
      permissions: result.permissions,
      activeRoleCount: result.activeRoleCount,
    });
  } catch (error) {
    console.error("Failed to fetch user permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}
