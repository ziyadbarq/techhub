/**
 * Inline Role Editor Component
 *
 * Allows adding/removing roles directly from the user table without navigation.
 * Shows current roles as removable badges with an "Add Role" button.
 */

"use client";

import * as React from "react";
import { Plus, X, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { assignRoleToUserAction, removeRoleFromUserAction } from "@/interface-adapters/controllers/user-role.controller";
import { toast } from "sonner";

interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  isActive: boolean;
  expiresAt: string | null;
}

interface InlineRoleEditorProps {
  userId: string;
  userEmail: string;
  roles: UserRole[];
  availableRoles: { id: string; name: string; displayName: string }[];
  onUpdate?: () => void;
}

export function InlineRoleEditor({
  userId,
  userEmail,
  roles,
  availableRoles,
  onUpdate,
}: InlineRoleEditorProps) {
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);
  const [roleToRemove, setRoleToRemove] = React.useState<UserRole | null>(null);
  const [expirationDate, setExpirationDate] = React.useState<Date | undefined>(
    undefined,
  );

  const activeRoles = roles.filter((r) => r.isActive);
  const expiredRoles = roles.filter((r) => !r.isActive);
  const assignedRoleIds = roles.map((r) => r.roleId);
  const availableToAdd = availableRoles.filter(
    (r) => !assignedRoleIds.includes(r.id),
  );

  const handleRemoveClick = (role: UserRole) => {
    setRoleToRemove(role);
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = async () => {
    if (!roleToRemove) return;

    setRemoving(roleToRemove.id);
    setShowRemoveDialog(false);

    const result = await removeRoleFromUserAction({
      userId,
      roleId: roleToRemove.roleId,
    });

    if (result.success) {
      toast.success(`Removed role "${roleToRemove.roleDisplayName}"`);
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to remove role");
    }

    setRemoving(null);
    setRoleToRemove(null);
  };

  const handleAddRole = async (roleId: string) => {
    setAdding(true);

    const result = await assignRoleToUserAction({
      userId,
      roleId,
      expiresAt: expirationDate?.toISOString(),
    });

    if (result.success) {
      const role = availableRoles.find((r) => r.id === roleId);
      toast.success(`Assigned role "${role?.displayName}"`);
      setExpirationDate(undefined);
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to assign role");
    }

    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Active Roles */}
      {activeRoles.length === 0 && expiredRoles.length === 0 ? (
        <Badge variant="outline" className="text-muted-foreground">
          No roles
        </Badge>
      ) : (
        <>
          {activeRoles.map((role) => (
            <Badge
              key={role.id}
              variant="default"
              className="group relative gap-1 pr-1"
            >
              <span className="text-xs">{role.roleDisplayName}</span>
              {role.expiresAt && (
                <span className="text-muted-foreground text-[10px]">
                  (exp: {format(new Date(role.expiresAt), "MMM d")})
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveClick(role)}
                disabled={removing === role.id}
              >
                {removing === role.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                )}
              </Button>
            </Badge>
          ))}

          {/* Expired Roles */}
          {expiredRoles.length > 0 && (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              {expiredRoles.length} expired
            </Badge>
          )}
        </>
      )}

      {/* Add Role Dropdown */}
      {availableToAdd.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full border border-dashed"
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Add Role</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Expiration Date Picker */}
            <div className="p-2">
              <Label className="text-xs">Expiration Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "mt-1 w-full justify-start text-left font-normal",
                      !expirationDate && "text-muted-foreground",
                    )}
                  >
                    {expirationDate ? (
                      format(expirationDate, "PPP")
                    ) : (
                      <span>No expiration</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expirationDate}
                    onSelect={setExpirationDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {expirationDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpirationDate(undefined)}
                  className="mt-1 h-auto w-full p-1 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            <DropdownMenuSeparator />

            {availableToAdd.map((role) => (
              <DropdownMenuItem
                key={role.id}
                onClick={() => handleAddRole(role.id)}
              >
                {role.displayName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the role &quot;
              {roleToRemove?.roleDisplayName}&quot; from {userEmail}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
