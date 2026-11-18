import "server-only";
import { prisma } from "@/infrastructure/database/prisma/client";
import { hasPermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { formAccessFor } from "@/core/domain/workflow";
import type { FormAccess } from "@/core/domain/workflow";

/** What the user may do on this form's requests as one of its people. */
export async function getFormAccess(
  userId: string,
  formId: string,
): Promise<FormAccess> {
  const rows = await prisma.formMember.findMany({
    where: { formId, userId },
    select: { role: true },
  });
  return formAccessFor(rows.map((r) => r.role));
}

/**
 * Who may see a request — its page, timeline, comments and attachments:
 *
 * - someone who may view every request (`workflows-requests:view`);
 * - its requester;
 * - anyone assigned to one of its steps, current or past;
 * - the form's people (owner, manager or viewer).
 */
export async function canSeeRequest(
  userId: string,
  requestId: string,
): Promise<boolean> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { requesterId: true, formId: true },
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
  if (assigned) return true;
  return (await getFormAccess(userId, request.formId)).canView;
}
