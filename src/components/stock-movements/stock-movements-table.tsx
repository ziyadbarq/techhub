/**
 * Stock Movements Table Component
 * Displays stock movements with filtering, sorting, and actions
 */

"use client";
"use no memo";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  Settings,
  Tag,
  Warehouse,
  Ban,
  Eye,
  User,
  Bot,
  EyeOff,
  X,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EntityDisplay } from "@/components/ui/entity-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import type { StockMovementSource } from "@/core/domain/entities/stock-movement.entity";
import { deleteStockMovementAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { useDeleteDialog } from "@/hooks/use-delete-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { buildSelectColumn, buildActionsColumn } from "@/lib/table-utils";
import { MovementDetailSheet } from "./movement-detail-sheet";
import { VoidMovementDialog } from "./void-movement-dialog";
import { useSessionContext } from "@/contexts/session-context";

const sourceLabels: Record<StockMovementSource, string> = {
  MANUAL: "Manual",
  ASSIGNMENT: "Assignment",
  RETURN: "Return",
  DISPOSAL: "Disposal",
  IMPORT: "Import",
  LOCATION_CHANGE: "Location",
  SYSTEM: "System",
};

const movementTypeLabels: Record<string, string> = {
  IN: "Receiving (IN)",
  OUT: "Issuing (OUT)",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Adjustment",
};

interface StockMovementsTableProps {
  data: StockMovementDTO[];
  loading?: boolean;
  onRefresh: () => void;
  showVoided?: boolean;
  onShowVoidedChange?: (show: boolean) => void;
  personId?: string;
}

const MovementTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "IN":
      return <ArrowDownToLine className="h-4 w-4" />;
    case "OUT":
      return <ArrowUpFromLine className="h-4 w-4" />;
    case "TRANSFER":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "ADJUSTMENT":
      return <Settings className="h-4 w-4" />;
    default:
      return null;
  }
};

export function StockMovementsTable({
  data,
  loading = false,
  onRefresh,
  showVoided = false,
  onShowVoidedChange,
  personId,
}: StockMovementsTableProps) {
  // State for detail and void dialogs
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false);
  const [selectedMovement, setSelectedMovement] =
    React.useState<StockMovementDTO | null>(null);
  const [voidDialogOpen, setVoidDialogOpen] = React.useState(false);
  const [movementToVoid, setMovementToVoid] =
    React.useState<StockMovementDTO | null>(null);

  // Filter states
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");

  const { user } = useSessionContext();
  const { hasPermission } = usePermissions();
  const currentPersonId = personId || user?.id;
  const canVoid = hasPermission(PERMISSIONS.STOCK_MOVEMENTS_VOID);

  // Use reusable delete dialog hook
  const deleteDialog = useDeleteDialog<StockMovementDTO>({
    onDelete: (movement) => deleteStockMovementAction(movement.id),
    onSuccess: onRefresh,
    getItemName: (movement) =>
      movement.assetTag || `Movement ${movement.id.slice(0, 8)}`,
    entityName: "Stock Movement",
    description:
      "This will permanently delete this stock movement record. This action should only be used for corrections and cannot be undone.",
  });

  // Filter data based on showVoided and other filters
  const filteredData = React.useMemo(() => {
    let result = showVoided ? data : data.filter((m) => !m.isVoided);

    if (typeFilter !== "all") {
      result = result.filter((m) => m.movementType === typeFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((m) => m.source === sourceFilter);
    }

    return result;
  }, [data, showVoided, typeFilter, sourceFilter]);

  const voidedCount = data.filter((m) => m.isVoided).length;

  // Check if any filters are active
  const hasActiveFilters = typeFilter !== "all" || sourceFilter !== "all";

  const clearFilters = () => {
    setTypeFilter("all");
    setSourceFilter("all");
  };

  const handleViewDetails = (movement: StockMovementDTO) => {
    setSelectedMovement(movement);
    setDetailSheetOpen(true);
  };

  const handleVoid = (movement: StockMovementDTO) => {
    setMovementToVoid(movement);
    setVoidDialogOpen(true);
  };

  const handleVoided = () => {
    onRefresh();
  };

  const baseColumns = React.useMemo<ColumnDef<StockMovementDTO>[]>(
    () => [
      buildSelectColumn<StockMovementDTO>(),
      {
        accessorKey: "movementType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => {
          const type = row.getValue("movementType") as string;
          const movement = row.original;

          let colorClass = "";
          if (movement.isVoided) {
            colorClass = "bg-gray-500/10 text-gray-500 line-through opacity-60";
          } else if (movement.isReceiving) {
            colorClass = "bg-green-500/10 text-green-700 dark:text-green-400";
          } else if (movement.isIssuing) {
            colorClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400";
          } else if (movement.isTransfer) {
            colorClass =
              "bg-purple-500/10 text-purple-700 dark:text-purple-400";
          } else if (movement.isAdjustment) {
            colorClass =
              "bg-orange-500/10 text-orange-700 dark:text-orange-400";
          }

          return (
            <button
              type="button"
              className="focus-visible:ring-ring flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2"
              onClick={() => handleViewDetails(movement)}
            >
              <Badge
                variant="outline"
                className={`cursor-pointer gap-1.5 ${colorClass}`}
              >
                <MovementTypeIcon type={type} />
                {type}
              </Badge>
              {movement.isVoided && (
                <Badge variant="destructive" className="text-xs">
                  Voided
                </Badge>
              )}
            </button>
          );
        },
        meta: {
          label: "Type",
        },
      },
      {
        accessorKey: "source",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Source" />
        ),
        cell: ({ row }) => {
          const movement = row.original;
          const source = movement.source as StockMovementSource;
          const SourceIcon = movement.isAutoGenerated ? Bot : User;

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={movement.isAutoGenerated ? "secondary" : "outline"}
                    className="gap-1"
                  >
                    <SourceIcon className="h-3 w-3" />
                    {sourceLabels[source]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {movement.isAutoGenerated
                    ? "Automatically generated"
                    : "Manually created"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
        meta: {
          label: "Source",
        },
      },
      {
        accessorKey: "assetTag",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asset" />
        ),
        cell: ({ row }) => {
          const movement = row.original;
          return (
            <button
              type="button"
              className="focus-visible:ring-ring rounded-md transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2"
              onClick={() => handleViewDetails(movement)}
            >
              <EntityDisplay
                name={movement.assetTag}
                icon={Tag}
                className="cursor-pointer"
              />
            </button>
          );
        },
        meta: {
          label: "Asset",
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Quantity" />
        ),
        cell: ({ row }) => {
          const quantity = row.getValue("quantity") as number;
          return <span className="font-medium">{quantity}</span>;
        },
        meta: {
          label: "Quantity",
        },
      },
      {
        accessorKey: "stockLocationFromName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="From" />
        ),
        cell: ({ row }) => (
          <EntityDisplay
            name={row.original.stockLocationFromName}
            icon={Warehouse}
          />
        ),
        meta: {
          label: "From",
        },
      },
      {
        accessorKey: "stockLocationToName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="To" />
        ),
        cell: ({ row }) => (
          <EntityDisplay
            name={row.original.stockLocationToName}
            icon={Warehouse}
          />
        ),
        meta: {
          label: "To",
        },
      },
      {
        accessorKey: "reason",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reason" />
        ),
        cell: ({ row }) => {
          const reason = row.getValue("reason") as string | null;
          return (
            <span className="text-muted-foreground block max-w-[200px] truncate text-sm">
              {reason || "—"}
            </span>
          );
        },
        meta: {
          label: "Reason",
        },
      },
      {
        accessorKey: "occurredAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Occurred" />
        ),
        cell: ({ row }) => {
          const occurredAt = row.getValue("occurredAt") as string;
          return (
            <span className="text-muted-foreground text-sm">
              {format(new Date(occurredAt), "MMM d, yyyy HH:mm")}
            </span>
          );
        },
        meta: {
          label: "Occurred",
        },
      },
    ],
    [],
  );

  // Actions column using reusable builder
  const actionsColumn = React.useMemo(
    () =>
      buildActionsColumn<StockMovementDTO>([
        {
          type: "view",
          label: "View Details",
          onClick: handleViewDetails,
        },
        {
          type: "custom",
          label: "Void Movement",
          icon: Ban,
          permission: PERMISSIONS.STOCK_MOVEMENTS_VOID,
          variant: "destructive",
          separator: true,
          onClick: handleVoid,
          hidden: (movement) => !movement.isActive,
        },
        {
          type: "delete",
          label: "Delete (Correction)",
          permission: PERMISSIONS.STOCK_MOVEMENTS_DELETE,
          variant: "destructive",
          onClick: deleteDialog.openDialog,
          hidden: (movement) => !movement.isActive,
        },
      ]),
    [deleteDialog.openDialog],
  );

  // Merge static columns + actions column
  const allColumns = React.useMemo(() => {
    return [...baseColumns, actionsColumn];
  }, [baseColumns, actionsColumn]);

  // Build toolbar actions with filters
  const toolbarFilters = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Filter */}
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="h-8 w-[150px]">
          <Filter className="mr-2 h-3.5 w-3.5" />
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="IN">{movementTypeLabels.IN}</SelectItem>
          <SelectItem value="OUT">{movementTypeLabels.OUT}</SelectItem>
          <SelectItem value="TRANSFER">
            {movementTypeLabels.TRANSFER}
          </SelectItem>
          <SelectItem value="ADJUSTMENT">
            {movementTypeLabels.ADJUSTMENT}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Source Filter */}
      <Select value={sourceFilter} onValueChange={setSourceFilter}>
        <SelectTrigger className="h-8 w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="MANUAL">{sourceLabels.MANUAL}</SelectItem>
          <SelectItem value="ASSIGNMENT">{sourceLabels.ASSIGNMENT}</SelectItem>
          <SelectItem value="RETURN">{sourceLabels.RETURN}</SelectItem>
          <SelectItem value="DISPOSAL">{sourceLabels.DISPOSAL}</SelectItem>
          <SelectItem value="IMPORT">{sourceLabels.IMPORT}</SelectItem>
          <SelectItem value="LOCATION_CHANGE">
            {sourceLabels.LOCATION_CHANGE}
          </SelectItem>
          <SelectItem value="SYSTEM">{sourceLabels.SYSTEM}</SelectItem>
        </SelectContent>
      </Select>

      {/* Show voided toggle */}
      {voidedCount > 0 && onShowVoidedChange && (
        <div className="flex items-center gap-2">
          <Switch
            id="show-voided-table"
            checked={showVoided}
            onCheckedChange={onShowVoidedChange}
          />
          <Label
            htmlFor="show-voided-table"
            className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm"
          >
            {showVoided ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            Voided ({voidedCount})
          </Label>
        </div>
      )}

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <>
      <DataTable
        columns={allColumns}
        data={filteredData}
        loading={loading}
        searchable
        searchKey="assetTag"
        searchPlaceholder="Search by asset..."
        selectable
        showColumnToggle
        initialColumnVisibility={{
          stockLocationFromName: false,
          stockLocationToName: false,
          quantity: false,
        }}
        toolbarActions={toolbarFilters}
        emptyMessage={
          hasActiveFilters
            ? "No movements match the current filters."
            : showVoided
              ? "No stock movements found. Create one to get started!"
              : "No active stock movements found."
        }
        pagination={{
          pageSize: 20,
        }}
      />

      {/* Detail Sheet */}
      <MovementDetailSheet
        movement={selectedMovement}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onVoid={handleVoid}
        canVoid={canVoid}
      />

      {/* Void Dialog */}
      {currentPersonId && (
        <VoidMovementDialog
          movement={movementToVoid}
          open={voidDialogOpen}
          onOpenChange={setVoidDialogOpen}
          onVoided={handleVoided}
          personId={currentPersonId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <deleteDialog.DialogComponent />
    </>
  );
}
