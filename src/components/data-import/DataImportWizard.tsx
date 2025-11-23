"use client";

/**
 * Data Import Wizard - Main Orchestrator
 *
 * Manages the 7-step import workflow:
 * 1. Entity Selection
 * 2. Import Settings
 * 3. File Upload
 * 4. Field Mapping
 * 5. Validation Results
 * 6. Import Progress
 * 7. Final Results
 */

import { useState, useCallback } from "react";
import type {
  EntityConfig,
  ImportSettings,
  ParsedFile,
  ColumnMapping,
  RowValidationResult,
  ImportResult,
  LookupMap,
} from "@/lib/data-import/entity-config.types";
import { Step1EntitySelector } from "./Step1EntitySelector";
import { Step2ImportSettings } from "./Step2ImportSettings";
import { Step3FileUpload } from "./Step3FileUpload";
import { Step4FieldMapper } from "./Step4FieldMapper";
import { Step5ValidationResults } from "./Step5ValidationResults";
import { Step6ImportProgress } from "./Step6ImportProgress";
import { Step7Results } from "./Step7Results";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

/**
 * Wizard step type
 */
type WizardStep =
  | "entity-select"
  | "settings"
  | "upload"
  | "mapping"
  | "validation"
  | "import"
  | "results";

/**
 * Wizard state
 */
interface WizardState {
  currentStep: WizardStep;
  selectedEntity: EntityConfig | null;
  settings: ImportSettings | null;
  parsedFile: ParsedFile | null;
  columnMappings: ColumnMapping[];
  validationResults: {
    validRows: RowValidationResult[];
    invalidRows: RowValidationResult[];
  } | null;
  importResult: ImportResult | null;
  lookupMaps: Map<string, LookupMap>;
}

/**
 * Main wizard component
 */
export function DataImportWizard() {
  const [state, setState] = useState<WizardState>({
    currentStep: "entity-select",
    selectedEntity: null,
    settings: null,
    parsedFile: null,
    columnMappings: [],
    validationResults: null,
    importResult: null,
    lookupMaps: new Map(),
  });

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  /**
   * Handle entity selection
   */
  const handleEntitySelected = useCallback(
    (entity: EntityConfig, lookupMaps: Map<string, LookupMap>) => {
      setState((prev) => ({
        ...prev,
        selectedEntity: entity,
        lookupMaps,
        currentStep: "settings",
      }));
    },
    [],
  );

  /**
   * Handle settings configured
   */
  const handleSettingsConfigured = useCallback((settings: ImportSettings) => {
    setState((prev) => ({
      ...prev,
      settings,
      currentStep: "upload",
    }));
  }, []);

  /**
   * Handle file uploaded
   */
  const handleFileUploaded = useCallback((parsedFile: ParsedFile) => {
    setState((prev) => ({
      ...prev,
      parsedFile,
      currentStep: "mapping",
    }));
  }, []);

  /**
   * Handle columns mapped
   */
  const handleColumnsMapped = useCallback((mappings: ColumnMapping[]) => {
    setState((prev) => ({
      ...prev,
      columnMappings: mappings,
      currentStep: "validation",
    }));
  }, []);

  /**
   * Handle validation complete
   */
  const handleValidationComplete = useCallback(
    (validRows: RowValidationResult[], invalidRows: RowValidationResult[]) => {
      setState((prev) => ({
        ...prev,
        validationResults: { validRows, invalidRows },
        currentStep: "import",
      }));
    },
    [],
  );

  /**
   * Handle import complete
   */
  const handleImportComplete = useCallback((result: ImportResult) => {
    setState((prev) => ({
      ...prev,
      importResult: result,
      currentStep: "results",
    }));
  }, []);

  /**
   * Reset wizard
   */
  const handleReset = useCallback(() => {
    setState({
      currentStep: "entity-select",
      selectedEntity: null,
      settings: null,
      parsedFile: null,
      columnMappings: [],
      validationResults: null,
      importResult: null,
      lookupMaps: new Map(),
    });
  }, []);

  /**
   * Go back to previous step
   */
  const handleBack = useCallback(() => {
    const stepOrder: WizardStep[] = [
      "entity-select",
      "settings",
      "upload",
      "mapping",
      "validation",
      "import",
      "results",
    ];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    }
  }, [state.currentStep, goToStep]);

  /**
   * Calculate progress percentage
   */
  const progressPercentage = {
    "entity-select": 0,
    settings: 14,
    upload: 28,
    mapping: 42,
    validation: 57,
    import: 71,
    results: 100,
  }[state.currentStep];

  /**
   * Get step label
   */
  const stepLabel = {
    "entity-select": "1. Select Entity",
    settings: "2. Configure Settings",
    upload: "3. Upload File",
    mapping: "4. Map Columns",
    validation: "5. Validate Data",
    import: "6. Import Progress",
    results: "7. Results",
  }[state.currentStep];

  /**
   * Can go back?
   */
  const canGoBack =
    state.currentStep !== "entity-select" &&
    state.currentStep !== "import" &&
    state.currentStep !== "results";

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{stepLabel}</span>
          <span className="text-muted-foreground">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {state.currentStep === "entity-select" && (
          <Step1EntitySelector onEntitySelected={handleEntitySelected} />
        )}

        {state.currentStep === "settings" && state.selectedEntity && (
          <Step2ImportSettings
            entity={state.selectedEntity}
            onSettingsConfigured={handleSettingsConfigured}
            onBack={handleBack}
          />
        )}

        {state.currentStep === "upload" && state.selectedEntity && (
          <Step3FileUpload
            entity={state.selectedEntity}
            lookupMaps={state.lookupMaps}
            onFileUploaded={handleFileUploaded}
            onBack={handleBack}
          />
        )}

        {state.currentStep === "mapping" &&
          state.selectedEntity &&
          state.parsedFile && (
            <Step4FieldMapper
              entity={state.selectedEntity}
              parsedFile={state.parsedFile}
              onColumnsMapped={handleColumnsMapped}
              onBack={handleBack}
            />
          )}

        {state.currentStep === "validation" &&
          state.selectedEntity &&
          state.settings &&
          state.parsedFile &&
          state.columnMappings.length > 0 && (
            <Step5ValidationResults
              entity={state.selectedEntity}
              settings={state.settings}
              parsedFile={state.parsedFile}
              columnMappings={state.columnMappings}
              lookupMaps={state.lookupMaps}
              onValidationComplete={handleValidationComplete}
              onBack={handleBack}
            />
          )}

        {state.currentStep === "import" &&
          state.selectedEntity &&
          state.settings &&
          state.validationResults && (
            <Step6ImportProgress
              entity={state.selectedEntity}
              settings={state.settings}
              validRows={state.validationResults.validRows}
              lookupMaps={state.lookupMaps}
              onImportComplete={handleImportComplete}
            />
          )}

        {state.currentStep === "results" && state.importResult && (
          <Step7Results
            entity={state.selectedEntity!}
            result={state.importResult}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Navigation */}
      {canGoBack && (
        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="text-muted-foreground text-sm">
            Step {progressPercentage / 14 + 1} of 7
          </div>
        </div>
      )}
    </div>
  );
}
