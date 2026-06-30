import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

/**
 * Audit trail CSV export. Returns the last N audit entries (or scoped to a
 * single requestId via ?requestId=).
 *
 * Output: text/csv with columns:
 *   created_at, request_reference, action, actor, actor_system, payload_json
 */
export async function GET(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_AUDIT_EXPORT);

  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const limit = Math.min(
    Number(url.searchParams.get("limit") ?? "10000"),
    50_000,
  );

  const entries = await prisma.auditEntry.findMany({
    where: requestId ? { requestId } : {},
    orderBy: { createdAt: "asc" },
    include: {
      actor: { select: { name: true, email: true } },
      request: { select: { referenceNumber: true } },
    },
    take: limit,
  });

  const header = [
    "created_at",
    "request_reference",
    "action",
    "actor",
    "actor_system",
    "payload_json",
  ].join(",");

  const rows = entries.map((e) =>
    [
      csv(e.createdAt.toISOString()),
      csv(e.request?.referenceNumber ?? ""),
      csv(e.action),
      csv(e.actor?.email ?? ""),
      csv(e.actorSystem ?? ""),
      csv(JSON.stringify(e.payloadJson ?? {})),
    ].join(","),
  );

  const body = [header, ...rows].join("\n");
  const filename = `audit-${requestId ?? "all"}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csv(s: string): string {
  if (!s) return "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
