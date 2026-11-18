import "server-only";
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

/** Who may see a request: see `request-access.ts`. */
export { canSeeRequest } from "@/lib/workflows/request-access";

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
