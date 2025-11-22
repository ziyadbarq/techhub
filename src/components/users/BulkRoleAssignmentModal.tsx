/**
 * Bulk Role Assignment Modal Component
 *
 * Modal for assigning roles to multiple users at once.
 * Features: role multi-select, optional expiration date, conflict detection.
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon, AlertTriangle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { UserWithRolesDTO } from "@/interface-adapters/controllers/user-role.controller";
import { bulkAssignRolesToUsersAction } from "@/interface-adapters/controllers/user-role.controller";
import { validateRoleAddition } from "@/lib/rbac/role-conflicts";
import type { RoleConflict } from "@/lib/rbac/role-conflicts";

interface BulkRoleAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: UserWithRolesDTO[];
  availableRoles: { id: string; name: string; displayName: string }[];
  onSuccess: () => void;
}

interface ConflictSummary {
  userId: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  conflicts: RoleConflict[];
}

export function BulkRoleAssignmentModal({
  open,
  onOpenChange,
  selectedUsers,
  availableRoles,
  onSuccess,
}: BulkRoleAssignmentModalProps) {
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [expirationDate, setExpirationDate] = React.useState<Date>();
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [showConflictSummary, setShowConflictSummary] = React.useState(false);
  const [conflictSummary, setConflictSummary] = React.useState<
    ConflictSummary[]
  >([]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedRoleIds(new Set());
      setExpirationDate(undefined);
      setShowConflictSummary(false);
      setConflictSummary([]);
    }
  }, [open]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handlePreflightCheck = () => {
    if (selectedRoleIds.size === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    // Check for conflicts per user/role combination
    const conflicts: ConflictSummary[] = [];

    for (const user of selectedUsers) {
      const currentRoleNames = user.roles
        .filter((r) => r.isActive)
        .map((r) => r.roleName);

      for (const roleId of selectedRoleIds) {
        const role = availableRoles.find((r) => r.id === roleId);
        if (!role) continue;

        const validation = validateRoleAddition(currentRoleNames, role.name);
        if (validation.conflicts.length > 0) {
          conflicts.push({
            userId: user.id,
            userEmail: user.email,
            roleId: role.id,
            roleName: role.displayName,
            conflicts: validation.conflicts,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      setConflictSummary(conflicts);
      setShowConflictSummary(true);
    } else {
      // No conflicts, proceed with assignment
      handleAssign();
    }
  };

  const handleAssign = async (skipConflicts = false) => {
    setIsAssigning(true);
    try {
      // If skipping conflicts, filter out users/roles with critical conflicts
      const userIds = selectedUsers.map((u) => u.id);
      const roleIds = Array.from(selectedRoleIds);

      if (skipConflicts && conflictSummary.length > 0) {
        const _criticalConflicts = conflictSummary.filter((cs) =>
          cs.conflicts.some((c) => c.severity === "critical"),
        );

        // For simplicity, we'll still call the API with all users/roles
        // The backend will handle blocking critical conflicts
        // A more sophisticated approach would pre-filter, but that's complex with many users/roles
      }

      const result = await bulkAssignRolesToUsersAction({
        userIds,
        roleIds,
        expiresAt: expirationDate,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { assigned, conflicts: conflictCount, failed } = result.data;
      if (assigned > 0 && (conflictCount > 0 || failed > 0)) {
        toast.warning(
          `Partially completed: ${assigned} succeeded, ${conflictCount} conflicts, ${failed} failed`,
        );
      } else if (assigned > 0) {
        toast.success(`Successfully assigned ${assigned} role(s)`);
      } else {
        toast.error("No roles were assigned");
      }
      onOpenChange(false);
      onSuccess();
    } catch (_error) {
      toast.error("Failed to assign roles");
    } finally {
      setIsAssigning(false);
      setShowConflictSummary(false);
    }
  };

  // Get summary of users with role counts
  const getUserSummary = () => {
    const activeRoleCounts = selectedUsers.map(
      (u) => u.roles.filter((r) => r.isActive).length,
    );
    const avgRoles =
      activeRoleCounts.length > 0
        ? Math.round(
            activeRoleCounts.reduce((a, b) => a + b, 0) /
              activeRoleCounts.length,
          )
        : 0;
    return { avgRoles, totalUsers: selectedUsers.length };
  };

  const summary = getUserSummary();

  // Count critical conflicts
  const criticalConflictCount = conflictSummary.filter((cs) =>
    cs.conflicts.some((c) => c.severity === "critical"),
  ).length;

  // If showing conflict summary, render conflict dialog instead
  if (showConflictSummary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Role Conflict Detection</DialogTitle>
            <DialogDescription>
              {conflictSummary.length} conflict
              {conflictSummary.length === 1 ? "" : "s"} detected. Review before
              proceeding.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {conflictSummary.map((cs, idx) => {
                const hasCritical = cs.conflicts.some(
                  (c) => c.severity === "critical",
                );
                return (
                  <Card
                    key={idx}
                    className={
                      hasCritical
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                    }
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`mt-0.5 h-5 w-5 ${
                            hasCritical
                              ? "text-red-600 dark:text-red-500"
                              : "text-yellow-600 dark:text-yellow-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              hasCritical
                                ? "text-red-900 dark:text-red-100"
                                : "text-yellow-900 dark:text-yellow-100"
                            }`}
                          >
                            {cs.userEmail} + {cs.roleName}
                          </p>
                          <div className="mt-2 space-y-1">
                            {cs.conflicts.map((conflict, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-center gap-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={
                                    conflict.severity === "critical"
                                      ? "border-red-600 text-red-700"
                                      : conflict.severity === "error"
                                        ? "border-orange-600 text-orange-700"
                                        : "border-yellow-600 text-yellow-700"
                                  }
                                >
                                  {conflict.severity.toUpperCase()}
                                </Badge>
                                <span
                                  className={`text-sm ${
                                    hasCritical
                                      ? "text-red-800 dark:text-red-200"
                                      : "text-yellow-800 dark:text-yellow-200"
                                  }`}
                                >
                                  {conflict.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>{criticalConflictCount}</strong> critical conflict
                {criticalConflictCount === 1 ? "" : "s"} will be blocked.{" "}
                {conflictSummary.length - criticalConflictCount > 0 && (
                  <>
                    <strong>
                      {conflictSummary.length - criticalConflictCount}
                    </strong>{" "}
                    warning
                    {conflictSummary.length - criticalConflictCount === 1
                      ? ""
                      : "s"}{" "}
                    can proceed with caution.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConflictSummary(false)}
              disabled={isAssigning}
            >
              Back
            </Button>
            <Button
              onClick={() => handleAssign(false)}
              disabled={isAssigning}
              variant="default"
            >
              {isAssigning ? "Assigning..." : "Proceed Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Assign Roles</DialogTitle>
          <DialogDescription>
            Assign one or more roles to {selectedUsers.length} selected{" "}
            {selectedUsers.length === 1 ? "user" : "users"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Users Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <CardTitle className="text-base">Selected Users</CardTitle>
              </div>
              <CardDescription>
                {summary.totalUsers}{" "}
                {summary.totalUsers === 1 ? "user" : "users"} with an average of{" "}
                {summary.avgRoles} active{" "}
                {summary.avgRoles === 1 ? "role" : "roles"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user.name || user.email}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {user.roles.filter((r) => r.isActive).length} active{" "}
                          {user.roles.filter((r) => r.isActive).length === 1
                            ? "role"
                            : "roles"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Select Roles to Assign</Label>
            <ScrollArea className="h-64 rounded-md border p-4">
              <div className="space-y-3">
                {availableRoles.map((role) => {
                  const isSelected = selectedRoleIds.has(role.id);
                  return (
                    <div
                      key={role.id}
                      className={`hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRole(role.id)}
                        disabled={isAssigning}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {role.displayName}
                          </span>
                          <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                            {role.name}
                          </code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="text-muted-foreground text-xs">
              {selectedRoleIds.size}{" "}
              {selectedRoleIds.size === 1 ? "role" : "roles"} selected
            </p>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={isAssigning}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? (
                    format(expirationDate, "PPP")
                  ) : (
                    <span className="text-muted-foreground">No expiration</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  disabled={(date: Date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                />
                {expirationDate && (
                  <div className="border-t p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpirationDate(undefined)}
                      className="w-full"
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <p className="text-muted-foreground text-xs">
              If set, all assigned roles will automatically expire on this date
            </p>
          </div>

          {/* Warning Banner */}
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    This will assign the selected roles to all{" "}
                    {selectedUsers.length} users. Users who already have these
                    roles will not be affected.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePreflightCheck}
            disabled={selectedRoleIds.size === 0 || isAssigning}
          >
            {isAssigning
              ? "Assigning..."
              : `Assign ${selectedRoleIds.size} Role${selectedRoleIds.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
