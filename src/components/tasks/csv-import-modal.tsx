/**
 * CSV Import Modal Component
 *
 * Handles CSV file upload, validation, and bulk task import.
 * Features: drag-and-drop, preview, validation errors, progress tracking.
 */

"use client";

import * as React from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  importTasksFromCSV,
  validateTasksCSV,
} from "@/interface-adapters/controllers/csv.controller";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function CSVImportModal({
  open,
  onOpenChange,
  onSuccess,
}: CSVImportModalProps) {
  const [step, setStep] = React.useState<ImportStep>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [csvContent, setCSVContent] = React.useState<string>("");
  const [previewData, setPreviewData] = React.useState<
    Record<string, unknown>[]
  >([]);
  const [validationErrors, setValidationErrors] = React.useState<
    Array<{ row: number; message: string }>
  >([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setCSVContent("");
    setPreviewData([]);
    setValidationErrors([]);
    setTotalRows(0);
    setSuccessCount(0);
    setErrorCount(0);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      // Read file content
      const content = await selectedFile.text();
      setCSVContent(content);

      // Validate CSV
      const result = await validateTasksCSV(content);

      if (result.success && result.data) {
        setPreviewData(result.data.preview);
        setTotalRows(result.data.totalRows);
        setValidationErrors(result.data.errors);
        setErrorCount(result.data.errorCount);

        if (result.data.isValid) {
          toast.success(
            `CSV validated: ${result.data.totalRows} rows ready to import`,
          );
        } else {
          toast.warning(
            `CSV has ${result.data.errorCount} validation error${result.data.errorCount !== 1 ? "s" : ""}`,
          );
        }

        setStep("preview");
      } else {
        toast.error(!result.success ? result.error : "Failed to validate CSV");
        resetState();
      }
    } catch (_error) {
      toast.error("Failed to read CSV file");
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!csvContent) return;

    setStep("importing");
    setIsProcessing(true);

    try {
      const result = await importTasksFromCSV(csvContent);

      if (result.success && result.data) {
        setSuccessCount(result.data.successCount);
        setErrorCount(result.data.errorCount);
        setValidationErrors(result.data.errors);
        setStep("complete");

        if (result.data.errorCount === 0) {
          toast.success(
            `Successfully imported ${result.data.successCount} task${result.data.successCount !== 1 ? "s" : ""}`,
          );
        } else {
          toast.warning(
            `Imported ${result.data.successCount} tasks, ${result.data.errorCount} failed`,
          );
        }

        onSuccess();
      } else {
        toast.error(!result.success ? result.error : "Failed to import tasks");
        setStep("preview");
      }
    } catch (_error) {
      toast.error("Failed to import tasks");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with task data. Required columns: Title,
            Description (optional), Status (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === "upload" && (
            <div
              className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                Drop your CSV file here
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Select File"}
              </Button>

              <div className="bg-muted/50 mt-6 rounded-lg p-4 text-left text-sm">
                <h4 className="mb-2 font-medium">CSV Format:</h4>
                <code className="bg-background block rounded p-2">
                  Title,Description,Status
                  <br />
                  "Task 1","Description here",PENDING
                  <br />
                  "Task 2","Another task",IN_PROGRESS
                </code>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <FileText className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="font-medium">{file?.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {totalRows} row{totalRows !== 1 ? "s" : ""} found
                    </p>
                  </div>
                </div>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Preview (first 5 rows)
                  </h4>
                  <ScrollArea className="h-[200px] rounded-lg border">
                    <div className="space-y-2 p-4">
                      {previewData.map((row, idx) => (
                        <div
                          key={idx}
                          className="bg-muted/50 rounded p-3 text-sm"
                        >
                          <p className="font-medium">
                            {String(row.title || "")}
                          </p>
                          {row.description ? (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {String(row.description)}
                            </p>
                          ) : null}
                          <Badge variant="outline" className="mt-2">
                            {String(row.status || "")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div>
                  <h4 className="text-destructive mb-2 text-sm font-medium">
                    Validation Errors
                  </h4>
                  <ScrollArea className="border-destructive/50 h-[150px] rounded-lg border">
                    <div className="space-y-2 p-4">
                      {validationErrors.map((error, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <span className="font-medium">
                              Row {error.row}:
                            </span>{" "}
                            {error.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Rows with errors will be skipped during import
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="py-12 text-center">
              <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
              <h3 className="mb-2 text-lg font-semibold">Importing Tasks...</h3>
              <p className="text-muted-foreground text-sm">
                Please wait while we import your tasks
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="space-y-4 py-8 text-center">
              <CheckCircle2 className="text-success mx-auto h-16 w-16" />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Import Complete!</h3>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="text-success">
                    <span className="text-lg font-bold">{successCount}</span>
                    <p className="text-muted-foreground">Successful</p>
                  </div>
                  {errorCount > 0 && (
                    <div className="text-destructive">
                      <span className="text-lg font-bold">{errorCount}</span>
                      <p className="text-muted-foreground">Failed</p>
                    </div>
                  )}
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium">Failed Rows:</h4>
                  <ScrollArea className="h-[150px] rounded-lg border">
                    <div className="space-y-2 p-4 text-left">
                      {validationErrors.map((error, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">Row {error.row}:</span>{" "}
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={resetState}
                disabled={isProcessing}
              >
                Choose Different File
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || totalRows === 0}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                Import {totalRows - errorCount} Task
                {totalRows - errorCount !== 1 ? "s" : ""}
              </Button>
            </>
          )}
          {step === "complete" && <Button onClick={handleClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
