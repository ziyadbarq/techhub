"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentTypesTable } from "@/components/attachment-types/attachment-types-table";
import { AttachmentTypeForm } from "@/components/attachment-types/attachment-type-form";
import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import { listAttachmentTypes } from "@/interface-adapters/controllers/attachment-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

export const dynamic = "force-dynamic";

export default function AttachmentTypesPage() {
  const [attachmentTypes, setAttachmentTypes] = React.useState<
    AttachmentTypeDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAttachmentType, setEditingAttachmentType] =
    React.useState<AttachmentTypeDTO | null>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.ATTACHMENT_TYPES_CREATE);

  const loadAttachmentTypes = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAttachmentTypes();
      if (result.success) {
        setAttachmentTypes(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAttachmentTypes();
  }, [loadAttachmentTypes]);

  const handleEdit = (attachmentType: AttachmentTypeDTO) => {
    setEditingAttachmentType(attachmentType);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingAttachmentType(null);
    void loadAttachmentTypes();
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setEditingAttachmentType(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attachment Types
          </h1>
          <p className="text-muted-foreground">
            Manage attachment types with file validation rules and size limits
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Attachment Type
          </Button>
        )}
      </div>

      <AttachmentTypesTable
        data={attachmentTypes}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadAttachmentTypes}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAttachmentType ? "Edit" : "Create"} Attachment Type
            </DialogTitle>
            <DialogDescription>
              {editingAttachmentType
                ? "Update the attachment type details below."
                : "Fill in the details to create a new attachment type."}
            </DialogDescription>
          </DialogHeader>
          <AttachmentTypeForm
            attachmentType={editingAttachmentType ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
