/**
 * What may be attached to a workflow request.
 *
 * Checked on the server for every upload: the extension must be allowed and
 * the file's actual content (magic number) must match it. Scripts, HTML and
 * SVG are not accepted (they could run in a browser), nor archives
 * (unscannable bundles).
 */

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

interface AllowedType {
  contentType: string;
  /** MIME types file-type may detect for it; "text" = plain text, no magic number. */
  detected: readonly string[] | "text";
}

const OOXML_OR_ZIP = ["application/zip"] as const;
const LEGACY_OFFICE = ["application/x-cfb"] as const;

export const ALLOWED_ATTACHMENT_TYPES: Readonly<Record<string, AllowedType>> = {
  ".pdf": { contentType: "application/pdf", detected: ["application/pdf"] },
  ".png": { contentType: "image/png", detected: ["image/png"] },
  ".jpg": { contentType: "image/jpeg", detected: ["image/jpeg"] },
  ".jpeg": { contentType: "image/jpeg", detected: ["image/jpeg"] },
  ".gif": { contentType: "image/gif", detected: ["image/gif"] },
  ".webp": { contentType: "image/webp", detected: ["image/webp"] },
  ".docx": {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    detected: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ...OOXML_OR_ZIP,
    ],
  },
  ".xlsx": {
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    detected: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ...OOXML_OR_ZIP,
    ],
  },
  ".pptx": {
    contentType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    detected: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ...OOXML_OR_ZIP,
    ],
  },
  ".doc": { contentType: "application/msword", detected: LEGACY_OFFICE },
  ".xls": { contentType: "application/vnd.ms-excel", detected: LEGACY_OFFICE },
  ".ppt": {
    contentType: "application/vnd.ms-powerpoint",
    detected: LEGACY_OFFICE,
  },
  ".msg": {
    contentType: "application/vnd.ms-outlook",
    detected: LEGACY_OFFICE,
  },
  ".txt": { contentType: "text/plain", detected: "text" },
  ".csv": { contentType: "text/csv", detected: "text" },
};

/** For the file picker's `accept` attribute. */
export const ATTACHMENT_ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(
  ",",
);

export {
  fileFieldIds,
  MAX_FILES_PER_FIELD,
  type FileFieldItem,
} from "@/core/domain/workflow/file-field";
