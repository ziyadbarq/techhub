/**
 * Features API Route
 * Returns enabled features for client-side navigation filtering
 */

import { NextResponse } from "next/server";
import {
  getEnabledFeatures,
  isMaintenanceModeEnabled,
} from "@/lib/features/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/features
 * Returns list of enabled feature names
 * Returns maintenanceMode: true if maintenance mode is active for current user
 */
export async function GET() {
  try {
    // Check maintenance mode
    const maintenanceMode = await isMaintenanceModeEnabled();

    const enabledFeatures = await getEnabledFeatures();

    return NextResponse.json({
      features: Array.from(enabledFeatures),
      total: enabledFeatures.size,
      maintenanceMode, // Signal to client if maintenance mode is active
    });
  } catch (error) {
    console.error("Error fetching enabled features:", error);
    return NextResponse.json(
      { error: "Failed to fetch enabled features" },
      { status: 500 },
    );
  }
}
