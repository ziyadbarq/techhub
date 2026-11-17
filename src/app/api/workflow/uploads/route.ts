import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { MAX_ATTACHMENT_BYTES } from "@/lib/workflows/attachments/upload-policy";
import { checkAttachmentUpload } from "@/lib/workflows/attachments/upload-check";
import { workflowFileStorage } from "@/lib/workflows/attachments/server";
import { PrivateStorageUnavailableError } from "@/lib/storage/private-file-storage";

export const dynamic = "force-dynamic";

/** Uploads waiting for a request, per person, within a day. */
const MAX_PENDING_PER_DAY = 100;

/**
 * Upload a file for a form's FILE field. The file waits, visible only to its
 * uploader, until the request (or a step action) that references it is
 * submitted; then it is linked to that request.
 */
export async function POST(request: NextRequest) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_ATTACH);
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (
    Number(request.headers.get("content-length") ?? 0) >
    MAX_ATTACHMENT_BYTES + 64_000
  ) {
    return NextResponse.json(
      { error: "FILE_TOO_LARGE", message: "Files can be up to 10 MB." },
      { status: 413 },
    );
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const fieldKey = String(form?.get("fieldKey") ?? "").trim();
  if (!(file instanceof File) || !fieldKey || fieldKey.length > 100) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const pending = await prisma.requestAttachment.count({
    where: {
      uploadedById: userId,
      requestId: null,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (pending >= MAX_PENDING_PER_DAY) {
    return NextResponse.json(
      {
        error: "TOO_MANY_UPLOADS",
        message: "Too many uploads today. Submit or try again tomorrow.",
      },
      { status: 429 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const check = await checkAttachmentUpload({ name: file.name, bytes });
  if (!check.ok) {
    return NextResponse.json(
      { error: check.error, message: check.message },
      { status: 400 },
    );
  }

  let storageRef: string;
  try {
    storageRef = await workflowFileStorage().upload(
      bytes,
      check.fileName,
      check.contentType,
    );
  } catch (error) {
    if (error instanceof PrivateStorageUnavailableError) {
      return NextResponse.json(
        {
          error: "PRIVATE_STORAGE_REQUIRED",
          message: "File storage isn't configured.",
        },
        { status: 503 },
      );
    }
    logger.error(
      { module: "Workflow", function: "upload" },
      "Attachment upload failed",
      error,
    );
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }

  const created = await prisma.requestAttachment.create({
    data: {
      requestId: null,
      fieldKey,
      uploadedById: userId,
      filename: check.fileName,
      contentType: check.contentType,
      byteSize: bytes.byteLength,
      storageRef,
    },
    select: { id: true, filename: true, byteSize: true },
  });
  return NextResponse.json(
    {
      file: { id: created.id, name: created.filename, size: created.byteSize },
    },
    { status: 201 },
  );
}
