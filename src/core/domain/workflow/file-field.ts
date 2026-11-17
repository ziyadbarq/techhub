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
