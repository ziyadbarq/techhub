/**
 * Asset Assignments Tab Component
 *
 * Displays asset assignments separated by source (Intune vs Manual)
 * using CountedTabs to show dual assignment support and conflict detection.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, Laptop, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CountedTabs,
  type CountedTabConfig,
} from "@/components/ui/counted-tabs";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";

interface AssetAssignmentsTabProps {
  assetId: string;
}

function AssignmentCard({ assignment }: { assignment: AssetAssignmentDTO }) {
  const isActive =
    !assignment.endDate || new Date(assignment.endDate) > new Date();

  return (
    <Card key={assignment.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {assignment.assigneeType}:{" "}
              {assignment.assigneeName || assignment.assigneeId}
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
            {assignment.hasConflict && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Conflict
              </Badge>
            )}
            {isActive && <Badge variant="default">Active</Badge>}
            {assignment.isPrimary && <Badge variant="secondary">Primary</Badge>}
          </div>
        </div>
      </CardHeader>
      {(assignment.note || assignment.conflictNote) && (
        <CardContent className="space-y-2">
          {assignment.note && (
            <p className="text-muted-foreground text-sm">{assignment.note}</p>
          )}
          {assignment.conflictNote && (
            <div className="bg-destructive/10 rounded-md p-3">
              <p className="text-destructive text-sm font-medium">
                Conflict: {assignment.conflictNote}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function AssignmentList({
  assignments,
  emptyMessage,
}: {
  assignments: AssetAssignmentDTO[];
  emptyMessage: string;
}) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
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

  // Separate assignments by source
  const intuneAssignments = assignments.filter((a) => a.isIntuneManaged);
  const manualAssignments = assignments.filter((a) => a.isManual);
  const otherAssignments = assignments.filter(
    (a) => !a.isIntuneManaged && !a.isManual,
  );

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

  const tabs: CountedTabConfig[] = [
    {
      value: "manual",
      label: "Manual",
      icon: User,
      count: manualAssignments.length,
      showWhenZero: true,
      content: (
        <AssignmentList
          assignments={manualAssignments}
          emptyMessage="No manual assignments"
        />
      ),
    },
    {
      value: "intune",
      label: "Intune",
      icon: Laptop,
      count: intuneAssignments.length,
      showWhenZero: true,
      content: (
        <AssignmentList
          assignments={intuneAssignments}
          emptyMessage="No Intune-managed assignments"
        />
      ),
    },
  ];

  // Add "Other" tab only if there are assignments from other sources
  if (otherAssignments.length > 0) {
    tabs.push({
      value: "other",
      label: "Other",
      count: otherAssignments.length,
      content: (
        <AssignmentList
          assignments={otherAssignments}
          emptyMessage="No other assignments"
        />
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assignment History</h3>
          <p className="text-muted-foreground text-sm">
            <span>
              {assignments.length} assignment
              {assignments.length !== 1 ? "s" : ""}
            </span>
            <span className="mx-1">-</span>
            <span>
              {intuneAssignments.length > 0 && manualAssignments.length > 0
                ? "Intune and manual"
                : intuneAssignments.length > 0
                  ? "Intune"
                  : "manual"}{" "}
              sources
            </span>
          </p>
        </div>
      </div>

      <CountedTabs tabs={tabs} defaultValue="manual" loading={loading} />
    </div>
  );
}
