/**
 * Shared body of the attachment download and preview routes.
 *
 * Streams the bytes through the application instead of exposing a storage
 * URL, so permission is checked on every fetch. This is what makes a private
 * bucket worth having: a signed asset handover form carries an employee's
 * name, number, email and handwritten signature, and must not be readable by
 * anyone who happens to hold a link.
 *
 * Works for either storage backend — both implement readFile.
 */

import { NextResponse } from "next/server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import type { GetAttachmentUseCase } from "@/core/use-cases/attachments/attachment";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

/**
 * Types the browser may render in place. Anything else (HTML, SVG, office
 * files) is only ever offered as a download, so a stored file can never run
 * as a page on our origin.
 */
const INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export async function serveAttachment(
  id: string,
  disposition: "attachment" | "inline",
): Promise<NextResponse> {
  try {
    await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const container = getContainer();

  try {
    const attachment = await container
      .get<GetAttachmentUseCase>(DI_TOKENS.GetAttachmentUseCase)
      .execute({ id });

    const mimeType = attachment.mimeType || "application/octet-stream";
    if (disposition === "inline" && !INLINE_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "PREVIEW_UNSUPPORTED", message: "Download this file instead" },
        { status: 415 },
      );
    }

    const fileStorage = container.get<IFileStorageService>(
      DI_TOKENS.IFileStorageService,
    );

    const bytes = await fileStorage.readFile(attachment.filePath, "binary");

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        // Headers must be Latin-1, so an Arabic file name would throw here.
        // ASCII fallback for old clients, RFC 5987 filename* for the real name.
        "Content-Disposition": `${disposition}; filename="${attachment.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Content-Length": String(bytes.length),
        // Never cached by a proxy — the bytes are permission-gated.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read attachment";

    return NextResponse.json(
      { error: "DOWNLOAD_FAILED", message },
      { status: 404 },
    );
  }
}
