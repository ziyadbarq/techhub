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

interface BulkRoleAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: UserWithRolesDTO[];
  availableRoles: { id: string; name: string; displayName: string }[];
  onSuccess: () => void;
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

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedRoleIds(new Set());
      setExpirationDate(undefined);
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

  const handleAssign = async () => {
    if (selectedRoleIds.size === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await bulkAssignRolesToUsersAction({
        userIds: selectedUsers.map((u) => u.id),
        roleIds: Array.from(selectedRoleIds),
        expiresAt: expirationDate,
      });

      if (result.success) {
        toast.success(
          `Successfully assigned ${selectedRoleIds.size} role(s) to ${selectedUsers.length} user(s)`,
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to assign roles");
    } finally {
      setIsAssigning(false);
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
                {summary.totalUsers} {summary.totalUsers === 1 ? "user" : "users"}{" "}
                with an average of {summary.avgRoles} active{" "}
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
                          <span className="font-medium">{role.displayName}</span>
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
              {selectedRoleIds.size} {selectedRoleIds.size === 1 ? "role" : "roles"}{" "}
              selected
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
                  disabled={(date: Date) => date < new Date()}
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
                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <p className="text-yellow-900 dark:text-yellow-100 text-sm">
                    This will assign the selected roles to all {selectedUsers.length}{" "}
                    users. Users who already have these roles will not be affected.
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
            onClick={handleAssign}
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
