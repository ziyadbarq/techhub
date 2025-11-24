/**
 * PermissionItem Component
 *
 * Displays a single permission as a checkable item.
 * Features:
 * - Checkbox for selection
 * - Permission display name and code
 * - Tooltip showing permission dependencies
 * - "Will Add" / "Will Remove" badges
 * - Highlights in bulk selection mode
 */

"use client";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PermissionDTO } from "@/interface-adapters/presenters/role.presenter";
import type { PermissionKey } from "@/core/domain/value-objects/permission-key";

interface PermissionItemProps {
  permission: PermissionDTO;
  isSelected: boolean;
  wasOriginal: boolean;
  dependencies: PermissionKey[];
  isBulkSelected: boolean;
  bulkMode: boolean;
  isSystemRole: boolean;
  isSaving: boolean;
  onToggle: () => void;
  permissionMap: Map<string, PermissionDTO>;
}

export function PermissionItem({
  permission,
  isSelected,
  wasOriginal,
  dependencies,
  isBulkSelected,
  bulkMode,
  isSystemRole,
  isSaving,
  onToggle,
  permissionMap,
}: PermissionItemProps) {
  const hasDependencies = dependencies.length > 0;

  return (
    <div
      className={`hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors ${
        isBulkSelected && bulkMode ? "border-primary bg-primary/5" : ""
      }`}
    >
      <Checkbox
        checked={bulkMode ? isBulkSelected : isSelected}
        onCheckedChange={onToggle}
        disabled={isSystemRole || isSaving}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{permission.displayName}</span>
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
                  <p className="mb-1 font-medium">Requires:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-sm">
                    {dependencies.map((dep) => {
                      const depPerm = permissionMap.get(dep);
                      return <li key={dep}>{depPerm?.displayName ?? dep}</li>;
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
            <Badge variant="outline" className="border-success text-success">
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
}
