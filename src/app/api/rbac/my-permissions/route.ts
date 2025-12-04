/**
 * My Permissions API Route
 * Returns the current user's permissions
 */

import { NextResponse } from "next/server";
import { getMyPermissionsAction } from "@/interface-adapters/controllers/rbac.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getMyPermissionsAction();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch permissions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      permissions: result.data.permissions,
      activeRoleCount: result.data.activeRoleCount,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}
