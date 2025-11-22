/**
 * AttachmentDialog Component
 *
 * Combined dialog for uploading and viewing attachments with tabbed interface.
 */

"use client";

import * as React from "react";
import { Upload, List } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttachmentUploader } from "./attachment-uploader";
import { AttachmentList } from "./attachment-list";
import type { TargetObjectTypeEnum } from "@/generated/prisma";

interface AttachmentDialogProps {
  targetType: TargetObjectTypeEnum;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AttachmentDialog({
  targetType,
  targetId,
  open,
  onOpenChange,
  title = "Manage Attachments",
  description = "Upload new files or view existing attachments",
}: AttachmentDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"upload" | "view">("view");
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUploadComplete = () => {
    // Refresh the attachment list by incrementing the key
    setRefreshKey((prev) => prev + 1);
    // Switch to view tab to see the newly uploaded file
    setActiveTab("view");
  };

  const handleAttachmentDeleted = () => {
    // Refresh the attachment list
    setRefreshKey((prev) => prev + 1);
  };

  // Reset to view tab when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveTab("view");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "view")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <List className="size-4" />
              View All
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="size-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-4 max-h-[500px] overflow-y-auto">
            {/* Key on parent div to force re-render of AttachmentList */}
            <div key={refreshKey}>
              <AttachmentList
                targetType={targetType}
                targetId={targetId}
                showDelete={true}
                onAttachmentDeleted={handleAttachmentDeleted}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <AttachmentUploader
              targetType={targetType}
              targetId={targetId}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
