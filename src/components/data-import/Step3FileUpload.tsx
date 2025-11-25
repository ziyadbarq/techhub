"use client";

/**
 * Step 3: File Upload
 *
 * Drag-and-drop file upload with:
 * - CSV and Excel support
 * - File validation
 * - Preview of first 5 rows
 * - Template download
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type {
  EntityConfig,
  ParsedFile,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { importProcessor } from "@/lib/data-import/import-processor";
import { templateGenerator } from "@/lib/data-import/template-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  entity: EntityConfig;
  lookupMaps: Map<string, LookupMap>;
  onFileUploaded: (parsedFile: ParsedFile) => void;
  onBack: () => void;
}

export function Step3FileUpload({
  entity,
  lookupMaps,
  onFileUploaded,
  onBack,
}: Props) {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle file drop
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const parsed = await importProcessor.parseFile(file);
      setParsedFile(parsed);
      toast.success(
        `File parsed: ${parsed.rowCount} rows, ${parsed.columnCount} columns`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to parse file";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Dropzone configuration
   */
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10 MB
      disabled: isProcessing,
    });

  /**
   * Download template
   */
  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    try {
      await templateGenerator.generateTemplate(entity, lookupMaps, {
        includeInstructions: true,
        includeExamples: true,
        includeOptionalFields: true,
        format,
      });

      toast.success(`Template downloaded: ${entity.name} template.${format}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate template",
      );
    }
  };

  /**
   * Clear file
   */
  const handleClear = () => {
    setParsedFile(null);
    setError(null);
  };

  /**
   * Continue to next step
   */
  const handleContinue = () => {
    if (parsedFile) {
      onFileUploaded(parsedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions (top) */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!parsedFile}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Download Template (Optional)
          </CardTitle>
          <CardDescription>
            Get a pre-formatted template with examples and lookup hints
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate("csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate("xlsx")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Excel Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Your File</CardTitle>
          <CardDescription>
            Drag and drop your CSV or Excel file, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!parsedFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors",
                isDragActive && "border-primary bg-primary/5",
                isDragReject && "border-destructive bg-destructive/5",
                isProcessing && "cursor-not-allowed opacity-50",
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-muted-foreground h-12 w-12" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the file here</p>
                ) : (
                  <>
                    <p className="text-lg font-medium">
                      Drag and drop your file here
                    </p>
                    <p className="text-muted-foreground text-sm">
                      or click to browse
                    </p>
                  </>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary">CSV</Badge>
                  <Badge variant="secondary">XLSX</Badge>
                  <Badge variant="secondary">XLS</Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Maximum file size: 10 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-primary h-8 w-8" />
                  <div>
                    <p className="font-medium">{parsedFile.fileName}</p>
                    <p className="text-muted-foreground text-sm">
                      {parsedFile.rowCount} rows, {parsedFile.columnCount}{" "}
                      columns • {(parsedFile.fileSize / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Parse Errors */}
              {parsedFile.parseErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="mb-1 font-medium">Parse Warnings:</div>
                    <ul className="list-inside list-disc text-sm">
                      {parsedFile.parseErrors.slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {parsedFile.parseErrors.length > 3 && (
                        <li>...and {parsedFile.parseErrors.length - 3} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview */}
              <div>
                <h4 className="mb-2 font-medium">Preview (first 5 rows)</h4>
                <div className="max-h-96 overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parsedFile.columns.map((col) => (
                          <TableHead key={col} className="whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedFile.preview.map((row, i) => (
                        <TableRow key={i}>
                          {parsedFile.columns.map((col) => (
                            <TableCell key={col} className="whitespace-nowrap">
                              {String(row[col] || "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
              <span className="ml-2">Parsing file...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Formats Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Supported File Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium">CSV:</span>
              <span>Comma-separated values (UTF-8 encoding recommended)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">XLSX:</span>
              <span>Excel workbook (latest format)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">XLS:</span>
              <span>Legacy Excel format (Excel 97-2003)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
