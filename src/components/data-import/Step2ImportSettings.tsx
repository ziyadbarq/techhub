"use client";

/**
 * Step 2: Import Settings
 *
 * Allows user to configure import behavior:
 * - Duplicate handling strategy
 * - Data sanitization options
 * - Batch size and performance settings
 * - Error tolerance
 * - Date format preferences
 */

import { useState } from "react";
import type {
  EntityConfig,
  ImportSettings,
  DuplicateStrategy,
} from "@/lib/data-import/entity-config.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  entity: EntityConfig;
  onSettingsConfigured: (settings: ImportSettings) => void;
  onBack: () => void;
}

export function Step2ImportSettings({
  entity,
  onSettingsConfigured,
  onBack,
}: Props) {
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("skip");
  const [autoTrimWhitespace, setAutoTrimWhitespace] = useState(true);
  const [normalizeText, setNormalizeText] = useState(true);
  const [skipEmptyRows, setSkipEmptyRows] = useState(true);
  const [autoFixCommonErrors, setAutoFixCommonErrors] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [strictValidation, setStrictValidation] = useState(false);
  const [batchSize, setBatchSize] = useState(entity.maxBatchSize);
  const [maxParallelBatches, setMaxParallelBatches] = useState(1);
  const [stopOnFirstError, setStopOnFirstError] = useState(false);
  const [maxErrorsBeforeAbort, setMaxErrorsBeforeAbort] = useState(100);
  const [autoDetectDateFormat, setAutoDetectDateFormat] = useState(true);
  const [dateFormat, setDateFormat] = useState<string>("");

  /**
   * Handle continue
   */
  const handleContinue = () => {
    const settings: ImportSettings = {
      duplicateStrategy,
      uniqueFields: entity.uniqueFields,
      autoTrimWhitespace,
      normalizeText,
      skipEmptyRows,
      autoFixCommonErrors,
      dryRun,
      strictValidation,
      batchSize,
      maxParallelBatches,
      stopOnFirstError,
      maxErrorsBeforeAbort,
      dateFormat: autoDetectDateFormat ? undefined : dateFormat,
      autoDetectDateFormat,
    };

    onSettingsConfigured(settings);
  };

  return (
    <div className="space-y-6">
      {/* Entity Info */}
      <Card>
        <CardHeader>
          <CardTitle>Importing into: {entity.name}</CardTitle>
          <CardDescription>{entity.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Duplicate Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Duplicate Handling</CardTitle>
          <CardDescription>
            What should happen when a record with the same{" "}
            {entity.uniqueFields.join(", ")} already exists?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={duplicateStrategy}
            onValueChange={(v) => setDuplicateStrategy(v as DuplicateStrategy)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="skip" id="skip" />
              <Label htmlFor="skip" className="cursor-pointer font-normal">
                <div>
                  <div className="font-medium">Skip duplicates</div>
                  <div className="text-muted-foreground text-sm">
                    Keep existing record, skip the import row
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" />
              <Label htmlFor="overwrite" className="cursor-pointer font-normal">
                <div>
                  <div className="font-medium">Overwrite duplicates</div>
                  <div className="text-muted-foreground text-sm">
                    Update existing record with import data
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id="fail" />
              <Label htmlFor="fail" className="cursor-pointer font-normal">
                <div>
                  <div className="font-medium">Fail on duplicates</div>
                  <div className="text-muted-foreground text-sm">
                    Treat duplicates as validation errors
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="append" id="append" />
              <Label htmlFor="append" className="cursor-pointer font-normal">
                <div>
                  <div className="font-medium">Append suffix to duplicates</div>
                  <div className="text-muted-foreground text-sm">
                    Create new record with "-COPY" suffix
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Data Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Processing</CardTitle>
          <CardDescription>
            Automatically clean and normalize imported data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-trim whitespace</Label>
              <p className="text-muted-foreground text-sm">
                Remove leading/trailing spaces from all fields
              </p>
            </div>
            <Switch
              checked={autoTrimWhitespace}
              onCheckedChange={setAutoTrimWhitespace}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Normalize text case</Label>
              <p className="text-muted-foreground text-sm">
                Uppercase codes, title case names, lowercase emails
              </p>
            </div>
            <Switch
              checked={normalizeText}
              onCheckedChange={setNormalizeText}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Skip empty rows</Label>
              <p className="text-muted-foreground text-sm">
                Ignore rows where all fields are empty
              </p>
            </div>
            <Switch
              checked={skipEmptyRows}
              onCheckedChange={setSkipEmptyRows}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-fix common errors</Label>
              <p className="text-muted-foreground text-sm">
                Fix boolean variations, number formats, date formats
              </p>
            </div>
            <Switch
              checked={autoFixCommonErrors}
              onCheckedChange={setAutoFixCommonErrors}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validation</CardTitle>
          <CardDescription>Configure validation behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Dry run mode</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Validate without importing - no data changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-muted-foreground text-sm">
                Validate data without actually importing
              </p>
            </div>
            <Switch checked={dryRun} onCheckedChange={setDryRun} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Strict validation</Label>
              <p className="text-muted-foreground text-sm">
                Treat warnings as errors
              </p>
            </div>
            <Switch
              checked={strictValidation}
              onCheckedChange={setStrictValidation}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance</CardTitle>
          <CardDescription>Configure batch processing settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Batch size (rows per batch)</Label>
            <Input
              type="number"
              min={1}
              max={entity.maxBatchSize}
              value={batchSize}
              onChange={(e) =>
                setBatchSize(parseInt(e.target.value) || entity.maxBatchSize)
              }
            />
            <p className="text-muted-foreground text-sm">
              Max: {entity.maxBatchSize} rows. Larger = faster but more memory.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max parallel batches</Label>
            <Select
              value={String(maxParallelBatches)}
              onValueChange={(v) => setMaxParallelBatches(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (Sequential)</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              Higher = faster but may overwhelm database
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Error Handling</CardTitle>
          <CardDescription>Configure error tolerance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stop on first error</Label>
              <p className="text-muted-foreground text-sm">
                Abort import immediately if any error occurs
              </p>
            </div>
            <Switch
              checked={stopOnFirstError}
              onCheckedChange={setStopOnFirstError}
            />
          </div>

          {!stopOnFirstError && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Max errors before abort</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={maxErrorsBeforeAbort}
                  onChange={(e) =>
                    setMaxErrorsBeforeAbort(parseInt(e.target.value) || 100)
                  }
                />
                <p className="text-muted-foreground text-sm">
                  Abort if error count exceeds this threshold
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Date Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Format</CardTitle>
          <CardDescription>Configure date parsing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-detect date format</Label>
              <p className="text-muted-foreground text-sm">
                Automatically parse common date formats
              </p>
            </div>
            <Switch
              checked={autoDetectDateFormat}
              onCheckedChange={setAutoDetectDateFormat}
            />
          </div>

          {!autoDetectDateFormat && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Date format pattern</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                    <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
