"use client";

/**
 * Step 4: Field Mapper
 *
 * Maps CSV columns to entity fields:
 * - Auto-mapping with confidence indicators
 * - Manual mapping adjustments
 * - Required vs optional field distinction
 * - Unmapped column handling
 * - Field info tooltips
 * - Custom fields support for Asset imports
 */

import { useState, useEffect, useMemo, useRef } from "react";
import type {
  EntityConfig,
  EntityFieldConfig,
  ParsedFile,
  ColumnMapping,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { importProcessor } from "@/lib/data-import/import-processor";
import { toEntityFieldConfigs } from "@/lib/data-import/custom-field-loader";
import { listEnrichedAssetCategoryFieldsAction } from "@/interface-adapters/controllers/asset-category-field.controller";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Wand2,
  ExternalLink,
  Sparkles,
  Loader2,
  Puzzle,
} from "lucide-react";
import Link from "next/link";

interface Props {
  entity: EntityConfig;
  parsedFile: ParsedFile;
  lookupMaps: Map<string, LookupMap>;
  onColumnsMapped: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

export function Step4FieldMapper({
  entity,
  parsedFile,
  lookupMaps,
  onColumnsMapped,
  onBack,
}: Props) {
  // Initialize mappings with auto-mapped values
  const [mappings, setMappings] = useState<Map<string, string>>(() =>
    importProcessor.autoMapColumns(
      parsedFile.columns,
      entity.fields.map((f) => ({
        name: f.name,
        label: f.label,
        autoMap: f.autoMap,
      })),
    ),
  );

  // Track last loaded category to prevent double-execution in React Strict Mode
  const loadedCategoryRef = useRef<string | null>(null);

  // Custom fields state for Asset imports
  const [customFields, setCustomFields] = useState<EntityFieldConfig[]>([]);
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);
  const [detectedCategoryId, setDetectedCategoryId] = useState<string | null>(
    null,
  );
  const [detectedCategoryCode, setDetectedCategoryCode] = useState<
    string | null
  >(null);

  /**
   * Check if this is an Asset import and detect the category from CSV data
   */
  const isAssetImport = entity.key === "ASSET";

  /**
   * Detect category from CSV data when assetCategoryId is mapped
   */
  useEffect(() => {
    if (!isAssetImport) return;

    // Find the CSV column mapped to assetCategoryId
    let categoryColumn: string | null = null;
    for (const [col, fieldName] of mappings.entries()) {
      if (fieldName === "assetCategoryId") {
        categoryColumn = col;
        break;
      }
    }

    if (!categoryColumn) {
      setDetectedCategoryId(null);
      setDetectedCategoryCode(null);
      setCustomFields([]);
      return;
    }

    // Get the category value from the first row of preview data
    const firstRow = parsedFile.preview[0];
    if (!firstRow) {
      setDetectedCategoryId(null);
      setDetectedCategoryCode(null);
      setCustomFields([]);
      return;
    }

    const categoryValue = String(firstRow[categoryColumn] || "").trim();
    if (!categoryValue) {
      setDetectedCategoryId(null);
      setDetectedCategoryCode(null);
      setCustomFields([]);
      return;
    }

    // Use lookupMaps to resolve category code to ID
    const categoryMap =
      lookupMaps.get("assetCategoryId") ?? lookupMaps.get("AssetCategory");
    if (!categoryMap) {
      setDetectedCategoryCode(categoryValue);
      setDetectedCategoryId(null);
      return;
    }

    // Try to find the category ID from the lookup map
    const categoryId =
      categoryMap.entries.get(categoryValue.toLowerCase()) ??
      categoryMap.entries.get(categoryValue.toUpperCase()) ??
      categoryMap.entries.get(categoryValue);

    setDetectedCategoryCode(categoryValue);
    setDetectedCategoryId(categoryId ?? null);
  }, [isAssetImport, mappings, parsedFile.preview, lookupMaps]);

  /**
   * Load custom fields when category is detected
   */
  useEffect(() => {
    if (!detectedCategoryId) {
      setCustomFields([]);
      loadedCategoryRef.current = null;
      return;
    }

    // Prevent double-execution in React Strict Mode for the same category
    if (loadedCategoryRef.current === detectedCategoryId) {
      return;
    }
    loadedCategoryRef.current = detectedCategoryId;

    const loadFields = async () => {
      setCustomFieldsLoading(true);
      try {
        const result =
          await listEnrichedAssetCategoryFieldsAction(detectedCategoryId);
        if (!result.success) {
          setCustomFields([]);
          return;
        }
        const fields = toEntityFieldConfigs(result.data);
        setCustomFields(fields);

        // Auto-map custom fields to CSV columns if possible
        if (fields.length > 0) {
          const customFieldAutoMapped = importProcessor.autoMapColumns(
            parsedFile.columns,
            fields.map((f) => ({
              name: f.name,
              label: f.label,
              autoMap: f.autoMap,
            })),
          );

          // Merge with existing mappings
          setMappings((prev) => {
            const newMappings = new Map(prev);
            for (const [col, fieldName] of customFieldAutoMapped.entries()) {
              // Only add if not already mapped
              if (!newMappings.has(col)) {
                newMappings.set(col, fieldName);
              }
            }
            return newMappings;
          });
        }
      } catch {
        setCustomFields([]);
      } finally {
        setCustomFieldsLoading(false);
      }
    };

    loadFields();
  }, [detectedCategoryId, parsedFile.columns]);

  /**
   * Get all fields including custom fields
   */
  const allFields = useMemo((): EntityFieldConfig[] => {
    return [...entity.fields, ...customFields];
  }, [entity.fields, customFields]);

  /**
   * Get column mappings array (including custom fields)
   */
  const columnMappings = useMemo((): ColumnMapping[] => {
    return allFields.map((field) => {
      // Find CSV column mapped to this field
      let csvColumn: string | null = null;
      let autoMapped = false;

      for (const [col, fieldName] of mappings.entries()) {
        if (fieldName === field.name) {
          csvColumn = col;
          autoMapped = true;
          break;
        }
      }

      return {
        csvColumn: csvColumn || "",
        entityField: field.name,
        isRequired: field.required,
        isMapped: csvColumn !== null,
        autoMapped,
        confidence: autoMapped ? 85 : 0,
      };
    });
  }, [mappings, allFields]);

  /**
   * Handle mapping change (unused - keeping for potential future use)
   */
  const _handleMappingChange = (csvColumn: string, entityField: string) => {
    setMappings((prev) => {
      const newMappings = new Map(prev);

      // Remove old mapping for this CSV column
      for (const [col, _field] of newMappings.entries()) {
        if (col === csvColumn) {
          newMappings.delete(col);
        }
      }

      // Add new mapping if not "ignore"
      if (entityField !== "__ignore__") {
        newMappings.set(csvColumn, entityField);
      }

      return newMappings;
    });
  };

  /**
   * Handle field change (reverse mapping)
   */
  const handleFieldChange = (entityField: string, csvColumn: string) => {
    setMappings((prev) => {
      const newMappings = new Map(prev);

      // Remove old mapping for this entity field
      for (const [col, field] of Array.from(newMappings.entries())) {
        if (field === entityField) {
          newMappings.delete(col);
        }
      }

      // Add new mapping if not empty
      if (csvColumn && csvColumn !== "__unmapped__") {
        newMappings.set(csvColumn, entityField);
      }

      return newMappings;
    });
  };

  /**
   * Auto-map all similar names
   */
  const handleAutoMapAll = () => {
    const autoMapped = importProcessor.autoMapColumns(
      parsedFile.columns,
      entity.fields.map((f) => ({
        name: f.name,
        label: f.label,
        autoMap: f.autoMap,
      })),
    );

    setMappings(autoMapped);
  };

  /**
   * Clear all mappings
   */
  const handleClearAll = () => {
    setMappings(new Map());
  };

  /**
   * Continue to validation
   */
  const handleContinue = () => {
    onColumnsMapped(columnMappings);
  };

  /**
   * Get unmapped CSV columns
   */
  const unmappedCsvColumns = useMemo(() => {
    return parsedFile.columns.filter((col) => !mappings.has(col));
  }, [parsedFile.columns, mappings]);

  /**
   * Get required custom field names
   */
  const requiredCustomFieldNames = useMemo(() => {
    return customFields.filter((f) => f.required).map((f) => f.name);
  }, [customFields]);

  /**
   * Get all required field names (entity + custom)
   */
  const allRequiredFieldNames = useMemo(() => {
    return [...entity.requiredFields, ...requiredCustomFieldNames];
  }, [entity.requiredFields, requiredCustomFieldNames]);

  const unmappedRequiredFields = useMemo(() => {
    return allRequiredFieldNames.filter((fieldName) => {
      return !Array.from(mappings.values()).includes(fieldName);
    });
  }, [allRequiredFieldNames, mappings]);

  /**
   * Can continue?
   */
  const canContinue = unmappedRequiredFields.length === 0;

  /**
   * Column options for SearchableSelect
   */
  const columnOptions: SearchableSelectOption[] = useMemo(() => {
    return [
      { value: "__unmapped__", label: "Not mapped" },
      ...parsedFile.columns.map((col) => ({
        value: col,
        label: col,
      })),
    ];
  }, [parsedFile.columns]);

  /**
   * Get field info
   */
  const getFieldInfo = (fieldName: string) => {
    return allFields.find((f) => f.name === fieldName);
  };

  /**
   * Get mapped CSV column for field
   */
  const getMappedColumn = (fieldName: string): string => {
    for (const [col, field] of mappings.entries()) {
      if (field === fieldName) return col;
    }
    return "__unmapped__";
  };

  /**
   * Get sample lookup values (first 10) for a lookup field
   */
  const getLookupSamples = (fieldName: string): string[] => {
    const field = getFieldInfo(fieldName);
    if (!field || field.type !== "lookup" || !field.lookupTarget) return [];

    const map =
      lookupMaps.get(field.name) ?? lookupMaps.get(field.lookupTarget);
    if (!map || !map.allValues || map.allValues.length === 0) return [];

    return map.allValues.slice(0, 5);
  };

  /**
   * Get management link for lookup target (if available)
   */
  const getLookupLink = (fieldName: string): string | null => {
    const field = getFieldInfo(fieldName);
    if (!field || field.type !== "lookup" || !field.lookupTarget) return null;

    const linkMap: Record<string, string> = {
      OrganizationUnit: "/organization-units",
      Role: "/admin/roles",
      Location: "/locations",
      Person: "/persons",
    };

    return linkMap[field.lookupTarget] ?? null;
  };

  return (
    <div className="space-y-6">
      {/* Actions (top) */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continue to Validation
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Column Mapping</CardTitle>
              <CardDescription>
                Match your CSV columns to {entity.name} fields
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoMapAll}>
                <Wand2 className="mr-2 h-4 w-4" />
                Auto-Map All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{mappings.size}</div>
              <div className="text-muted-foreground text-sm">Mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {unmappedRequiredFields.length}
              </div>
              <div className="text-muted-foreground text-sm">
                Required Unmapped
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {unmappedCsvColumns.length}
              </div>
              <div className="text-muted-foreground text-sm">
                CSV Columns Unused
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {unmappedRequiredFields.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-1 font-medium">
              {unmappedRequiredFields.length} required field(s) not mapped:
            </div>
            <ul className="list-inside list-disc text-sm">
              {unmappedRequiredFields.map((field) => {
                const fieldInfo = getFieldInfo(field);
                return <li key={field}>{fieldInfo?.label || field}</li>;
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Required Fields ({entity.requiredFields.length})
          </CardTitle>
          <CardDescription>
            These fields must be mapped to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {entity.fields
            .filter((f) => f.required)
            .map((field) => {
              const mappedColumn = getMappedColumn(field.name);
              const isMapped = mappedColumn !== "__unmapped__";

              return (
                <div key={field.name} className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {isMapped ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    {/* Field Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="text-muted-foreground h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {field.description}
                                </p>
                                <p className="text-xs">Type: {field.type}</p>
                                {field.examples &&
                                  field.examples.length > 0 && (
                                    <p className="text-xs">
                                      Examples: {field.examples.join(", ")}
                                    </p>
                                  )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-2 truncate text-sm">
                        <span>{field.name}</span>
                        {getLookupLink(field.name) ? (
                          <Link
                            href={getLookupLink(field.name)!}
                            target="_blank"
                            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Manage values
                          </Link>
                        ) : null}
                      </p>
                    </div>

                    {/* Mapping Selector */}
                    <div className="w-64">
                      <SearchableSelect
                        options={columnOptions}
                        value={mappedColumn}
                        onValueChange={(value) =>
                          handleFieldChange(field.name, value)
                        }
                        placeholder="Select column..."
                        searchPlaceholder="Search columns..."
                        emptyMessage="No matching columns"
                        maxVisibleItems={5}
                      />
                    </div>
                  </div>
                  {field.type === "lookup" ? (
                    <div className="text-muted-foreground ml-12 flex flex-wrap items-center gap-2 text-xs">
                      {getLookupSamples(field.name).length > 0 ? (
                        <>
                          <span>Sample values:</span>
                          {getLookupSamples(field.name).map((val, idx) => (
                            <Badge
                              key={`${field.name}-${val || idx}`}
                              variant="outline"
                              className="bg-muted/50"
                            >
                              {val || "–"}
                            </Badge>
                          ))}
                        </>
                      ) : (
                        <span>No sample values found</span>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Optional Fields */}
      {entity.fields.filter((f) => !f.required).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Optional Fields ({entity.fields.filter((f) => !f.required).length}
              )
            </CardTitle>
            <CardDescription>
              These fields can be left unmapped. Auto-generated fields will be
              filled automatically if not provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {entity.fields
              .filter((f) => !f.required)
              .map((field) => {
                const mappedColumn = getMappedColumn(field.name);
                const isMapped = mappedColumn !== "__unmapped__";

                return (
                  <div key={field.name} className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {isMapped ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : field.autoGenerate ? (
                          <Sparkles className="h-5 w-5 text-blue-500" />
                        ) : (
                          <div className="border-muted h-5 w-5 rounded-full border-2" />
                        )}
                      </div>

                      {/* Field Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.autoGenerate ? (
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                            >
                              Auto-generated
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="text-muted-foreground h-4 w-4" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {field.description}
                                  </p>
                                  <p className="text-xs">Type: {field.type}</p>
                                  {field.examples &&
                                    field.examples.length > 0 && (
                                      <p className="text-xs">
                                        Examples: {field.examples.join(", ")}
                                      </p>
                                    )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 truncate text-sm">
                          <span>{field.name}</span>
                          {getLookupLink(field.name) ? (
                            <Link
                              href={getLookupLink(field.name)!}
                              target="_blank"
                              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Manage values
                            </Link>
                          ) : null}
                        </p>
                      </div>

                      {/* Mapping Selector */}
                      <div className="w-64">
                        <SearchableSelect
                          options={columnOptions}
                          value={mappedColumn}
                          onValueChange={(value) =>
                            handleFieldChange(field.name, value)
                          }
                          placeholder="Select column..."
                          searchPlaceholder="Search columns..."
                          emptyMessage="No matching columns"
                          maxVisibleItems={5}
                        />
                      </div>
                    </div>
                    {field.type === "lookup" ? (
                      <div className="text-muted-foreground ml-12 flex flex-wrap items-center gap-2 text-xs">
                        {getLookupSamples(field.name).length > 0 ? (
                          <>
                            <span>Sample values:</span>
                            {getLookupSamples(field.name).map((val, idx) => (
                              <Badge
                                key={`${field.name}-${val || idx}`}
                                variant="outline"
                                className="bg-muted/50"
                              >
                                {val || "–"}
                              </Badge>
                            ))}
                          </>
                        ) : (
                          <span>No sample values found</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Custom Fields Section (for Asset imports) */}
      {isAssetImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle className="text-base">
                    Custom Fields
                    {customFields.length > 0 && ` (${customFields.length})`}
                  </CardTitle>
                  <CardDescription>
                    {detectedCategoryCode
                      ? `Category-specific fields for "${detectedCategoryCode}"`
                      : "Map the Asset Category field to load custom fields"}
                  </CardDescription>
                </div>
              </div>
              {customFieldsLoading && (
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!detectedCategoryId && !customFieldsLoading && (
              <div className="text-muted-foreground py-4 text-center">
                {detectedCategoryCode ? (
                  <p className="text-sm">
                    Category &quot;{detectedCategoryCode}&quot; not found.
                    Please check the category code in your CSV.
                  </p>
                ) : (
                  <p className="text-sm">
                    Map the <strong>Asset Category Code</strong> field above to
                    load custom fields for that category.
                  </p>
                )}
              </div>
            )}

            {customFieldsLoading && (
              <div className="text-muted-foreground py-4 text-center">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                <p className="text-sm">Loading custom fields...</p>
              </div>
            )}

            {detectedCategoryId &&
              customFields.length === 0 &&
              !customFieldsLoading && (
                <div className="text-muted-foreground py-4 text-center">
                  <p className="text-sm">
                    No custom fields defined for this category.
                  </p>
                </div>
              )}

            {customFields.length > 0 && !customFieldsLoading && (
              <div className="space-y-3">
                {customFields.map((field) => {
                  const mappedColumn = getMappedColumn(field.name);
                  const isMapped = mappedColumn !== "__unmapped__";

                  return (
                    <div key={field.name} className="space-y-2">
                      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isMapped ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : field.required ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <div className="border-muted h-5 w-5 rounded-full border-2" />
                          )}
                        </div>

                        {/* Field Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.label}</span>
                            {field.required ? (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Optional
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="border-purple-300 bg-purple-100 text-xs text-purple-700 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            >
                              Custom
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="text-muted-foreground h-4 w-4" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {field.description || field.label}
                                    </p>
                                    <p className="text-xs">
                                      Type: {field.type}
                                    </p>
                                    {field.examples &&
                                      field.examples.length > 0 && (
                                        <p className="text-xs">
                                          Examples: {field.examples.join(", ")}
                                        </p>
                                      )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-muted-foreground truncate text-sm">
                            {field.name}
                          </p>
                        </div>

                        {/* Mapping Selector */}
                        <div className="w-64">
                          <SearchableSelect
                            options={columnOptions}
                            value={mappedColumn}
                            onValueChange={(value) =>
                              handleFieldChange(field.name, value)
                            }
                            placeholder="Select column..."
                            searchPlaceholder="Search columns..."
                            emptyMessage="No matching columns"
                            maxVisibleItems={5}
                          />
                        </div>
                      </div>
                      {field.type === "lookup" ? (
                        <div className="text-muted-foreground ml-12 flex flex-wrap items-center gap-2 text-xs">
                          {getLookupSamples(field.name).length > 0 ? (
                            <>
                              <span>Sample values:</span>
                              {getLookupSamples(field.name).map((val, idx) => (
                                <Badge
                                  key={`${field.name}-${val || idx}`}
                                  variant="outline"
                                  className="bg-muted/50"
                                >
                                  {val || "–"}
                                </Badge>
                              ))}
                            </>
                          ) : (
                            <span>No sample values found</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unmapped CSV Columns */}
      {unmappedCsvColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Unmapped CSV Columns ({unmappedCsvColumns.length})
            </CardTitle>
            <CardDescription>
              These columns from your file will be ignored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmappedCsvColumns.map((col) => (
                <Badge
                  key={col}
                  variant="outline"
                  className="text-muted-foreground"
                >
                  {col}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
    </div>
  );
}
