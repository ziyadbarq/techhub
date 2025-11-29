/**
 * Universal Assets Import Processor
 *
 * Main orchestrator for the universal assets import process.
 * Coordinates prefix parsing, entity resolution, field inference, and asset creation.
 * Creates stock movements for imported assets with source tracking.
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type {
  ILoggerService,
  ICodeGeneratorService,
  ISarConversionService,
} from "@/core/services";
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import type { UpdateAssetUseCase } from "@/core/use-cases/asset/asset";
import type { UpdateAssetInput } from "@/core/use-cases/asset/asset/update-asset.use-case";
import { prisma } from "@/infrastructure/database/prisma/client";
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
  detectDuplicatesInFile,
} from "./prefix-parser";
import { csvSanitizer } from "../csv-sanitizer";
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
  const codeGenerator = container.get<ICodeGeneratorService>(
    DI_TOKENS.ICodeGeneratorService,
  );
  const sarConversionService = container.get<ISarConversionService>(
    DI_TOKENS.ISarConversionService,
  );

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
    createdAssets: [],
    updatedAssets: [],
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

    // Pre-process rows based on settings
    let processedRows = rows;

    // Skip empty rows if configured
    if (settings.skipEmptyRows !== false) {
      const originalCount = processedRows.length;
      processedRows = processedRows.filter(
        (row) => !csvSanitizer.isEmptyRow(row),
      );
      if (processedRows.length < originalCount) {
        logger.info("Skipped empty rows", {
          skipped: originalCount - processedRows.length,
        });
      }
    }

    // Apply data sanitization
    processedRows = processedRows.map((row) => {
      let processed = { ...row };

      // Trim whitespace
      if (settings.autoTrimWhitespace !== false) {
        processed = csvSanitizer.trimAllFields(processed);
      }

      // Auto-fix common errors (smart quotes, etc.)
      if (settings.autoFixCommonErrors !== false) {
        // Apply string-level fixes without field config
        for (const [key, value] of Object.entries(processed)) {
          if (typeof value === "string") {
            // Fix smart quotes and dashes
            processed[key] = value
              .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
              .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
              .replace(/[\u2013\u2014]/g, "-"); // Em-dash and en-dash
          }
        }
      }

      // Normalize text case
      if (settings.normalizeText !== false) {
        for (const [key, value] of Object.entries(processed)) {
          if (typeof value === "string") {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes("email")) {
              processed[key] = value.toLowerCase().trim();
            } else if (
              lowerKey.includes("code") ||
              lowerKey.includes("lifecycle")
            ) {
              processed[key] = value.toUpperCase().trim();
            } else if (lowerKey.includes("name")) {
              processed[key] = value
                .split(" ")
                .map(
                  (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                )
                .join(" ")
                .trim();
            }
          }
        }
      }

      return processed;
    });

    // Update row count after filtering
    result.totalRows = processedRows.length;

    // Parse all rows
    const parsedRows = processedRows.map((row, index) => ({
      rowNumber: index + 1,
      data: groupRowByPrefix(row, columns),
    }));

    // Check for duplicates within file (warning only, doesn't block import)
    const duplicateCheck = detectDuplicatesInFile(parsedRows);
    if (duplicateCheck.hasDuplicates) {
      result.warnings = result.warnings || [];
      for (const dup of duplicateCheck.duplicateSerialNumbers) {
        result.warnings.push({
          type: "duplicate_serial_number",
          message: `Serial number "${dup.serialNumber}" appears ${dup.rowNumbers.length} times (rows: ${dup.rowNumbers.join(", ")}). Later rows will update earlier ones.`,
          rowNumbers: dup.rowNumbers,
        });
      }
      logger.warn("Duplicate serial numbers detected in import file", {
        duplicateCount: duplicateCheck.duplicateSerialNumbers.length,
        totalDuplicateRows: duplicateCheck.totalDuplicateRows,
      });
    }

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

    // Check each row's person (optional unless requirePersonForImport is true)
    const validRows: Array<{
      rowNumber: number;
      data: GroupedRowData;
      personId: string | null;
    }> = [];

    for (const row of parsedRows) {
      const email = row.data.person?.email;
      const hasEmail = email && String(email).trim() !== "";

      if (!hasEmail) {
        if (settings.requirePersonForImport) {
          // Skip row - person required but missing
          result.skipCount++;
          result.skipped.push({
            rowNumber: row.rowNumber,
            identifier: `Row ${row.rowNumber}`,
            reason: "Missing person.email (required by settings)",
          });
          continue;
        }
        // No email provided - will create asset without assignment
        validRows.push({
          rowNumber: row.rowNumber,
          data: row.data,
          personId: null,
        });
        continue;
      }

      // Has email - validate person exists
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

    // Dry run mode - validate without importing
    if (settings.dryRun) {
      reportProgress(
        "complete",
        "Dry run complete - no changes made",
        validRows.length,
        validRows.length,
        11,
      );

      // Count what would be created vs updated
      const assetRepo = container.get<IAssetRepository>(
        DI_TOKENS.IAssetRepository,
      );
      for (const row of validRows) {
        const serialNumber = row.data.asset?.serialNumber;
        if (serialNumber) {
          const exists = await assetRepo.findBySerialNumber(
            String(serialNumber),
          );
          if (exists) {
            result.assetsUpdated++;
          } else {
            result.assetsCreated++;
          }
        }
        result.successCount++;
      }

      logger.info("Universal Assets Import dry run completed", {
        totalRows: validRows.length,
        wouldCreate: result.assetsCreated,
        wouldUpdate: result.assetsUpdated,
      });

      const endTime = Date.now();
      result.duration = (endTime - startTime) / 1000;
      result.throughput =
        result.duration > 0 ? validRows.length / result.duration : 0;
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
            settings.autoCreateMissingEntities,
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
            error:
              "Category is required for all assets. Provide category.code or category.name.",
            suggestion:
              "Add a category.code column (e.g., LAPTOP, DESKTOP, MONITOR) or category.name column (e.g., Laptop Computers)",
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
            // Model requires vendor - add warning but continue with asset
            const modelName = row.data.model.code || row.data.model.name;
            logger.warn("Skipping model creation - vendor required", {
              rowNumber: row.rowNumber,
              model: modelName,
            });
            result.errors.push({
              rowNumber: row.rowNumber,
              identifier,
              error: `Cannot create model "${modelName}" - manufacturer is required. Provide vendor.code or vendor.name column with the manufacturer.`,
              suggestion:
                "Add vendor.code or vendor.name columns to specify the manufacturer",
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
        let effectiveSerialNumber = String(serialNumber);

        // Handle duplicate strategy for existing assets
        if (existingAsset) {
          const strategy = settings.duplicateStrategy || "overwrite";

          if (strategy === "skip") {
            result.skipCount++;
            result.skipped.push({
              rowNumber: row.rowNumber,
              identifier: effectiveSerialNumber,
              reason: `Skipped: asset with serial number "${effectiveSerialNumber}" already exists`,
            });
            result.assignmentsUnchanged++;
            continue;
          }

          if (strategy === "fail") {
            result.failureCount++;
            result.errors.push({
              rowNumber: row.rowNumber,
              identifier: effectiveSerialNumber,
              error: `Duplicate: asset with serial number "${effectiveSerialNumber}" already exists`,
            });
            // Check error tolerance
            if (settings.stopOnFirstError) {
              logger.info("Stopping on first error as configured");
              break;
            }
            const maxErrors = settings.maxErrorsBeforeAbort ?? 100;
            if (maxErrors > 0 && result.failureCount >= maxErrors) {
              logger.info("Max errors reached, aborting import", {
                maxErrors,
                failureCount: result.failureCount,
              });
              break;
            }
            continue;
          }

          if (strategy === "append") {
            // Create new asset with modified serial number
            effectiveSerialNumber = `${serialNumber}-COPY-${Date.now()}`;
            // Check if appended serial also exists
            const appendedExists = await assetRepo.findBySerialNumber(
              effectiveSerialNumber,
            );
            if (appendedExists) {
              result.failureCount++;
              result.errors.push({
                rowNumber: row.rowNumber,
                identifier: effectiveSerialNumber,
                error: `Cannot append suffix: asset with serial number "${effectiveSerialNumber}" also exists`,
              });
              continue;
            }
            // Fall through to create new asset with appended serial
          }

          // strategy === "overwrite" - continue with update logic below
        }

        if (
          existingAsset &&
          (settings.duplicateStrategy || "overwrite") === "overwrite"
        ) {
          // Update existing asset (use case handles validation)
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
          result.updatedAssets.push({
            id: existingAsset.id,
            assetTag: existingAsset.assetTag,
            serialNumber: String(serialNumber),
            rowNumber: row.rowNumber,
          });

          // Handle assignment for existing asset (non-transactional - less critical)
          if (row.personId) {
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
                logger.warn("Assignment failed for existing asset", {
                  assetId,
                  error: assignmentResult.error,
                });
                break;
            }
          } else {
            result.assignmentsUnchanged++;
          }
        } else {
          // Create new asset (or append-suffix case when existing asset with "append" strategy)
          // Generate asset tag before transaction (uses CodeGeneratorService for sequential tags)
          const generatedTag = assetData.assetTag
            ? String(assetData.assetTag)
            : await codeGenerator.generateCode("ASSET", "ASSET");

          // Calculate SAR conversion for purchase cost (consistent with CreateAssetUseCase)
          const purchaseCost = assetData.purchaseCost
            ? Number(assetData.purchaseCost)
            : null;
          const currency = assetData.currency
            ? String(assetData.currency)
            : null;
          const purchaseCostSar =
            await sarConversionService.convertToSarIfNeeded(
              purchaseCost,
              currency,
            );

          // Get movement service for creating stock movements
          const assetMovementService = container.get<IAssetMovementService>(
            DI_TOKENS.IAssetMovementService,
          );

          // Create new asset + movement + assignment atomically within a transaction
          const txResult = await prisma.$transaction(async (tx) => {
            // Prepare asset data for transaction
            // Use effectiveSerialNumber which may be modified for "append" strategy
            const assetCreateData: Parameters<
              typeof tx.asset.create
            >[0]["data"] = {
              serialNumber: effectiveSerialNumber,
              assetCategoryId: categoryId,
              assetTag: generatedTag,
            };

            // Optional fields
            if (modelId) assetCreateData.assetModelId = modelId;
            if (vendorId) assetCreateData.vendorId = vendorId;
            if (stockLocationId)
              assetCreateData.currentStockLocationId = stockLocationId;
            if (lifecycleStateId)
              assetCreateData.lifecycleStateId = lifecycleStateId;
            if (assetData.purchaseDate)
              assetCreateData.purchaseDate = new Date(
                String(assetData.purchaseDate),
              );
            if (purchaseCost !== null)
              assetCreateData.purchaseCost = purchaseCost;
            if (currency) assetCreateData.currency = currency;
            if (purchaseCostSar !== null)
              assetCreateData.purchaseCostSar = purchaseCostSar;
            if (assetData.condition)
              assetCreateData.condition = assetData.condition as
                | "NEW"
                | "GOOD"
                | "FAIR"
                | "POOR";
            if (assetData.note) assetCreateData.note = String(assetData.note);
            if (Object.keys(transformedCustomFields).length > 0) {
              assetCreateData.attributes = transformedCustomFields as object;
            }

            // Create asset within transaction
            const created = await tx.asset.create({
              data: assetCreateData,
            });

            // Create stock movement if asset has stock location and we have performedById
            if (stockLocationId && settings.performedById) {
              try {
                await assetMovementService.createMovementTx(tx, {
                  movementType: "IN",
                  assetId: created.id,
                  stockLocationToId: stockLocationId,
                  performedById: settings.performedById,
                  reason: "Asset imported into inventory",
                  source: "IMPORT",
                  sourceReferenceType: "ImportBatch",
                  sourceReferenceId: `import-${new Date().toISOString()}`,
                });
              } catch (movementError) {
                // Log but don't fail the import if movement creation fails
                logger.warn("Failed to create movement during import", {
                  assetId: created.id,
                  error:
                    movementError instanceof Error
                      ? movementError.message
                      : String(movementError),
                });
              }
            }

            // Handle assignment within same transaction (if personId exists)
            let assignmentAction:
              | "created"
              | "reassigned"
              | "unchanged"
              | "failed" = "unchanged";
            if (row.personId) {
              const assignmentResult =
                await assignmentHandler.handleAssignmentWithTransaction(
                  tx,
                  created.id,
                  row.personId,
                  row.data.person.email,
                  settings,
                );
              assignmentAction = assignmentResult.action;
            }

            return {
              assetId: created.id,
              assetTag: created.assetTag,
              assignmentAction,
            };
          });

          assetId = txResult.assetId;
          result.assetsCreated++;
          result.createdAssets.push({
            id: txResult.assetId,
            assetTag: txResult.assetTag,
            serialNumber: effectiveSerialNumber,
            rowNumber: row.rowNumber,
          });

          // Update assignment counters
          switch (txResult.assignmentAction) {
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
              logger.warn("Assignment failed within transaction", { assetId });
              break;
          }
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

        // Check error tolerance settings
        if (settings.stopOnFirstError) {
          logger.info(
            "Stopping import on first error (stopOnFirstError enabled)",
            {
              rowNumber: row.rowNumber,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          );
          break;
        }

        const maxErrors = settings.maxErrorsBeforeAbort ?? 100;
        if (maxErrors > 0 && result.failureCount >= maxErrors) {
          logger.info("Stopping import - max errors reached", {
            failureCount: result.failureCount,
            maxErrors,
          });
          result.errors.push({
            rowNumber: row.rowNumber,
            identifier: "System",
            error: `Import aborted: Maximum error count (${maxErrors}) reached`,
          });
          break;
        }
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
    result.failureCount++;
    result.errors.push({
      rowNumber: 0,
      identifier: "System",
      error:
        err instanceof Error
          ? err.message
          : "Unexpected system error occurred during import",
      suggestion:
        "Check server logs for detailed error information or contact support.",
    });
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
