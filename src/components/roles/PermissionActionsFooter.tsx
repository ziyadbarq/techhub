/**
 * PermissionActionsFooter Component
 *
 * Footer with action buttons and validation messages.
 * Features:
 * - Save button (disabled when no changes, invalid, or system role)
 * - Reset button (discards unsaved changes)
 * - Loading state for save operation
 * - Validation messages (system role, dependency errors)
 */

"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PermissionActionsFooterProps {
  hasChanges: boolean;
  isSystemRole: boolean;
  isSaving: boolean;
  isValid: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function PermissionActionsFooter({
  hasChanges,
  isSystemRole,
  isSaving,
  isValid,
  onSave,
  onReset,
}: PermissionActionsFooterProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Button
            onClick={onSave}
            disabled={!hasChanges || isSystemRole || isSaving || !isValid}
            className="flex-1"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
        </div>
        {isSystemRole && (
          <p className="text-muted-foreground mt-4 text-center text-sm">
            System roles cannot be modified
          </p>
        )}
        {!isSystemRole && !isValid && hasChanges && (
          <p className="text-destructive mt-4 text-center text-sm">
            Please resolve missing permission dependencies before saving
          </p>
        )}
      </CardContent>
    </Card>
  );
}
