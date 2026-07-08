/**
 * Verification Campaigns Table Component
 */

"use client";
"use no memo";

import { useCallback, useEffect, useState } from "react";
import { type ColumnDef, type ColumnFiltersState } from "@tanstack/react-table";
import { Eye, Edit, Trash2, Play, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils/date-format";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { VerificationCampaignDTO } from "@/interface-adapters/presenters/verification-campaign.presenter";
import { deleteVerificationCampaign } from "@/interface-adapters/controllers/verification-campaign.controller";
import { listVerificationItems } from "@/interface-adapters/controllers/verification-item.controller";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useColumnVisibilityEnhanced } from "@/hooks";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";

interface VerificationCampaignsTableProps {
  data: VerificationCampaignDTO[];
  loading?: boolean;
  onEdit: (campaign: VerificationCampaignDTO) => void;
  onStart: (campaign: VerificationCampaignDTO) => void;
  onComplete: (campaign: VerificationCampaignDTO) => void;
  onRefresh: () => void;
}

interface CampaignWithProgress extends VerificationCampaignDTO {
  totalItems?: number;
  verifiedItems?: number;
}

const equalsOrAll = (
  row: { getValue: (id: string) => unknown },
  id: string,
  value: string,
) => value === "all" || row.getValue(id) === value;

export function VerificationCampaignsTable({
  data,
  loading,
  onEdit,
  onStart,
  onComplete,
  onRefresh,
}: VerificationCampaignsTableProps) {
  const router = useRouter();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [campaignsWithProgress, setCampaignsWithProgress] =
    useState<CampaignWithProgress[]>(data);

  const getFilter = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string) ?? "all";
  const setFilter = (id: string, value: string) =>
    setColumnFilters((prev) =>
      value === "all"
        ? prev.filter((f) => f.id !== id)
        : [...prev.filter((f) => f.id !== id), { id, value }],
    );

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<VerificationCampaignDTO>({
    onDelete: (campaign) => deleteVerificationCampaign(campaign.id),
    onSuccess: onRefresh,
    getItemName: (campaign) => campaign.name,
    entityName: "Campaign",
    description:
      "This action cannot be undone and will delete all associated verification items.",
  });

  // Load progress data for campaigns
  const loadProgressData = useCallback(async () => {
    const campaignsWithProgressData = await Promise.all(
      data.map(async (campaign) => {
        try {
          const itemsResult = await listVerificationItems({
            campaignId: campaign.id,
          });
          if (itemsResult.success) {
            const items = itemsResult.data;
            const verifiedItems = items.filter(
              (item) => item.status === "VERIFIED",
            ).length;
            return {
              ...campaign,
              totalItems: items.length,
              verifiedItems,
            };
          }
        } catch {
          // Ignore errors for individual campaigns
        }
        return { ...campaign, totalItems: 0, verifiedItems: 0 };
      }),
    );
    return campaignsWithProgressData;
  }, [data]);

  // Load progress on mount and when data changes
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const campaignsWithProgressData = await loadProgressData();
      if (!isMounted) return;
      setCampaignsWithProgress(campaignsWithProgressData);
    })();
    return () => {
      isMounted = false;
    };
  }, [loadProgressData]);

  const handleViewItems = (campaignId: string) => {
    router.push(`/verification-campaigns/${campaignId}/items`);
  };

  const getStatusBadge = (campaign: VerificationCampaignDTO) => {
    if (campaign.isCompleted) {
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
          Completed
        </Badge>
      );
    }
    if (campaign.isActive) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
        Future
      </Badge>
    );
  };

  const columns: ColumnDef<CampaignWithProgress>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue<string>("name")}</div>
      ),
    },
    {
      accessorKey: "targetType",
      header: "Target Type",
      cell: ({ row }) => {
        const targetType = row.getValue<string>("targetType");
        return (
          <Badge variant="outline">
            {targetType === "CI" ? "Configuration Items" : "Assets"}
          </Badge>
        );
      },
      filterFn: equalsOrAll,
    },
    {
      accessorKey: "scheduledStart",
      header: "Scheduled Start",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<Date>("scheduledStart"))}
        </div>
      ),
    },
    {
      accessorKey: "scheduledEnd",
      header: "Scheduled End",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDate(row.getValue<Date | null>("scheduledEnd")) || "-"}
        </div>
      ),
      meta: {
        label: "Scheduled End",
        hiddenByDefault: true,
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original),
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const total = row.original.totalItems || 0;
        const verified = row.original.verifiedItems || 0;
        const percentage = total > 0 ? (verified / total) * 100 : 0;

        return (
          <div className="flex min-w-[150px] items-center gap-2">
            <Progress value={percentage} className="h-2 flex-1" />
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {verified}/{total}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const campaign = row.original;
        const canStart = !campaign.hasStarted && !campaign.isCompleted;
        const canComplete = campaign.isActive && !campaign.isCompleted;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewItems(campaign.id)}
              title="View Items"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {canStart && (
              <PermissionGuard
                permission={PERMISSIONS.VERIFICATION_CAMPAIGNS_START}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onStart(campaign)}
                  title="Start Campaign"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            )}

            {canComplete && (
              <PermissionGuard
                permission={PERMISSIONS.VERIFICATION_CAMPAIGNS_COMPLETE}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onComplete(campaign)}
                  title="Complete Campaign"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            )}

            <PermissionGuard
              permission={PERMISSIONS.VERIFICATION_CAMPAIGNS_UPDATE}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(campaign)}
                disabled={campaign.isCompleted}
                title="Edit Campaign"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </PermissionGuard>

            <PermissionGuard
              permission={PERMISSIONS.VERIFICATION_CAMPAIGNS_DELETE}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteDialog.openDialog(campaign)}
                disabled={campaign.isActive || campaign.isCompleted}
                title="Delete Campaign"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        );
      },
    },
  ];

  // Column visibility with persistence
  const { visibility, onVisibilityChange } =
    useColumnVisibilityEnhanced<CampaignWithProgress>({
      storageKey: "verification-campaigns-table-columns",
      columns,
    });

  return (
    <>
      <DataTable
        columns={columns}
        data={campaignsWithProgress}
        loading={loading}
        searchable
        searchKey="name"
        searchPlaceholder="Filter by name..."
        emptyMessage="No campaigns found."
        controlledState={{ columnFilters, columnVisibility: visibility }}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={onVisibilityChange}
        filtersSlot={
          <Select
            value={getFilter("targetType")}
            onValueChange={(value) => setFilter("targetType", value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by target type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CI">Configuration Items</SelectItem>
              <SelectItem value="ASSET">Assets</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <deleteDialog.DialogComponent />
    </>
  );
}
