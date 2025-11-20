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
import { Calendar as CalendarIcon, Trash2, Plus } from "lucide-react";

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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.roles.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No roles assigned yet.
            </p>
          ) : (
            <div className="space-y-3">
              {user.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border p-3"
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
                      </div>
                      {role.expiresAt && (
                        <span className="text-muted-foreground text-xs">
                          {role.isActive ? "Expires" : "Expired"}:{" "}
                          {format(new Date(role.expiresAt), "PPP")}
                        </span>
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
              ))}
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
                  If set, the role will automatically expire on this date
                </p>
              </div>

              <Button
                onClick={handleAssignRole}
                disabled={!selectedRoleId || isAssigning}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isAssigning ? "Assigning..." : "Assign Role"}
              </Button>
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
