/**
 * Sync OCI Resources Use Case
 *
 * Orchestrates synchronization of OCI cloud resources from the n8n webhook
 * into CMDB Configuration Items. Follows the same pattern as
 * SyncDevicesFromIntuneUseCase.
 *
 * Flow:
 * 1. Create OciSyncLog (IN_PROGRESS)
 * 2. Fetch data from n8n webhook per service key
 * 3. Flatten nested structure → individual resources
 * 4. Upsert compartment CIs (Cloud Compartment class)
 * 5. Upsert resource CIs with appropriate CI class
 * 6. Create CONTAINS relationships (compartment → resource)
 * 7. Update sync log with statistics
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  IOciWebhookService,
  OciWebhookFetchFailure,
} from "@/core/services/oci-webhook.service.interface";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { IOciSyncLogRepository } from "@/core/repositories/oci-sync-log.repository.interface";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { ConfigurationItem } from "@/core/domain/entities/configuration-item.entity";
import { CIRelationship } from "@/core/domain/entities/ci-relationship.entity";
import { LogExecution } from "@/lib/decorators";
import {
  OCI_SERVICE_KEYS,
  type OciServiceKey,
  type OciFlattenedResource,
  type SyncOciResourcesOptions,
  type OciSyncResult,
  type OciSyncError,
} from "@/core/domain/value-objects/oci-resource.types";
import {
  OCI_SERVICE_CLASS_MAP,
  extractResourceId,
  extractResourceName,
  extractResourceAttributes,
  inferEnvironment,
  mapOciLifecycleState,
} from "@/core/domain/value-objects/oci-service-mapping";
import type { OciSyncAttributeSource } from "@/core/domain/value-objects/oci-sync-source";

type ResolvedCiState = {
  id: string;
  isNew: boolean;
  existsInDatabase: boolean;
};

type UpsertCiResult = {
  id: string;
  disposition: "created" | "updated" | "unchanged";
  existsInDatabase: boolean;
};

type RetireMissingCiResult = {
  retiredCount: number;
  deactivatedRelationshipCount: number;
};

@injectable()
export class SyncOciResourcesUseCase {
  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IOciWebhookService)
    private readonly ociWebhookService: IOciWebhookService,
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepository: IConfigurationItemRepository,
    @inject(DI_TOKENS.ICIRelationshipRepository)
    private readonly relationshipRepository: ICIRelationshipRepository,
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepository: ICIClassRepository,
    @inject(DI_TOKENS.IRelationshipTypeRepository)
    private readonly relationshipTypeRepository: IRelationshipTypeRepository,
    @inject(DI_TOKENS.IOciSyncLogRepository)
    private readonly syncLogRepository: IOciSyncLogRepository,
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepository: ILifecycleStateRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  @LogExecution("oci.resources.sync")
  async execute(options: SyncOciResourcesOptions): Promise<OciSyncResult> {
    const startTime = Date.now();
    const syncTimestampIso = new Date().toISOString();
    const serviceKeys = options.serviceKeys ?? [...OCI_SERVICE_KEYS];
    const dryRun = options.dryRun ?? false;

    // 1. Create sync log (always persist, including dry runs for audit trail)
    const syncLogId = this.idGenerator.generateId();
    await this.syncLogRepository.create({
      id: syncLogId,
      serviceTypes: serviceKeys,
      triggeredBy: options.triggeredBy,
      isDryRun: dryRun,
    });

    // 2. Resolve CI class IDs (cache in map)
    const ciClassMap = await this.resolveCIClassIds(serviceKeys);
    const lifecycleStateMap = await this.resolveLifecycleStates();

    // 3. Resolve CONTAINS relationship type
    const containsRelType =
      await this.relationshipTypeRepository.findByCode("CONTAINS");
    if (!containsRelType) {
      this.logger.warn(
        "CONTAINS relationship type not found — skipping relationship creation",
      );
    }

    // 4. Fetch data from webhook
    const webhookBatch =
      await this.ociWebhookService.fetchAllServices(serviceKeys);
    const allServiceData = webhookBatch.responses;
    const syncSource = webhookBatch.source.attributeValue;

    // Track statistics
    const fetchFailures = webhookBatch.failures;
    let resourcesProcessed = 0;
    let resourcesCreated = 0;
    let resourcesUpdated = 0;
    let resourcesRetired = 0;
    let resourcesUnchanged = 0;
    let compartmentsCreated = 0;
    let relationshipsCreated = 0;
    let hasSuccessfulEmptyService = false;
    const errors: OciSyncError[] = [];
    const nonFatalIssues: OciSyncError[] = [];
    let tenancyId: string | null = null;
    const allRegions = new Set<string>();

    if (!containsRelType) {
      nonFatalIssues.push({
        serviceKey: "cmdb",
        resourceId: "CONTAINS",
        resourceName: "CONTAINS relationship type",
        error:
          "The CMDB relationship type 'CONTAINS' is missing, so OCI resources were synced without compartment-to-resource relationships. Create or restore the CONTAINS relationship type to enable relationship creation.",
      });
    }

    // Track compartment CIs to avoid re-creating
    const compartmentCiCache = new Map<string, ResolvedCiState>();
    const processedRelationshipKeys = new Set<string>();
    const seenResourceKeys = new Set<string>();
    const successfulServiceKeys = new Set<OciServiceKey>();

    // 5. Process each service
    for (const [serviceKey, webhookResponse] of allServiceData) {
      successfulServiceKeys.add(serviceKey);
      const tenancies = webhookResponse["object Object"];
      if (!tenancies || tenancies.length === 0) {
        hasSuccessfulEmptyService = true;
        continue;
      }

      const tenancy = tenancies[0];
      tenancyId = tenancy.tenancyId;
      tenancy.regions.forEach((r) => allRegions.add(r));

      // Flatten: tenancy → services → compartments → regions → items
      const serviceData = tenancy.services[serviceKey];
      if (!serviceData) {
        hasSuccessfulEmptyService = true;
        continue;
      }

      const resources = this.flattenResources(
        serviceKey as OciServiceKey,
        serviceData,
        tenancy.tenancyId,
        tenancy.generated_at,
      );
      if (resources.length === 0) {
        hasSuccessfulEmptyService = true;
        continue;
      }

      for (const resource of resources) {
        resourcesProcessed++;

        try {
          // Ensure compartment CI exists
          const compartmentResult = await this.ensureCompartmentCI(
            resource.compartmentId,
            resource.compartmentName,
            ciClassMap.get("CLOUD_COMPARTMENT"),
            dryRun,
            compartmentCiCache,
            syncSource,
          );
          if (compartmentResult?.isNew) {
            compartmentsCreated++;
          }
          // Get CI class ID for this service type
          const mapping = OCI_SERVICE_CLASS_MAP[resource.serviceKey];
          const ciClassId = ciClassMap.get(mapping.ciClassCode);
          if (!ciClassId) {
            errors.push({
              serviceKey: resource.serviceKey,
              resourceId: extractResourceId(
                resource.serviceKey,
                resource.raw,
                resource.compartmentId,
              ),
              resourceName: extractResourceName(resource.raw),
              error: `CI class ${mapping.ciClassCode} not found`,
            });
            continue;
          }

          // Build ciKey and attributes
          const name = extractResourceName(resource.raw);
          const ciKey = extractResourceId(
            resource.serviceKey,
            resource.raw,
            resource.compartmentId,
          );
          if (!ciKey) {
            errors.push({
              serviceKey: resource.serviceKey,
              resourceId: "unknown",
              resourceName: name,
              error: "Could not determine resource ID",
            });
            continue;
          }

          try {
            ConfigurationItem.validateCiKey(ciKey);
          } catch (error) {
            errors.push({
              serviceKey: resource.serviceKey,
              resourceId: ciKey,
              resourceName: name,
              error:
                `Generated CI key is invalid for this OCI resource. ` +
                `${error instanceof Error ? error.message : String(error)}`,
            });
            continue;
          }

          const attributes = extractResourceAttributes(
            resource.serviceKey,
            resource.raw,
            resource.region,
            resource.compartmentName,
            { syncSource },
          );
          const environment = inferEnvironment(resource.compartmentName);
          const lifecycleStateId =
            lifecycleStateMap.get(
              mapOciLifecycleState(
                typeof resource.raw["lifecycle-state"] === "string"
                  ? resource.raw["lifecycle-state"]
                  : undefined,
              ),
            ) ?? null;
          seenResourceKeys.add(ciKey);

          // Upsert CI
          const result = await this.upsertCI(
            ciKey,
            name,
            ciClassId,
            environment,
            attributes,
            lifecycleStateId,
            dryRun,
            [
              "OCI_MISSING_FROM_SOURCE_AT",
              "OCI_RETIRE_REASON",
              "OCI_HISTORICAL",
            ],
          );

          if (result.disposition === "created") resourcesCreated++;
          else if (result.disposition === "updated") resourcesUpdated++;
          else resourcesUnchanged++;

          // Create CONTAINS relationship if we have both compartment and resource CIs
          if (containsRelType && compartmentResult) {
            const created = dryRun
              ? await this.estimateRelationshipCreation(
                  compartmentResult,
                  result,
                  containsRelType.id,
                  processedRelationshipKeys,
                )
              : await this.ensureRelationship(
                  compartmentResult.id,
                  result.id,
                  containsRelType.id,
                  processedRelationshipKeys,
                );
            if (created) relationshipsCreated++;
          }
        } catch (error) {
          errors.push({
            serviceKey: resource.serviceKey,
            resourceId: extractResourceId(
              resource.serviceKey,
              resource.raw,
              resource.compartmentId,
            ),
            resourceName: extractResourceName(resource.raw),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const allowRetirementForLocalSource =
      process.env.OCI_LOCAL_SOURCE_RETIRE_MISSING === "true";
    const shouldRetireMissingResources =
      successfulServiceKeys.size > 0 &&
      (webhookBatch.source.mode === "webhook" || allowRetirementForLocalSource);

    if (successfulServiceKeys.size > 0 && !shouldRetireMissingResources) {
      this.logger.info(
        "Skipping OCI retirement reconciliation for local snapshot source",
        {
          sourceMode: webhookBatch.source.mode,
          allowRetirementForLocalSource,
        },
      );
    }

    if (shouldRetireMissingResources) {
      const retirementResult = await this.retireMissingOciResources({
        dryRun,
        seenResourceKeys,
        serviceKeys: Array.from(successfulServiceKeys),
        syncTimestampIso,
        retiredLifecycleStateId: lifecycleStateMap.get("Retired") ?? null,
        containsRelationshipTypeId: containsRelType?.id ?? null,
      });
      resourcesRetired += retirementResult.retiredCount;
      if (retirementResult.deactivatedRelationshipCount > 0) {
        this.logger.info(
          "Retired missing OCI resources and deactivated stale relationships",
          {
            retiredCount: retirementResult.retiredCount,
            deactivatedRelationshipCount:
              retirementResult.deactivatedRelationshipCount,
            dryRun,
          },
        );
      }
    }

    // 6. Record fetch-level failures as errors
    for (const failure of fetchFailures) {
      errors.push(this.toSyncErrorFromFetchFailure(failure));
    }

    // 7. Update sync log
    const durationMs = Date.now() - startTime;
    const issues = [...errors, ...nonFatalIssues];
    const failedServiceCount = fetchFailures.reduce(
      (count, failure) => count + failure.serviceKeys.length,
      0,
    );
    const hasFetchFailures = failedServiceCount > 0;
    const hasSuccessfulWork =
      resourcesCreated +
        resourcesUpdated +
        resourcesRetired +
        resourcesUnchanged >
      0;
    const hasNonFatalIssues = nonFatalIssues.length > 0;
    const allServicesFailed = failedServiceCount === serviceKeys.length;
    const hasPartialSuccess =
      hasSuccessfulWork || (hasFetchFailures && hasSuccessfulEmptyService);
    const status = allServicesFailed
      ? "FAILED"
      : hasFetchFailures || errors.length > 0
        ? hasPartialSuccess
          ? "PARTIAL"
          : "FAILED"
        : hasNonFatalIssues
          ? "PARTIAL"
          : "COMPLETED";
    const summary = this.buildSummary(
      status,
      dryRun,
      resourcesCreated,
      resourcesUpdated,
      resourcesRetired,
      resourcesUnchanged,
      compartmentsCreated,
      relationshipsCreated,
      issues,
    );

    await this.syncLogRepository.update(syncLogId, {
      status,
      tenancyId: tenancyId ?? undefined,
      regions: Array.from(allRegions),
      resourcesProcessed,
      resourcesCreated,
      resourcesUpdated,
      resourcesRetired,
      resourcesUnchanged,
      compartmentsCreated,
      relationshipsCreated,
      errorsCount: issues.length,
      errors: issues.length > 0 ? issues : undefined,
      completedAt: new Date(),
      durationMs,
    });

    this.logger.info("OCI resource sync completed", {
      status,
      resourcesProcessed,
      resourcesCreated,
      resourcesUpdated,
      resourcesRetired,
      resourcesUnchanged,
      compartmentsCreated,
      relationshipsCreated,
      errors: issues.length,
      durationMs,
      dryRun,
      syncSourceMode: webhookBatch.source.mode,
      syncSourceLocation: webhookBatch.source.location,
    });

    return {
      syncLogId,
      status,
      summary,
      resourcesProcessed,
      resourcesCreated,
      resourcesUpdated,
      resourcesRetired,
      resourcesUnchanged,
      compartmentsCreated,
      relationshipsCreated,
      errors: issues,
      durationMs,
    };
  }

  // ============================================
  // Private helpers
  // ============================================

  /**
   * Resolve CI class codes to IDs, caching for the sync session.
   */
  private async resolveCIClassIds(
    serviceKeys: OciServiceKey[],
  ): Promise<Map<string, string>> {
    const needed = new Set<string>();
    needed.add("CLOUD_COMPARTMENT"); // Always need this
    for (const key of serviceKeys) {
      needed.add(OCI_SERVICE_CLASS_MAP[key].ciClassCode);
    }

    const result = new Map<string, string>();
    for (const code of needed) {
      const ciClass = await this.ciClassRepository.findByCode(code);
      if (ciClass) {
        result.set(code, ciClass.id);
      } else {
        this.logger.warn(`CI class not found for code: ${code}`);
      }
    }

    return result;
  }

  private async resolveLifecycleStates(): Promise<Map<string, string>> {
    const states = await this.lifecycleStateRepository.findAll();
    return new Map(states.map((state) => [state.name, state.id]));
  }

  /**
   * Flatten the nested webhook response into individual resources.
   */
  private flattenResources(
    serviceKey: OciServiceKey,
    compartmentGroups: Array<{
      id: string;
      name: string;
      total: number;
      regions: Array<{
        region: string;
        count: number;
        items: Array<Record<string, unknown>>;
      }>;
    }>,
    tenancyId: string,
    generatedAt: string,
  ): OciFlattenedResource[] {
    const resources: OciFlattenedResource[] = [];

    for (const compartment of compartmentGroups) {
      for (const regionData of compartment.regions) {
        for (const item of regionData.items) {
          resources.push({
            raw: item,
            serviceKey,
            region: regionData.region,
            compartmentId: compartment.id,
            compartmentName: compartment.name,
            tenancyId,
            generatedAt,
          });
        }
      }
    }

    return resources;
  }

  /**
   * Ensure a compartment CI exists, creating it if needed.
   * Returns the CI id and whether it was newly created.
   */
  private async ensureCompartmentCI(
    compartmentOcid: string,
    compartmentName: string,
    compartmentClassId: string | undefined,
    dryRun: boolean,
    cache: Map<string, ResolvedCiState>,
    syncSource: OciSyncAttributeSource,
  ): Promise<ResolvedCiState | null> {
    // Check cache first
    if (cache.has(compartmentOcid)) {
      const cached = cache.get(compartmentOcid)!;
      return { ...cached, isNew: false };
    }

    if (!compartmentClassId) return null;

    // Check DB
    const existing = await this.ciRepository.findByCiKey(compartmentOcid);
    if (existing) {
      const resolved = {
        id: existing.id,
        isNew: false,
        existsInDatabase: true,
      } satisfies ResolvedCiState;
      cache.set(compartmentOcid, resolved);
      return resolved;
    }

    if (dryRun) {
      const preview = {
        id: `dry-run:compartment:${compartmentOcid}`,
        isNew: true,
        existsInDatabase: false,
      } satisfies ResolvedCiState;
      cache.set(compartmentOcid, preview);
      return preview;
    }

    // Create compartment CI
    const environment = inferEnvironment(compartmentName);
    const ci = ConfigurationItem.create(
      {
        name: compartmentName,
        ciClassId: compartmentClassId,
        ciKey: compartmentOcid,
        environment: environment ?? undefined,
        attributes: {
          OCI_ID: compartmentOcid,
          OCI_SERVICE_TYPE: "compartment",
          OCI_SYNC_SOURCE: syncSource,
        },
      },
      this.idGenerator,
    );

    const created = await this.ciRepository.create(ci);
    const resolved = {
      id: created.id,
      isNew: true,
      existsInDatabase: true,
    } satisfies ResolvedCiState;
    cache.set(compartmentOcid, resolved);
    return resolved;
  }

  /**
   * Upsert a CI by ciKey. Returns "created", "updated", or "unchanged".
   */
  private async upsertCI(
    ciKey: string,
    name: string,
    ciClassId: string,
    environment: string | null,
    attributes: Record<string, unknown>,
    lifecycleStateId: string | null,
    dryRun: boolean,
    attributeKeysToClear: string[] = [],
  ): Promise<UpsertCiResult> {
    const existing = await this.ciRepository.findByCiKey(ciKey);
    const normalizedName = name.trim();
    const normalizedIncomingAttrs = this.normalizeComparableValue(
      attributes,
    ) as Record<string, unknown>;

    if (existing) {
      // Merge attributes: existing + new (new wins)
      const existingAttrs =
        (existing.attributes as Record<string, unknown>) ?? {};
      const mergedAttrsInput = {
        ...existingAttrs,
        ...normalizedIncomingAttrs,
      } as Record<string, unknown>;
      for (const key of attributeKeysToClear) {
        delete mergedAttrsInput[key];
      }
      const mergedAttrs = this.normalizeComparableValue(
        mergedAttrsInput,
      ) as Record<string, unknown>;

      // Check if anything actually changed
      const nameChanged = existing.name !== normalizedName;
      const envChanged = existing.environment !== environment;
      const lifecycleChanged = existing.lifecycleStateId !== lifecycleStateId;
      const attrsChanged = !this.areEquivalentAttributes(
        existingAttrs,
        mergedAttrs,
      );

      if (!nameChanged && !envChanged && !lifecycleChanged && !attrsChanged) {
        return {
          id: existing.id,
          disposition: "unchanged",
          existsInDatabase: true,
        };
      }

      if (!dryRun) {
        existing.update({
          name: normalizedName,
          environment: environment as
            | "PROD"
            | "UAT"
            | "DEV"
            | "DR"
            | "TEST"
            | "OTHER"
            | null,
          lifecycleStateId,
          attributes: mergedAttrs,
        });
        await this.ciRepository.update(existing);
      }

      return {
        id: existing.id,
        disposition: "updated",
        existsInDatabase: true,
      };
    }

    // Create new CI
    if (dryRun) {
      return {
        id: `dry-run:resource:${ciKey}`,
        disposition: "created",
        existsInDatabase: false,
      };
    }

    const ci = ConfigurationItem.create(
      {
        name,
        ciClassId,
        ciKey,
        lifecycleStateId,
        environment: environment
          ? (environment as "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER")
          : undefined,
        attributes: normalizedIncomingAttrs,
      },
      this.idGenerator,
    );
    const created = await this.ciRepository.create(ci);
    return {
      id: created.id,
      disposition: "created",
      existsInDatabase: true,
    };
  }

  private areEquivalentAttributes(
    left: Record<string, unknown>,
    right: Record<string, unknown>,
  ): boolean {
    return (
      JSON.stringify(this.normalizeComparableValue(left)) ===
      JSON.stringify(this.normalizeComparableValue(right))
    );
  }

  private normalizeComparableValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeComparableValue(item));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
          .map(([key, child]) => [key, this.normalizeComparableValue(child)]),
      );
    }

    return value;
  }

  /**
   * Ensure a CONTAINS relationship exists between compartment and resource.
   */
  private async ensureRelationship(
    fromCiId: string,
    toCiId: string,
    relationshipTypeId: string,
    processedKeys: Set<string>,
  ): Promise<boolean> {
    const relationshipKey = `${fromCiId}:${toCiId}:${relationshipTypeId}`;
    if (processedKeys.has(relationshipKey)) {
      return false;
    }
    processedKeys.add(relationshipKey);

    const existingRelationships =
      await this.relationshipRepository.findByFromCi(fromCiId);
    const existing = existingRelationships.find(
      (relationship) =>
        relationship.toCiId === toCiId &&
        relationship.relationshipTypeId === relationshipTypeId,
    );
    if (existing?.isActive) return false;
    if (existing) {
      existing.activate();
      await this.relationshipRepository.update(existing);
      return true;
    }

    const relationship = CIRelationship.create(
      {
        fromCiId,
        toCiId,
        relationshipTypeId,
      },
      this.idGenerator,
    );
    await this.relationshipRepository.create(relationship);
    return true;
  }

  private async estimateRelationshipCreation(
    fromCi: ResolvedCiState,
    toCi: UpsertCiResult,
    relationshipTypeId: string,
    processedKeys: Set<string>,
  ): Promise<boolean> {
    const relationshipKey = `${fromCi.id}:${toCi.id}:${relationshipTypeId}`;
    if (processedKeys.has(relationshipKey)) {
      return false;
    }
    processedKeys.add(relationshipKey);

    if (!fromCi.existsInDatabase || !toCi.existsInDatabase) {
      return true;
    }

    const existingRelationships =
      await this.relationshipRepository.findByFromCi(fromCi.id);
    const existing = existingRelationships.find(
      (relationship) =>
        relationship.toCiId === toCi.id &&
        relationship.relationshipTypeId === relationshipTypeId,
    );
    return !existing?.isActive;
  }

  private async retireMissingOciResources(params: {
    dryRun: boolean;
    seenResourceKeys: Set<string>;
    serviceKeys: OciServiceKey[];
    syncTimestampIso: string;
    retiredLifecycleStateId: string | null;
    containsRelationshipTypeId: string | null;
  }): Promise<RetireMissingCiResult> {
    const existingManagedResources =
      await this.ciRepository.findOciManagedByServiceTypes(params.serviceKeys);
    let retiredCount = 0;
    let deactivatedRelationshipCount = 0;

    for (const ci of existingManagedResources) {
      if (!ci.ciKey || params.seenResourceKeys.has(ci.ciKey)) {
        continue;
      }

      const existingAttrs = (ci.attributes as Record<string, unknown>) ?? {};
      const missingFromSourceAt =
        typeof existingAttrs.OCI_MISSING_FROM_SOURCE_AT === "string" &&
        existingAttrs.OCI_MISSING_FROM_SOURCE_AT
          ? existingAttrs.OCI_MISSING_FROM_SOURCE_AT
          : params.syncTimestampIso;
      const nextAttrs = this.normalizeComparableValue({
        ...existingAttrs,
        OCI_SOURCE_STATUS: "missing",
        OCI_MISSING_FROM_SOURCE_AT: missingFromSourceAt,
        OCI_RETIRE_REASON: "missing_from_source",
        OCI_HISTORICAL: true,
      }) as Record<string, unknown>;
      const needsCiUpdate =
        ci.lifecycleStateId !== params.retiredLifecycleStateId ||
        !this.areEquivalentAttributes(existingAttrs, nextAttrs);

      const activeContainsRelationships =
        params.containsRelationshipTypeId === null
          ? []
          : (await this.relationshipRepository.findByToCi(ci.id)).filter(
              (relationship) =>
                relationship.relationshipTypeId ===
                  params.containsRelationshipTypeId && relationship.isActive,
            );

      if (!params.dryRun) {
        if (needsCiUpdate) {
          ci.update({
            lifecycleStateId: params.retiredLifecycleStateId,
            attributes: nextAttrs,
          });
          await this.ciRepository.update(ci);
          retiredCount++;
        }

        for (const relationship of activeContainsRelationships) {
          relationship.deactivate();
          await this.relationshipRepository.update(relationship);
          deactivatedRelationshipCount++;
        }
      } else if (needsCiUpdate) {
        retiredCount++;
      }
    }

    return { retiredCount, deactivatedRelationshipCount };
  }

  private buildSummary(
    status: "COMPLETED" | "PARTIAL" | "FAILED",
    dryRun: boolean,
    resourcesCreated: number,
    resourcesUpdated: number,
    resourcesRetired: number,
    resourcesUnchanged: number,
    compartmentsCreated: number,
    relationshipsCreated: number,
    errors: OciSyncError[],
  ): string {
    const operation = dryRun ? "Preview" : "Sync";
    const resourceSummary = dryRun
      ? `${resourcesCreated} would be created, ${resourcesUpdated} would be updated, ${resourcesRetired} would be retired, ${resourcesUnchanged} already aligned`
      : `${resourcesCreated} created, ${resourcesUpdated} updated, ${resourcesRetired} retired, ${resourcesUnchanged} unchanged`;
    const topologySummary = dryRun
      ? `${compartmentsCreated} compartment${compartmentsCreated === 1 ? "" : "s"} and ${relationshipsCreated} relationship${relationshipsCreated === 1 ? "" : "s"} would be created`
      : `${compartmentsCreated} compartment${compartmentsCreated === 1 ? "" : "s"} and ${relationshipsCreated} relationship${relationshipsCreated === 1 ? "" : "s"} created`;

    if (status === "COMPLETED") {
      return `${operation} completed: ${resourceSummary}. ${topologySummary}.`;
    }

    const firstError = errors[0]?.error;
    if (status === "PARTIAL") {
      return `${operation} completed with ${errors.length} issue(s): ${resourceSummary}. ${topologySummary}. ${firstError ?? "Check sync history for details."}`;
    }

    return `${operation} failed. ${firstError ?? "No OCI services could be synchronized."}`;
  }

  private toSyncErrorFromFetchFailure(
    failure: OciWebhookFetchFailure,
  ): OciSyncError {
    const serviceKey =
      failure.serviceKeys.length === 1
        ? failure.serviceKeys[0]
        : failure.serviceKeys.join(", ");

    const error =
      failure.serviceKeys.length === 1
        ? failure.message
        : `${failure.message} Affected services: ${failure.serviceKeys.join(", ")}.`;

    return {
      serviceKey,
      resourceId: "",
      resourceName: "",
      error,
    };
  }
}
