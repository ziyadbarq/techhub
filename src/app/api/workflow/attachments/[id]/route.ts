import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  attachmentHeaders,
  canSeeRequest,
  workflowFileStorage,
} from "@/lib/workflows/attachments/server";

export const dynamic = "force-dynamic";

/**
 * Serve an attachment to someone who may see its request (requester, a step
 * assignee, or a global viewer). A file not yet on a request is visible only
 * to its uploader.
 */
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
  const attachment = await prisma.requestAttachment.findUnique({
    where: { id },
    select: {
      requestId: true,
      uploadedById: true,
      filename: true,
      contentType: true,
      byteSize: true,
      storageRef: true,
    },
  });
  const allowed =
    !!attachment &&
    (attachment.requestId
      ? await canSeeRequest(userId, attachment.requestId)
      : attachment.uploadedById === userId);
  if (!attachment || !allowed) {
    // Same answer either way: don't reveal that the file exists.
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await workflowFileStorage().read(attachment.storageRef);
  } catch (error) {
    logger.warn(
      { module: "Workflow", function: "attachment" },
      "Attachment file unavailable",
      { id, error: String(error) },
    );
    return NextResponse.json({ error: "FILE_UNAVAILABLE" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: attachmentHeaders({ ...attachment, byteSize: bytes.byteLength }),
  });
}
