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
import {
  canSeeRequest,
  workflowFileStorage,
} from "@/lib/workflows/attachments/server";
import { PrivateStorageUnavailableError } from "@/lib/storage/private-file-storage";

export const dynamic = "force-dynamic";

/** Files on a request, for anyone who may see the request. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!(await canSeeRequest(userId, id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const attachments = await prisma.requestAttachment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestId: true,
      fieldKey: true,
      commentId: true,
      filename: true,
      contentType: true,
      byteSize: true,
      supersedesId: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ attachments });
}

/**
 * Add a file to a request (from the comments panel). Only people who may see
 * the request can add to it. Optional fields:
 *   - commentId    → the file belongs to a comment on this request
 *   - supersedesId → a new version of a file on this request
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
  if (!(await canSeeRequest(userId, id))) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
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

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  // References must point inside this same request.
  const commentId = String(formData?.get("commentId") ?? "") || null;
  const supersedesId = String(formData?.get("supersedesId") ?? "") || null;
  if (
    commentId &&
    !(await prisma.requestComment.findFirst({
      where: { id: commentId, requestId: id },
      select: { id: true },
    }))
  ) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }
  if (
    supersedesId &&
    !(await prisma.requestAttachment.findFirst({
      where: { id: supersedesId, requestId: id },
      select: { id: true },
    }))
  ) {
    return NextResponse.json({ error: "INVALID_SUPERSEDES" }, { status: 400 });
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
      { module: "Workflow", function: "requestAttachment" },
      "Attachment upload failed",
      error,
    );
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }

  const created = await prisma.requestAttachment.create({
    data: {
      requestId: id,
      uploadedById: userId,
      filename: check.fileName,
      contentType: check.contentType,
      byteSize: bytes.byteLength,
      storageRef,
      commentId,
      supersedesId,
    },
  });
  return NextResponse.json({ attachment: created }, { status: 201 });
}
