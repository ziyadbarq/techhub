"use client";

/**
 * Field Template Preview Component
 * Shows a preview of fields that would be created from a template
 */

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  FileJson,
  Link,
  User,
  Building2,
  MapPin,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { getFieldTemplateAction } from "@/interface-adapters/controllers/field-template.controller";
import type {
  FieldTemplateDTO,
  FieldTemplateItemDTO,
} from "@/interface-adapters/presenters/field-template.presenter";

// Data type icon mapping
const DATA_TYPE_ICONS: Record<string, React.ElementType> = {
  STRING: Type,
  TEXT: Type,
  INTEGER: Hash,
  DECIMAL: Hash,
  BOOLEAN: ToggleLeft,
  DATE: Calendar,
  DATETIME: Calendar,
  ENUM: List,
  JSON: FileJson,
  CI_REFERENCE: Link,
  PERSON_REFERENCE: User,
  ORG_UNIT_REFERENCE: Building2,
  LOCATION_REFERENCE: MapPin,
};

// Data type badge variant
const DATA_TYPE_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  STRING: "default",
  TEXT: "default",
  INTEGER: "secondary",
  DECIMAL: "secondary",
  BOOLEAN: "outline",
  DATE: "outline",
  DATETIME: "outline",
  ENUM: "default",
  JSON: "secondary",
  CI_REFERENCE: "outline",
  PERSON_REFERENCE: "outline",
  ORG_UNIT_REFERENCE: "outline",
  LOCATION_REFERENCE: "outline",
};

interface FieldTemplatePreviewProps {
  templateId: string;
  selectedFieldNames?: string[];
  onFieldSelectionChange?: (fieldNames: string[]) => void;
  showSelectionCheckboxes?: boolean;
  className?: string;
}

export function FieldTemplatePreview({
  templateId,
  selectedFieldNames,
  onFieldSelectionChange,
  showSelectionCheckboxes = false,
  className,
}: FieldTemplatePreviewProps) {
  const [template, setTemplate] = useState<FieldTemplateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to access callbacks without adding them to dependencies
  const onFieldSelectionChangeRef = useRef(onFieldSelectionChange);
  const selectedFieldNamesRef = useRef(selectedFieldNames);

  // Keep refs updated
  onFieldSelectionChangeRef.current = onFieldSelectionChange;
  selectedFieldNamesRef.current = selectedFieldNames;

  // Memoized load function that uses refs
  const loadTemplate = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getFieldTemplateAction(templateId);
      if (result.success) {
        setTemplate(result.data);
        // Initialize selection with all fields if not provided
        if (
          !selectedFieldNamesRef.current &&
          onFieldSelectionChangeRef.current
        ) {
          onFieldSelectionChangeRef.current(
            result.data.items.map((i) => i.fieldName),
          );
        }
      } else {
        setError(result.error || "Failed to load template");
      }
    } catch (_err) {
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    if (!onFieldSelectionChange || !selectedFieldNames) return;

    if (checked) {
      onFieldSelectionChange([...selectedFieldNames, fieldName]);
    } else {
      onFieldSelectionChange(selectedFieldNames.filter((n) => n !== fieldName));
    }
  };

  const handleSelectAll = () => {
    if (!template || !onFieldSelectionChange) return;
    onFieldSelectionChange(template.items.map((i) => i.fieldName));
  };

  const handleDeselectAll = () => {
    if (!onFieldSelectionChange) return;
    onFieldSelectionChange([]);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="flex items-center gap-2 py-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <span className="text-destructive">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return null;
  }

  const allSelected = selectedFieldNames?.length === template.items.length;
  const someSelected =
    selectedFieldNames && selectedFieldNames.length > 0 && !allSelected;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {template.name}
          </CardTitle>
          <Badge variant="secondary">{template.itemCount} fields</Badge>
        </div>
        {template.description && (
          <p className="text-muted-foreground text-sm">
            {template.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {template.category && (
            <Badge variant="outline">{template.category}</Badge>
          )}
          {template.standard && (
            <Badge variant="outline">{template.standard}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showSelectionCheckboxes && (
          <div className="mb-3 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) handleSelectAll();
                  else handleDeselectAll();
                }}
                className={someSelected ? "data-[state=checked]:bg-muted" : ""}
              />
              <span className="text-muted-foreground text-sm">
                {selectedFieldNames?.length || 0} of {template.items.length}{" "}
                selected
              </span>
            </div>
          </div>
        )}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {template.items.map((item) => (
              <FieldItemPreview
                key={item.id}
                item={item}
                selected={selectedFieldNames?.includes(item.fieldName)}
                showCheckbox={showSelectionCheckboxes}
                onToggle={(checked) =>
                  handleFieldToggle(item.fieldName, checked)
                }
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface FieldItemPreviewProps {
  item: FieldTemplateItemDTO;
  selected?: boolean;
  showCheckbox?: boolean;
  onToggle?: (checked: boolean) => void;
}

function FieldItemPreview({
  item,
  selected,
  showCheckbox,
  onToggle,
}: FieldItemPreviewProps) {
  const Icon = DATA_TYPE_ICONS[item.fieldDataType] || Type;
  const variant = DATA_TYPE_VARIANTS[item.fieldDataType] || "default";

  return (
    <div
      className={cn(
        "bg-card flex items-start gap-3 rounded-lg border p-3 transition-colors",
        selected === false && "opacity-50",
      )}
    >
      {showCheckbox && (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="truncate font-medium">{item.fieldLabel}</span>
          <Badge variant={variant} className="shrink-0">
            {item.fieldDataType}
          </Badge>
          {item.isRequired && (
            <Badge variant="destructive" className="shrink-0">
              Required
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
          <code className="bg-muted rounded px-1 py-0.5">{item.fieldName}</code>
          {item.isSearchable && (
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" /> Searchable
            </span>
          )}
          {item.isFilterable && (
            <span className="flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filterable
            </span>
          )}
          {item.uiGroup && <span>Group: {item.uiGroup}</span>}
        </div>
        {item.description && (
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {item.description}
          </p>
        )}
        {item.enumOptions && item.enumOptions.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground text-xs">Options:</span>
            {item.enumOptions.slice(0, 5).map((opt) => (
              <Badge key={opt} variant="outline" className="text-xs">
                {opt}
              </Badge>
            ))}
            {item.enumOptions.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{item.enumOptions.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
