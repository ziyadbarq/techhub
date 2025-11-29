/**
 * Movement Timeline Component
 *
 * Displays stock movements in a visual timeline format.
 * Used on asset detail pages to show movement history.
 * Supports voided movement display and filtering.
 */

"use client";

import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Package,
  ArrowRight,
  Ban,
  Bot,
  User,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import type { StockMovementSource } from "@/core/domain/entities/stock-movement.entity";

type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

interface MovementTimelineProps {
  movements: StockMovementDTO[];
  onViewDetails?: (movement: StockMovementDTO) => void;
  onVoid?: (movement: StockMovementDTO) => void;
  canVoid?: boolean;
  showVoided?: boolean;
}

const movementTypeIcons: Record<MovementType, typeof ArrowDown> = {
  IN: ArrowDown,
  OUT: ArrowUp,
  TRANSFER: ArrowUpDown,
  ADJUSTMENT: Package,
};

const movementTypeLabels: Record<MovementType, string> = {
  IN: "Received",
  OUT: "Issued",
  TRANSFER: "Transferred",
  ADJUSTMENT: "Adjusted",
};

const movementTypeColors: Record<MovementType, string> = {
  IN: "border-green-600 bg-green-600",
  OUT: "border-blue-600 bg-blue-600",
  TRANSFER: "border-purple-600 bg-purple-600",
  ADJUSTMENT: "border-orange-600 bg-orange-600",
};

const voidedColors = "border-gray-400 bg-gray-400";

const sourceLabels: Record<StockMovementSource, string> = {
  MANUAL: "Manual Entry",
  ASSIGNMENT: "Asset Assignment",
  RETURN: "Asset Return",
  DISPOSAL: "Asset Disposal",
  IMPORT: "Data Import",
  LOCATION_CHANGE: "Location Change",
  SYSTEM: "System Generated",
};

const sourceBadgeVariants: Record<
  StockMovementSource,
  "default" | "secondary" | "outline"
> = {
  MANUAL: "outline",
  ASSIGNMENT: "secondary",
  RETURN: "secondary",
  DISPOSAL: "secondary",
  IMPORT: "secondary",
  LOCATION_CHANGE: "secondary",
  SYSTEM: "default",
};

function getSourceIcon(source: StockMovementSource) {
  return source === "MANUAL" ? User : Bot;
}

export function MovementTimeline({
  movements,
  onViewDetails,
  onVoid,
  canVoid = false,
  showVoided = false,
}: MovementTimelineProps) {
  // Filter voided movements unless showVoided is true
  const displayedMovements = showVoided
    ? movements
    : movements.filter((m) => !m.isVoided);

  if (displayedMovements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Package className="text-muted-foreground/50 h-12 w-12" />
        <p className="text-muted-foreground mt-4">
          {showVoided ? "No movement history" : "No active movements"}
        </p>
        {!showVoided && movements.length > 0 && (
          <p className="text-muted-foreground/70 text-sm">
            {movements.length} voided movement
            {movements.length !== 1 ? "s" : ""} hidden
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="bg-border absolute top-2 bottom-2 left-[7px] w-0.5" />

      {/* Timeline items */}
      <div className="space-y-4">
        {displayedMovements.map((movement) => {
          const type = movement.movementType as MovementType;
          const Icon = movementTypeIcons[type] || Package;
          const SourceIcon = getSourceIcon(
            movement.source as StockMovementSource,
          );
          const isVoided = movement.isVoided;
          const dotColor = isVoided ? voidedColors : movementTypeColors[type];

          return (
            <div
              key={movement.id}
              className={`relative pl-6 ${isVoided ? "opacity-60" : ""}`}
            >
              {/* Timeline dot */}
              <div
                className={`absolute top-1 left-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${dotColor}`}
              >
                {isVoided && <Ban className="h-2 w-2 text-white" />}
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  isVoided
                    ? "border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
                    : "bg-background"
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-md p-1.5 ${
                        isVoided
                          ? "bg-gray-200 text-gray-500 dark:bg-gray-800"
                          : `bg-${type === "IN" ? "green" : type === "OUT" ? "blue" : type === "TRANSFER" ? "purple" : "orange"}-500/10 text-${type === "IN" ? "green" : type === "OUT" ? "blue" : type === "TRANSFER" ? "purple" : "orange"}-700 dark:text-${type === "IN" ? "green" : type === "OUT" ? "blue" : type === "TRANSFER" ? "purple" : "orange"}-400`
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {movementTypeLabels[type]}
                        </span>
                        {isVoided && (
                          <Badge variant="destructive" className="text-xs">
                            Voided
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {format(
                          new Date(movement.occurredAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Source badge */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={
                              sourceBadgeVariants[
                                movement.source as StockMovementSource
                              ]
                            }
                            className="gap-1"
                          >
                            <SourceIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {movement.isAutoGenerated ? "Auto" : "Manual"}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {sourceLabels[movement.source as StockMovementSource]}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={() => onViewDetails(movement)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {canVoid && onVoid && !isVoided && (
                          <DropdownMenuItem
                            onClick={() => onVoid(movement)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Void Movement
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Location flow */}
                {(movement.stockLocationFromName ||
                  movement.stockLocationToName) && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {movement.stockLocationFromName ? (
                      <span className="text-muted-foreground">
                        {movement.stockLocationFromName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 italic">
                        External
                      </span>
                    )}
                    <ArrowRight className="text-muted-foreground h-3 w-3" />
                    {movement.stockLocationToName ? (
                      <span className="text-muted-foreground">
                        {movement.stockLocationToName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 italic">
                        External
                      </span>
                    )}
                  </div>
                )}

                {/* Reason */}
                {movement.reason && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    {movement.reason}
                  </p>
                )}

                {/* Performed by */}
                {movement.performedByName && (
                  <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    {movement.performedByName}
                  </div>
                )}

                {/* Void info */}
                {isVoided && (
                  <div className="mt-3 rounded-md border border-dashed border-red-300 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950/30">
                    <div className="flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400">
                      <Ban className="h-3 w-3" />
                      Voided
                      {movement.voidedAt && (
                        <span className="font-normal">
                          on{" "}
                          {format(new Date(movement.voidedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    {movement.voidReason && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Reason: {movement.voidReason}
                      </p>
                    )}
                    {movement.voidedByName && (
                      <p className="text-xs text-red-500 dark:text-red-400/70">
                        By: {movement.voidedByName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
