/**
 * Role Assignment Component
 *
 * UI for managing user role assignments.
 * Features: current roles list, add roles with expiration, revoke roles.
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { UserWithRolesDTO } from "@/interface-adapters/controllers/user-role.controller";
import {
  assignRoleToUserAction,
  revokeRoleFromUserAction,
} from "@/interface-adapters/controllers/user-role.controller";
import {
  validateRoleAddition,
  detectRoleConflicts,
} from "@/lib/rbac/role-conflicts";

interface RoleAssignmentProps {
  user: UserWithRolesDTO;
  availableRoles: { id: string; name: string; displayName: string }[];
  onUpdate: () => void;
}

export function RoleAssignment({
  user,
  availableRoles,
  onUpdate,
}: RoleAssignmentProps) {
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("");
  const [expirationDate, setExpirationDate] = React.useState<Date>();
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
  const [roleToRevoke, setRoleToRevoke] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

  // Filter out roles that user already has (active only)
  const activeRoleIds = user.roles
    .filter((r) => r.isActive)
    .map((r) => r.roleId);
  const assignableRoles = availableRoles.filter(
    (r) => !activeRoleIds.includes(r.id),
  );

  // Get current active role names for conflict detection
  const currentRoleNames = user.roles
    .filter((r) => r.isActive)
    .map((r) => r.roleName);

  // Get selected role name for conflict detection
  const selectedRoleName = React.useMemo(() => {
    if (!selectedRoleId) return null;
    const selectedRole = availableRoles.find((r) => r.id === selectedRoleId);
    return selectedRole?.name ?? null;
  }, [selectedRoleId, availableRoles]);

  // Detect conflicts with selected role
  const conflictValidation = React.useMemo(() => {
    if (!selectedRoleName) {
      return { canAdd: true, conflicts: [] };
    }

    return validateRoleAddition(currentRoleNames, selectedRoleName);
  }, [selectedRoleName, currentRoleNames]);

  const hasCriticalConflicts = conflictValidation.conflicts.some(
    (c) => c.severity === "critical",
  );

  // Detect existing conflicts among current roles
  const existingConflicts = React.useMemo(() => {
    return detectRoleConflicts(currentRoleNames);
  }, [currentRoleNames]);

  // Helper to check if a role is involved in conflicts
  const getRoleConflicts = (roleName: string) => {
    return existingConflicts.conflicts.filter(
      (c) => c.role1 === roleName || c.role2 === roleName,
    );
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      toast.error("Please select a role");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignRoleToUserAction({
        userId: user.id,
        roleId: selectedRoleId,
        expiresAt: expirationDate,
      });

      if (result.success) {
        toast.success("Role assigned successfully");
        setSelectedRoleId("");
        setExpirationDate(undefined);
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to assign role");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!roleToRevoke) return;

    setIsRevoking(true);
    try {
      const result = await revokeRoleFromUserAction({
        userId: user.id,
        roleId: roleToRevoke.id,
      });

      if (result.success) {
        toast.success("Role revoked successfully");
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to revoke role");
    } finally {
      setIsRevoking(false);
      setRevokeDialogOpen(false);
      setRoleToRevoke(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Current Roles</CardTitle>
          <CardDescription>
            Roles currently assigned to this user
            {existingConflicts.hasConflicts && (
              <Badge
                variant="outline"
                className="border-yellow-600 text-yellow-700 ml-2"
              >
                {existingConflicts.conflicts.length} Conflict
                {existingConflicts.conflicts.length > 1 ? "s" : ""}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No roles assigned yet.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Existing Conflicts Warning */}
              {existingConflicts.hasConflicts && (
                <div className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950 rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-500 mt-0.5 h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-yellow-900 dark:text-yellow-100 text-sm font-medium">
                        Conflicting Roles Detected
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200 mt-1 text-xs">
                        This user has {existingConflicts.conflicts.length} role
                        conflict{existingConflicts.conflicts.length > 1 ? "s" : ""}.
                        Review for segregation of duties compliance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user.roles.map((role) => {
                const roleConflicts = role.isActive
                  ? getRoleConflicts(role.roleName)
                  : [];
                const hasConflicts = roleConflicts.length > 0;

                return (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      hasConflicts ? "border-yellow-300 bg-yellow-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {role.roleDisplayName}
                          </span>
                          {!role.isActive && (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground text-xs"
                            >
                              Expired
                            </Badge>
                          )}
                          {hasConflicts && (
                            <Badge
                              variant="outline"
                              className="border-yellow-600 text-yellow-700 text-xs"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Conflicts
                            </Badge>
                          )}
                        </div>
                        {role.expiresAt && (
                          <span className="text-muted-foreground text-xs">
                            {role.isActive ? "Expires" : "Expired"}:{" "}
                            {format(new Date(role.expiresAt), "PPP")}
                          </span>
                        )}
                        {hasConflicts && (
                          <div className="mt-1 space-y-1">
                            {roleConflicts.map((conflict, idx) => (
                              <p
                                key={idx}
                                className="text-yellow-800 dark:text-yellow-200 text-xs"
                              >
                                Conflicts with:{" "}
                                <span className="font-medium">
                                  {conflict.role1 === role.roleName
                                    ? conflict.role2
                                    : conflict.role1}
                                </span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {role.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRoleToRevoke({
                            id: role.roleId,
                            name: role.roleDisplayName,
                          });
                          setRevokeDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role */}
      <Card>
        <CardHeader>
          <CardTitle>Add Role</CardTitle>
          <CardDescription>
            Assign a new role to this user with optional expiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignableRoles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              All available roles are already assigned to this user.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Select Role</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conflict Warnings */}
              {conflictValidation.conflicts.length > 0 && (
                <div
                  className={`rounded-lg border p-4 ${
                    hasCriticalConflicts
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`mt-0.5 h-5 w-5 ${
                        hasCriticalConflicts
                          ? "text-red-600 dark:text-red-500"
                          : "text-yellow-600 dark:text-yellow-500"
                      }`}
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-semibold ${
                          hasCriticalConflicts
                            ? "text-red-900 dark:text-red-100"
                            : "text-yellow-900 dark:text-yellow-100"
                        }`}
                      >
                        {hasCriticalConflicts
                          ? "Critical Role Conflict"
                          : "Role Conflict Warning"}
                      </h4>
                      <div className="mt-2 space-y-2">
                        {conflictValidation.conflicts.map((conflict, idx) => (
                          <div
                            key={idx}
                            className={`rounded-md border p-2 ${
                              hasCriticalConflicts
                                ? "border-red-300 bg-white dark:border-red-700 dark:bg-red-900/20"
                                : "border-yellow-300 bg-white dark:border-yellow-700 dark:bg-yellow-900/20"
                            }`}
                          >
                            <p
                              className={`text-sm ${
                                hasCriticalConflicts
                                  ? "text-red-900 dark:text-red-100"
                                  : "text-yellow-900 dark:text-yellow-100"
                              }`}
                            >
                              <span className="font-medium">
                                {conflict.role1 === selectedRoleName
                                  ? conflict.role2
                                  : conflict.role1}
                              </span>
                            </p>
                            <p
                              className={`mt-1 text-xs ${
                                hasCriticalConflicts
                                  ? "text-red-700 dark:text-red-300"
                                  : "text-yellow-700 dark:text-yellow-300"
                              }`}
                            >
                              {conflict.reason}
                            </p>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className={
                                  conflict.severity === "critical"
                                    ? "border-red-600 text-red-700 dark:border-red-500 dark:text-red-300"
                                    : conflict.severity === "error"
                                      ? "border-orange-600 text-orange-700 dark:border-orange-500 dark:text-orange-300"
                                      : "border-yellow-600 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300"
                                }
                              >
                                {conflict.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      {hasCriticalConflicts && (
                        <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                          This role cannot be assigned due to critical conflicts
                          with segregation of duties policies.
                        </p>
                      )}
                      {!hasCriticalConflicts && (
                        <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                          You can still assign this role, but review the
                          conflicts carefully.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? (
                        format(expirationDate, "PPP")
                      ) : (
                        <span className="text-muted-foreground">
                          No expiration
                        </span>
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
                  If set, the role will automatically expire on this date
                </p>
              </div>

              <Button
                onClick={handleAssignRole}
                disabled={
                  !selectedRoleId || isAssigning || hasCriticalConflicts
                }
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isAssigning ? "Assigning..." : "Assign Role"}
              </Button>
              {hasCriticalConflicts && (
                <p className="text-destructive text-center text-xs">
                  Cannot assign role due to critical conflicts
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the &quot;{roleToRevoke?.name}
              &quot; role from this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeRole}
              disabled={isRevoking}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isRevoking ? "Revoking..." : "Revoke Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
