/**
 * DependencyWarningCard Component
 *
 * Displays warning when selected permissions have missing dependencies.
 * Features:
 * - Yellow-themed warning card
 * - List of permissions with missing dependencies
 * - Shows required dependencies for each permission
 * - "Add Missing Dependencies" button
 */

"use client";

import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ValidationResult } from "@/lib/rbac/permission-dependencies";
import type { PermissionDTO } from "@/interface-adapters/presenters/role.presenter";

interface DependencyWarningCardProps {
  validation: ValidationResult;
  permissionMap: Map<string, PermissionDTO>;
  onAddMissingDependencies: () => void;
  isSystemRole: boolean;
  isSaving: boolean;
}

export function DependencyWarningCard({
  validation,
  permissionMap,
  onAddMissingDependencies,
  isSystemRole,
  isSaving,
}: DependencyWarningCardProps) {
  if (validation.valid) {
    return null;
  }

  return (
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
          {validation.missing.map((item, idx) => {
            const permission = permissionMap.get(item.permission);
            return (
              <div
                key={idx}
                className="rounded-md border border-yellow-300 bg-white p-3 dark:border-yellow-700 dark:bg-yellow-900/20"
              >
                <div className="mb-2 flex items-center gap-2">
                  <code className="rounded bg-yellow-100 px-2 py-1 font-mono text-xs text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100">
                    {permission?.displayName ?? item.permission}
                  </code>
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
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
            onClick={onAddMissingDependencies}
            disabled={isSystemRole || isSaving}
            variant="outline"
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
          >
            Add Missing Dependencies Automatically
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
