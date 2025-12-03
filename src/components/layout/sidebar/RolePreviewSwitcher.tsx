/**
 * Role Preview Switcher
 *
 * Client-only role preview toggle for admins to simulate another role's permissions
 * without changing assignments in the database. Updates navigation/permission gating
 * on the client only; server-side permission checks remain enforced.
 */

"use client";

import * as React from "react";
import { UserCog, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import { useRolePreviewContext } from "@/contexts/role-preview-context";
import { useFeatureFlagsContext } from "@/contexts/feature-flags-context";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RolePreviewSwitcherProps {
  isCollapsed: boolean;
}

export function RolePreviewSwitcher({ isCollapsed }: RolePreviewSwitcherProps) {
  const {
    roles,
    isLoadingRoles,
    rolesError,
    isPreviewing,
    previewRoleId,
    previewRoleName,
    ensureRolesLoaded,
    refreshRoles,
    setPreviewRole,
    clearPreview,
  } = useRolePreviewContext();
  const { actualPermissions } = usePermissions();
  const { isFeatureEnabled, isLoading: featuresLoading } =
    useFeatureFlagsContext();
  const [open, setOpen] = React.useState(false);

  const canPreview =
    !featuresLoading &&
    isFeatureEnabled(FEATURE_FLAGS.RBAC) &&
    actualPermissions.includes(PERMISSIONS.ROLES_VIEW);
  const activeLabel = isPreviewing
    ? `Previewing ${previewRoleName ?? "role"}`
    : "Preview roles";

  React.useEffect(() => {
    if (open) {
      void ensureRolesLoaded();
    }
  }, [ensureRolesLoaded, open]);

  if (!canPreview) return null;

  const handleSelect = (roleId: string) => {
    setPreviewRole(roleId);
    const roleLabel =
      roles.find((role) => role.id === roleId)?.displayName ??
      roles.find((role) => role.id === roleId)?.name ??
      "role";
    toast.success(`Previewing as ${roleLabel}`);
    setOpen(false);
  };

  const handleClear = () => {
    clearPreview();
    toast.success("Reverted to your assigned permissions");
    setOpen(false);
  };

  return (
    <div className="px-1">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className="w-full justify-start gap-2"
          >
            {isPreviewing ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <UserCog className="h-4 w-4" />
            )}
            {!isCollapsed && (
              <span className="truncate text-sm">{activeLabel}</span>
            )}
            {!isCollapsed && isPreviewing && (
              <Badge variant="secondary" className="ml-auto">
                Preview
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={isCollapsed ? "end" : "start"}
          side={isCollapsed ? "right" : "bottom"}
          className="w-80"
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Preview as role
          </DropdownMenuLabel>
          <DropdownMenuItem disabled className="text-muted-foreground text-xs">
            Client-only preview. Server actions still use your real permissions.
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {isLoadingRoles ? (
            <DropdownMenuItem disabled>Loading roles...</DropdownMenuItem>
          ) : rolesError ? (
            <DropdownMenuItem disabled className="text-destructive gap-2">
              <AlertTriangle className="h-4 w-4" />
              {rolesError}
            </DropdownMenuItem>
          ) : roles.length === 0 ? (
            <DropdownMenuItem disabled>No roles available</DropdownMenuItem>
          ) : (
            roles.map((role) => (
              <DropdownMenuItem
                key={role.id}
                onSelect={(event) => {
                  event.preventDefault();
                  handleSelect(role.id);
                }}
                className="items-start gap-2 py-2"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {role.displayName ?? role.name}
                    </span>
                    {previewRoleId === role.id && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {role.description}
                    </p>
                  )}
                  {role.isSystem && (
                    <p className="text-muted-foreground text-[11px]">
                      System role
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              refreshRoles();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh roles
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleClear();
            }}
            disabled={!isPreviewing}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Use my permissions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
