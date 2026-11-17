import "server-only";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "./upload-policy";

export type UploadCheck =
  | { ok: true; contentType: string; fileName: string }
  | { ok: false; error: string; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot).toLowerCase();
}

/** Keep a readable name, drop path parts and control characters. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = [...base]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127 && !'"<>|'.includes(ch);
    })
    .join("")
    .trim();
  return (cleaned || "attachment").slice(0, 180);
}

export async function checkAttachmentUpload(file: {
  name: string;
  bytes: Uint8Array;
}): Promise<UploadCheck> {
  const fileName = safeFileName(file.name);
  if (file.bytes.byteLength === 0) {
    return { ok: false, error: "EMPTY_FILE", message: "The file is empty." };
  }
  if (file.bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: "FILE_TOO_LARGE",
      message: "Files can be up to 10 MB.",
    };
  }
  const allowed = ALLOWED_ATTACHMENT_TYPES[extensionOf(fileName)];
  if (!allowed) {
    return {
      ok: false,
      error: "FILE_TYPE_NOT_ALLOWED",
      message:
        "This file type isn't allowed. Use PDF, Word, Excel, PowerPoint, an image, Outlook message, TXT or CSV.",
    };
  }

  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(file.bytes);
  const matches =
    allowed.detected === "text"
      ? !detected && !file.bytes.subarray(0, 8192).includes(0)
      : !!detected && allowed.detected.includes(detected.mime);
  if (!matches) {
    return {
      ok: false,
      error: "FILE_CONTENT_MISMATCH",
      message: "The file's content doesn't match its extension.",
    };
  }
  return { ok: true, contentType: allowed.contentType, fileName };
}
