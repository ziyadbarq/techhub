/**
 * Asset Movements Tab Component
 *
 * Displays stock movement history for an asset in a timeline format.
 * Supports voiding movements and toggling visibility of voided entries.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { StockMovementDTO } from "@/interface-adapters/presenters/stock-movement.presenter";
import { listStockMovementsAction } from "@/interface-adapters/controllers/stock-movement.controller";
import { MovementTimeline } from "@/components/stock-movements/movement-timeline";
import { MovementDetailSheet } from "@/components/stock-movements/movement-detail-sheet";
import { VoidMovementDialog } from "@/components/stock-movements/void-movement-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { useSessionContext } from "@/contexts/session-context";

interface AssetMovementsTabProps {
  assetId: string;
  personId?: string;
}

export function AssetMovementsTab({
  assetId,
  personId,
}: AssetMovementsTabProps) {
  const [movements, setMovements] = useState<StockMovementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoided, setShowVoided] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<StockMovementDTO | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [movementToVoid, setMovementToVoid] = useState<StockMovementDTO | null>(
    null,
  );

  const { hasPermission } = usePermissions();
  const { user } = useSessionContext();
  const canVoid = hasPermission("stock-movements:void");

  // Get current person ID for void action
  const currentPersonId = personId || user?.id;

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      // Include voided movements in the request - we'll filter client-side
      const result = await listStockMovementsAction({
        assetId,
        includeVoided: true,
      });
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

  const handleViewDetails = (movement: StockMovementDTO) => {
    setSelectedMovement(movement);
    setDetailSheetOpen(true);
  };

  const handleVoid = (movement: StockMovementDTO) => {
    setMovementToVoid(movement);
    setVoidDialogOpen(true);
  };

  const handleVoided = (voidedMovement: StockMovementDTO) => {
    // Update the movement in the list
    setMovements((prev) =>
      prev.map((m) => (m.id === voidedMovement.id ? voidedMovement : m)),
    );
  };

  // Count voided movements
  const voidedCount = movements.filter((m) => m.isVoided).length;
  const activeCount = movements.length - voidedCount;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Movement History</CardTitle>
          <p className="text-muted-foreground text-sm">
            {activeCount} active movement{activeCount !== 1 ? "s" : ""}
            {voidedCount > 0 && (
              <span className="text-muted-foreground/70">
                {" "}
                • {voidedCount} voided
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {voidedCount > 0 && (
            <div className="flex items-center gap-2">
              <Switch
                id="show-voided"
                checked={showVoided}
                onCheckedChange={setShowVoided}
              />
              <Label
                htmlFor="show-voided"
                className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm"
              >
                {showVoided ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                Show voided
              </Label>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadMovements}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          <MovementTimeline
            movements={movements}
            showVoided={showVoided}
            onViewDetails={handleViewDetails}
            onVoid={handleVoid}
            canVoid={canVoid}
          />
        </CardContent>
      </Card>

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
    </div>
  );
}
