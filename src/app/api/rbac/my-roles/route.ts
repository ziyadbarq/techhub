/**
 * My Roles API Route
 * Returns the current user's assigned roles
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { GetUserRolesUseCase } from "@/core/use-cases/rbac/get-user-roles.use-case";
import type { ILoggerService } from "@/core/services";

const container = getContainer();
const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

export async function GET() {
  try {
    // Get current user session
    const { user } = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get use case from DI container
    const getUserRoles = container.get<GetUserRolesUseCase>(
      DI_TOKENS.GetUserRolesUseCase,
    );

    // Execute use case
    const result = await getUserRoles.execute({ userId: user.id });

    return NextResponse.json({
      roles: result.roles.map((userRole) => ({
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
        description: userRole.role.description,
        isSystem: userRole.role.isSystem,
      })),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to fetch user roles", err);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}
