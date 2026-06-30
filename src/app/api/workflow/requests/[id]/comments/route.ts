import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  body: z.string().min(1).max(10_000),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const { id } = await context.params;

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const comments = await prisma.requestComment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      attachments: {
        select: {
          id: true,
          filename: true,
          contentType: true,
          byteSize: true,
          createdAt: true,
        },
      },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_COMMENT);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const created = await prisma.requestComment.create({
    data: {
      requestId: id,
      authorId: userId,
      body: parsed.data.body,
    },
  });
  return NextResponse.json({ comment: created }, { status: 201 });
}
