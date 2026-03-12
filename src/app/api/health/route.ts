import { NextResponse } from "next/server";

/**
 * Lightweight liveness/readiness probe endpoint.
 * Returns 200 so K8s and Docker HEALTHCHECK can verify the process is up.
 * For full system health (DB, Redis, etc.) use GET /api/system-health.
 */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
