/**
 * Kit Detail Component
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
import type { AssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";

interface KitDetailProps {
  kit: AssetKitDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export function KitDetail({ kit, onClose }: KitDetailProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Kit Details</DialogTitle>
            <Badge
              variant="outline"
              className={
                kit.isActive
                  ? "border-green-500/20 bg-green-500/10 text-green-500"
                  : "border-gray-500/20 bg-gray-500/10 text-gray-500"
              }
            >
              {kit.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Code:</span>
                <span className="col-span-2 font-mono">{kit.code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="col-span-2">{kit.name}</span>
              </div>
              {kit.description && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="col-span-2">{kit.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Management - Placeholder */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Kit Items</h3>
            <div className="text-muted-foreground rounded-lg border p-4 text-center text-sm">
              Kit items management will be displayed here
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
