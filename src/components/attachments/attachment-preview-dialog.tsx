/**
 * Attachment Preview Dialog
 *
 * Shows a PDF or image in place, served by the permission-checked
 * /api/attachments/[id]/preview route. Other file types are not previewable
 * and only offer a download.
 */

"use client";

import { Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";

export type PreviewableAttachment = Pick<
  AttachmentDTO,
  "id" | "fileName" | "isPDF" | "isImage" | "formattedFileSize"
>;

export function canPreviewAttachment(attachment: PreviewableAttachment) {
  return attachment.isPDF || attachment.isImage;
}

export function attachmentDownloadUrl(id: string) {
  return `/api/attachments/${id}/download`;
}

interface AttachmentPreviewDialogProps {
  attachment: PreviewableAttachment | null;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentPreviewDialog({
  attachment,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  const previewUrl = attachment
    ? `/api/attachments/${attachment.id}/preview`
    : "";

  return (
    <Dialog open={attachment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-3 p-4 sm:max-w-5xl">
        <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 pr-8">
          <div className="min-w-0">
            <DialogTitle className="truncate">
              {attachment?.fileName}
            </DialogTitle>
            <DialogDescription>
              {attachment?.formattedFileSize}
            </DialogDescription>
          </div>
          {attachment && (
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={previewUrl} target="_blank" rel="noopener">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
              <Button asChild size="sm" className="gap-2">
                <a href={attachmentDownloadUrl(attachment.id)}>
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="bg-muted min-h-0 flex-1 overflow-hidden rounded-md border">
          {attachment?.isPDF ? (
            <iframe
              key={attachment.id}
              src={previewUrl}
              title={attachment.fileName}
              className="h-full w-full"
            />
          ) : attachment?.isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={attachment.fileName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
