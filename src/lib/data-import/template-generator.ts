/**
 * Template Generator
 *
 * Generates downloadable CSV and Excel templates for data import.
 * Includes headers, instructions, examples, and validation hints.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type {
  EntityConfig,
  EntityFieldConfig,
  TemplateOptions,
  LookupMap,
} from "./entity-config.types";

/**
 * Template generator class
 */
export class TemplateGenerator {
  /**
   * Generate and download template for an entity
   */
  async generateTemplate(
    entityConfig: EntityConfig,
    lookupMaps: Map<string, LookupMap>,
    options: TemplateOptions = {
      includeInstructions: true,
      includeExamples: true,
      includeOptionalFields: true,
      format: "csv",
    },
  ): Promise<void> {
    const fields = options.includeOptionalFields
      ? entityConfig.fields
      : entityConfig.fields.filter((f) => f.required);

    const data = this.buildTemplateData(fields, lookupMaps, options);

    const fileName = `${entityConfig.name.toLowerCase().replace(/\s+/g, "_")}_import_template`;

    if (options.format === "xlsx") {
      await this.downloadAsExcel(data, fileName);
    } else {
      await this.downloadAsCSV(data, fileName);
    }
  }

  /**
   * Build template data structure
   */
  private buildTemplateData(
    fields: EntityFieldConfig[],
    lookupMaps: Map<string, LookupMap>,
    options: TemplateOptions,
  ): any[][] {
    const rows: any[][] = [];

    // Row 1: Headers with required field indicators
    const headers = fields.map((field) =>
      field.required ? `${field.label}*` : field.label,
    );
    rows.push(headers);

    // Row 2: Instructions (field descriptions and validation rules)
    if (options.includeInstructions) {
      const instructions = fields.map((field) =>
        this.generateFieldInstructions(field, lookupMaps),
      );
      rows.push(instructions);
    }

    // Row 3: Example data
    if (options.includeExamples) {
      const examples = fields.map((field) =>
        this.generateFieldExample(field, lookupMaps),
      );
      rows.push(examples);
    }

    return rows;
  }

  /**
   * Generate field instructions
   */
  private generateFieldInstructions(
    field: EntityFieldConfig,
    lookupMaps: Map<string, LookupMap>,
  ): string {
    const parts: string[] = [];

    // Type
    parts.push(`Type: ${field.type}`);

    // Required
    if (field.required) {
      parts.push("Required");
    }

    // Length constraints
    if (field.minLength !== undefined || field.maxLength !== undefined) {
      if (field.minLength && field.maxLength) {
        parts.push(`Length: ${field.minLength}-${field.maxLength} characters`);
      } else if (field.minLength) {
        parts.push(`Min length: ${field.minLength}`);
      } else if (field.maxLength) {
        parts.push(`Max length: ${field.maxLength}`);
      }
    }

    // Numeric range
    if (field.type === "number") {
      if (field.min !== undefined && field.max !== undefined) {
        parts.push(`Range: ${field.min}-${field.max}`);
      } else if (field.min !== undefined) {
        parts.push(`Min: ${field.min}`);
      } else if (field.max !== undefined) {
        parts.push(`Max: ${field.max}`);
      }
    }

    // Enum values
    if (field.enum && field.enum.length > 0) {
      const values = field.enum.slice(0, 5).join(", ");
      parts.push(`Values: ${values}${field.enum.length > 5 ? ", ..." : ""}`);
    }

    // Lookup values
    if (field.type === "lookup" && field.lookupTarget) {
      const lookupMap =
        lookupMaps.get(field.name) ?? lookupMaps.get(field.lookupTarget);
      if (lookupMap && lookupMap.allValues.length > 0) {
        const values = lookupMap.allValues.slice(0, 5).join(", ");
        parts.push(
          `Valid codes: ${values}${lookupMap.allValues.length > 5 ? ", ..." : ""}`,
        );
      }
    }

    // Pattern
    if (field.pattern) {
      parts.push(`Format: ${field.pattern.toString()}`);
    }

    // Description
    if (field.description) {
      parts.push(field.description);
    }

    return parts.join(". ");
  }

  /**
   * Generate example value for field
   */
  private generateFieldExample(
    field: EntityFieldConfig,
    lookupMaps: Map<string, LookupMap>,
  ): string {
    // Use provided examples first
    if (field.examples && field.examples.length > 0) {
      return field.examples[0];
    }

    // Generate based on type
    switch (field.type) {
      case "string":
        if (field.name.toLowerCase().includes("email")) {
          return "john.doe@barq.com";
        }
        if (field.name.toLowerCase().includes("name")) {
          return "Name";
        }
        if (field.name.toLowerCase().includes("phone")) {
          return "+966501234567";
        }
        return "Example text";

      case "number":
        if (field.name.toLowerCase().includes("price")) {
          return "1000.00";
        }
        if (field.name.toLowerCase().includes("quantity")) {
          return "5";
        }
        return field.min !== undefined ? String(field.min) : "100";

      case "boolean":
        return "true";

      case "date":
      case "datetime":
        return "2024-01-15";

      case "enum":
        return field.enum && field.enum.length > 0 ? field.enum[0] : "";

      case "lookup":
        if (field.lookupTarget) {
          const lookupMap =
            lookupMaps.get(field.name) ?? lookupMaps.get(field.lookupTarget);
          if (lookupMap && lookupMap.allValues.length > 0) {
            return lookupMap.allValues[0];
          }
        }
        return "";

      default:
        return "";
    }
  }

  /**
   * Download as CSV
   */
  private async downloadAsCSV(data: any[][], fileName: string): Promise<void> {
    // Convert to CSV string
    const csvContent = data
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma or newline
            const cellStr = String(cell ?? "");
            if (
              cellStr.includes(",") ||
              cellStr.includes("\n") ||
              cellStr.includes('"')
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(","),
      )
      .join("\n");

    // Add UTF-8 BOM for Excel compatibility
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `${fileName}.csv`);
  }

  /**
   * Download as Excel
   */
  private async downloadAsExcel(
    data: any[][],
    fileName: string,
  ): Promise<void> {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = data[0].map((_, colIndex) => {
      const maxLength = Math.max(
        ...data.map((row) => {
          const cellValue = String(row[colIndex] ?? "");
          return cellValue.length;
        }),
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
    });
    worksheet["!cols"] = colWidths;

    // Style header row (bold)
    const range = XLSX.utils.decode_range(worksheet["!ref"]!);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E2E8F0" } },
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  }

  /**
   * Generate lookup reference sheet
   */
  async generateLookupReferenceSheet(
    lookupMaps: Map<string, LookupMap>,
    fileName: string = "lookup_reference",
  ): Promise<void> {
    const data: any[][] = [];

    // Add header
    data.push(["Entity", "Code", "Name", "Description"]);

    // Add lookup values from each map
    for (const [entityName, lookupMap] of lookupMaps.entries()) {
      // Sort values alphabetically
      const sortedValues = Array.from(lookupMap.entries.entries()).sort(
        (a, b) => a[0].localeCompare(b[0]),
      );

      for (const [code, id] of sortedValues) {
        data.push([
          entityName,
          code,
          lookupMap.reverseEntries.get(id) || "",
          "",
        ]);
      }

      // Add separator row
      data.push([]);
    }

    await this.downloadAsExcel(data, fileName);
  }

  /**
   * Generate comprehensive instructions document
   */
  generateInstructionsDocument(entityConfig: EntityConfig): string {
    const lines: string[] = [];

    lines.push(`# ${entityConfig.name} Import Instructions`);
    lines.push("");
    lines.push(entityConfig.description);
    lines.push("");

    // Required fields
    lines.push("## Required Fields");
    lines.push("");
    const requiredFields = entityConfig.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      lines.push(`**${field.label}** (${field.name})`);
      if (field.description) {
        lines.push(`- ${field.description}`);
      }
      lines.push(`- Type: ${field.type}`);
      if (field.examples && field.examples.length > 0) {
        lines.push(`- Examples: ${field.examples.join(", ")}`);
      }
      lines.push("");
    }

    // Optional fields
    const optionalFields = entityConfig.fields.filter((f) => !f.required);
    if (optionalFields.length > 0) {
      lines.push("## Optional Fields");
      lines.push("");
      for (const field of optionalFields) {
        lines.push(`**${field.label}** (${field.name})`);
        if (field.description) {
          lines.push(`- ${field.description}`);
        }
        lines.push(`- Type: ${field.type}`);
        if (field.examples && field.examples.length > 0) {
          lines.push(`- Examples: ${field.examples.join(", ")}`);
        }
        lines.push("");
      }
    }

    // Special instructions
    if (entityConfig.templateInstructions) {
      lines.push("## Special Instructions");
      lines.push("");
      lines.push(entityConfig.templateInstructions);
      lines.push("");
    }

    // Business rules
    if (entityConfig.businessRules && entityConfig.businessRules.length > 0) {
      lines.push("## Business Rules");
      lines.push("");
      for (const rule of entityConfig.businessRules) {
        lines.push(`- **${rule.name}**: ${rule.description}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Export error report as CSV
   */
  async exportErrorReport(
    errors: Array<{
      rowNumber: number;
      field: string;
      value: any;
      error: string;
    }>,
    originalData: Array<Record<string, any>>,
    fileName: string = "import_errors",
  ): Promise<void> {
    if (errors.length === 0) {
      return;
    }

    // Group errors by row
    const errorsByRow = new Map<number, string[]>();
    for (const error of errors) {
      if (!errorsByRow.has(error.rowNumber)) {
        errorsByRow.set(error.rowNumber, []);
      }
      errorsByRow.get(error.rowNumber)!.push(`${error.field}: ${error.error}`);
    }

    // Build CSV data
    const data: any[][] = [];

    // Header
    const originalHeaders = Object.keys(originalData[0] || {});
    data.push([...originalHeaders, "ERRORS"]);

    // Data rows with errors
    for (const [rowNumber, errorMessages] of errorsByRow.entries()) {
      const row = originalData[rowNumber - 1]; // Row numbers are 1-indexed
      if (row) {
        const rowData = originalHeaders.map((header) => row[header] ?? "");
        rowData.push(errorMessages.join("; "));
        data.push(rowData);
      }
    }

    await this.downloadAsCSV(data, fileName);
  }

  /**
   * Export validation results as Excel with multiple sheets
   */
  async exportValidationResults(
    validRows: Array<Record<string, any>>,
    invalidRows: Array<Record<string, any>>,
    errors: Array<{
      rowNumber: number;
      field: string;
      value: any;
      error: string;
    }>,
    fileName: string = "validation_results",
  ): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Valid rows
    if (validRows.length > 0) {
      const validSheet = XLSX.utils.json_to_sheet(validRows);
      XLSX.utils.book_append_sheet(workbook, validSheet, "Valid Rows");
    }

    // Sheet 2: Invalid rows with errors
    if (invalidRows.length > 0) {
      // Add error column to invalid rows
      const errorsByRow = new Map<number, string[]>();
      for (const error of errors) {
        if (!errorsByRow.has(error.rowNumber)) {
          errorsByRow.set(error.rowNumber, []);
        }
        errorsByRow
          .get(error.rowNumber)!
          .push(`${error.field}: ${error.error}`);
      }

      const invalidWithErrors = invalidRows.map((row, index) => ({
        ...row,
        ERRORS: errorsByRow.get(index + 1)?.join("; ") || "",
      }));

      const invalidSheet = XLSX.utils.json_to_sheet(invalidWithErrors);
      XLSX.utils.book_append_sheet(workbook, invalidSheet, "Invalid Rows");
    }

    // Sheet 3: Error summary
    const errorSummary = this.buildErrorSummary(errors);
    const errorSheet = XLSX.utils.aoa_to_sheet(errorSummary);
    XLSX.utils.book_append_sheet(workbook, errorSheet, "Error Summary");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}.xlsx`);
  }

  /**
   * Build error summary data
   */
  private buildErrorSummary(
    errors: Array<{
      rowNumber: number;
      field: string;
      value: any;
      error: string;
    }>,
  ): any[][] {
    const data: any[][] = [];

    // Header
    data.push(["Error Type", "Count", "Affected Rows"]);

    // Group by error message
    const errorGroups = new Map<string, number[]>();
    for (const error of errors) {
      const key = `${error.field}: ${error.error}`;
      if (!errorGroups.has(key)) {
        errorGroups.set(key, []);
      }
      errorGroups.get(key)!.push(error.rowNumber);
    }

    // Add summary rows
    for (const [errorType, rows] of errorGroups.entries()) {
      data.push([errorType, rows.length, rows.join(", ")]);
    }

    return data;
  }
}

/**
 * Singleton instance
 */
export const templateGenerator = new TemplateGenerator();
