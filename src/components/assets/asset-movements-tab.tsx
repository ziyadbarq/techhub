/**
 * Asset Movements Tab Component
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowRight,
  Package,
  TrendingUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";

interface AssetMovementsTabProps {
  assetId: string;
}

type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

const movementTypeIcons: Record<MovementType, typeof ArrowDown> = {
  IN: ArrowDown,
  OUT: TrendingUp,
  TRANSFER: ArrowUpDown,
  ADJUSTMENT: Package,
};

const movementTypeColors: Record<MovementType, string> = {
  IN: "bg-green-500/10 text-green-700 dark:text-green-400",
  OUT: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  TRANSFER: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  ADJUSTMENT: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

export function AssetMovementsTab({ assetId }: AssetMovementsTabProps) {
  const [movements, setMovements] = useState<StockMovementDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStockMovementsAction({ assetId });
      if (result.success) {
        // Sort by date descending (most recent first)
        const sorted = result.data.sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
        );
        setMovements(sorted);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadMovements();
  }, [assetId, loadMovements]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No movement history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Movement History</h3>
          <p className="text-muted-foreground text-sm">
            {movements.length} movement{movements.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {movements.map((movement) => {
          const Icon =
            movementTypeIcons[movement.movementType as MovementType] || Package;
          const colorClass =
            movementTypeColors[movement.movementType as MovementType] ||
            "bg-gray-500/10 text-gray-700 dark:text-gray-400";

          return (
            <Card key={movement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {movement.movementType}
                      </CardTitle>
                      <CardDescription>
                        {format(
                          new Date(movement.occurredAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </CardDescription>

                      {/* Location Flow */}
                      {(movement.stockLocationFromId ||
                        movement.stockLocationToId) && (
                        <div className="flex items-center gap-2 text-sm">
                          {movement.stockLocationFromId ? (
                            <span className="text-muted-foreground">
                              From: {movement.stockLocationFromId.slice(0, 8)}
                              ...
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <ArrowRight className="h-3 w-3" />
                          {movement.stockLocationToId ? (
                            <span className="text-muted-foreground">
                              To: {movement.stockLocationToId.slice(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">Qty: {movement.quantity}</Badge>
                  </div>
                </div>
              </CardHeader>

              {(movement.reason || movement.performedById) && (
                <CardContent className="space-y-2">
                  {movement.reason && (
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Reason
                      </p>
                      <p className="text-sm">{movement.reason}</p>
                    </div>
                  )}
                  {movement.performedById && (
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Performed By
                      </p>
                      <p className="font-mono text-sm">
                        {movement.performedById.slice(0, 8)}...
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
