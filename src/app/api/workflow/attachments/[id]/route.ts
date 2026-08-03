import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";

export const dynamic = "force-dynamic";

/**
 * Serve attachment bytes. Auth: anyone with read access to the request that
 * owns this attachment. Inherits view scope per PRD §16.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_VIEW);

  const { id } = await context.params;

  const attachment = await prisma.requestAttachment.findUnique({
    where: { id },
    select: {
      filename: true,
      contentType: true,
      storageRef: true,
    },
  });
  if (!attachment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const storage = getContainer().get<IFileStorageService>(
    DI_TOKENS.IFileStorageService,
  );
  const bytes = await storage.readFile(attachment.storageRef, "binary");

  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": attachment.contentType,
      "content-disposition": `inline; filename="${escapeFilename(attachment.filename)}"`,
      "content-length": String(bytes.byteLength),
    },
  });
}

function escapeFilename(s: string): string {
  return s.replace(/"/g, "");
}
