/**
 * CICustomFieldsSection Component
 * Renders all custom fields for a selected CI class
 * Used in ConfigurationItem create/edit forms
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useCIClassFields } from "@/hooks/use-ci-class-fields";
import { CustomFieldInput } from "./custom-field-input";
import type { EnrichedCIClassFieldDTO } from "@/interface-adapters/presenters/ci-class-field.presenter";

export interface CustomFieldValues {
  [fieldName: string]: unknown;
}

export interface CustomFieldErrors {
  [fieldName: string]: string;
}

interface CICustomFieldsSectionProps {
  ciClassId: string | null | undefined;
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  errors?: CustomFieldErrors;
  disabled?: boolean;
  className?: string;
}

export function CICustomFieldsSection({
  ciClassId,
  values,
  onChange,
  errors = {},
  disabled = false,
  className,
}: CICustomFieldsSectionProps) {
  const { fields, isLoading, error } = useCIClassFields(ciClassId);

  // Filter to only visible fields and sort by uiOrder
  const visibleFields = fields.filter((f) => f.isVisible);

  // Group fields by uiGroup
  const groupedFields = groupFieldsByGroup(visibleFields);

  // Handle field value change
  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  // Show nothing if no CI class selected
  if (!ciClassId) {
    return null;
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error if loading failed
  if (error) {
    return (
      <div
        className={cn(
          "border-destructive/50 bg-destructive/10 rounded-lg border p-4",
          className,
        )}
      >
        <div className="text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Failed to load custom fields
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{error}</p>
      </div>
    );
  }

  // Show nothing if no visible fields
  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Custom Fields</h3>
        <Badge variant="secondary" className="text-xs">
          {visibleFields.length} field{visibleFields.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Render grouped fields */}
      {Object.entries(groupedFields).map(([groupName, groupFields]) => (
        <div key={groupName} className="space-y-4">
          {groupName !== "default" && (
            <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {groupName}
            </h4>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {groupFields.map((field) => (
              <CICustomFieldFormItem
                key={field.id}
                field={field}
                value={values[field.fieldName]}
                onChange={(value) => handleFieldChange(field.fieldName, value)}
                error={errors[field.fieldName]}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CICustomFieldFormItemProps {
  field: EnrichedCIClassFieldDTO;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

function CICustomFieldFormItem({
  field,
  value,
  onChange,
  error,
  disabled,
}: CICustomFieldFormItemProps) {
  // Convert EnrichedCIClassFieldDTO to compatible format for CustomFieldInput
  const fieldForInput = {
    ...field,
    // Map ciClassId properties to expected interface
    assetCategoryId: field.ciClassId,
  };

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.fieldName}
        className={cn(
          "flex items-center gap-1",
          field.isRequired &&
            "after:text-destructive after:ml-0.5 after:content-['*']",
        )}
      >
        {field.fieldLabel}
      </Label>
      {field.fieldDescription && (
        <p className="text-muted-foreground text-xs">
          {field.fieldDescription}
        </p>
      )}
      <CustomFieldInput
        field={fieldForInput}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Group fields by their uiGroup, defaulting to "default"
 */
function groupFieldsByGroup(
  fields: EnrichedCIClassFieldDTO[],
): Record<string, EnrichedCIClassFieldDTO[]> {
  const groups: Record<string, EnrichedCIClassFieldDTO[]> = {};

  for (const field of fields) {
    const groupName = field.uiGroup || "default";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
  }

  // Sort each group by uiOrder
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.uiOrder - b.uiOrder);
  }

  return groups;
}

/**
 * Validate custom field values based on field definitions
 */
export function validateCICustomFields(
  fields: EnrichedCIClassFieldDTO[],
  values: CustomFieldValues,
): CustomFieldErrors {
  const errors: CustomFieldErrors = {};

  for (const field of fields) {
    if (!field.isVisible) continue;

    const value = values[field.fieldName];

    // Required field validation
    if (field.isRequired) {
      const isEmpty =
        value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "string" && value.trim() === "");

      if (isEmpty) {
        errors[field.fieldName] = `${field.fieldLabel} is required`;
        continue;
      }
    }

    // Skip further validation if value is empty and not required
    if (value === null || value === undefined || value === "") {
      continue;
    }

    // Type-specific validation
    const rules = field.validationRules;
    if (!rules) continue;

    // String/Text validation
    if (field.dataType === "STRING" || field.dataType === "TEXT") {
      const strValue = String(value);
      const minLength =
        typeof rules.minLength === "number" ? rules.minLength : undefined;
      const maxLength =
        typeof rules.maxLength === "number" ? rules.maxLength : undefined;
      const pattern =
        typeof rules.pattern === "string" ? rules.pattern : undefined;

      if (minLength !== undefined && strValue.length < minLength) {
        errors[field.fieldName] = `Minimum ${minLength} characters required`;
      } else if (maxLength !== undefined && strValue.length > maxLength) {
        errors[field.fieldName] = `Maximum ${maxLength} characters allowed`;
      } else if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(strValue)) {
          errors[field.fieldName] = "Invalid format";
        }
      }
    }

    // Number validation
    if (field.dataType === "INTEGER" || field.dataType === "DECIMAL") {
      const numValue = Number(value);
      const min = typeof rules.min === "number" ? rules.min : undefined;
      const max = typeof rules.max === "number" ? rules.max : undefined;

      if (isNaN(numValue)) {
        errors[field.fieldName] = "Must be a valid number";
      } else if (min !== undefined && numValue < min) {
        errors[field.fieldName] = `Minimum value is ${min}`;
      } else if (max !== undefined && numValue > max) {
        errors[field.fieldName] = `Maximum value is ${max}`;
      }
    }
  }

  return errors;
}

export default CICustomFieldsSection;
