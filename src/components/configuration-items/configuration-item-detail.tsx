/**
 * Configuration Item Detail Component
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
import { Separator } from "@/components/ui/separator";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { Pencil } from "lucide-react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { format } from "date-fns";
import { CICustomFieldsDisplay } from "@/components/custom-fields";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { listCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { useEffect, useState } from "react";

interface ConfigurationItemDetailProps {
  item: ConfigurationItemDTO;
  onClose: () => void;
  onEdit: (item: ConfigurationItemDTO) => void;
  onSuccess: () => void;
}

const criticalityColors: Record<string, string> = {
  LOW: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

const environmentColors: Record<string, string> = {
  PROD: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  UAT: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  DEV: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  TEST: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  DR: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20",
  OTHER: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
};

export function ConfigurationItemDetail({
  item,
  onClose,
  onEdit,
}: ConfigurationItemDetailProps) {
  const [relationships, setRelationships] = useState<CIRelationshipDTO[]>([]);
  const [isLoadingRels, setIsLoadingRels] = useState(false);

  useEffect(() => {
    const loadRelationships = async () => {
      setIsLoadingRels(true);
      try {
        const result = await listCIRelationshipsAction(
          item.id,
          undefined,
          true,
        );
        if (result.success && result.data) {
          setRelationships(result.data);
        }
      } catch {
        // Best-effort; keep UI resilient
      } finally {
        setIsLoadingRels(false);
      }
    };

    loadRelationships();
  }, [item.id]);

  const dependsOn = relationships.filter((rel) => rel.fromCiId === item.id);
  const impactedBy = relationships.filter((rel) => rel.toCiId === item.id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Configuration Item Details</span>
            <div className="flex gap-2">
              <PermissionGuard
                permission={PERMISSIONS.CONFIGURATION_ITEMS_UPDATE}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PermissionGuard>
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
                <p className="font-medium">{item.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">CI Class</p>
                <p className="font-medium">{item.ciClassName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">CI Key</p>
                <p className="font-mono text-sm">{item.ciKey || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Lifecycle State</p>
                <p className="font-medium">{item.lifecycleStateName || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Classification */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Classification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Criticality
                </p>
                {item.criticality ? (
                  <Badge
                    variant="outline"
                    className={criticalityColors[item.criticality]}
                  >
                    {item.criticality}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Environment
                </p>
                {item.environment ? (
                  <Badge
                    variant="outline"
                    className={environmentColors[item.environment]}
                  >
                    {item.environment}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Ownership & Location */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Ownership & Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Primary Owner</p>
                <p className="font-medium">{item.primaryOwnerName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Location</p>
                <p className="font-medium">{item.locationName || "—"}</p>
              </div>
            </div>
          </div>

          {item.linkedAssetTag && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-lg font-semibold">Linked Asset</h3>
                <div>
                  <p className="text-muted-foreground text-sm">Asset Tag</p>
                  <p className="font-mono text-sm">{item.linkedAssetTag}</p>
                </div>
              </div>
            </>
          )}

          {item.description && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-lg font-semibold">Description</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            </>
          )}

          {/* Custom Fields */}
          {item.ciClassId &&
            item.attributes &&
            Object.keys(item.attributes).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Custom Fields</h3>
                  <CICustomFieldsDisplay
                    ciClassId={item.ciClassId}
                    attributes={item.attributes as Record<string, unknown>}
                  />
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
                <p>{format(new Date(item.createdAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p>{format(new Date(item.updatedAt), "PPp")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono text-xs break-all">{item.id}</p>
              </div>
            </div>
          </div>

          {/* Relationships */}
          <Separator />
          <div>
            <h3 className="mb-3 text-lg font-semibold">
              Relationships
              {isLoadingRels && (
                <span className="text-muted-foreground ml-2 text-xs">
                  Loading…
                </span>
              )}
            </h3>
            {dependsOn.length === 0 &&
            impactedBy.length === 0 &&
            !isLoadingRels ? (
              <p className="text-muted-foreground text-sm">
                No relationships found for this configuration item.
              </p>
            ) : (
              <div className="space-y-4">
                {dependsOn.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      This CI depends on:
                    </p>
                    <div className="space-y-1">
                      {dependsOn.map((rel) => (
                        <div
                          key={rel.id}
                          className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {rel.toCiName || rel.toCiId}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {rel.relationshipTypeName ||
                                rel.relationshipTypeCode ||
                                rel.relationshipTypeId}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {rel.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {impactedBy.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm">
                      This CI is depended on by:
                    </p>
                    <div className="space-y-1">
                      {impactedBy.map((rel) => (
                        <div
                          key={rel.id}
                          className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {rel.fromCiName || rel.fromCiId}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {rel.relationshipTypeName ||
                                rel.relationshipTypeCode ||
                                rel.relationshipTypeId}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {rel.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
