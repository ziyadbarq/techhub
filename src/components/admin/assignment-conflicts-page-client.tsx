/**
 * Assignment Conflicts Page - Client Component
 *
 * Admin interface for reviewing and resolving assignment conflicts
 * between Intune and manual sources.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, Check, Laptop, User, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import {
  listConflictsAction,
  updateConflictStatusAction,
} from "@/interface-adapters/controllers/asset-assignment.controller";

export function AssignmentConflictsPageClient() {
  const [conflicts, setConflicts] = useState<AssetAssignmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadConflicts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listConflictsAction();
      if (result.success) {
        setConflicts(result.data);
      } else {
        toast.error(result.error || "Failed to load conflicts");
      }
    } catch (_error) {
      toast.error("Failed to load conflicts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const handleResolveConflict = async (assignmentId: string) => {
    setResolvingId(assignmentId);
    try {
      const result = await updateConflictStatusAction({
        assignmentId,
        hasConflict: false,
        conflictNote: null,
      });

      if (result.success) {
        toast.success("Conflict resolved");
        await loadConflicts();
      } else {
        toast.error(result.error || "Failed to resolve conflict");
      }
    } catch (_error) {
      toast.error("Failed to resolve conflict");
    } finally {
      setResolvingId(null);
    }
  };

  const handleFlagConflict = async (assignmentId: string, note: string) => {
    setResolvingId(assignmentId);
    try {
      const result = await updateConflictStatusAction({
        assignmentId,
        hasConflict: true,
        conflictNote: note || null,
      });

      if (result.success) {
        toast.success("Conflict flagged");
        await loadConflicts();
      } else {
        toast.error(result.error || "Failed to flag conflict");
      }
    } catch (_error) {
      toast.error("Failed to flag conflict");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assignment Conflicts</h1>
          <p className="text-muted-foreground mt-2">
            Review and resolve conflicts between Intune and manual assignments
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assignment Conflicts</h1>
          <p className="text-muted-foreground mt-2">
            Review and resolve conflicts between Intune and manual assignments
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <Check className="text-muted-foreground h-16 w-16" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No Conflicts Found</h3>
              <p className="text-muted-foreground text-sm">
                All assignment sources are in agreement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group conflicts by asset
  const conflictsByAsset = conflicts.reduce(
    (acc, assignment) => {
      if (!acc[assignment.assetId]) {
        acc[assignment.assetId] = [];
      }
      acc[assignment.assetId].push(assignment);
      return acc;
    },
    {} as Record<string, AssetAssignmentDTO[]>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Conflicts</h1>
        <p className="text-muted-foreground mt-2">
          {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} across{" "}
          {Object.keys(conflictsByAsset).length} asset
          {Object.keys(conflictsByAsset).length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(conflictsByAsset).map(([assetId, assetConflicts]) => {
          const firstAssignment = assetConflicts[0];

          return (
            <Card key={assetId} className="border-destructive/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="text-destructive h-5 w-5" />
                      Asset: {firstAssignment.assetTag || assetId}
                    </CardTitle>
                    <CardDescription>
                      {assetConflicts.length} conflicting assignment
                      {assetConflicts.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assetConflicts.map((assignment) => {
                  const isActive =
                    !assignment.endDate ||
                    new Date(assignment.endDate) > new Date();

                  return (
                    <div
                      key={assignment.id}
                      className="bg-muted rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {assignment.isIntuneManaged ? (
                              <Laptop className="text-muted-foreground h-4 w-4" />
                            ) : (
                              <User className="text-muted-foreground h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {assignment.isIntuneManaged ? "Intune" : "Manual"}{" "}
                              Assignment
                            </span>
                            {isActive && (
                              <Badge variant="default" className="text-xs">
                                Active
                              </Badge>
                            )}
                            {assignment.isPrimary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Assigned to:
                            </span>{" "}
                            <span className="font-medium">
                              {assignment.assigneeName || assignment.assigneeId}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              ({assignment.assigneeType})
                            </span>
                          </div>

                          <div className="text-muted-foreground text-sm">
                            {format(
                              new Date(assignment.startDate),
                              "MMM d, yyyy",
                            )}
                            {" → "}
                            {assignment.endDate
                              ? format(
                                  new Date(assignment.endDate),
                                  "MMM d, yyyy",
                                )
                              : "Present"}
                          </div>

                          {assignment.conflictNote && (
                            <div className="bg-destructive/10 rounded-md p-3">
                              <p className="text-destructive text-sm">
                                <strong>Conflict Note:</strong>{" "}
                                {assignment.conflictNote}
                              </p>
                            </div>
                          )}

                          {assignment.note && (
                            <div className="text-muted-foreground text-sm">
                              <strong>Note:</strong> {assignment.note}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveConflict(assignment.id)}
                            disabled={resolvingId === assignment.id}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Clear Conflict
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={resolvingId === assignment.id}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Update Note
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Update Conflict Note
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Add or update the conflict note for this
                                  assignment
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-2">
                                <Label htmlFor="conflict-note">
                                  Conflict Note
                                </Label>
                                <Textarea
                                  id="conflict-note"
                                  placeholder="Describe the conflict..."
                                  defaultValue={assignment.conflictNote || ""}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const note =
                                      (
                                        document.getElementById(
                                          "conflict-note",
                                        ) as HTMLTextAreaElement
                                      )?.value || "";
                                    handleFlagConflict(assignment.id, note);
                                  }}
                                >
                                  Update
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
