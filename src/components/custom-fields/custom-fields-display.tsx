/**
 * CustomFieldsDisplay Component
 * Displays custom field values in a read-only format with proper formatting
 */

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useCategoryFields } from "@/hooks/use-category-fields";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";

// Actions for resolving references
import { getConfigurationItemAction } from "@/interface-adapters/controllers/configuration-item.controller";
import { getPersonAction } from "@/interface-adapters/controllers/person.controller";
import { getOrganizationUnitAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { getLocationAction } from "@/interface-adapters/controllers/location.controller";

interface CustomFieldsDisplayProps {
  categoryId: string | null | undefined;
  attributes: Record<string, unknown> | null;
  className?: string;
}

export function CustomFieldsDisplay({
  categoryId,
  attributes,
  className,
}: CustomFieldsDisplayProps) {
  const { fields, isLoading, error } = useCategoryFields(categoryId);

  // Filter to only visible fields
  const visibleFields = fields.filter((f) => f.isVisible);

  // Group fields by uiGroup
  const groupedFields = groupFieldsByGroup(visibleFields);

  // Show nothing if no category or no attributes
  if (!categoryId || !attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show nothing if error or no visible fields
  if (error || visibleFields.length === 0) {
    return null;
  }

  // Filter to only fields that have values
  const fieldsWithValues = visibleFields.filter(
    (field) =>
      attributes[field.fieldName] !== null &&
      attributes[field.fieldName] !== undefined &&
      attributes[field.fieldName] !== "",
  );

  if (fieldsWithValues.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedFields).map(([groupName, groupFields]) => {
        // Filter to only fields with values in this group
        const groupFieldsWithValues = groupFields.filter(
          (field) =>
            attributes[field.fieldName] !== null &&
            attributes[field.fieldName] !== undefined &&
            attributes[field.fieldName] !== "",
        );

        if (groupFieldsWithValues.length === 0) return null;

        return (
          <div key={groupName} className="space-y-4">
            {groupName !== "default" && (
              <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {groupName}
              </h4>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupFieldsWithValues.map((field) => (
                <CustomFieldValue
                  key={field.id}
                  field={field}
                  value={attributes[field.fieldName]}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CustomFieldValueProps {
  field: EnrichedAssetCategoryFieldDTO;
  value: unknown;
}

function CustomFieldValue({ field, value }: CustomFieldValueProps) {
  return (
    <div>
      <p className="text-muted-foreground text-sm font-medium">
        {field.fieldLabel}
      </p>
      <div className="text-sm">
        <FormattedValue field={field} value={value} />
      </div>
    </div>
  );
}

interface FormattedValueProps {
  field: EnrichedAssetCategoryFieldDTO;
  value: unknown;
}

function FormattedValue({ field, value }: FormattedValueProps) {
  // Handle null/undefined
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.dataType) {
    case "STRING":
    case "TEXT":
      return <span className="whitespace-pre-wrap">{String(value)}</span>;

    case "INTEGER":
      return <span>{Number(value).toLocaleString()}</span>;

    case "DECIMAL":
      return (
        <span>
          {Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );

    case "BOOLEAN":
      return value ? (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Yes
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          No
        </Badge>
      );

    case "DATE": {
      let formattedDate: string;
      try {
        formattedDate = format(new Date(String(value)), "MMM d, yyyy");
      } catch {
        formattedDate = String(value);
      }
      return <span>{formattedDate}</span>;
    }

    case "DATETIME": {
      let formattedDateTime: string;
      try {
        formattedDateTime = format(
          new Date(String(value)),
          "MMM d, yyyy 'at' h:mm a",
        );
      } catch {
        formattedDateTime = String(value);
      }
      return <span>{formattedDateTime}</span>;
    }

    case "ENUM":
      return <Badge variant="outline">{String(value)}</Badge>;

    case "JSON": {
      let formattedJson: string;
      try {
        formattedJson = JSON.stringify(value, null, 2);
      } catch {
        formattedJson = String(value);
      }
      return (
        <pre className="bg-muted text-muted-foreground max-h-32 overflow-x-auto rounded-md p-2 text-xs">
          {formattedJson}
        </pre>
      );
    }

    case "CI_REFERENCE":
      return <ReferenceValue type="ci" id={String(value)} />;

    case "PERSON_REFERENCE":
      return <ReferenceValue type="person" id={String(value)} />;

    case "ORG_UNIT_REFERENCE":
      return <ReferenceValue type="orgUnit" id={String(value)} />;

    case "LOCATION_REFERENCE":
      return <ReferenceValue type="location" id={String(value)} />;

    default:
      return <span>{String(value)}</span>;
  }
}

interface ReferenceValueProps {
  type: "ci" | "person" | "orgUnit" | "location";
  id: string;
}

function ReferenceValue({ type, id }: ReferenceValueProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    async function resolveReference() {
      setLoading(true);
      try {
        let name: string | null = null;
        let link: string | null = null;

        switch (type) {
          case "ci": {
            const result = await getConfigurationItemAction(id);
            if (result.success) {
              name = result.data.name;
              link = `/configuration-items/${id}`;
            }
            break;
          }
          case "person": {
            const result = await getPersonAction(id);
            if (result.success) {
              name = `${result.data.firstName} ${result.data.lastName}`;
              link = `/persons/${id}`;
            }
            break;
          }
          case "orgUnit": {
            const result = await getOrganizationUnitAction(id);
            if (result.success) {
              name = result.data.name;
              link = `/organization-units/${id}`;
            }
            break;
          }
          case "location": {
            const result = await getLocationAction(id);
            if (result.success) {
              name = result.data.name;
              link = `/locations/${id}`;
            }
            break;
          }
        }

        setDisplayName(name);
        setHref(link);
      } catch {
        // Failed to resolve reference
      } finally {
        setLoading(false);
      }
    }

    resolveReference();
  }, [type, id]);

  if (loading) {
    return <Skeleton className="h-5 w-24" />;
  }

  if (!displayName) {
    return <span className="text-muted-foreground">{id}</span>;
  }

  if (href) {
    return (
      <Link
        href={href}
        className="hover:text-primary inline-flex items-center gap-1 hover:underline"
      >
        {displayName}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }

  return <span>{displayName}</span>;
}

/**
 * Group fields by their uiGroup, defaulting to "default"
 */
function groupFieldsByGroup(
  fields: EnrichedAssetCategoryFieldDTO[],
): Record<string, EnrichedAssetCategoryFieldDTO[]> {
  const groups: Record<string, EnrichedAssetCategoryFieldDTO[]> = {};

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

export default CustomFieldsDisplay;
