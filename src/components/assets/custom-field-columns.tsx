/**
 * Custom Field Columns for Assets Table
 * Dynamically generates TanStack Table columns based on custom field definitions
 */

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Mail,
  Phone,
  DollarSign,
  Paperclip,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import type { EnrichedAssetCategoryFieldDTO } from "@/interface-adapters/presenters/asset-category-field.presenter";
import { listEnrichedAssetCategoryFieldsAction } from "@/interface-adapters/controllers/asset-category-field.controller";
import type { FieldDataTypeEnum } from "@/generated/prisma";

/**
 * Custom field info for column generation
 */
export interface CustomFieldInfo {
  fieldName: string;
  fieldLabel: string;
  dataType: FieldDataTypeEnum;
  enumOptions: string[] | null;
}

/**
 * Cache for category fields to avoid redundant fetches
 */
const categoryFieldsCache = new Map<string, EnrichedAssetCategoryFieldDTO[]>();

/**
 * Fetch custom fields for multiple categories
 */
async function fetchFieldsForCategories(
  categoryIds: string[],
): Promise<Map<string, EnrichedAssetCategoryFieldDTO[]>> {
  const results = new Map<string, EnrichedAssetCategoryFieldDTO[]>();

  await Promise.all(
    categoryIds.map(async (categoryId) => {
      // Check cache first
      if (categoryFieldsCache.has(categoryId)) {
        results.set(categoryId, categoryFieldsCache.get(categoryId)!);
        return;
      }

      try {
        const result = await listEnrichedAssetCategoryFieldsAction(categoryId);
        if (result.success) {
          const fields = result.data.filter((f) => f.isVisible);
          categoryFieldsCache.set(categoryId, fields);
          results.set(categoryId, fields);
        }
      } catch {
        // Silently fail - table will still work without custom columns
      }
    }),
  );

  return results;
}

/**
 * Extract unique custom fields from category fields map
 * Deduplicates by fieldName
 */
function extractUniqueFields(
  categoryFieldsMap: Map<string, EnrichedAssetCategoryFieldDTO[]>,
): CustomFieldInfo[] {
  const fieldMap = new Map<string, CustomFieldInfo>();

  for (const fields of categoryFieldsMap.values()) {
    for (const field of fields) {
      if (!fieldMap.has(field.fieldName)) {
        fieldMap.set(field.fieldName, {
          fieldName: field.fieldName,
          fieldLabel: field.fieldLabel,
          dataType: field.dataType,
          enumOptions: field.enumOptions,
        });
      }
    }
  }

  // Sort alphabetically by label
  return Array.from(fieldMap.values()).sort((a, b) =>
    a.fieldLabel.localeCompare(b.fieldLabel),
  );
}

/**
 * Whether any of the given assets actually carries a value for this field.
 */
function fieldHasValues(assets: AssetDTO[], field: CustomFieldInfo): boolean {
  return assets.some((asset) => {
    const value = asset.attributes?.[field.fieldName];
    return value !== null && value !== undefined && value !== "";
  });
}

/**
 * Render a custom field value based on data type
 */
function CustomFieldCell({
  value,
  dataType,
}: {
  value: unknown;
  dataType: FieldDataTypeEnum;
}) {
  // Handle null/undefined
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  switch (dataType) {
    case "STRING":
    case "TEXT":
      return (
        <span className="block max-w-[200px] truncate text-sm">
          {String(value)}
        </span>
      );

    case "INTEGER":
      return (
        <span className="text-sm tabular-nums">
          {Number(value).toLocaleString()}
        </span>
      );

    case "DECIMAL":
      return (
        <span className="text-sm tabular-nums">
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
      return <span className="text-sm">{formattedDate}</span>;
    }

    case "DATETIME": {
      let formattedDateTime: string;
      try {
        formattedDateTime = format(
          new Date(String(value)),
          "MMM d, yyyy HH:mm",
        );
      } catch {
        formattedDateTime = String(value);
      }
      return <span className="text-sm">{formattedDateTime}</span>;
    }

    case "ENUM":
      return (
        <Badge variant="outline" className="text-xs">
          {String(value)}
        </Badge>
      );

    case "JSON":
      return (
        <span className="text-muted-foreground block max-w-[150px] truncate text-xs">
          {typeof value === "object" ? JSON.stringify(value) : String(value)}
        </span>
      );

    case "CI_REFERENCE":
    case "PERSON_REFERENCE":
    case "ORG_UNIT_REFERENCE":
    case "LOCATION_REFERENCE":
      // For reference types, just show the ID (or could be enhanced to resolve names)
      return (
        <span className="text-muted-foreground text-sm">{String(value)}</span>
      );

    // New data types (Phase 3)
    case "URL":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex max-w-[150px] items-center gap-1 truncate text-sm hover:underline"
        >
          <LinkIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{String(value)}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );

    case "EMAIL":
      return (
        <a
          href={`mailto:${String(value)}`}
          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
        >
          <Mail className="h-3 w-3" />
          {String(value)}
        </a>
      );

    case "PHONE":
      return (
        <a
          href={`tel:${String(value)}`}
          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
        >
          <Phone className="h-3 w-3" />
          {String(value)}
        </a>
      );

    case "MULTI_SELECT_ENUM": {
      const selectedValues = Array.isArray(value) ? value : [];
      if (selectedValues.length === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {selectedValues.slice(0, 3).map((v) => (
            <Badge key={String(v)} variant="outline" className="text-xs">
              {String(v)}
            </Badge>
          ))}
          {selectedValues.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedValues.length - 3}
            </Badge>
          )}
        </div>
      );
    }

    case "CURRENCY": {
      const currencyValue = value as {
        amount?: number;
        currency?: string;
      } | null;
      if (!currencyValue?.amount) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <span className="inline-flex items-center gap-1 text-sm tabular-nums">
          <DollarSign className="text-muted-foreground h-3 w-3" />
          {currencyValue.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-muted-foreground text-xs">
            {currencyValue.currency || "SAR"}
          </span>
        </span>
      );
    }

    case "ATTACHMENT_REFERENCE":
      return (
        <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
          <Paperclip className="h-3 w-3" />
          {String(value)}
        </span>
      );

    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}

/**
 * Generate a column definition for a custom field
 */
function createCustomFieldColumn(
  field: CustomFieldInfo,
  hasValues: boolean,
): ColumnDef<AssetDTO> {
  return {
    id: `custom_${field.fieldName}`,
    accessorFn: (row) => row.attributes?.[field.fieldName],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={field.fieldLabel} />
    ),
    cell: ({ row }) => {
      const value = row.original.attributes?.[field.fieldName];
      return <CustomFieldCell value={value} dataType={field.dataType} />;
    },
    meta: {
      label: field.fieldLabel,
      // A field defined for the category but filled in on no visible asset
      // would only add an all-dashes column, so start it hidden. It stays
      // available in the Columns menu.
      hiddenByDefault: !hasValues,
    },
    // Enable filtering and sorting based on data type
    enableSorting: [
      "STRING",
      "INTEGER",
      "DECIMAL",
      "DATE",
      "DATETIME",
    ].includes(field.dataType),
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
  };
}

/**
 * Hook to dynamically generate custom field columns for assets
 */
export function useCustomFieldColumns(assets: AssetDTO[]): {
  columns: ColumnDef<AssetDTO>[];
  isLoading: boolean;
  customFields: CustomFieldInfo[];
} {
  const [columns, setColumns] = React.useState<ColumnDef<AssetDTO>[]>([]);
  const [customFields, setCustomFields] = React.useState<CustomFieldInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Get unique category IDs from assets
  const categoryIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const asset of assets) {
      if (asset.assetCategoryId) {
        ids.add(asset.assetCategoryId);
      }
    }
    return Array.from(ids);
  }, [assets]);

  // Track previous category IDs to avoid unnecessary fetches
  const prevCategoryIdsRef = React.useRef<string[]>([]);

  // Read the latest rows inside the effect without making it re-fetch on
  // every data change - only the set of categories should trigger a reload.
  const assetsRef = React.useRef(assets);
  assetsRef.current = assets;

  React.useEffect(() => {
    // Check if category IDs have changed
    const sortedCurrent = [...categoryIds].sort().join(",");
    const sortedPrev = [...prevCategoryIdsRef.current].sort().join(",");

    if (sortedCurrent === sortedPrev) {
      return; // No change in categories
    }

    prevCategoryIdsRef.current = categoryIds;

    if (categoryIds.length === 0) {
      setColumns([]);
      setCustomFields([]);
      return;
    }

    async function loadCustomFields() {
      setIsLoading(true);
      try {
        const categoryFieldsMap = await fetchFieldsForCategories(categoryIds);
        const uniqueFields = extractUniqueFields(categoryFieldsMap);
        setCustomFields(uniqueFields);

        // Generate columns for each unique field
        const newColumns = uniqueFields.map((field) =>
          createCustomFieldColumn(
            field,
            fieldHasValues(assetsRef.current, field),
          ),
        );
        setColumns(newColumns);
      } catch {
        // Silently fail
        setColumns([]);
        setCustomFields([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomFields();
  }, [categoryIds]);

  return { columns, isLoading, customFields };
}

/**
 * Clear the custom fields cache
 */
export function clearCustomFieldColumnsCache(categoryId?: string): void {
  if (categoryId) {
    categoryFieldsCache.delete(categoryId);
  } else {
    categoryFieldsCache.clear();
  }
}
