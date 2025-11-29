/**
 * Checkout Detail Component
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date-format";
import type { AssetKitCheckoutDTO } from "@/interface-adapters/dtos/generated/asset-kit-checkout.dto";

interface CheckoutDetailProps {
  checkout: AssetKitCheckoutDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  PARTIAL_RETURN: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  RETURNED: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  EXTENDED: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
};

export function CheckoutDetail({ checkout, onClose }: CheckoutDetailProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Checkout Details</DialogTitle>
            <Badge
              variant="outline"
              className={statusColors[checkout.status] || ""}
            >
              {checkout.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Kit ID:</span>
                <span className="col-span-2 font-mono">{checkout.kitId}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Assigned To:</span>
                <span className="col-span-2 font-mono">
                  {checkout.assignedToPersonId ||
                    checkout.assignedToOrgUnitId ||
                    "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Checkout Date:</span>
                <span className="col-span-2">
                  {formatDate(checkout.checkoutDate)}
                </span>
              </div>
              {checkout.expectedReturnDate && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">
                    Expected Return:
                  </span>
                  <span className="col-span-2">
                    {formatDate(checkout.expectedReturnDate)}
                  </span>
                </div>
              )}
              {checkout.actualReturnDate && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Actual Return:</span>
                  <span className="col-span-2">
                    {formatDate(checkout.actualReturnDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Items - Placeholder */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Checked Out Items</h3>
            <div className="text-muted-foreground rounded-lg border p-4 text-center text-sm">
              Checkout items and return status will be displayed here
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
