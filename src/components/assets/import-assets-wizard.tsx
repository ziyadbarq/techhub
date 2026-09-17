/**
 * Import Assets Wizard Component
 * Multi-step wizard for importing assets from CSV or Excel
 */

"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  parseAssetImportFile,
  csvRowToDTO,
  exportFailedRowsToCSV,
  type ParsedAsset,
  type CSVParseResult,
} from "@/lib/csv-import";
import {
  downloadAssetCSVTemplate,
  downloadAssetExcelTemplate,
} from "@/lib/csv-template";
import {
  bulkCreateAssetsAction,
  getImportLookupMapsAction,
} from "@/interface-adapters/controllers/asset.controller";
import type { CreateAssetDTO } from "@/interface-adapters/dtos/generated/asset.dto";

interface ImportAssetsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "upload" | "validate" | "import" | "complete";

export function ImportAssetsWizard({
  open,
  onOpenChange,
  onSuccess,
}: ImportAssetsWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; assetTag: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    // Reset state
    setStep("upload");
    setFile(null);
    setParseResult(null);
    setImportProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      const supportedExtensions = ["csv", "xlsx", "xls"];

      if (!extension || !supportedExtensions.includes(extension)) {
        toast.error("Please select a CSV or Excel file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadNext = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      const result = await parseAssetImportFile(file);
      setParseResult(result);

      if (result.totalRows === 0) {
        toast.error("Import file is empty");
        return;
      }

      setStep("validate");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse import file",
      );
    }
  };

  const handleValidateNext = async () => {
    if (!parseResult) return;

    const validAssets = parseResult.assets.filter((a) => a.errors.length === 0);
    if (validAssets.length === 0) {
      toast.error("No valid assets to import");
      return;
    }

    // Get lookup maps for code -> ID conversion
    const lookupResult = await getImportLookupMapsAction();
    if (!lookupResult.success) {
      toast.error(lookupResult.error || "Failed to load lookup data");
      return;
    }

    const lookupMaps = {
      categoryMap: new Map(Object.entries(lookupResult.data.categoryMap)),
      modelMap: new Map(Object.entries(lookupResult.data.modelMap)),
      vendorMap: new Map(Object.entries(lookupResult.data.vendorMap)),
      locationMap: new Map(Object.entries(lookupResult.data.locationMap)),
      stateMap: new Map(Object.entries(lookupResult.data.stateMap)),
      personEmailMap: new Map(Object.entries(lookupResult.data.personEmailMap)),
    };

    // Convert valid CSV rows to DTOs
    const assetsToCreate: CreateAssetDTO[] = [];
    const conversionErrors: ParsedAsset[] = [];

    for (const asset of validAssets) {
      const { dto, errors } = csvRowToDTO(asset.data, lookupMaps);
      if (errors.length > 0) {
        conversionErrors.push({
          ...asset,
          errors,
        });
      } else {
        assetsToCreate.push(dto as CreateAssetDTO);
      }
    }

    // If there are conversion errors, update parse result and stay on validate step
    if (conversionErrors.length > 0) {
      toast.error(
        `${conversionErrors.length} asset(s) have invalid codes. Please check the errors.`,
      );
      // Update parse result to show conversion errors
      const updatedAssets = parseResult.assets.map((asset) => {
        const conversionError = conversionErrors.find(
          (e) => e.row === asset.row,
        );
        if (conversionError) {
          return conversionError;
        }
        return asset;
      });
      setParseResult({
        ...parseResult,
        assets: updatedAssets,
        invalidRows: parseResult.invalidRows + conversionErrors.length,
        validRows: parseResult.validRows - conversionErrors.length,
      });
      return;
    }

    // Proceed to import
    setStep("import");
    setImportProgress(0);

    try {
      const result = await bulkCreateAssetsAction(assetsToCreate);

      if (result.success) {
        setImportResult(result.data);
        setImportProgress(100);
        setStep("complete");

        if (result.data.successCount > 0) {
          toast.success(
            `Successfully imported ${result.data.successCount} asset(s)`,
          );
          onSuccess();
        }

        if (result.data.failureCount > 0) {
          toast.warning(
            `${result.data.failureCount} asset(s) failed to import`,
          );
        }
      } else {
        toast.error(result.error || "Failed to import assets");
        setStep("validate");
      }
    } catch (_error) {
      toast.error("Failed to import assets");
      setStep("validate");
    }
  };

  const handleDownloadTemplate = () => {
    downloadAssetExcelTemplate();
    toast.success("Excel template downloaded");
  };

  const handleDownloadCSVTemplate = () => {
    downloadAssetCSVTemplate();
    toast.success("Template downloaded");
  };

  const handleDownloadErrors = () => {
    if (!parseResult) return;

    const failedAssets = parseResult.assets.filter((a) => a.errors.length > 0);
    exportFailedRowsToCSV(failedAssets);
    toast.success("Error report downloaded");
  };

  const renderStepContent = () => {
    switch (step) {
      case "upload":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-8">
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Upload Excel or CSV file to import assets
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  .xlsx, .xls, or .csv file with asset data (max 10,000 rows)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="asset-import-upload"
              />
              <label htmlFor="asset-import-upload">
                <Button asChild variant="outline">
                  <span>
                    <FileText className="mr-2 h-4 w-4" />
                    Select Excel or CSV File
                  </span>
                </Button>
              </label>
              {file && (
                <p className="text-sm text-green-600">Selected: {file.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Need a template?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Excel Template
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadCSVTemplate}
                className="ml-2"
              >
                Download CSV
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadNext}
                disabled={!file}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                Next
              </Button>
            </div>
          </div>
        );

      case "validate": {
        if (!parseResult) return null;

        const validAssets = parseResult.assets.filter(
          (a) => a.errors.length === 0,
        );
        const invalidAssets = parseResult.assets.filter(
          (a) => a.errors.length > 0,
        );

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-muted-foreground text-sm">Total Rows</p>
                <p className="text-2xl font-bold">{parseResult.totalRows}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-muted-foreground text-sm">Valid</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseResult.validRows}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-muted-foreground text-sm">Invalid</p>
                <p className="text-2xl font-bold text-red-600">
                  {parseResult.invalidRows}
                </p>
              </div>
            </div>

            {invalidAssets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">
                    <AlertCircle className="mr-1 inline h-4 w-4" />
                    {invalidAssets.length} row(s) with errors
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrors}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Errors
                  </Button>
                </div>
                <ScrollArea className="h-[300px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invalidAssets.map((asset) => (
                        <TableRow key={asset.row}>
                          <TableCell>{asset.row}</TableCell>
                          <TableCell>{asset.data.assetTag || "-"}</TableCell>
                          <TableCell className="text-xs text-red-600">
                            {asset.errors.join(", ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            {validAssets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">
                  <CheckCircle className="mr-1 inline h-4 w-4" />
                  {validAssets.length} valid asset(s) ready to import
                </p>
                <ScrollArea className="h-[200px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Model</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validAssets.slice(0, 100).map((asset) => (
                        <TableRow key={asset.row}>
                          <TableCell>{asset.row}</TableCell>
                          <TableCell>{asset.data.assetTag}</TableCell>
                          <TableCell>{asset.data.categoryCode}</TableCell>
                          <TableCell>{asset.data.modelCode || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {validAssets.length > 100 && (
                  <p className="text-muted-foreground text-xs">
                    Showing first 100 of {validAssets.length} valid assets
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleValidateNext}
                  disabled={validAssets.length === 0}
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                >
                  Import {validAssets.length} Asset(s)
                </Button>
              </div>
            </div>
          </div>
        );
      }

      case "import":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="border-barq-yellow h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-lg font-medium">Importing assets...</p>
              <Progress value={importProgress} className="w-full max-w-xs" />
            </div>
          </div>
        );

      case "complete":
        if (!importResult) return null;

        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-xl font-bold">Import Complete</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-muted-foreground text-sm">Imported</p>
                <p className="text-2xl font-bold text-green-600">
                  {importResult.successCount}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-muted-foreground text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {importResult.failureCount}
                </p>
              </div>
            </div>

            {importResult.failures.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">
                  Failed imports:
                </p>
                <ScrollArea className="h-[200px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.failures.map((failure) => (
                        <TableRow key={failure.index}>
                          <TableCell>{failure.index + 2}</TableCell>
                          <TableCell>{failure.assetTag}</TableCell>
                          <TableCell className="text-xs text-red-600">
                            {failure.error}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                Done
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Assets</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload an Excel or CSV file with asset data"}
            {step === "validate" && "Review and validate the data"}
            {step === "import" && "Importing assets..."}
            {step === "complete" && "Import summary"}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
