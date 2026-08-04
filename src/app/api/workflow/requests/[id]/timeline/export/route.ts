import { type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_AUDIT_EXPORT);

  const { id } = await context.params;

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true, referenceNumber: true },
  });
  if (!req) {
    return new Response("Not found", { status: 404 });
  }

  const auditEntries = await prisma.auditEntry.findMany({
    where: { requestId: req.id },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  const header = [
    "timestamp",
    "action",
    "actor",
    "actor_system",
    "step_instance",
    "payload",
  ];
  const rows = auditEntries.map((e) => [
    e.createdAt.toISOString(),
    e.action,
    e.actor ? (e.actor.name ?? e.actor.email) : "",
    e.actorSystem ?? "",
    e.stepInstanceId ?? "",
    e.payloadJson ? JSON.stringify(e.payloadJson) : "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const filename = `${req.referenceNumber ?? req.id}-timeline.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
