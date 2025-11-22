"use client";

import * as React from "react";
import { FileIcon, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentsTable } from "@/components/attachments/attachments-table";
import type { AttachmentDTO } from "@/interface-adapters/presenters/attachment.presenter";
import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import {
  listAttachments,
  downloadAttachment,
} from "@/interface-adapters/controllers/attachment.controller";
import { listAttachmentTypes } from "@/interface-adapters/controllers/attachment-type.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

export const dynamic = "force-dynamic";

// Target types for filtering
const TARGET_TYPES = [
  { value: "Asset", label: "Assets" },
  { value: "ConfigurationItem", label: "Configuration Items" },
  { value: "Contract", label: "Contracts" },
  { value: "LicenseProduct", label: "License Products" },
  { value: "LicenseEntitlement", label: "License Entitlements" },
  { value: "Person", label: "Persons" },
  { value: "OrganizationUnit", label: "Organization Units" },
  { value: "Vendor", label: "Vendors" },
  { value: "Warranty", label: "Warranties" },
  { value: "MaintenanceSchedule", label: "Maintenance Schedules" },
  { value: "MaintenanceRecord", label: "Maintenance Records" },
  { value: "AssetDisposal", label: "Asset Disposals" },
  { value: "AssetKit", label: "Asset Kits" },
  { value: "AssetReservation", label: "Asset Reservations" },
  { value: "StockMovement", label: "Stock Movements" },
  { value: "VerificationCampaign", label: "Verification Campaigns" },
  { value: "VerificationItem", label: "Verification Items" },
];

export default function AttachmentsPage() {
  const [attachments, setAttachments] = React.useState<AttachmentDTO[]>([]);
  const [attachmentTypes, setAttachmentTypes] = React.useState<
    AttachmentTypeDTO[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = React.useState<
    string | undefined
  >();
  const [attachmentTypeFilter, setAttachmentTypeFilter] = React.useState<
    string | undefined
  >();

  const { hasPermission } = usePermissions();
  const canView = hasPermission(PERMISSIONS.ATTACHMENTS_VIEW);
  const { toast } = useToast();

  const loadAttachments = React.useCallback(async () => {
    if (!canView) return;

    setLoading(true);
    try {
      const result = await listAttachments({
        targetType: targetTypeFilter,
        attachmentTypeId: attachmentTypeFilter,
      });
      if (result.success) {
        setAttachments(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load attachments",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [canView, targetTypeFilter, attachmentTypeFilter, toast]);

  const loadAttachmentTypes = React.useCallback(async () => {
    const result = await listAttachmentTypes();
    if (result.success) {
      setAttachmentTypes(result.data.filter((t) => t.isActive));
    }
  }, []);

  React.useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  React.useEffect(() => {
    void loadAttachmentTypes();
  }, [loadAttachmentTypes]);

  const handleDownload = async (attachment: AttachmentDTO) => {
    try {
      const result = await downloadAttachment(attachment.id);
      if (result.success) {
        // Create a download link
        const link = document.createElement("a");
        link.href = result.url;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Success",
          description: "Attachment downloaded successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to download attachment",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download attachment",
      });
    }
  };

  const handleClearFilters = () => {
    setTargetTypeFilter(undefined);
    setAttachmentTypeFilter(undefined);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <FileIcon className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to view attachments
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Attachments</h1>
          <p className="text-muted-foreground">
            View and manage attachments across all entities
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">
            Filter by Entity Type
          </label>
          <Select
            value={targetTypeFilter || "all"}
            onValueChange={(value) =>
              setTargetTypeFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entity types</SelectItem>
              {TARGET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium mb-2 block">
            Filter by Attachment Type
          </label>
          <Select
            value={attachmentTypeFilter || "all"}
            onValueChange={(value) =>
              setAttachmentTypeFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All attachment types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All attachment types</SelectItem>
              {attachmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(targetTypeFilter || attachmentTypeFilter) && (
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <AttachmentsTable
        data={attachments}
        loading={loading}
        onDownload={handleDownload}
        onRefresh={loadAttachments}
      />
    </div>
  );
}
