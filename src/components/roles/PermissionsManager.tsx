/**
 * Permissions Manager Component
 *
 * Interactive component to manage role permissions.
 * Features:
 * - Group permissions by resource
 * - Select/deselect individual permissions
 * - Select/deselect all permissions in a group
 * - Show current vs. new state
 * - Save changes with optimistic updates
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type {
  RoleDTO,
  PermissionDTO,
} from "@/interface-adapters/presenters/role.presenter";
import { assignPermissionsToRoleAction } from "@/interface-adapters/controllers/role.controller";

interface PermissionsManagerProps {
  role: RoleDTO;
  allPermissions: PermissionDTO[];
  isSystemRole: boolean;
}

export function PermissionsManager({
  role,
  allPermissions,
  isSystemRole,
}: PermissionsManagerProps) {
  const router = useRouter();
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    Set<string>
  >(new Set(role.permissions ?? []));
  const [isSaving, setIsSaving] = React.useState(false);

  // Group permissions by resource
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, PermissionDTO[]> = {};
    allPermissions.forEach((permission) => {
      if (!groups[permission.resource]) {
        groups[permission.resource] = [];
      }
      groups[permission.resource].push(permission);
    });
    return groups;
  }, [allPermissions]);

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  };

  const toggleAllInGroup = (resource: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const groupPerms = groupedPermissions[resource];
      groupPerms.forEach((perm) => {
        if (checked) {
          next.add(perm.name);
        } else {
          next.delete(perm.name);
        }
      });
      return next;
    });
  };

  const isGroupFullySelected = (resource: string) => {
    const groupPerms = groupedPermissions[resource];
    return groupPerms.every((perm) => selectedPermissions.has(perm.name));
  };

  const isGroupPartiallySelected = (resource: string) => {
    const groupPerms = groupedPermissions[resource];
    const selectedCount = groupPerms.filter((perm) =>
      selectedPermissions.has(perm.name),
    ).length;
    return selectedCount > 0 && selectedCount < groupPerms.length;
  };

  const hasChanges = () => {
    const current = new Set(role.permissions ?? []);
    if (current.size !== selectedPermissions.size) return true;
    for (const perm of selectedPermissions) {
      if (!current.has(perm)) return true;
    }
    return false;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get permission IDs from names
      const selectedPermissionIds = allPermissions
        .filter((p) => selectedPermissions.has(p.name))
        .map((p) => p.id);

      const result = await assignPermissionsToRoleAction({
        roleId: role.id,
        permissionIds: selectedPermissionIds,
      });

      if (result.success) {
        toast.success("Permissions updated successfully");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedPermissions(new Set(role.permissions ?? []));
    toast.info("Changes discarded");
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            {selectedPermissions.size} of {allPermissions.length} permissions
            selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {role.permissions?.length ?? 0} current
              </Badge>
              <X className="text-muted-foreground h-4 w-4" />
              <Badge variant="default">{selectedPermissions.size} new</Badge>
            </div>
            {hasChanges() && (
              <Badge variant="default" className="bg-barq-yellow text-white">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Resource */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([resource, permissions]) => (
          <Card key={resource}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg capitalize">
                    {resource}
                  </CardTitle>
                  <CardDescription>
                    {permissions.length} permission
                    {permissions.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      isGroupFullySelected(resource) ||
                      (isGroupPartiallySelected(resource)
                        ? "indeterminate"
                        : false)
                    }
                    onCheckedChange={(checked) =>
                      toggleAllInGroup(resource, !!checked)
                    }
                    disabled={isSystemRole || isSaving}
                  />
                  <span className="text-muted-foreground text-sm">
                    Select All
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {permissions.map((permission) => {
                  const isSelected = selectedPermissions.has(permission.name);
                  const wasOriginal = role.permissions?.includes(
                    permission.name,
                  );

                  return (
                    <div
                      key={permission.id}
                      className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          togglePermission(permission.name)
                        }
                        disabled={isSystemRole || isSaving}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {permission.displayName}
                          </span>
                          <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                            {permission.name}
                          </code>
                          {wasOriginal && !isSelected && (
                            <Badge
                              variant="outline"
                              className="border-destructive text-destructive"
                            >
                              Will Remove
                            </Badge>
                          )}
                          {!wasOriginal && isSelected && (
                            <Badge
                              variant="outline"
                              className="border-success text-success"
                            >
                              Will Add
                            </Badge>
                          )}
                        </div>
                        {permission.description && (
                          <p className="text-muted-foreground mt-1 text-sm">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges() || isSystemRole || isSaving}
              className="flex-1"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges() || isSaving}
            >
              Reset
            </Button>
          </div>
          {isSystemRole && (
            <p className="text-muted-foreground mt-4 text-center text-sm">
              System roles cannot be modified
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
