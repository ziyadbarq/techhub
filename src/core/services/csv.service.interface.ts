/**
 * CSV Service Interface
 *
 * Defines the contract for CSV import/export operations.
 * Provides type-safe CSV handling with validation support.
 */

import type { z } from "zod";

/**
 * Options for CSV export
 */
export interface CSVExportOptions {
  /**
   * Custom headers for CSV columns
   * If not provided, will use object keys
   */
  headers?: Record<string, string>;

  /**
   * Fields to include in export (if not specified, all fields are included)
   */
  fields?: string[];

  /**
   * Delimiter character (default: ',')
   */
  delimiter?: string;
}

/**
 * Options for CSV import
 */
export interface CSVImportOptions {
  /**
   * Whether to skip the first row (header row)
   */
  skipHeader?: boolean;

  /**
   * Delimiter character (default: ',')
   */
  delimiter?: string;

  /**
   * Custom header mapping (CSV header -> object key)
   */
  headerMap?: Record<string, string>;
}

/**
 * Result of CSV import operation
 */
export interface CSVImportResult<T> {
  /**
   * Successfully parsed and validated items
   */
  data: T[];

  /**
   * Validation errors (row index -> error message)
   */
  errors: Array<{
    row: number;
    message: string;
    data?: unknown;
  }>;

  /**
   * Total rows processed
   */
  totalRows: number;

  /**
   * Number of successful imports
   */
  successCount: number;

  /**
   * Number of failed imports
   */
  errorCount: number;
}

/**
 * CSV Service Interface
 *
 * Provides methods for CSV import/export with validation
 */
export interface ICSVService {
  /**
   * Export data to CSV format
   *
   * @param data - Array of objects to export
   * @param options - Export options
   * @returns CSV string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportToCSV<T extends Record<string, any>>(
    data: T[],
    options?: CSVExportOptions,
  ): string;

  /**
   * Import data from CSV file
   *
   * @param file - CSV file to import
   * @param schema - Zod schema for validation
   * @param options - Import options
   * @returns Import result with data and errors
   */
  importFromCSV<T>(
    file: File,
    schema: z.ZodSchema<T>,
    options?: CSVImportOptions,
  ): Promise<CSVImportResult<T>>;

  /**
   * Parse CSV string into objects
   *
   * @param csvString - CSV content as string
   * @param schema - Zod schema for validation
   * @param options - Import options
   * @returns Import result with data and errors
   */
  parseCSV<T>(
    csvString: string,
    schema: z.ZodSchema<T>,
    options?: CSVImportOptions,
  ): CSVImportResult<T>;
}
