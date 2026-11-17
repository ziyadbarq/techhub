"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { FileUpload, type FileUploadItem } from "@/components/ui/file-upload";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  MAX_FILES_PER_FIELD,
  type FileFieldItem,
} from "@/lib/workflows/attachments/upload-policy";

function asItems(value: unknown): FileFieldItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FileFieldItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as FileFieldItem).id === "string",
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type UploadResponse = { file?: FileFieldItem; message?: string };

/**
 * POST with XMLHttpRequest, the only browser API that reports upload
 * progress (same approach as the asset attachments tab).
 */
function sendWithProgress(
  body: FormData,
  onProgress: (percent: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<{ ok: boolean; data: UploadResponse }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Hold at 95% until the server has checked and stored the file.
        onProgress(Math.min(95, (event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          data: JSON.parse(xhr.responseText) as UploadResponse,
        });
      } catch {
        resolve({
          ok: false,
          data: { message: "Session expired. Sign in again and retry." },
        });
      }
    };
    xhr.onerror = () =>
      resolve({
        ok: false,
        data: { message: "Network error. Check connection." },
      });
    xhr.onabort = () => resolve({ ok: false, data: { message: "Cancelled" } });
    xhr.open("POST", "/api/workflow/uploads");
    xhr.send(body);
  });
}

/**
 * A form's FILE field, using the same uploader as asset attachments. Files
 * upload as soon as they are added and wait, private to the uploader, until
 * the request is submitted. The field value is the list of uploaded files
 * ({ id, name, size }).
 */
export function FileFieldInput({
  fieldKey,
  value,
  onChange,
  readOnly,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (next: FileFieldItem[]) => void;
  readOnly?: boolean;
}) {
  const initial = asItems(value);
  // Rows shown by the uploader. Already-uploaded files use their attachment
  // id as the row id; new rows get a local id until their upload finishes.
  const [queue, setQueue] = useState<FileUploadItem[]>(() =>
    initial.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      status: "success",
      progress: 100,
    })),
  );
  const uploaded = useRef(
    new Map<string, FileFieldItem>(initial.map((file) => [file.id, file])),
  );
  const requests = useRef(new Map<string, XMLHttpRequest>());

  // The field value follows the rows that finished uploading.
  const currentIds = asItems(value)
    .map((file) => file.id)
    .join("|");
  useEffect(() => {
    const files = queue
      .filter((row) => row.status === "success")
      .map((row) => uploaded.current.get(row.id))
      .filter((file): file is FileFieldItem => !!file);
    if (files.map((file) => file.id).join("|") !== currentIds) {
      onChange(files);
    }
  }, [queue, currentIds, onChange]);

  const patch = (id: string, change: Partial<FileUploadItem>) =>
    setQueue((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...change } : row)),
    );

  async function upload(item: FileUploadItem) {
    if (!item.file) return;
    if (item.file.size > MAX_ATTACHMENT_BYTES) {
      patch(item.id, {
        status: "error",
        error: "Files can be up to 10 MB.",
      });
      return;
    }
    const body = new FormData();
    body.append("file", item.file);
    body.append("fieldKey", fieldKey);
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    const result = await sendWithProgress(
      body,
      (progress) => patch(item.id, { progress }),
      (xhr) => requests.current.set(item.id, xhr),
    );
    requests.current.delete(item.id);
    if (result.ok && result.data.file) {
      uploaded.current.set(item.id, result.data.file);
      patch(item.id, { status: "success", progress: 100 });
    } else {
      patch(item.id, {
        status: "error",
        error: result.data.message ?? "Upload failed.",
      });
    }
  }

  if (readOnly) {
    if (initial.length === 0) {
      return <p className="text-sm text-[var(--color-stone)]">No files</p>;
    }
    return (
      <ul className="space-y-1.5">
        {initial.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] px-3 py-2 text-sm"
          >
            <FileText className="h-4 w-4 shrink-0 text-[var(--color-stone)]" />
            <a
              href={`/api/workflow/attachments/${file.id}`}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate font-medium text-[var(--color-brand-blue)] hover:underline"
            >
              {file.name}
            </a>
            <span className="shrink-0 text-xs text-[var(--color-stone)]">
              {formatSize(file.size)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <FileUpload
      value={queue}
      onValueChange={setQueue}
      onFilesAdded={(added) => {
        for (const item of added) void upload(item);
      }}
      onRetry={(item) => void upload(item)}
      onRemove={(item) => {
        requests.current.get(item.id)?.abort();
        requests.current.delete(item.id);
        uploaded.current.delete(item.id);
      }}
      accept={ATTACHMENT_ACCEPT}
      maxFiles={MAX_FILES_PER_FIELD}
      title="Drop files here"
      description="PDF, Word, Excel, PowerPoint, images, Outlook messages, TXT or CSV · up to 10 MB each"
      browseLabel="Choose files"
    />
  );
}
