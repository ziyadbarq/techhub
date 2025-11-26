"use client";

import * as React from "react";
import { FileIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
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
import { toast } from "sonner";

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

export function AttachmentsPageClient() {
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

  // Memoized options for searchable selects
  const targetTypeOptions: SearchableSelectOption[] = React.useMemo(
    () => [
      { value: "all", label: "All entity types" },
      ...TARGET_TYPES.map((type) => ({
        value: type.value,
        label: type.label,
      })),
    ],
    [],
  );

  const attachmentTypeOptions: SearchableSelectOption[] = React.useMemo(
    () => [
      { value: "all", label: "All attachment types" },
      ...attachmentTypes.map((type) => ({
        value: type.id,
        label: type.name,
      })),
    ],
    [attachmentTypes],
  );

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
        toast.error(result.error || "Failed to load attachments");
      }
    } finally {
      setLoading(false);
    }
  }, [canView, targetTypeFilter, attachmentTypeFilter]);

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

        toast.success("Attachment downloaded successfully");
      } else {
        toast.error(result.error || "Failed to download attachment");
      }
    } catch (_error) {
      toast.error("Failed to download attachment");
    }
  };

  const handleClearFilters = () => {
    setTargetTypeFilter(undefined);
    setAttachmentTypeFilter(undefined);
  };

  if (!canView) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <FileIcon className="text-muted-foreground h-16 w-16" />
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
      <div className="flex items-end gap-4">
        <div className="max-w-xs flex-1">
          <label className="mb-2 block text-sm font-medium">
            Filter by Entity Type
          </label>
          <SearchableSelect
            options={targetTypeOptions}
            value={targetTypeFilter || "all"}
            onValueChange={(value) =>
              setTargetTypeFilter(value === "all" ? undefined : value)
            }
            placeholder="All entity types"
            searchPlaceholder="Search entity types..."
          />
        </div>

        <div className="max-w-xs flex-1">
          <label className="mb-2 block text-sm font-medium">
            Filter by Attachment Type
          </label>
          <SearchableSelect
            options={attachmentTypeOptions}
            value={attachmentTypeFilter || "all"}
            onValueChange={(value) =>
              setAttachmentTypeFilter(value === "all" ? undefined : value)
            }
            placeholder="All attachment types"
            searchPlaceholder="Search attachment types..."
          />
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
