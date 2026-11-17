/** A FILE field's value: the attachments it holds. */
export interface FileFieldItem {
  id: string;
  name: string;
  size: number;
}

export const MAX_FILES_PER_FIELD = 10;

/** Attachment ids referenced by a FILE field value (objects or bare ids). */
export function fileFieldIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      item && typeof item === "object" && "id" in item
        ? String((item as { id: unknown }).id)
        : typeof item === "string"
          ? item
          : "",
    )
    .filter(Boolean);
}

/**
 * A FILE-field upload waits with no request until the request (or a step
 * action) that references it is submitted. Pending uploads older than this
 * are deleted, file and row, by the `workflow-pending-attachment-cleanup` job.
 */
export const PENDING_ATTACHMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Submitting may link a pending upload only while it is younger than this.
 * The hour of margin below the cleanup age means the cleanup job never
 * removes a file that a submission in progress is about to link.
 */
export const PENDING_ATTACHMENT_LINK_WINDOW_MS =
  PENDING_ATTACHMENT_MAX_AGE_MS - 60 * 60 * 1000;
