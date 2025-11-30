/**
 * CI Relationship Detail Component
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { Link, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface CIRelationshipDetailProps {
  relationship: CIRelationshipDTO;
  onClose: () => void;
  onEdit: (relationship: CIRelationshipDTO) => void;
  onSuccess: () => void;
}

export function CIRelationshipDetail({
  relationship,
  onClose,
  onEdit: _onEdit,
}: CIRelationshipDetailProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relationship Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Relationship Overview */}
          <div className="bg-muted/50 flex items-center justify-center gap-4 rounded-lg py-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-sm">From</p>
              <p className="text-lg font-semibold">
                {relationship.fromCiName || "Unknown"}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="text-muted-foreground h-6 w-6" />
              <div className="bg-background flex items-center gap-2 rounded-md px-3 py-1">
                <Link className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">
                  {relationship.relationshipTypeName || "Unknown"}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-sm">To</p>
              <p className="text-lg font-semibold">
                {relationship.toCiName || "Unknown"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Status & Validity */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Status & Validity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Status</p>
                <Badge
                  variant="outline"
                  className={
                    relationship.isActive
                      ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                  }
                >
                  {relationship.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Valid From</p>
                <p className="font-medium">
                  {format(new Date(relationship.validFrom), "PPP")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Valid To</p>
                <p className="font-medium">
                  {relationship.validTo
                    ? format(new Date(relationship.validTo), "PPP")
                    : "Indefinite"}
                </p>
              </div>
            </div>
          </div>

          {relationship.note && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-lg font-semibold">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {relationship.note}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{format(new Date(relationship.createdAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{format(new Date(relationship.updatedAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">From CI ID</p>
                <p className="font-mono text-xs break-all">
                  {relationship.fromCiId}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">To CI ID</p>
                <p className="font-mono text-xs break-all">
                  {relationship.toCiId}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Relationship ID</p>
                <p className="font-mono text-xs break-all">{relationship.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
