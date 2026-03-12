import { NextResponse } from "next/server";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";

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

    return NextResponse.json(
      {
        success: true,
        status,
        checkedAt: new Date().toISOString(),
        data: health,
      },
      {
        status: health.coreServicesHealthy ? 200 : 503,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        checkedAt: new Date().toISOString(),
        error: message,
      },
      { status: 500 },
    );
  }
}
