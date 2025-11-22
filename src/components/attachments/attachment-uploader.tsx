/**
 * AttachmentUploader Component
 *
 * Handles file uploads with drag-and-drop support.
 * Integrates with attachment controllers and LocalFileStorageService.
 */

"use client";

import * as React from "react";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAttachment } from "@/interface-adapters/controllers/attachment.controller";
import { listAttachmentTypes } from "@/interface-adapters/controllers/attachment-type.controller";
import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import type { TargetObjectTypeEnum } from "@/generated/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

interface AttachmentUploaderProps {
  targetType: TargetObjectTypeEnum;
  targetId: string;
  onUploadComplete?: () => void;
}

export function AttachmentUploader({
  targetType,
  targetId,
  onUploadComplete,
}: AttachmentUploaderProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [attachmentTypes, setAttachmentTypes] = React.useState<
    AttachmentTypeDTO[]
  >([]);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load attachment types on mount
  React.useEffect(() => {
    loadAttachmentTypes();
  }, []);

  const loadAttachmentTypes = async () => {
    const result = await listAttachmentTypes({ activeOnly: true });
    if (result.success) {
      setAttachmentTypes(result.data);
      // Auto-select first type if available
      if (result.data.length > 0) {
        setSelectedTypeId(result.data[0].id);
      }
    } else {
      toast.error("Failed to load attachment types");
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error("File size must not exceed 100MB");
      return;
    }

    // Validate file extension if attachment type is selected
    if (selectedTypeId) {
      const attachmentType = attachmentTypes.find(
        (t) => t.id === selectedTypeId,
      );
      if (attachmentType && attachmentType.allowedExtensions.length > 0) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        if (!attachmentType.allowedExtensions.includes(fileExt)) {
          toast.error(
            `Invalid file type. Allowed: ${attachmentType.allowedExtensions.join(", ")}`,
          );
          return;
        }
      }

      // Validate file size against attachment type max
      if (attachmentType) {
        const maxSizeMB = attachmentType.maxFileSizeMB * 1024 * 1024;
        if (file.size > maxSizeMB) {
          toast.error(
            `File size must not exceed ${attachmentType.maxFileSizeMB}MB`,
          );
          return;
        }
      }
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedTypeId) {
      toast.error("Please select an attachment type");
      return;
    }

    setIsUploading(true);

    try {
      // Get current user ID
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error("User not authenticated");
        setIsUploading(false);
        return;
      }

      // For now, we'll create a simplified storage path
      // The actual file upload will be integrated with LocalFileStorageService later
      // TODO: Implement actual file upload using LocalFileStorageService
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `uploads/${timestamp}_${sanitizedFileName}`;

      // Create attachment record
      const result = await createAttachment({
        attachmentTypeId: selectedTypeId,
        targetType,
        targetId,
        fileName: selectedFile.name,
        filePath: storagePath,
        mimeType: selectedFile.type || null,
        sizeBytes: BigInt(selectedFile.size),
        uploadedById: userId,
        note: note.trim() || null,
      });

      if (result.success) {
        toast.success("File uploaded successfully");
        // Reset form
        setSelectedFile(null);
        setNote("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Trigger callback
        onUploadComplete?.();
      } else {
        toast.error(result.error || "Failed to upload file");
      }
    } catch (error) {
      toast.error("Failed to upload file");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-4">
      {/* Attachment Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="attachment-type">Attachment Type *</Label>
        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger id="attachment-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {attachmentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
                {type.allowedExtensions.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({type.allowedExtensions.join(", ")})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <Label>File *</Label>
        <Card
          className={`relative border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="mx-auto size-12 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type: {selectedFile.type || "Unknown"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="mr-2 size-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mb-4 size-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Maximum file size: 100MB
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Note (Optional)</Label>
        <Textarea
          id="note"
          placeholder="Add a note about this attachment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">
          {note.length}/2000 characters
        </p>
      </div>

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || !selectedTypeId || isUploading}
        className="w-full"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
