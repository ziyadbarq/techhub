/**
 * Import Processor
 *
 * Orchestrates the batch processing of imported data with validation,
 * duplicate detection, transaction management, and error handling.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as XLSX from "xlsx";
import Papa from "papaparse";
import type {
  EntityConfig,
  ImportSettings,
  ImportProgress,
  ImportResult,
  ImportError,
  ImportActivity,
  ParsedFile,
  RowValidationResult,
  LookupMap,
  DuplicateStrategy,
} from "./entity-config.types";
import { csvSanitizer } from "./csv-sanitizer";
import { fieldValidator } from "./field-validators";
import { lookupResolver } from "./lookup-resolver";
import { extractCustomFieldValues } from "./custom-field-loader";

/**
 * Import processor class
 */
export class ImportProcessor {
  /**
   * Detects and removes template instruction rows (second row in generated templates)
   */
  private isTemplateInstructionRow(row: Record<string, any>): boolean {
    const values = Object.values(row)
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
      .map((v) => String(v).trim().toLowerCase());

    if (values.length === 0) return false;

    // Template instruction rows start with "Type: ..."
    return values.every((val) => val.startsWith("type:"));
  }
  /**
   * Parse uploaded file (CSV or Excel)
   */
  async parseFile(file: File): Promise<ParsedFile> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      return this.parseCSV(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      return this.parseExcel(file);
    } else {
      throw new Error(
        "Unsupported file format. Please upload CSV or Excel files.",
      );
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, any>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.replace("*", "").trim(),
        complete: (results) => {
          const rows = results.data.filter(
            (row) => !this.isTemplateInstructionRow(row),
          );
          const columns = results.meta.fields || [];

          resolve({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            rowCount: rows.length,
            columnCount: columns.length,
            columns,
            rows,
            preview: rows.slice(0, 5),
            parseErrors: results.errors.map((e) => e.message),
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
            worksheet,
            {
              defval: "",
            },
          );

          // Get column headers
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

          // Clean headers (remove asterisks)
          const cleanRows = rows.map((row) => {
            const cleanRow: Record<string, any> = {};
            for (const [key, value] of Object.entries(row)) {
              const cleanKey = key.replace("*", "").trim();
              cleanRow[cleanKey] = value;
            }
            return cleanRow;
          });

          const cleanColumns = columns.map((col) =>
            col.replace("*", "").trim(),
          );

          const filteredRows = cleanRows.filter(
            (row) => !this.isTemplateInstructionRow(row),
          );

          resolve({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            rowCount: filteredRows.length,
            columnCount: cleanColumns.length,
            columns: cleanColumns,
            rows: filteredRows,
            preview: filteredRows.slice(0, 5),
            parseErrors: [],
          });
        } catch (error) {
          reject(
            new Error(
              `Excel parsing error: ${error instanceof Error ? error.message : "Unknown error"}`,
            ),
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate imported data
   */
  async validateData(
    rows: Array<Record<string, any>>,
    entityConfig: EntityConfig,
    settings: ImportSettings,
    lookupMaps: Map<string, LookupMap>,
  ): Promise<{
    validRows: RowValidationResult[];
    invalidRows: RowValidationResult[];
    totalErrors: number;
    totalWarnings: number;
  }> {
    const validRows: RowValidationResult[] = [];
    const invalidRows: RowValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    // Track unique values for duplicate detection within file
    const uniqueValueTrackers = new Map<string, Set<string>>();
    for (const fieldName of entityConfig.uniqueFields) {
      uniqueValueTrackers.set(fieldName, new Set());
    }

    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      const rowNumber = i + 1;

      // Skip empty rows if configured
      if (settings.skipEmptyRows && csvSanitizer.isEmptyRow(row)) {
        continue;
      }

      // Apply sanitization
      if (settings.autoTrimWhitespace) {
        row = csvSanitizer.trimAllFields(row);
      }

      if (settings.normalizeText) {
        row = csvSanitizer.normalizeCaseByType(row, entityConfig.fields);
      }

      if (settings.autoFixCommonErrors) {
        row = csvSanitizer.autoFixCommonErrors(row, entityConfig.fields);
      }

      // Sanitize row based on field configurations
      row = csvSanitizer.sanitizeRow(row, entityConfig.fields);

      // Validate row
      const validation = fieldValidator.validateRow(
        row,
        entityConfig.fields,
        rowNumber,
        lookupMaps,
      );

      // Check for duplicates within the file
      for (const fieldName of entityConfig.uniqueFields) {
        const value = row[fieldName];
        if (value) {
          const tracker = uniqueValueTrackers.get(fieldName)!;
          if (tracker.has(String(value))) {
            validation.errors.push({
              field: fieldName,
              message: `Duplicate value '${value}' found in the file`,
              severity: "error",
              value,
            });
            validation.valid = false;
          } else {
            tracker.add(String(value));
          }
        }
      }

      // Build result
      const result: RowValidationResult = {
        rowNumber,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        data: row,
      };

      if (result.valid) {
        validRows.push(result);
      } else {
        invalidRows.push(result);
      }

      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      // Check if we've hit max errors
      if (settings.stopOnFirstError && result.errors.length > 0) {
        break;
      }

      if (
        settings.maxErrorsBeforeAbort > 0 &&
        totalErrors >= settings.maxErrorsBeforeAbort
      ) {
        break;
      }
    }

    return {
      validRows,
      invalidRows,
      totalErrors,
      totalWarnings,
    };
  }

  /**
   * Process import in batches
   */
  async processImport(
    validRows: RowValidationResult[],
    entityConfig: EntityConfig,
    settings: ImportSettings,
    lookupMaps: Map<string, LookupMap>,
    onProgress?: (progress: ImportProgress) => void,
  ): Promise<ImportResult> {
    const startTime = new Date();
    const totalRows = validRows.length;
    const batchSize = Math.min(settings.batchSize, entityConfig.maxBatchSize);
    const totalBatches = Math.ceil(totalRows / batchSize);

    let successCount = 0;
    let skipCount = 0;
    let failureCount = 0;
    let createCount = 0;
    let updateCount = 0;

    const createdRecords: any[] = [];
    const updatedRecords: any[] = [];
    const skippedRows: ImportError[] = [];
    const failedRows: ImportError[] = [];
    const recentActivity: ImportActivity[] = [];

    // If dry run, skip actual import
    if (settings.dryRun) {
      return {
        success: true,
        totalRows,
        successCount: totalRows,
        skipCount: 0,
        failureCount: 0,
        createCount: totalRows,
        updateCount: 0,
        duration: 0,
        throughput: 0,
        createdRecords: [],
        updatedRecords: [],
        skippedRows: [],
        failedRows: [],
      };
    }

    // ============================================
    // PRE-IMPORT DUPLICATE DETECTION
    // ============================================
    // Check for existing records BEFORE processing if checkDuplicatesAction is available
    const duplicatesMap: Map<string, { id: string; [key: string]: unknown }> =
      new Map();

    if (
      entityConfig.checkDuplicatesAction &&
      settings.duplicateStrategy !== "fail"
    ) {
      // Collect unique field values from all valid rows
      const uniqueValues: string[] = [];
      for (const row of validRows) {
        for (const fieldName of entityConfig.uniqueFields) {
          const value = row.data[fieldName];
          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {
            uniqueValues.push(String(value));
          }
        }
      }

      if (uniqueValues.length > 0) {
        try {
          const checkResult =
            await entityConfig.checkDuplicatesAction(uniqueValues);
          if (checkResult.success && checkResult.data?.duplicates) {
            for (const dup of checkResult.data.duplicates) {
              // Map by the first non-id string value (the unique field value)
              for (const [key, value] of Object.entries(dup)) {
                if (
                  key !== "id" &&
                  typeof value === "string" &&
                  value.trim() !== ""
                ) {
                  duplicatesMap.set(value.toLowerCase(), dup);
                  break;
                }
              }
            }
          }
        } catch {
          // If duplicate check fails, continue with create-only approach
          // This maintains backward compatibility
        }
      }
    }

    // Determine if we should use bulkUpsertAction
    const useBulkUpsert =
      entityConfig.bulkUpsertAction &&
      duplicatesMap.size > 0 &&
      (settings.duplicateStrategy === "overwrite" ||
        settings.duplicateStrategy === "skip");

    // Process in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, totalRows);
      const batch = validRows.slice(batchStart, batchEnd);

      try {
        // Resolve lookups and fail fast on missing lookups
        const resolvedBatch: Array<Record<string, any>> = [];

        for (const row of batch) {
          const resolvedRow = { ...row.data };
          let hasMissingLookup = false;

          for (const field of entityConfig.fields) {
            if (field.type !== "lookup" || !field.lookupTarget) {
              continue;
            }

            const value = row.data[field.name];
            if (!value) continue;

            const lookupMap =
              lookupMaps.get(field.name) ?? lookupMaps.get(field.lookupTarget);
            const resolvedId = lookupMap
              ? lookupResolver.resolve(String(value), lookupMap, "fuzzy")
              : null;

            if (!resolvedId) {
              hasMissingLookup = true;
              failureCount += 1;
              failedRows.push({
                rowNumber: row.rowNumber,
                field: field.name,
                message: `Lookup not found for ${field.label || field.name}: ${value}`,
                originalValue: value,
              });
              recentActivity.push({
                timestamp: new Date(),
                type: "error",
                message: `Row ${row.rowNumber} skipped: missing ${field.label || field.name} '${value}'`,
                rowNumber: row.rowNumber,
              });
              break;
            }

            resolvedRow[field.name] = resolvedId;
            resolvedRow[`${field.name}_original`] = value;
          }

          if (!hasMissingLookup) {
            // Extract custom field values from attributes.* keys
            const customAttributes = extractCustomFieldValues(resolvedRow);
            if (Object.keys(customAttributes).length > 0) {
              // Merge with any existing attributes
              resolvedRow.attributes = {
                ...((resolvedRow.attributes as Record<string, unknown>) || {}),
                ...customAttributes,
              };
              // Remove the individual attributes.* keys
              for (const key of Object.keys(resolvedRow)) {
                if (key.startsWith("attributes.")) {
                  delete resolvedRow[key];
                }
              }
            }
            resolvedBatch.push(resolvedRow);
          }
        }

        // ============================================
        // CALL APPROPRIATE BULK ACTION
        // ============================================
        // Use bulkUpsertAction if available and duplicates were pre-checked
        // Otherwise fall back to bulkCreateAction
        let result: {
          success: boolean;
          data?: Record<string, any>;
          error?: string;
        };

        if (useBulkUpsert && entityConfig.bulkUpsertAction) {
          // Use the new bulkUpsertAction that handles both create and update
          result = await entityConfig.bulkUpsertAction(
            resolvedBatch,
            settings.duplicateStrategy,
          );
        } else {
          // Fall back to bulkCreateAction
          result = await entityConfig.bulkCreateAction(resolvedBatch);
        }

        if (result.success && result.data) {
          // Handle results from bulkUpsertAction (has separate created/updated counts)
          if (result.data.createdCount !== undefined) {
            createCount += result.data.createdCount || 0;
            updateCount += result.data.updatedCount || 0;
            successCount +=
              (result.data.createdCount || 0) + (result.data.updatedCount || 0);
            skipCount += result.data.skipCount || 0;
            failureCount += result.data.failureCount || 0;

            if (result.data.created) {
              createdRecords.push(...result.data.created);
            }
            if (result.data.updated) {
              updatedRecords.push(...result.data.updated);
            }
            if (result.data.skipped) {
              // Map skipped items to ImportError format
              const skippedItems = result.data.skipped as Array<{
                identifier: string;
                reason: string;
              }>;
              skippedRows.push(
                ...skippedItems.map((s, idx) => ({
                  rowNumber: batchStart + idx + 1,
                  field: entityConfig.uniqueFields[0] || "",
                  message: s.reason,
                  originalValue: s.identifier,
                })),
              );
            }
            if (result.data.failures) {
              const failures = result.data.failures as Array<{
                index: number;
                identifier: string;
                error: string;
              }>;
              failedRows.push(
                ...failures.map((f) => ({
                  rowNumber: batchStart + f.index + 1,
                  field: entityConfig.uniqueFields[0] || "",
                  message: f.error,
                  originalValue: f.identifier,
                })),
              );
            }
          } else {
            // Handle results from bulkCreateAction (legacy format)
            successCount += result.data.successCount || 0;
            createCount += result.data.successCount || 0; // All successes are creates
            skipCount += result.data.skipCount || 0;
            failureCount += result.data.failureCount || 0;

            if (result.data.created) {
              createdRecords.push(...result.data.created);
            }
            if (result.data.updated) {
              updatedRecords.push(...result.data.updated);
            }
            if (result.data.skipped) {
              skippedRows.push(...result.data.skipped);
            }
            if (result.data.failed) {
              failedRows.push(...result.data.failed);
            }

            // Handle failures array (reclassify duplicates as skips for backward compatibility)
            if (result.data.failures) {
              const failures = result.data.failures as Array<
                Record<string, any>
              >;

              const duplicateFailures: Array<Record<string, any>> = [];
              const otherFailures: Array<Record<string, any>> = [];

              for (const failure of failures) {
                const message =
                  (failure.error as string) ||
                  (failure.message as string) ||
                  "";
                if (
                  settings.duplicateStrategy === "skip" &&
                  message.toLowerCase().includes("already exists")
                ) {
                  duplicateFailures.push(failure);
                } else {
                  otherFailures.push(failure);
                }
              }

              if (duplicateFailures.length > 0) {
                skipCount += duplicateFailures.length;
                failureCount = Math.max(
                  0,
                  failureCount - duplicateFailures.length,
                );
                skippedRows.push(
                  ...duplicateFailures.map((failure) => ({
                    rowNumber:
                      typeof failure.index === "number"
                        ? failure.index + 1
                        : (failure.rowNumber ?? 0),
                    field: (failure.field ||
                      failure.email ||
                      failure.code ||
                      failure.name ||
                      failure.assetTag ||
                      "") as string,
                    message: "Skipped duplicate (already exists)",
                    originalValue:
                      (failure.value as string | number | undefined) ??
                      (failure.email as string | undefined) ??
                      (failure.code as string | undefined) ??
                      (failure.name as string | undefined) ??
                      (failure.assetTag as string | undefined) ??
                      undefined,
                  })),
                );
              }

              if (otherFailures.length > 0) {
                failedRows.push(
                  ...otherFailures.map((failure: Record<string, any>) => ({
                    rowNumber:
                      typeof failure.index === "number"
                        ? failure.index + 1
                        : (failure.rowNumber ?? 0),
                    field: (failure.field ||
                      failure.assetTag ||
                      failure.code ||
                      failure.email ||
                      failure.name ||
                      failure.movementType ||
                      failure.currency ||
                      "") as string,
                    message:
                      (failure.error as string) ||
                      (failure.message as string) ||
                      "Import failure",
                    originalValue:
                      (failure.value as string | number | undefined) ??
                      (failure.assetTag as string | undefined) ??
                      (failure.code as string | undefined) ??
                      (failure.email as string | undefined) ??
                      (failure.name as string | undefined) ??
                      undefined,
                  })),
                );
              }
            }
          }

          // Add activity
          recentActivity.push({
            timestamp: new Date(),
            type: "success",
            message: `Batch ${batchIndex + 1} completed: ${result.data.successCount} succeeded`,
          });
        } else {
          failureCount += batch.length;
          for (const row of batch) {
            failedRows.push({
              rowNumber: row.rowNumber,
              message: result.error || "Unknown error",
            });
          }

          recentActivity.push({
            timestamp: new Date(),
            type: "error",
            message: `Batch ${batchIndex + 1} failed: ${result.error}`,
          });
        }
      } catch (error) {
        failureCount += batch.length;
        for (const row of batch) {
          failedRows.push({
            rowNumber: row.rowNumber,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }

        recentActivity.push({
          timestamp: new Date(),
          type: "error",
          message: `Batch ${batchIndex + 1} error: ${error instanceof Error ? error.message : "Unknown"}`,
        });
      }

      // Report progress
      if (onProgress) {
        const elapsedMs = Date.now() - startTime.getTime();
        const processedRows = batchEnd;
        const progress: ImportProgress = {
          status: "importing",
          totalRows,
          processedRows,
          successCount,
          skipCount,
          failureCount,
          createCount,
          updateCount,
          currentBatch: batchIndex + 1,
          totalBatches,
          startTime,
          elapsedSeconds: Math.floor(elapsedMs / 1000),
          estimatedRemainingSeconds: Math.floor(
            ((elapsedMs / processedRows) * (totalRows - processedRows)) / 1000,
          ),
          recentActivity: recentActivity.slice(-10),
          errors: failedRows.slice(-50),
        };

        onProgress(progress);
      }
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    const throughput = duration > 0 ? totalRows / duration : 0;

    return {
      success: failureCount === 0,
      totalRows,
      successCount,
      skipCount,
      failureCount,
      createCount,
      updateCount,
      duration,
      throughput,
      createdRecords,
      updatedRecords,
      skippedRows,
      failedRows,
    };
  }

  /**
   * Auto-map CSV columns to entity fields
   */
  autoMapColumns(
    csvColumns: string[],
    entityFields: Array<{ name: string; label: string; autoMap?: string[] }>,
  ): Map<string, string> {
    const mapping = new Map<string, string>();

    for (const csvColumn of csvColumns) {
      const normalized = csvColumn.toLowerCase().trim();

      // Try exact match on field name
      const exactNameMatch = entityFields.find(
        (f) => f.name.toLowerCase() === normalized,
      );
      if (exactNameMatch) {
        mapping.set(csvColumn, exactNameMatch.name);
        continue;
      }

      // Try exact match on label
      const exactLabelMatch = entityFields.find(
        (f) => f.label.toLowerCase() === normalized,
      );
      if (exactLabelMatch) {
        mapping.set(csvColumn, exactLabelMatch.name);
        continue;
      }

      // Try auto-map alternatives
      const autoMapMatch = entityFields.find((f) =>
        f.autoMap?.some((alt) => alt.toLowerCase() === normalized),
      );
      if (autoMapMatch) {
        mapping.set(csvColumn, autoMapMatch.name);
        continue;
      }

      // Try fuzzy matching (remove spaces, underscores, hyphens)
      const fuzzyNormalized = normalized.replace(/[\s_-]/g, "");
      const fuzzyMatch = entityFields.find((f) => {
        const fuzzyFieldName = f.name.toLowerCase().replace(/[\s_-]/g, "");
        const fuzzyLabel = f.label.toLowerCase().replace(/[\s_-]/g, "");
        return (
          fuzzyFieldName === fuzzyNormalized || fuzzyLabel === fuzzyNormalized
        );
      });
      if (fuzzyMatch) {
        mapping.set(csvColumn, fuzzyMatch.name);
      }
    }

    return mapping;
  }

  /**
   * Check for existing records to handle duplicates
   */
  async checkDuplicates(
    rows: Array<Record<string, any>>,
    uniqueFields: string[],
    checkDuplicatesFn: (values: any[]) => Promise<any[]>,
  ): Promise<Map<string, any>> {
    const uniqueValues = new Set<string>();

    for (const row of rows) {
      for (const field of uniqueFields) {
        const value = row[field];
        if (value) {
          uniqueValues.add(String(value));
        }
      }
    }

    const existingRecords = await checkDuplicatesFn(Array.from(uniqueValues));
    const duplicates = new Map<string, any>();

    for (const record of existingRecords) {
      for (const field of uniqueFields) {
        const value = record[field];
        if (value) {
          duplicates.set(String(value), record);
        }
      }
    }

    return duplicates;
  }

  /**
   * Apply duplicate strategy
   */
  applyDuplicateStrategy(
    rows: Array<Record<string, any>>,
    duplicates: Map<string, any>,
    uniqueFields: string[],
    strategy: DuplicateStrategy,
  ): {
    toCreate: Array<Record<string, any>>;
    toUpdate: Array<Record<string, any>>;
    toSkip: Array<Record<string, any>>;
  } {
    const toCreate: Array<Record<string, any>> = [];
    const toUpdate: Array<Record<string, any>> = [];
    const toSkip: Array<Record<string, any>> = [];

    for (const row of rows) {
      let isDuplicate = false;
      let existingRecord: any = null;

      // Check if row is a duplicate
      for (const field of uniqueFields) {
        const value = row[field];
        if (value && duplicates.has(String(value))) {
          isDuplicate = true;
          existingRecord = duplicates.get(String(value));
          break;
        }
      }

      if (!isDuplicate) {
        toCreate.push(row);
        continue;
      }

      // Apply strategy for duplicates
      switch (strategy) {
        case "skip":
          toSkip.push(row);
          break;

        case "overwrite":
          toUpdate.push({ ...row, id: existingRecord.id });
          break;

        case "fail":
          // Will be handled as validation error
          toSkip.push(row);
          break;

        case "append": {
          // Modify unique field with suffix
          const modifiedRow = { ...row };
          for (const field of uniqueFields) {
            if (modifiedRow[field]) {
              modifiedRow[field] = `${modifiedRow[field]}-COPY`;
            }
          }
          toCreate.push(modifiedRow);
          break;
        }
      }
    }

    return { toCreate, toUpdate, toSkip };
  }
}

/**
 * Singleton instance
 */
export const importProcessor = new ImportProcessor();
