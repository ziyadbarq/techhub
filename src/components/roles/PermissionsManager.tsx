/**
 * Permissions Manager Component
 *
 * Interactive component to manage role permissions with grouped UI.
 * Features:
 * - Group permissions by logical categories (10 groups)
 * - Search/filter permissions across all groups
 * - Select/deselect individual permissions
 * - Select/deselect all permissions in a group
 * - Collapsible sections for better UX
 * - Show current vs. new state
 * - Save changes with optimistic updates
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  RoleDTO,
  PermissionDTO,
} from "@/interface-adapters/presenters/role.presenter";
import { assignPermissionsToRoleAction } from "@/interface-adapters/controllers/role.controller";
import { PERMISSION_GROUPS } from "@/lib/rbac/permission-groups";
import {
  validatePermissionDependencies,
  getPermissionDependencies,
} from "@/lib/rbac/permission-dependencies";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(PERMISSION_GROUPS.map((g) => g.id)),
  );
  const [bulkMode, setBulkMode] = React.useState(false);
  const [bulkSelection, setBulkSelection] = React.useState<Set<string>>(
    new Set(),
  );

  // Create permission map for quick lookup
  const permissionMap = React.useMemo(() => {
    const map = new Map<string, PermissionDTO>();
    allPermissions.forEach((perm) => map.set(perm.name, perm));
    return map;
  }, [allPermissions]);

  // Validate permission dependencies
  const dependencyValidation = React.useMemo(() => {
    const selectedArray = Array.from(selectedPermissions) as PermissionKey[];
    return validatePermissionDependencies(selectedArray);
  }, [selectedPermissions]);

  // Group permissions by logical categories
  const groupedPermissions = React.useMemo(() => {
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions
        .map((permKey) => permissionMap.get(permKey))
        .filter((perm): perm is PermissionDTO => perm !== undefined),
    }));
  }, [permissionMap]);

  // Filter groups and permissions based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedPermissions;

    const query = searchQuery.toLowerCase();
    return groupedPermissions
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (perm) =>
            perm.name.toLowerCase().includes(query) ||
            perm.displayName.toLowerCase().includes(query) ||
            (perm.description ?? "").toLowerCase().includes(query) ||
            perm.resource.toLowerCase().includes(query) ||
            perm.action.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groupedPermissions, searchQuery]);

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleAllInGroup = (groupId: string, checked: boolean) => {
    if (bulkMode) {
      setBulkSelection((prev) => {
        const next = new Set(prev);
        const group = groupedPermissions.find((g) => g.id === groupId);
        if (!group) return prev;

        group.permissions.forEach((perm) => {
          if (checked) {
            next.add(perm.name);
          } else {
            next.delete(perm.name);
          }
        });
        return next;
      });
    } else {
      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        const group = groupedPermissions.find((g) => g.id === groupId);
        if (!group) return prev;

        group.permissions.forEach((perm) => {
          if (checked) {
            next.add(perm.name);
          } else {
            next.delete(perm.name);
          }
        });
        return next;
      });
    }
  };

  const isGroupFullySelected = (groupId: string) => {
    const group = groupedPermissions.find((g) => g.id === groupId);
    if (!group || group.permissions.length === 0) return false;
    const targetSet = bulkMode ? bulkSelection : selectedPermissions;
    return group.permissions.every((perm) => targetSet.has(perm.name));
  };

  const isGroupPartiallySelected = (groupId: string) => {
    const group = groupedPermissions.find((g) => g.id === groupId);
    if (!group || group.permissions.length === 0) return false;
    const targetSet = bulkMode ? bulkSelection : selectedPermissions;
    const selectedCount = group.permissions.filter((perm) =>
      targetSet.has(perm.name),
    ).length;
    return selectedCount > 0 && selectedCount < group.permissions.length;
  };

  const getGroupSelectedCount = (groupId: string) => {
    const group = groupedPermissions.find((g) => g.id === groupId);
    if (!group) return 0;
    const targetSet = bulkMode ? bulkSelection : selectedPermissions;
    return group.permissions.filter((perm) => targetSet.has(perm.name)).length;
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

  const handleAddMissingDependencies = () => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      dependencyValidation.missing.forEach((item) => {
        item.requiredDependencies.forEach((dep) => next.add(dep));
      });
      return next;
    });
    toast.success(
      `Added ${dependencyValidation.missing.reduce((sum, item) => sum + item.requiredDependencies.length, 0)} missing dependencies`,
    );
  };

  // Bulk mode handlers
  const handleToggleBulkSelection = (permissionName: string) => {
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (next.has(permissionName)) {
        next.delete(permissionName);
      } else {
        next.add(permissionName);
      }
      return next;
    });
  };

  const handleBulkAdd = () => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      bulkSelection.forEach((perm) => next.add(perm));
      return next;
    });
    setBulkSelection(new Set());
    toast.success(`Added ${bulkSelection.size} permissions`);
  };

  const handleBulkRemove = () => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      bulkSelection.forEach((perm) => next.delete(perm));
      return next;
    });
    setBulkSelection(new Set());
    toast.success(`Removed ${bulkSelection.size} permissions`);
  };

  const handleClearBulkSelection = () => {
    setBulkSelection(new Set());
    toast.info("Selection cleared");
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            {selectedPermissions.size} of {allPermissions.length} permissions
            selected across {filteredGroups.length} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {role.permissions?.length ?? 0} current
                </Badge>
                <X className="text-muted-foreground h-4 w-4" />
                <Badge variant="default">{selectedPermissions.size} new</Badge>
              </div>
              <div className="flex items-center gap-4">
                {hasChanges() && (
                  <Badge
                    variant="default"
                    className="bg-barq-yellow text-white"
                  >
                    Unsaved Changes
                  </Badge>
                )}
                {!isSystemRole && (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="bulk-mode"
                      className="text-muted-foreground text-sm"
                    >
                      Bulk Mode
                    </label>
                    <Switch
                      id="bulk-mode"
                      checked={bulkMode}
                      onCheckedChange={(checked) => {
                        setBulkMode(checked);
                        if (!checked) {
                          setBulkSelection(new Set());
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {bulkMode && (
              <div className="rounded-lg border bg-muted p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{bulkSelection.size} selected</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkAdd}
                      disabled={bulkSelection.size === 0}
                    >
                      Add Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkRemove}
                      disabled={bulkSelection.size === 0}
                    >
                      Remove Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearBulkSelection}
                      disabled={bulkSelection.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search permissions by name, description, or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery && (
              <p className="text-muted-foreground text-sm">
                Found{" "}
                {filteredGroups.reduce(
                  (sum, g) => sum + g.permissions.length,
                  0,
                )}{" "}
                permissions in {filteredGroups.length} categories
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dependency Warning */}
      {!dependencyValidation.valid && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Missing Permission Dependencies
                </CardTitle>
                <CardDescription className="text-yellow-800 dark:text-yellow-200">
                  Some selected permissions require additional permissions to
                  function correctly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dependencyValidation.missing.map((item, idx) => {
                const permission = permissionMap.get(item.permission);
                return (
                  <div
                    key={idx}
                    className="rounded-md border border-yellow-300 bg-white p-3 dark:border-yellow-700 dark:bg-yellow-900/20"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <code className="text-yellow-900 rounded bg-yellow-100 px-2 py-1 font-mono text-xs dark:bg-yellow-800 dark:text-yellow-100">
                        {permission?.displayName ?? item.permission}
                      </code>
                      <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                        requires:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.requiredDependencies.map((dep) => {
                        const depPerm = permissionMap.get(dep);
                        return (
                          <Badge
                            key={dep}
                            variant="outline"
                            className="border-yellow-600 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300"
                          >
                            {depPerm?.displayName ?? dep}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Button
                onClick={handleAddMissingDependencies}
                disabled={isSystemRole || isSaving}
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
              >
                Add Missing Dependencies Automatically
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions by Logical Groups */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No permissions found matching &quot;{searchQuery}&quot;
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const selectedCount = getGroupSelectedCount(group.id);
            const totalCount = group.permissions.length;

            return (
              <Card key={group.id}>
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="text-muted-foreground h-5 w-5" />
                        ) : (
                          <ChevronRight className="text-muted-foreground h-5 w-5" />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {group.label}
                          </CardTitle>
                          <CardDescription>
                            {group.description} • {selectedCount}/{totalCount}{" "}
                            selected
                          </CardDescription>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={
                            isGroupFullySelected(group.id) ||
                            (isGroupPartiallySelected(group.id)
                              ? "indeterminate"
                              : false)
                          }
                          onCheckedChange={(checked) =>
                            toggleAllInGroup(group.id, !!checked)
                          }
                          disabled={isSystemRole || isSaving}
                        />
                        <span className="text-muted-foreground text-sm">
                          Select All
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-3">
                        {group.permissions.map((permission) => {
                          const isSelected = selectedPermissions.has(
                            permission.name,
                          );
                          const wasOriginal = role.permissions?.includes(
                            permission.name,
                          );
                          const dependencies = getPermissionDependencies(
                            permission.name as PermissionKey,
                          );
                          const hasDependencies = dependencies.length > 0;
                          const isBulkSelected = bulkSelection.has(
                            permission.name,
                          );

                          return (
                            <div
                              key={permission.id}
                              className={`hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                                isBulkSelected && bulkMode
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <Checkbox
                                checked={
                                  bulkMode ? isBulkSelected : isSelected
                                }
                                onCheckedChange={() =>
                                  bulkMode
                                    ? handleToggleBulkSelection(permission.name)
                                    : togglePermission(permission.name)
                                }
                                disabled={isSystemRole || isSaving}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">
                                    {permission.displayName}
                                  </span>
                                  <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                                    {permission.name}
                                  </code>
                                  {hasDependencies && (
                                    <TooltipProvider delayDuration={300}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="text-muted-foreground h-4 w-4 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="mb-1 font-medium">
                                            Requires:
                                          </p>
                                          <ul className="list-inside list-disc space-y-0.5 text-sm">
                                            {dependencies.map((dep) => {
                                              const depPerm =
                                                permissionMap.get(dep);
                                              return (
                                                <li key={dep}>
                                                  {depPerm?.displayName ?? dep}
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
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
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={
                !hasChanges() ||
                isSystemRole ||
                isSaving ||
                !dependencyValidation.valid
              }
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
          {!isSystemRole && !dependencyValidation.valid && hasChanges() && (
            <p className="text-destructive mt-4 text-center text-sm">
              Please resolve missing permission dependencies before saving
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
