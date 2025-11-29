/**
 * AttachmentList Component
 *
 * Displays a list of attachments for a given target with download and delete capabilities.
 */

"use client";

import * as React from "react";
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listAttachmentsByTarget,
  deleteAttachment,
} from "@/interface-adapters/controllers/attachment.controller";
import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";
import type { TargetObjectTypeEnum } from "@/generated/prisma";
import { formatDateTime } from "@/lib/utils/date-format";

interface AttachmentListProps {
  targetType: TargetObjectTypeEnum;
  targetId: string;
  showDelete?: boolean;
  onAttachmentDeleted?: () => void;
}

export function AttachmentList({
  targetType,
  targetId,
  showDelete = true,
  onAttachmentDeleted,
}: AttachmentListProps) {
  const [attachments, setAttachments] = React.useState<AttachmentDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadAttachments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAttachmentsByTarget(targetType, targetId);
      if (result.success) {
        setAttachments(result.data);
      } else {
        toast.error("Failed to load attachments");
      }
    } catch (error) {
      toast.error("Failed to load attachments");
      console.error("Load attachments error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType]);

  React.useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const result = await deleteAttachment(attachmentId);
      if (result.success) {
        toast.success("Attachment deleted successfully");
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        onAttachmentDeleted?.();
      } else {
        toast.error(result.error || "Failed to delete attachment");
      }
    } catch (error) {
      toast.error("Failed to delete attachment");
      console.error("Delete attachment error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (attachment: AttachmentDTO) => {
    // For now, we'll show a toast. This will be enhanced with actual file download later
    toast.info(
      `Download functionality will be implemented soon: ${attachment.fileName}`,
    );
    // TODO: Implement actual file download using filePath
    // const url = `/api/attachments/${attachment.id}/download`;
    // window.open(url, '_blank');
  };

  const getFileIcon = (attachment: AttachmentDTO) => {
    if (attachment.isImage) {
      return <ImageIcon className="size-8 text-blue-500" />;
    }
    if (attachment.isPDF) {
      return <FileText className="size-8 text-red-500" />;
    }
    return <File className="size-8 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-muted size-8 animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <File className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-2 text-lg font-semibold">No Attachments</h3>
          <p className="text-muted-foreground text-sm">
            No files have been attached to this item yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-4">
          <div className="flex items-start gap-4">
            {/* File Icon */}
            <div className="flex-shrink-0">{getFileIcon(attachment)}</div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4
                  className="truncate font-medium"
                  title={attachment.fileName}
                >
                  {attachment.fileName}
                </h4>
                <div className="flex flex-shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="size-4" />
                  </Button>
                  {showDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === attachment.id}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {attachment.fileName}&quot;? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* File Metadata */}
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {attachment.formattedFileSize}
                  </Badge>
                  {attachment.fileExtension && (
                    <Badge variant="outline" className="text-xs uppercase">
                      {attachment.fileExtension}
                    </Badge>
                  )}
                  {attachment.mimeType && (
                    <span className="text-xs">{attachment.mimeType}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span>Uploaded {formatDateTime(attachment.uploadedAt)}</span>
                </div>
              </div>

              {/* Note */}
              {attachment.note && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {attachment.note}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
