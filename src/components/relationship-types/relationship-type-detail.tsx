/**
 * Relationship Type Detail Component
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RelationshipTypeDTO } from "@/interface-adapters/dtos/generated/relationship-type.dto";
import {
  Pencil,
  X,
  ArrowRightLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { format } from "date-fns";

interface RelationshipTypeDetailProps {
  type: RelationshipTypeDTO;
  onClose: () => void;
  onEdit: (type: RelationshipTypeDTO) => void;
  onSuccess: () => void;
}

export function RelationshipTypeDetail({
  type,
  onClose,
  onEdit,
}: RelationshipTypeDetailProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Relationship Type Details</span>
            <div className="flex gap-2">
              <PermissionGuard
                permission={PERMISSIONS.RELATIONSHIP_TYPES_UPDATE}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(type)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PermissionGuard>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Name</p>
                <p className="text-lg font-medium">{type.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Code</p>
                <p className="bg-muted inline-block rounded px-2 py-1 font-mono text-sm uppercase">
                  {type.code}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Characteristics */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Characteristics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Direction</p>
                <div className="flex items-center gap-2">
                  {type.direction === "BIDIRECTIONAL" ? (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Bidirectional</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Unidirectional</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {type.direction === "BIDIRECTIONAL"
                    ? "Relationship applies in both directions"
                    : "Relationship flows in one direction"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Impacting Relationship
                </p>
                <div className="flex items-center gap-2">
                  {type.isImpacting ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">No</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {type.isImpacting
                    ? "Used for dependency and impact analysis"
                    : "Not used for impact analysis"}
                </p>
              </div>
            </div>
          </div>

          {type.description && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-lg font-semibold">Description</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {type.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Usage Examples */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Usage Examples</h3>
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-medium">Example 1:</span> Application{" "}
                <span className="text-muted-foreground italic">
                  {type.name}
                </span>{" "}
                Server
              </p>
              {type.direction === "BIDIRECTIONAL" && (
                <p className="text-sm">
                  <span className="font-medium">Example 2:</span> Server{" "}
                  <span className="text-muted-foreground italic">
                    {type.name}
                  </span>{" "}
                  Application
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{format(new Date(type.createdAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{format(new Date(type.updatedAt), "PPp")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono text-xs break-all">{type.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
