/**
 * Category Fields Tab
 * Manages custom fields attached to an asset category
 */

"use client";

import { useState } from "react";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import {
  updateAssetCategoryFieldAction,
  deleteAssetCategoryFieldAction,
} from "@/interface-adapters/controllers/asset-category-field.controller";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { AddFieldDialog } from "./add-field-dialog";

interface CategoryFieldsTabProps {
  category: AssetCategoryDTO;
  attachedFields: EnrichedAssetCategoryFieldDTO[];
  fieldDefinitions: FieldDefinitionDTO[];
  onFieldsChange: (fields: EnrichedAssetCategoryFieldDTO[]) => void;
}

export function CategoryFieldsTab({
  category,
  attachedFields,
  fieldDefinitions,
  onFieldsChange,
}: CategoryFieldsTabProps) {
  const { hasPermission } = usePermissions();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingFieldId, setUpdatingFieldId] = useState<string | null>(null);

  const canCreate = hasPermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ASSET_CATEGORY_FIELDS_DELETE);

  // Get available field definitions (not yet attached)
  const availableFieldDefinitions = fieldDefinitions.filter(
    (fd) =>
      fd.isActive &&
      !attachedFields.some((af) => af.fieldDefinitionId === fd.id),
  );

  const handleToggleRequired = async (field: EnrichedAssetCategoryFieldDTO) => {
    setUpdatingFieldId(field.id);
    try {
      const result = await updateAssetCategoryFieldAction(field.id, {
        isRequired: !field.isRequired,
      });
      if (result.success) {
        onFieldsChange(
          attachedFields.map((f) =>
            f.id === field.id ? { ...f, isRequired: !f.isRequired } : f,
          ),
        );
        toast.success(`Field ${field.isRequired ? "optional" : "required"}`);
      } else {
        toast.error(result.error || "Failed to update field");
      }
    } catch {
      toast.error("Failed to update field");
    } finally {
      setUpdatingFieldId(null);
    }
  };

  const handleToggleVisible = async (field: EnrichedAssetCategoryFieldDTO) => {
    setUpdatingFieldId(field.id);
    try {
      const result = await updateAssetCategoryFieldAction(field.id, {
        isVisible: !field.isVisible,
      });
      if (result.success) {
        onFieldsChange(
          attachedFields.map((f) =>
            f.id === field.id ? { ...f, isVisible: !f.isVisible } : f,
          ),
        );
        toast.success(`Field ${field.isVisible ? "hidden" : "visible"}`);
      } else {
        toast.error(result.error || "Failed to update field");
      }
    } catch {
      toast.error("Failed to update field");
    } finally {
      setUpdatingFieldId(null);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const field = attachedFields[index];
    const prevField = attachedFields[index - 1];

    setUpdatingFieldId(field.id);
    try {
      // Swap uiOrder values
      await Promise.all([
        updateAssetCategoryFieldAction(field.id, {
          uiOrder: prevField.uiOrder,
        }),
        updateAssetCategoryFieldAction(prevField.id, {
          uiOrder: field.uiOrder,
        }),
      ]);

      const newFields = [...attachedFields];
      [newFields[index - 1], newFields[index]] = [
        { ...newFields[index], uiOrder: prevField.uiOrder },
        { ...newFields[index - 1], uiOrder: field.uiOrder },
      ];
      onFieldsChange(newFields);
    } catch {
      toast.error("Failed to reorder field");
    } finally {
      setUpdatingFieldId(null);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === attachedFields.length - 1) return;

    const field = attachedFields[index];
    const nextField = attachedFields[index + 1];

    setUpdatingFieldId(field.id);
    try {
      // Swap uiOrder values
      await Promise.all([
        updateAssetCategoryFieldAction(field.id, {
          uiOrder: nextField.uiOrder,
        }),
        updateAssetCategoryFieldAction(nextField.id, {
          uiOrder: field.uiOrder,
        }),
      ]);

      const newFields = [...attachedFields];
      [newFields[index], newFields[index + 1]] = [
        { ...newFields[index + 1], uiOrder: field.uiOrder },
        { ...newFields[index], uiOrder: nextField.uiOrder },
      ];
      onFieldsChange(newFields);
    } catch {
      toast.error("Failed to reorder field");
    } finally {
      setUpdatingFieldId(null);
    }
  };

  const handleDelete = async () => {
    if (!fieldToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteAssetCategoryFieldAction(fieldToDelete);
      if (result.success) {
        onFieldsChange(attachedFields.filter((f) => f.id !== fieldToDelete));
        toast.success("Field removed from category");
      } else {
        toast.error(result.error || "Failed to remove field");
      }
    } catch {
      toast.error("Failed to remove field");
    } finally {
      setIsDeleting(false);
      setFieldToDelete(null);
    }
  };

  const handleFieldAdded = (newField: EnrichedAssetCategoryFieldDTO) => {
    onFieldsChange([...attachedFields, newField]);
    setAddDialogOpen(false);
  };

  const getDataTypeBadge = (dataType: string) => {
    const typeColors: Record<string, string> = {
      STRING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      TEXT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      INTEGER:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      DECIMAL:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      BOOLEAN:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      DATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      DATETIME:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ENUM: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      JSON: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };

    const colorClass =
      typeColors[dataType] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";

    return (
      <Badge variant="outline" className={`${colorClass} border-0`}>
        {dataType}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Fields</CardTitle>
        {canCreate && (
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {attachedFields.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <p>No custom fields attached to this category.</p>
            {canCreate && (
              <p className="mt-2 text-sm">
                Click &quot;Add Field&quot; to attach field definitions.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {attachedFields.map((field, index) => (
              <div
                key={field.id}
                className="bg-muted/50 flex items-center gap-4 rounded-lg border p-4"
              >
                {/* Order indicator */}
                <div className="text-muted-foreground flex items-center gap-1">
                  <GripVertical className="h-4 w-4" />
                  <span className="w-4 text-center text-sm">{index + 1}</span>
                </div>

                {/* Field info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.fieldLabel}</span>
                    {getDataTypeBadge(field.dataType)}
                    {field.isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {!field.isVisible && (
                      <Badge variant="secondary" className="text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {field.fieldDescription || `Field: ${field.fieldName}`}
                  </p>
                </div>

                {/* Controls */}
                {canUpdate && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`required-${field.id}`}
                        checked={field.isRequired}
                        onCheckedChange={() => handleToggleRequired(field)}
                        disabled={updatingFieldId === field.id}
                      />
                      <Label
                        htmlFor={`required-${field.id}`}
                        className="text-sm"
                      >
                        Required
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`visible-${field.id}`}
                        checked={field.isVisible}
                        onCheckedChange={() => handleToggleVisible(field)}
                        disabled={updatingFieldId === field.id}
                      />
                      <Label
                        htmlFor={`visible-${field.id}`}
                        className="text-sm"
                      >
                        Visible
                      </Label>
                    </div>
                  </div>
                )}

                {/* Order buttons */}
                {canUpdate && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || updatingFieldId === field.id}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(index)}
                      disabled={
                        index === attachedFields.length - 1 ||
                        updatingFieldId === field.id
                      }
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Delete button */}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFieldToDelete(field.id)}
                    disabled={updatingFieldId === field.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categoryId={category.id}
        availableFieldDefinitions={availableFieldDefinitions}
        existingFieldCount={attachedFields.length}
        onFieldAdded={handleFieldAdded}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!fieldToDelete}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this field from the category? This
              will not delete existing asset data, but the field will no longer
              appear in forms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
