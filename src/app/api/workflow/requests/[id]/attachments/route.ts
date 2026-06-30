import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

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

  const attachments = await prisma.requestAttachment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ attachments });
}

/**
 * Upload an attachment via multipart/form-data. Optional fields:
 *   - fieldKey   (string) → tag the file as belonging to a form field
 *   - commentId  (string) → tag the file as belonging to a comment
 *   - supersedesId (string) → mark this as a new version of a previous attachment
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_ATTACH);

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;

  const req = await prisma.request.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!req) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
  }

  const fieldKey = formData.get("fieldKey");
  const commentId = formData.get("commentId");
  const supersedesId = formData.get("supersedesId");

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getContainer().get<IFileStorageService>(
    DI_TOKENS.IFileStorageService,
  );
  const storageRef = await storage.uploadFile(
    buffer,
    file.name || "upload.bin",
    file.type || "application/octet-stream",
  );

  const created = await prisma.requestAttachment.create({
    data: {
      requestId: id,
      uploadedById: userId,
      filename: file.name || "upload.bin",
      contentType: file.type || "application/octet-stream",
      byteSize: file.size,
      storageRef,
      fieldKey: typeof fieldKey === "string" && fieldKey ? fieldKey : null,
      commentId: typeof commentId === "string" && commentId ? commentId : null,
      supersedesId:
        typeof supersedesId === "string" && supersedesId ? supersedesId : null,
    },
  });
  return NextResponse.json({ attachment: created }, { status: 201 });
}
