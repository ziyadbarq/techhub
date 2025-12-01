/**
 * Configuration Item Detail Component
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConfigurationItemDTO } from "@/interface-adapters/dtos/generated/configuration-item.dto";
import { Pencil, X } from "lucide-react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { CICustomFieldsDisplay } from "@/components/custom-fields";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { listCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CRITICALITY_STATUS_MAP,
  ENVIRONMENT_STATUS_MAP,
  isCIStale,
} from "./configuration-items-helpers";
import { getStatusBadgeClasses } from "@/lib/utils/status-colors";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date-format";
import { cn } from "@/lib/utils";

interface ConfigurationItemDetailProps {
  item: ConfigurationItemDTO;
  onClose: () => void;
  onEdit: (item: ConfigurationItemDTO) => void;
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p
        className={cn(
          "font-medium",
          mono && "font-mono text-xs leading-relaxed break-all",
        )}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

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
      } finally {
        setIsLoadingRels(false);
      }
    };

    loadRelationships();
  }, [item.id]);

  const dependsOn = useMemo(
    () => relationships.filter((rel) => rel.fromCiId === item.id),
    [relationships, item.id],
  );
  const impactedBy = useMemo(
    () => relationships.filter((rel) => rel.toCiId === item.id),
    [relationships, item.id],
  );

  const isStale = useMemo(() => isCIStale(item.updatedAt), [item.updatedAt]);
  const hasCustomFields = useMemo(
    () =>
      Boolean(
        item.ciClassId &&
          item.attributes &&
          Object.keys(item.attributes).length > 0,
      ),
    [item.attributes, item.ciClassId],
  );

  const relationshipCount = dependsOn.length + impactedBy.length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto [&>button.absolute]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold">
                  Configuration Item
                </span>
                {isStale && (
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50"
                  >
                    Stale
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl leading-tight font-bold">
                  {item.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.ciClassName && (
                  <Badge variant="secondary">{item.ciClassName}</Badge>
                )}
                {item.criticality && (
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClasses(
                      CRITICALITY_STATUS_MAP[item.criticality] ?? "info",
                    )}
                  >
                    Criticality: {item.criticality}
                  </Badge>
                )}
                {item.environment && (
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClasses(
                      ENVIRONMENT_STATUS_MAP[item.environment] ?? "info",
                    )}
                  >
                    Environment: {item.environment}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4 space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="relationships">
              Relationships
              {relationshipCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {relationshipCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="custom-fields" disabled={!hasCustomFields}>
              Custom Fields
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="CI Class" value={item.ciClassName || "—"} />
              <DetailField
                label="Lifecycle State"
                value={item.lifecycleStateName || "—"}
              />
              <DetailField label="CI Key" value={item.ciKey || "—"} mono />
              <DetailField
                label="Linked Asset"
                value={
                  item.linkedAssetTag ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.linkedAssetTag}
                    </Badge>
                  ) : (
                    "Unlinked"
                  )
                }
              />
              <DetailField
                label="Primary Owner"
                value={item.primaryOwnerName || "—"}
              />
              <DetailField label="Location" value={item.locationName || "—"} />
            </div>

            {item.description && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            {isLoadingRels ? (
              <p className="text-muted-foreground text-sm">
                Loading relationships…
              </p>
            ) : relationshipCount === 0 ? (
              <p className="text-muted-foreground text-sm">
                No relationships found for this configuration item.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {dependsOn.length > 0 && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-muted-foreground text-sm">
                      This CI depends on
                    </p>
                    <div className="space-y-2">
                      {dependsOn.map((rel) => (
                        <div
                          key={rel.id}
                          className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="space-y-1">
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
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-muted-foreground text-sm">
                      This CI is depended on by
                    </p>
                    <div className="space-y-2">
                      {impactedBy.map((rel) => (
                        <div
                          key={rel.id}
                          className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="space-y-1">
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
          </TabsContent>

          <TabsContent value="custom-fields" className="space-y-3">
            {hasCustomFields && item.ciClassId && item.attributes ? (
              <CICustomFieldsDisplay
                ciClassId={item.ciClassId}
                attributes={item.attributes as Record<string, unknown>}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                No custom fields captured for this configuration item.
              </p>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField
                label="Created"
                value={formatDateTime(item.createdAt)}
              />
              <DetailField
                label="Last Updated"
                value={formatDateTime(item.updatedAt)}
              />
              <DetailField label="CI ID" value={item.id} mono />
              <DetailField
                label="Updated"
                value={formatRelativeTime(item.updatedAt)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
