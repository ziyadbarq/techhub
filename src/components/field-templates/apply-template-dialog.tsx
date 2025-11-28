"use client";

/**
 * Apply Template Dialog Component
 * Dialog for selecting and applying a field template to an entity
 */

import { useState } from "react";
import { Loader2, Wand2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldTemplateSelector } from "./field-template-selector";
import { FieldTemplatePreview } from "./field-template-preview";
import {
  applyFieldTemplateAction,
  type ApplyFieldTemplateResultDTO,
} from "@/interface-adapters/controllers/field-template.controller";
import type { FieldTemplateSummaryDTO } from "@/interface-adapters/presenters/field-template.presenter";

export type TargetEntityType = "AssetCategory" | "CIClass" | "LicenseProduct";

interface ApplyTemplateDialogProps {
  entityType: string;
  targetEntityType: TargetEntityType;
  targetEntityId: string;
  targetEntityName: string;
  onApplied?: () => void;
  trigger?: React.ReactNode;
}

export function ApplyTemplateDialog({
  entityType,
  targetEntityType,
  targetEntityId,
  targetEntityName,
  onApplied,
  trigger,
}: ApplyTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<FieldTemplateSummaryDTO | null>(null);
  const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);
  const [skipExisting, setSkipExisting] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ApplyFieldTemplateResultDTO | null>(
    null,
  );

  const handleTemplateSelect = (template: FieldTemplateSummaryDTO | null) => {
    setSelectedTemplate(template);
    setSelectedFieldNames([]);
    setResult(null);
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;

    setApplying(true);
    setResult(null);

    try {
      const response = await applyFieldTemplateAction({
        templateId: selectedTemplate.id,
        targetEntityType,
        targetEntityId,
        fieldNames:
          selectedFieldNames.length > 0 ? selectedFieldNames : undefined,
        skipExisting,
      });

      if (response.success) {
        setResult(response.data);

        const totalApplied =
          response.data.createdFieldCount + response.data.linkedFieldCount;

        if (totalApplied > 0) {
          toast.success(
            `Applied ${totalApplied} field(s) from "${response.data.templateName}"`,
          );
        }

        if (response.data.skippedFields.length > 0) {
          toast.warning(
            `${response.data.skippedFields.length} field(s) were skipped`,
          );
        }

        onApplied?.();
      } else {
        toast.error(response.error || "Failed to apply template");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setSelectedTemplate(null);
      setSelectedFieldNames([]);
      setResult(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Wand2 className="mr-2 h-4 w-4" />
            Apply Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Apply Field Template</DialogTitle>
          <DialogDescription>
            Select a template to quickly add predefined custom fields to{" "}
            <span className="font-medium">{targetEntityName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Select Template</Label>
            <FieldTemplateSelector
              entityType={entityType}
              value={selectedTemplate?.id}
              onSelect={handleTemplateSelect}
              placeholder="Choose a field template..."
            />
          </div>

          {/* Template Preview */}
          {selectedTemplate && !result && (
            <FieldTemplatePreview
              templateId={selectedTemplate.id}
              selectedFieldNames={selectedFieldNames}
              onFieldSelectionChange={setSelectedFieldNames}
              showSelectionCheckboxes={true}
            />
          )}

          {/* Options */}
          {selectedTemplate && !result && (
            <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="skip-existing" className="text-sm font-medium">
                  Skip existing fields
                </Label>
                <p className="text-muted-foreground text-xs">
                  Link to existing field definitions instead of creating
                  duplicates
                </p>
              </div>
              <Switch
                id="skip-existing"
                checked={skipExisting}
                onCheckedChange={setSkipExisting}
              />
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Template Applied Successfully</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">
                        {result.createdFieldCount}
                      </span>{" "}
                      new field definition(s) created
                    </p>
                    <p>
                      <span className="font-medium">
                        {result.linkedFieldCount}
                      </span>{" "}
                      existing field(s) linked
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {result.skippedFields.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Some fields were skipped</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                      {result.skippedFields.map((field, index) => (
                        <li key={index}>
                          <span className="font-medium">{field.fieldName}</span>
                          : {field.reason}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={!selectedTemplate || applying}
              >
                {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {applying
                  ? "Applying..."
                  : `Apply ${selectedFieldNames.length > 0 ? selectedFieldNames.length : "All"} Fields`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
