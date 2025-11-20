/**
 * PapaParse CSV Service Implementation
 *
 * Implements CSV import/export using PapaParse library.
 * Provides validation with Zod schemas and detailed error reporting.
 */

import { injectable } from "inversify";
import Papa from "papaparse";
import type { z } from "zod";

import type {
  ICSVService,
  CSVExportOptions,
  CSVImportOptions,
  CSVImportResult,
} from "@/core/services/csv.service.interface";

@injectable()
export class PapaParseCSVService implements ICSVService {
  /**
   * Export data to CSV format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportToCSV<T extends Record<string, any>>(
    data: T[],
    options: CSVExportOptions = {},
  ): string {
    if (data.length === 0) {
      return "";
    }

    const { headers, fields, delimiter = "," } = options;

    // Determine which fields to include
    const fieldsToExport = fields || Object.keys(data[0]);

    // Transform data if custom headers are provided
    const transformedData = data.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = {};
      fieldsToExport.forEach((field) => {
        const header = headers?.[field] || field;
        row[header] = item[field];
      });
      return row;
    });

    // Use PapaParse to generate CSV
    const csv = Papa.unparse(transformedData, {
      delimiter,
      header: true,
      skipEmptyLines: true,
    });

    return csv;
  }

  /**
   * Import data from CSV file
   */
  async importFromCSV<T>(
    file: File,
    schema: z.ZodSchema<T>,
    options: CSVImportOptions = {},
  ): Promise<CSVImportResult<T>> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: options.delimiter || ",",
        complete: (results) => {
          try {
            const result = this.processParseResults(
              results.data,
              schema,
              options,
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse CSV string into objects
   */
  parseCSV<T>(
    csvString: string,
    schema: z.ZodSchema<T>,
    options: CSVImportOptions = {},
  ): CSVImportResult<T> {
    const parseResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      delimiter: options.delimiter || ",",
    });

    if (parseResult.errors.length > 0) {
      const errorMessages = parseResult.errors
        .map((err) => `Row ${err.row}: ${err.message}`)
        .join("; ");
      throw new Error(`CSV parsing failed: ${errorMessages}`);
    }

    return this.processParseResults(parseResult.data, schema, options);
  }

  /**
   * Process parsed CSV data with validation
   */

  private processParseResults<T>(
    data: unknown[],
    schema: z.ZodSchema<T>,

    options: CSVImportOptions,
  ): CSVImportResult<T> {
    const validData: T[] = [];
    const errors: Array<{ row: number; message: string; data?: unknown }> = [];

    data.forEach((row, index) => {
      try {
        // Apply header mapping if provided
        const mappedRow = this.applyHeaderMapping(
          row as Record<string, unknown>,
          options.headerMap,
        );

        // Validate with Zod schema
        const validatedData = schema.parse(mappedRow);
        validData.push(validatedData);
      } catch (error) {
        let errorMessage = "Validation failed";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Parse Zod error for better messages
        if (error && typeof error === "object" && "issues" in error) {
          const zodError = error as z.ZodError;
          errorMessage = zodError.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", ");
        }

        errors.push({
          row: index + 1, // 1-indexed for user-friendly display
          message: errorMessage,
          data: row,
        });
      }
    });

    return {
      data: validData,
      errors,
      totalRows: data.length,
      successCount: validData.length,
      errorCount: errors.length,
    };
  }

  /**
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   * Apply header mapping to transform CSV headers to object keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   */
  private applyHeaderMapping(
    row: Record<string, unknown>,
    headerMap?: Record<string, string>,
  ): Record<string, unknown> {
    if (!headerMap) {
      return row;
    }

    const mappedRow: Record<string, unknown> = {};

    Object.keys(row).forEach((key) => {
      const mappedKey = headerMap[key] || key;

      mappedRow[mappedKey] = row[key];
    });

    return mappedRow;
  }
}
