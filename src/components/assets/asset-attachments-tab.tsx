/**
 * Asset Attachments Tab
 *
 * Built around the help desk's real job on this tab: get the signed delivery
 * note on file. The top card says whether it is on file, walks through
 * print -> sign -> upload, and the queue below uploads with real progress,
 * retry and removal. Every other document for the asset is listed underneath.
 */

"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  FileSignature,
  PenLine,
  Printer,
  TriangleAlert,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AttachmentList } from "@/components/attachments/attachment-list";
import {
  AttachmentPreviewDialog,
  canPreviewAttachment,
} from "@/components/attachments/attachment-preview-dialog";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileUploadItem } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { TargetObjectTypeEnum } from "@/generated/prisma";
import { listAttachmentsByTarget } from "@/interface-adapters/controllers/attachment.controller";
import { listAttachmentTypes } from "@/interface-adapters/controllers/attachment-type.controller";
import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";
import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import { formatDateTime } from "@/lib/utils/date-format";

/**
 * String literal rather than the generated enum object: a value import from
 * "@/generated/prisma" pulls the Prisma runtime (and sharp, via the DI graph)
 * into the browser bundle and breaks the production build.
 */
const ASSET_TARGET_TYPE: TargetObjectTypeEnum = "ASSET";

/** Seeded "Signed Delivery Note" attachment type. */
const DELIVERY_NOTE_TYPE_CODE = "ATT-DELIV";

/** Finished rows leave the queue after this long; the list below has them. */
const CLEAR_SUCCESS_AFTER_MS = 2500;

type UploadResponse =
  { success: true; data: AttachmentDTO } | { success: false; error: string };

/**
 * POST to /api/attachments with XMLHttpRequest, the only browser API that
 * reports upload progress.
 */
function sendWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<UploadResponse> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    register(xhr);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Hold at 95% until the server has stored and recorded the file.
        onProgress(Math.min(95, (event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as UploadResponse);
      } catch {
        // An HTML response means the session expired and we got a login page.
        resolve({
          success: false,
          error: "Session expired. Sign in again and retry.",
        });
      }
    };
    xhr.onerror = () =>
      resolve({ success: false, error: "Network error. Check connection." });
    xhr.onabort = () => resolve({ success: false, error: "Cancelled" });

    xhr.open("POST", "/api/attachments");
    xhr.send(formData);
  });
}

function extensionOf(fileName: string) {
  return fileName.includes(".")
    ? (fileName.split(".").pop()?.toLowerCase() ?? "")
    : "";
}

interface AssetAttachmentsTabProps {
  assetId: string;
  assetTag: string;
  onChange?: () => void;
}

export function AssetAttachmentsTab({
  assetId,
  assetTag,
  onChange,
}: AssetAttachmentsTabProps) {
  const [types, setTypes] = useState<AttachmentTypeDTO[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [queue, setQueue] = useState<FileUploadItem[]>([]);
  // Bumping this remounts the list so new uploads and deletes show up.
  const [reloadKey, setReloadKey] = useState(0);
  const requestsRef = useRef(new Map<string, XMLHttpRequest>());
  const [previewing, setPreviewing] = useState<AttachmentDTO | null>(null);

  const deliveryType = types.find((t) => t.code === DELIVERY_NOTE_TYPE_CODE);
  const selectedType = types.find((t) => t.id === selectedTypeId);

  const signedNote = useMemo(() => {
    if (!deliveryType) return null;
    return (
      attachments
        .filter((a) => a.attachmentTypeId === deliveryType.id)
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        )[0] ?? null
    );
  }, [attachments, deliveryType]);

  const loadStatus = useCallback(async () => {
    const [typesResult, attachmentsResult] = await Promise.all([
      listAttachmentTypes({ activeOnly: true }),
      listAttachmentsByTarget(ASSET_TARGET_TYPE, assetId),
    ]);

    if (typesResult.success) {
      setTypes(typesResult.data);
      setSelectedTypeId((current) => {
        if (current) return current;
        const preferred = typesResult.data.find(
          (t) => t.code === DELIVERY_NOTE_TYPE_CODE,
        );
        return (preferred ?? typesResult.data[0])?.id ?? "";
      });
    }
    if (attachmentsResult.success) {
      setAttachments(attachmentsResult.data);
    }
    setIsLoading(false);
  }, [assetId]);

  useEffect(() => {
    // Fetch on mount; state is set after the await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, [loadStatus]);

  // Abort anything still in flight if the tab unmounts.
  useEffect(() => {
    const requests = requestsRef.current;
    return () => {
      for (const xhr of requests.values()) xhr.abort();
      requests.clear();
    };
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<FileUploadItem>) => {
      setQueue((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const upload = useCallback(
    async (item: FileUploadItem) => {
      const file = item.file;
      const type = selectedType;
      if (!file || !type) {
        patchItem(item.id, {
          status: "error",
          error: "Choose a document type first",
        });
        return;
      }

      // Same rules the server enforces, checked first so the help desk gets
      // an answer before waiting on the upload.
      const allowed = type.allowedExtensions.map((e) => e.toLowerCase());
      if (allowed.length > 0 && !allowed.includes(extensionOf(file.name))) {
        patchItem(item.id, {
          status: "error",
          error: `Use ${allowed.join(", ").toUpperCase()}`,
        });
        return;
      }
      if (file.size > type.maxFileSizeMB * 1024 * 1024) {
        patchItem(item.id, {
          status: "error",
          error: `Larger than ${type.maxFileSizeMB} MB`,
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("attachmentTypeId", type.id);
      formData.append("targetType", ASSET_TARGET_TYPE);
      formData.append("targetId", assetId);
      formData.append("note", "");

      const result = await sendWithProgress(
        formData,
        (progress) => patchItem(item.id, { progress }),
        (xhr) => requestsRef.current.set(item.id, xhr),
      );
      requestsRef.current.delete(item.id);

      if (!result.success) {
        if (result.error !== "Cancelled") {
          patchItem(item.id, { status: "error", error: result.error });
        }
        return;
      }

      patchItem(item.id, { status: "success", progress: 100 });
      toast.success(
        type.code === DELIVERY_NOTE_TYPE_CODE
          ? "Signed delivery note saved"
          : `${file.name} uploaded`,
      );
      window.setTimeout(() => {
        setQueue((current) => current.filter((entry) => entry.id !== item.id));
      }, CLEAR_SUCCESS_AFTER_MS);

      await loadStatus();
      setReloadKey((key) => key + 1);
      onChange?.();
    },
    [assetId, loadStatus, onChange, patchItem, selectedType],
  );

  const handleListChanged = useCallback(() => {
    loadStatus();
    onChange?.();
  }, [loadStatus, onChange]);

  const accept = selectedType?.allowedExtensions.length
    ? selectedType.allowedExtensions.map((e) => `.${e}`).join(",")
    : undefined;
  const acceptedLabel = selectedType?.allowedExtensions.length
    ? selectedType.allowedExtensions.join(", ").toUpperCase()
    : "Any file";

  return (
    <div className="space-y-6">
      {/* Delivery note status + how-to */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                <FileSignature className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">Signed Delivery Note</h3>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : signedNote ? (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      On file
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200">
                      <TriangleAlert className="h-3 w-3" />
                      Missing
                    </Badge>
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-64 max-w-full" />
                ) : signedNote ? (
                  <p className="text-muted-foreground text-sm">
                    {signedNote.fileName} · uploaded{" "}
                    {formatDateTime(signedNote.uploadedAt)}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No signed copy yet. Follow the three steps below.
                  </p>
                )}
              </div>
            </div>

            {signedNote && (
              <div className="flex shrink-0 gap-2">
                {canPreviewAttachment(signedNote) && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setPreviewing(signedNote)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                )}
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={`/api/attachments/${signedNote.id}/download`}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>

          <ol className="grid gap-3 md:grid-cols-3">
            <li className="bg-muted/40 space-y-2 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-foreground text-background grid h-5 w-5 place-items-center rounded-full text-xs">
                  1
                </span>
                Print
              </p>
              <p className="text-muted-foreground text-xs">
                Open the form, pre-filled with this asset and its holder.
              </p>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link
                  href={`/assets/${encodeURIComponent(assetTag)}/delivery-note`}
                >
                  <Printer className="h-4 w-4" />
                  Open Delivery Note
                </Link>
              </Button>
            </li>
            <li className="bg-muted/40 space-y-2 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-foreground text-background grid h-5 w-5 place-items-center rounded-full text-xs">
                  2
                </span>
                Sign
              </p>
              <p className="text-muted-foreground flex gap-2 text-xs">
                <PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The employee signs and dates the printed form when receiving the
                device.
              </p>
            </li>
            <li className="bg-muted/40 space-y-2 rounded-lg border p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-foreground text-background grid h-5 w-5 place-items-center rounded-full text-xs">
                  3
                </span>
                Upload
              </p>
              <p className="text-muted-foreground flex gap-2 text-xs">
                <Upload className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Scan it or take a clear photo, then drop it in the box below.
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Upload */}
      <PermissionGuard permission={PERMISSIONS.ATTACHMENTS_CREATE}>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">Upload documents</h3>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Type</span>
              {isLoading ? (
                <Skeleton className="h-9 w-56" />
              ) : (
                <Select
                  value={selectedTypeId}
                  onValueChange={setSelectedTypeId}
                >
                  <SelectTrigger className="h-9 w-56">
                    <SelectValue placeholder="Choose document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <FileUpload
            value={queue}
            onValueChange={setQueue}
            onFilesAdded={(added) => {
              for (const item of added) upload(item);
            }}
            onRetry={(item) => upload(item)}
            onRemove={(item) => {
              requestsRef.current.get(item.id)?.abort();
              requestsRef.current.delete(item.id);
            }}
            accept={accept}
            disabled={isLoading || !selectedType}
            title={
              selectedType?.code === DELIVERY_NOTE_TYPE_CODE
                ? "Drop the signed delivery note here"
                : "Drop files here"
            }
            description={`${acceptedLabel} · up to ${
              selectedType?.maxFileSizeMB ?? "—"
            } MB each`}
            browseLabel="Choose file"
          />
        </div>
      </PermissionGuard>

      {/* Everything on file */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">All documents</h3>
        <AttachmentList
          key={reloadKey}
          targetType={ASSET_TARGET_TYPE}
          targetId={assetId}
          onAttachmentDeleted={handleListChanged}
        />
      </div>

      <AttachmentPreviewDialog
        attachment={previewing}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />
    </div>
  );
}
