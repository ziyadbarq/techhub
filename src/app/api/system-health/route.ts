import { NextResponse } from "next/server";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type HealthLevel = "healthy" | "degraded" | "unhealthy";

function getHealthLevel(
  coreServicesHealthy: boolean,
  overall: boolean,
): HealthLevel {
  if (!coreServicesHealthy) {
    return "unhealthy";
  }

  if (!overall) {
    return "degraded";
  }

  return "healthy";
}

export async function GET() {
  try {
    const result = await checkSystemHealthAction();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          status: "unhealthy",
          checkedAt: new Date().toISOString(),
          error: result.error ?? "Failed to check system health",
        },
        { status: 500 },
      );
    }

    const health = result.data;
    const status = getHealthLevel(health.coreServicesHealthy, health.overall);

    // Detailed diagnostics (error strings, missing env vars, migration and
    // seed state) are only returned to authenticated users; anonymous callers
    // get the overall status, which is all probes and the public page need.
    const { session } = await getSession();

    return NextResponse.json(
      {
        success: true,
        status,
        checkedAt: new Date().toISOString(),
        ...(session ? { data: health } : {}),
      },
      {
        status: health.coreServicesHealthy ? 200 : 503,
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        checkedAt: new Date().toISOString(),
        error: "Failed to check system health",
      },
      { status: 500 },
    );
  }
}
