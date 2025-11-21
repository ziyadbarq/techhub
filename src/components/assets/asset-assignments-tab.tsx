/**
 * Asset Assignments Tab Component
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";

interface AssetAssignmentsTabProps {
  assetId: string;
}

export function AssetAssignmentsTab({ assetId }: AssetAssignmentsTabProps) {
  const [assignments, setAssignments] = useState<AssetAssignmentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAssetAssignmentsAction({ assetId });
      if (result.success) {
        setAssignments(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadAssignments();
  }, [assetId, loadAssignments]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No assignment history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assignment History</h3>
          <p className="text-muted-foreground text-sm">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const isActive =
            !assignment.endDate || new Date(assignment.endDate) > new Date();

          return (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {assignment.assigneeType}:{" "}
                      {assignment.assigneeId.slice(0, 8)}...
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(assignment.startDate), "MMM d, yyyy")}
                      {" → "}
                      {assignment.endDate
                        ? format(new Date(assignment.endDate), "MMM d, yyyy")
                        : "Present"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {isActive && <Badge variant="default">Active</Badge>}
                    {assignment.isPrimary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {assignment.note && (
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {assignment.note}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
