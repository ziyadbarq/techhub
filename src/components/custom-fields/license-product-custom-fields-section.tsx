/**
 * LicenseProductCustomFieldsSection Component
 * Renders custom fields for a license product in create/edit forms.
 * Uses the same CustomFieldInput component as Asset custom fields.
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useLicenseProductFields } from "@/hooks/use-license-product-fields";
import { CustomFieldInput } from "./custom-field-input";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import type { EnrichedLicenseProductFieldDTO } from "@/interface-adapters/presenters/license-product-field.presenter";
import type {
  CustomFieldValues,
  CustomFieldErrors,
} from "./custom-fields-section";

interface LicenseProductCustomFieldsSectionProps {
  licenseProductId: string | null | undefined;
  values: CustomFieldValues;
  onChange: (values: CustomFieldValues) => void;
  errors?: CustomFieldErrors;
  disabled?: boolean;
  className?: string;
}

export function LicenseProductCustomFieldsSection({
  licenseProductId,
  values,
  onChange,
  errors = {},
  disabled = false,
  className,
}: LicenseProductCustomFieldsSectionProps) {
  const { fields, isLoading, error } =
    useLicenseProductFields(licenseProductId);

  const visibleFields = fields.filter((f) => f.isVisible);
  const groupedFields = groupFieldsByGroup(visibleFields);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  if (!licenseProductId) {
    return null;
  }

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

      {Object.entries(groupedFields).map(([groupName, groupFields]) => (
        <div key={groupName} className="space-y-4">
          {groupName !== "default" && (
            <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {groupName}
            </h4>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {groupFields.map((field) => (
              <div key={field.id} className="space-y-2">
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
                  field={field as unknown as EnrichedAssetCategoryFieldDTO}
                  value={values[field.fieldName]}
                  onChange={(value) =>
                    handleFieldChange(field.fieldName, value)
                  }
                  error={errors[field.fieldName]}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Validate license product custom field values.
 * Reuses the same validation logic as asset custom fields.
 */
export function validateLicenseProductCustomFields(
  fields: EnrichedLicenseProductFieldDTO[],
  values: CustomFieldValues,
): CustomFieldErrors {
  const errors: CustomFieldErrors = {};

  for (const field of fields) {
    if (!field.isVisible) continue;

    const value = values[field.fieldName];

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

    if (value === null || value === undefined || value === "") {
      continue;
    }

    const rules = field.validationRules;
    if (!rules) continue;

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

function groupFieldsByGroup(
  fields: EnrichedLicenseProductFieldDTO[],
): Record<string, EnrichedLicenseProductFieldDTO[]> {
  const groups: Record<string, EnrichedLicenseProductFieldDTO[]> = {};

  for (const field of fields) {
    const groupName = field.uiGroup || "default";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(field);
  }

  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.uiOrder - b.uiOrder);
  }

  return groups;
}
