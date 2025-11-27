/**
 * Universal Assets Import Processor
 *
 * Main orchestrator for the universal assets import process.
 * Coordinates prefix parsing, entity resolution, field inference, and asset creation.
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ILoggerService } from "@/core/services";
import type {
  CreateAssetUseCase,
  UpdateAssetUseCase,
} from "@/core/use-cases/asset/asset";
import type { UpdateAssetInput } from "@/core/use-cases/asset/asset/update-asset.use-case";
import type {
  GroupedRowData,
  UniversalImportSettings,
  UniversalImportProgress,
  UniversalImportResult,
  UniversalImportPhase,
} from "./types";
import { DEFAULT_UNIVERSAL_IMPORT_SETTINGS } from "./types";
import {
  detectPrefixedColumns,
  groupRowByPrefix,
  validateRequiredColumns,
  extractUniquePersonEmails,
} from "./prefix-parser";
import { AutoCreateResolver } from "./auto-create-resolver";
import { CustomFieldInferrer } from "./custom-field-inferrer";
import { AssignmentHandler } from "./assignment-handler";

/**
 * Process universal assets import
 */
export async function processUniversalAssetsImport(
  rows: Array<Record<string, unknown>>,
  columnHeaders: string[],
  settings: UniversalImportSettings = DEFAULT_UNIVERSAL_IMPORT_SETTINGS,
  onProgress?: (progress: UniversalImportProgress) => void,
): Promise<UniversalImportResult> {
  const startTime = Date.now();
  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting Universal Assets Import", {
    rowCount: rows.length,
    columnCount: columnHeaders.length,
  });

  // Initialize components
  const autoCreateResolver = new AutoCreateResolver();
  const customFieldInferrer = new CustomFieldInferrer();
  const assignmentHandler = new AssignmentHandler();

  // Result tracking
  const result: UniversalImportResult = {
    success: true,
    totalRows: rows.length,
    successCount: 0,
    skipCount: 0,
    failureCount: 0,
    assetsCreated: 0,
    assetsUpdated: 0,
    assignmentsCreated: 0,
    assignmentsReassigned: 0,
    assignmentsUnchanged: 0,
    autoCreatedEntities: [],
    fieldDefinitionsCreated: [],
    duration: 0,
    throughput: 0,
    errors: [],
    skipped: [],
  };

  // Progress helper
  const reportProgress = (
    phase: UniversalImportPhase,
    label: string,
    current: number,
    total: number,
    phasesComplete: number,
  ) => {
    if (onProgress) {
      onProgress({
        phase,
        currentPhaseLabel: label,
        phasesComplete,
        totalPhases: 11,
        currentPhaseProgress: current,
        currentPhaseTotal: total,
        autoCreated: autoCreateResolver.getAutoCreateSummary(),
      });
    }
  };

  try {
    // Phase 1: Parse and validate columns
    reportProgress("parsing", "Parsing columns...", 0, 1, 0);
    const columns = detectPrefixedColumns(columnHeaders);
    const columnValidation = validateRequiredColumns(columns);

    if (!columnValidation.valid) {
      result.success = false;
      result.errors.push({
        rowNumber: 0,
        identifier: "Column Headers",
        error: `Missing required columns: ${columnValidation.missingRequired.join(", ")}`,
      });
      return result;
    }

    // Parse all rows
    const parsedRows = rows.map((row, index) => ({
      rowNumber: index + 1,
      data: groupRowByPrefix(row, columns),
    }));

    // Phase 2: Validate persons exist
    reportProgress(
      "validating-persons",
      "Validating persons...",
      0,
      parsedRows.length,
      1,
    );
    const uniqueEmails = extractUniquePersonEmails(parsedRows);
    await autoCreateResolver.preloadPersons(uniqueEmails);

    // Check each row's person
    const validRows: Array<{
      rowNumber: number;
      data: GroupedRowData;
      personId: string;
    }> = [];

    for (const row of parsedRows) {
      const email = row.data.person?.email;
      if (!email || String(email).trim() === "") {
        result.skipCount++;
        result.skipped.push({
          rowNumber: row.rowNumber,
          identifier: `Row ${row.rowNumber}`,
          reason: "Missing person.email",
        });
        continue;
      }

      const personResult = await autoCreateResolver.resolvePerson(email);
      if (!personResult.id) {
        result.skipCount++;
        result.skipped.push({
          rowNumber: row.rowNumber,
          identifier: email,
          reason: personResult.error || `Person not found: ${email}`,
        });
        continue;
      }

      validRows.push({
        rowNumber: row.rowNumber,
        data: row.data,
        personId: personResult.id,
      });
    }

    reportProgress(
      "validating-persons",
      "Persons validated",
      uniqueEmails.length,
      uniqueEmails.length,
      1,
    );

    if (validRows.length === 0) {
      result.success = false;
      return result;
    }

    // Pre-load custom field definitions
    await customFieldInferrer.preloadCache();

    // Phase 3-11: Process each row
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const identifier = row.data.asset?.serialNumber || `Row ${row.rowNumber}`;

      try {
        // Phase 3: Resolve/Create Vendor
        let vendorId: string | undefined;
        if (row.data.vendor && (row.data.vendor.code || row.data.vendor.name)) {
          const vendorResult = await autoCreateResolver.resolveOrCreateVendor(
            row.data.vendor,
          );
          if (vendorResult.error && settings.skipRowOnAutoCreateFailure) {
            result.failureCount++;
            result.errors.push({
              rowNumber: row.rowNumber,
              identifier,
              error: vendorResult.error,
            });
            continue;
          }
          vendorId = vendorResult.id || undefined;
        }

        // Phase 4: Resolve/Create Location
        let locationId: string | undefined;
        if (
          row.data.location &&
          (row.data.location.code || row.data.location.name)
        ) {
          const locationResult =
            await autoCreateResolver.resolveOrCreateLocation(row.data.location);
          if (locationResult.error && settings.skipRowOnAutoCreateFailure) {
            result.failureCount++;
            result.errors.push({
              rowNumber: row.rowNumber,
              identifier,
              error: locationResult.error,
            });
            continue;
          }
          locationId = locationResult.id || undefined;
        }

        // Phase 5: Resolve/Create StockLocation
        let stockLocationId: string | undefined;
        if (
          row.data.stockLocation &&
          (row.data.stockLocation.code || row.data.stockLocation.name)
        ) {
          const stockLocationResult =
            await autoCreateResolver.resolveOrCreateStockLocation(
              row.data.stockLocation,
              locationId,
            );
          if (
            stockLocationResult.error &&
            settings.skipRowOnAutoCreateFailure
          ) {
            result.failureCount++;
            result.errors.push({
              rowNumber: row.rowNumber,
              identifier,
              error: stockLocationResult.error,
            });
            continue;
          }
          stockLocationId = stockLocationResult.id || undefined;
        }

        // Phase 6: Resolve/Create Category (required)
        const categoryData = row.data.category || {
          code: undefined,
          name: undefined,
        };
        if (!categoryData.code && !categoryData.name) {
          result.failureCount++;
          result.errors.push({
            rowNumber: row.rowNumber,
            identifier,
            error: "Category code or name is required",
          });
          continue;
        }

        const categoryResult =
          await autoCreateResolver.resolveOrCreateCategory(categoryData);
        if (!categoryResult.id) {
          result.failureCount++;
          result.errors.push({
            rowNumber: row.rowNumber,
            identifier,
            error: categoryResult.error || "Failed to resolve category",
          });
          continue;
        }
        const categoryId = categoryResult.id;

        // Phase 7: Lookup Lifecycle State (no auto-create)
        let lifecycleStateId: string | undefined;
        if (row.data.lifecycle?.code) {
          const lifecycleResult = await autoCreateResolver.lookupLifecycleState(
            row.data.lifecycle.code,
          );
          lifecycleStateId = lifecycleResult.id || undefined;
        }

        // Phase 8: Resolve/Create Model (depends on vendor + category)
        let modelId: string | undefined;
        if (row.data.model && (row.data.model.code || row.data.model.name)) {
          if (!vendorId) {
            // Model requires vendor - skip model but continue with asset
            logger.warn("Skipping model creation - vendor required", {
              rowNumber: row.rowNumber,
              model: row.data.model.code || row.data.model.name,
            });
          } else {
            const modelResult = await autoCreateResolver.resolveOrCreateModel(
              row.data.model,
              vendorId,
              categoryId,
            );
            if (modelResult.error && settings.skipRowOnAutoCreateFailure) {
              result.failureCount++;
              result.errors.push({
                rowNumber: row.rowNumber,
                identifier,
                error: modelResult.error,
              });
              continue;
            }
            modelId = modelResult.id || undefined;
          }
        }

        // Phase 9: Process custom fields
        const customFields = row.data.custom;
        const categoryCode = String(
          categoryData.code || categoryData.name || "UNKNOWN",
        );

        const inferredFields = customFieldInferrer.analyzeCustomFields(
          [{ data: row.data }],
          categoryCode,
          categoryId,
        );

        await customFieldInferrer.resolveOrCreateFieldDefinitions(
          inferredFields,
          categoryCode,
          categoryId,
        );

        const transformedCustomFields =
          customFieldInferrer.transformCustomFieldValues(
            customFields,
            inferredFields,
          );

        // Phase 10: Create or update asset
        const assetData = row.data.asset;
        const serialNumber = assetData.serialNumber;

        if (!serialNumber || String(serialNumber).trim() === "") {
          result.failureCount++;
          result.errors.push({
            rowNumber: row.rowNumber,
            identifier: `Row ${row.rowNumber}`,
            error: "Serial number is required",
          });
          continue;
        }

        const assetRepo = container.get<IAssetRepository>(
          DI_TOKENS.IAssetRepository,
        );
        const existingAsset = await assetRepo.findBySerialNumber(
          String(serialNumber),
        );

        let assetId: string;

        if (existingAsset) {
          // Update existing asset
          const updateUseCase = container.get<UpdateAssetUseCase>(
            DI_TOKENS.UpdateAssetUseCase,
          );

          // Only update non-empty fields
          const updateData: Record<string, unknown> = { id: existingAsset.id };

          if (categoryId) updateData.assetCategoryId = categoryId;
          if (modelId) updateData.assetModelId = modelId;
          if (vendorId) updateData.vendorId = vendorId;
          if (stockLocationId)
            updateData.currentStockLocationId = stockLocationId;
          if (lifecycleStateId) updateData.lifecycleStateId = lifecycleStateId;
          if (assetData.purchaseDate)
            updateData.purchaseDate = new Date(String(assetData.purchaseDate));
          if (assetData.purchaseCost)
            updateData.purchaseCost = Number(assetData.purchaseCost);
          if (assetData.currency)
            updateData.currency = String(assetData.currency);
          if (assetData.warrantyEndDate)
            updateData.warrantyEndDate = new Date(
              String(assetData.warrantyEndDate),
            );
          if (assetData.condition)
            updateData.condition = String(assetData.condition);
          if (assetData.note) updateData.note = String(assetData.note);

          // Merge custom fields with existing attributes
          if (Object.keys(transformedCustomFields).length > 0) {
            const existingAttributes =
              (existingAsset.attributes as Record<string, unknown>) || {};
            updateData.attributes = {
              ...existingAttributes,
              ...transformedCustomFields,
            };
          }

          await updateUseCase.execute(
            updateData as unknown as UpdateAssetInput,
          );
          assetId = existingAsset.id;
          result.assetsUpdated++;
        } else {
          // Create new asset
          const createUseCase = container.get<CreateAssetUseCase>(
            DI_TOKENS.CreateAssetUseCase,
          );

          const created = await createUseCase.execute({
            assetTag: assetData.assetTag
              ? String(assetData.assetTag)
              : undefined,
            serialNumber: String(serialNumber),
            assetCategoryId: categoryId,
            assetModelId: modelId,
            vendorId,
            currentStockLocationId: stockLocationId,
            lifecycleStateId,
            purchaseDate: assetData.purchaseDate
              ? new Date(String(assetData.purchaseDate))
              : undefined,
            purchaseCost: assetData.purchaseCost
              ? Number(assetData.purchaseCost)
              : undefined,
            currency: assetData.currency
              ? String(assetData.currency)
              : undefined,
            warrantyEndDate: assetData.warrantyEndDate
              ? new Date(String(assetData.warrantyEndDate))
              : undefined,
            condition: assetData.condition as
              | "NEW"
              | "GOOD"
              | "FAIR"
              | "POOR"
              | undefined,
            note: assetData.note ? String(assetData.note) : undefined,
            attributes:
              Object.keys(transformedCustomFields).length > 0
                ? transformedCustomFields
                : undefined,
          });

          assetId = created.id;
          result.assetsCreated++;
        }

        // Phase 11: Handle assignment
        const assignmentResult = await assignmentHandler.handleAssignment(
          assetId,
          row.personId,
          row.data.person.email,
          settings,
        );

        switch (assignmentResult.action) {
          case "created":
            result.assignmentsCreated++;
            break;
          case "reassigned":
            result.assignmentsReassigned++;
            break;
          case "unchanged":
            result.assignmentsUnchanged++;
            break;
          case "failed":
            logger.warn("Assignment failed", {
              assetId,
              error: assignmentResult.error,
            });
            break;
        }

        result.successCount++;

        // Report progress periodically
        if (i % 10 === 0 || i === validRows.length - 1) {
          reportProgress(
            "importing-assets",
            "Importing assets...",
            i + 1,
            validRows.length,
            9,
          );
        }
      } catch (error) {
        result.failureCount++;
        result.errors.push({
          rowNumber: row.rowNumber,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Collect auto-created entities
    result.autoCreatedEntities = autoCreateResolver.getAutoCreatedEntities();
    result.fieldDefinitionsCreated = customFieldInferrer
      .getCreatedFieldDefinitions()
      .map((f) => ({
        name: f.name,
        label: f.label,
        dataType: f.dataType,
        categoryCode: "",
      }));

    // Final progress
    reportProgress(
      "complete",
      "Import complete",
      result.successCount,
      rows.length,
      11,
    );
  } catch (err) {
    logger.error(
      "Universal Assets Import failed",
      err instanceof Error ? err : undefined,
    );
    result.success = false;
  }

  // Calculate metrics
  const endTime = Date.now();
  result.duration = (endTime - startTime) / 1000;
  result.throughput = result.duration > 0 ? rows.length / result.duration : 0;
  result.success = result.failureCount === 0;

  logger.info("Universal Assets Import completed", {
    duration: result.duration,
    successCount: result.successCount,
    skipCount: result.skipCount,
    failureCount: result.failureCount,
    assetsCreated: result.assetsCreated,
    assetsUpdated: result.assetsUpdated,
  });

  return result;
}
