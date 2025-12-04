/**
 * My Roles API Route
 * Returns the current user's assigned roles
 */

import { NextResponse } from "next/server";
import { getMyRolesAction } from "@/interface-adapters/controllers/rbac.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getMyRolesAction();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch roles" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      roles: result.data.roles,
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}
