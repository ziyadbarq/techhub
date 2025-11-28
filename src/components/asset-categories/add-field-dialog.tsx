/**
 * Add Field Dialog
 * Dialog to attach a field definition to an asset category
 */

"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import {
  createAssetCategoryFieldAction,
  listEnrichedAssetCategoryFieldsAction,
} from "@/interface-adapters/controllers/asset-category-field.controller";

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  availableFieldDefinitions: FieldDefinitionDTO[];
  existingFieldCount: number;
  onFieldAdded: (fields: EnrichedAssetCategoryFieldDTO[]) => void;
}

export function AddFieldDialog({
  open,
  onOpenChange,
  categoryId,
  availableFieldDefinitions,
  existingFieldCount,
  onFieldAdded,
}: AddFieldDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter field definitions by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return availableFieldDefinitions;

    const query = searchQuery.toLowerCase();
    return availableFieldDefinitions.filter(
      (fd) =>
        fd.name.toLowerCase().includes(query) ||
        fd.label.toLowerCase().includes(query) ||
        fd.description?.toLowerCase().includes(query) ||
        fd.dataType.toLowerCase().includes(query),
    );
  }, [availableFieldDefinitions, searchQuery]);

  const handleToggleField = (fieldId: string) => {
    const newSelected = new Set(selectedFieldIds);
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId);
    } else {
      newSelected.add(fieldId);
    }
    setSelectedFieldIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedFieldIds.size === 0) {
      toast.error("Please select at least one field");
      return;
    }

    setIsSubmitting(true);
    try {
      let successCount = 0;

      // Add fields sequentially
      for (const fieldId of selectedFieldIds) {
        const result = await createAssetCategoryFieldAction({
          assetCategoryId: categoryId,
          fieldDefinitionId: fieldId,
          isRequired: false,
          isUnique: false,
          isVisible: true,
          uiOrder: existingFieldCount + successCount,
        });

        if (result.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        // Fetch the updated list to get all enriched DTOs
        const updatedResult =
          await listEnrichedAssetCategoryFieldsAction(categoryId);

        toast.success(
          `Added ${successCount} field${successCount > 1 ? "s" : ""} to category`,
        );

        // Pass all fields to parent to update state
        if (updatedResult.success) {
          onFieldAdded(updatedResult.data);
        }

        // Reset state and close dialog
        setSelectedFieldIds(new Set());
        setSearchQuery("");
        onOpenChange(false);
      } else {
        toast.error("Failed to add fields");
      }
    } catch {
      toast.error("Failed to add fields");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFieldIds(new Set());
    setSearchQuery("");
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Custom Fields</DialogTitle>
          <DialogDescription>
            Select field definitions to attach to this category. You can select
            multiple fields at once.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Field List */}
        <ScrollArea className="h-[400px] pr-4">
          {filteredFields.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {availableFieldDefinitions.length === 0 ? (
                <>
                  <p>No field definitions available.</p>
                  <p className="mt-2 text-sm">
                    Create field definitions first at /field-definitions
                  </p>
                </>
              ) : (
                <p>No fields match your search.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFields.map((field) => (
                <div
                  key={field.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selectedFieldIds.has(field.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggleField(field.id)}
                >
                  <Checkbox
                    checked={selectedFieldIds.has(field.id)}
                    onCheckedChange={() => handleToggleField(field.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{field.label}</span>
                      {getDataTypeBadge(field.dataType)}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {field.description || `Internal name: ${field.name}`}
                    </p>
                    {field.dataType === "ENUM" && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Options: (defined in field definition)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {selectedFieldIds.size} field
            {selectedFieldIds.size !== 1 ? "s" : ""} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFieldIds.size === 0 || isSubmitting}
            >
              {isSubmitting
                ? "Adding..."
                : `Add ${selectedFieldIds.size} Field${selectedFieldIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
