import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

/**
 * Picker endpoint for REQUEST_LINK fields. Returns up to 30 requests on
 * the named form, optionally filtered by a search query against reference
 * number or any text field value.
 *
 * Used by the form renderer's REQUEST_LINK dropdown.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const { formId } = await context.params;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const includeFinal = url.searchParams.get("includeFinal") === "1";

  // Verify the form exists (defense-in-depth).
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { id: true, name: true },
  });
  if (!form) {
    return NextResponse.json({ error: "FORM_NOT_FOUND" }, { status: 404 });
  }

  const where: {
    formId: string;
    referenceNumber?: { contains: string; mode: "insensitive" };
    status?: { notIn: ("CLOSED" | "CANCELLED")[] };
  } = {
    formId,
  };
  if (q) where.referenceNumber = { contains: q, mode: "insensitive" };
  if (!includeFinal) where.status = { notIn: ["CLOSED", "CANCELLED"] };

  const rows = await prisma.request.findMany({
    where,
    select: {
      id: true,
      referenceNumber: true,
      status: true,
      outcome: true,
      createdAt: true,
      requester: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    requests: rows.map((r) => ({
      id: r.id,
      referenceNumber: r.referenceNumber,
      status: r.status,
      outcome: r.outcome,
      requester: r.requester ? (r.requester.name ?? r.requester.email) : null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
