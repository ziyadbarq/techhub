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
 */

import { useState, useEffect, useMemo, useRef } from "react";
import type {
  EntityConfig,
  ParsedFile,
  ColumnMapping,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { importProcessor } from "@/lib/data-import/import-processor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { toast } from "sonner";
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

  // Track if we've shown the initial toast
  const hasShownToast = useRef(false);

  /**
   * Show toast for auto-mapping (only once on initial render)
   */
  useEffect(() => {
    if (!hasShownToast.current && mappings.size > 0) {
      toast.success(
        `Auto-mapping complete: ${mappings.size} columns mapped automatically`,
      );
      hasShownToast.current = true;
    }
  }, [mappings.size]);

  /**
   * Get column mappings array
   */
  const columnMappings = useMemo((): ColumnMapping[] => {
    return entity.fields.map((field) => {
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
  }, [mappings, entity.fields]);

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

    toast.success(`${autoMapped.size} columns auto-mapped`);
  };

  /**
   * Clear all mappings
   */
  const handleClearAll = () => {
    setMappings(new Map());
    toast.info("All mappings cleared");
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
   * Get unmapped required fields
   */
  const unmappedRequiredFields = useMemo(() => {
    return entity.requiredFields.filter((fieldName) => {
      return !Array.from(mappings.values()).includes(fieldName);
    });
  }, [entity.requiredFields, mappings]);

  /**
   * Can continue?
   */
  const canContinue = unmappedRequiredFields.length === 0;

  /**
   * Get field info
   */
  const getFieldInfo = (fieldName: string) => {
    return entity.fields.find((f) => f.name === fieldName);
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
                      <Select
                        value={mappedColumn}
                        onValueChange={(value) =>
                          handleFieldChange(field.name, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unmapped__">
                            <span className="text-muted-foreground">
                              Not mapped
                            </span>
                          </SelectItem>
                          {parsedFile.columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            <CardDescription>These fields can be left unmapped</CardDescription>
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
                        ) : (
                          <div className="border-muted h-5 w-5 rounded-full border-2" />
                        )}
                      </div>

                      {/* Field Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            Optional
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
                        <Select
                          value={mappedColumn}
                          onValueChange={(value) =>
                            handleFieldChange(field.name, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__unmapped__">
                              <span className="text-muted-foreground">
                                Not mapped
                              </span>
                            </SelectItem>
                            {parsedFile.columns.map((col) => (
                              <SelectItem key={col} value={col}>
                                {col}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
