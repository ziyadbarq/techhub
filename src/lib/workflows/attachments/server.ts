import "server-only";
import { prisma } from "@/infrastructure/database/prisma/client";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  createPrivateFileStorage,
  type PrivateFileStorage,
} from "@/lib/storage/private-file-storage";

/** Private storage for request attachments (GCS, or a dev-only private folder). */
export function workflowFileStorage(): PrivateFileStorage {
  return createPrivateFileStorage({
    devDir: ".workflow-uploads-dev",
    devPrefix: "wf-dev",
  });
}

/**
 * Same rule as the request page: the requester, anyone assigned to one of
 * its steps (current or past), or someone who may view every request.
 */
export async function canSeeRequest(
  userId: string,
  requestId: string,
): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { requesterId: true },
  });
  if (!request) return false;
  if (await hasPermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW)) return true;
  if (
    request.requesterId === userId &&
    (await hasPermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW_OWN, {
      resourceOwnerId: request.requesterId,
    }))
  ) {
    return true;
  }
  const assigned = await prisma.assigneeSnapshot.findFirst({
    where: { userId, stepInstance: { requestId } },
    select: { id: true },
  });
  return !!assigned;
}

/** Content types a browser may show in a tab; everything else downloads. */
const INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
]);

export function attachmentHeaders(attachment: {
  filename: string;
  contentType: string;
  byteSize: number;
}): HeadersInit {
  const disposition = INLINE_TYPES.has(attachment.contentType)
    ? "inline"
    : "attachment";
  const ascii = attachment.filename
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_");
  return {
    "Content-Type": attachment.contentType,
    "Content-Disposition": `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
    "Content-Length": String(attachment.byteSize),
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    "Cache-Control": "private, no-store",
  };
}
