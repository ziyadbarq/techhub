/**
 * Sync Users from Microsoft Graph Use Case
 *
 * Orchestrates user synchronization from Microsoft Entra ID (Azure AD)
 * via Microsoft Graph API. Handles:
 * - Full sync of all users
 * - Manager relationship linking (2-pass)
 * - Deactivation of removed users
 *
 * Identity Strategy:
 * - Uses azureAdId (immutable GUID) as source of truth for matching
 * - Email can change (marriage, rebranding) but azureAdId never changes
 * - Persons without azureAdId are not affected by sync
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import { Person } from "@/core/domain/entities/person.entity";
import {
  transformGraphUserToPerson,
  type SyncResult,
  type FetchUsersOptions,
  type TransformGraphUserOptions,
} from "@/lib/schemas/graph-user.schema";
import type {
  GraphSyncProgress,
  GraphSyncProgressCallback,
  GraphSyncPhase,
} from "@/lib/schemas/graph-sync-progress.types";

/**
 * Options for the sync operation
 */
export interface SyncUsersOptions extends FetchUsersOptions {
  /**
   * Default organization unit ID for new users
   * If not provided, uses the first org unit
   */
  defaultOrgUnitId?: string;

  /**
   * Default primary role ID for new users
   * If not provided, uses "viewer" role
   */
  defaultPrimaryRoleId?: string;

  /**
   * Skip manager linking pass
   * Useful for faster initial sync
   */
  skipManagerLinking?: boolean;

  /**
   * Deactivate users not found in Microsoft Graph
   * @default true
   */
  deactivateMissing?: boolean;

  /**
   * Dry run - don't actually make changes
   */
  dryRun?: boolean;

  /**
   * Progress callback for real-time updates
   * Called periodically during sync to report status
   */
  onProgress?: GraphSyncProgressCallback;
}

@injectable()
export class SyncUsersFromGraphUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly orgUnitRepository: IOrganizationUnitRepository,
    @inject(DI_TOKENS.ILocationRepository)
    private readonly locationRepository: ILocationRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private readonly roleRepository: IRoleRepository,
    @inject(IMicrosoftGraphService)
    private readonly graphService: IMicrosoftGraphService,
  ) {
    this.logger = logger.child({ useCase: "SyncUsersFromGraphUseCase" });
  }

  /**
   * Report progress to callback with batching
   * Only calls callback every N items or on phase changes
   */
  private reportProgress(
    callback: GraphSyncProgressCallback | undefined,
    phase: GraphSyncPhase,
    phaseLabel: string,
    currentIndex: number,
    totalItems: number,
    stats: GraphSyncProgress["stats"],
    startTime: number,
    lastReportedIndex: number,
    reportInterval = 10,
  ): number {
    if (!callback) return lastReportedIndex;

    // Report on phase start/end or every reportInterval items
    const isPhaseChange = currentIndex === 0 || currentIndex === totalItems;
    const shouldReport =
      isPhaseChange || currentIndex - lastReportedIndex >= reportInterval;

    if (!shouldReport) return lastReportedIndex;

    callback({
      phase,
      phaseLabel,
      currentIndex,
      totalItems,
      stats: { ...stats },
      elapsedMs: Date.now() - startTime,
    });

    return currentIndex;
  }

  /**
   * Execute user sync from Microsoft Graph
   */
  async execute(options?: SyncUsersOptions): Promise<SyncResult> {
    const result: SyncResult = {
      created: 0,
      updated: 0,
      deactivated: 0,
      excluded: 0,
      errors: [],
    };

    const startTime = Date.now();
    const onProgress = options?.onProgress;
    let lastReported = -1;

    // Helper to get stats for progress reporting
    const getStats = () => ({
      created: result.created,
      updated: result.updated,
      excluded: result.excluded,
      deactivated: result.deactivated,
      errors: result.errors.length,
    });

    this.logger.info("Starting user sync from Microsoft Graph", { options });

    try {
      // Report initializing phase
      this.reportProgress(
        onProgress,
        "initializing",
        "Building lookup maps...",
        0,
        1,
        getStats(),
        startTime,
        -1,
      );

      // Build transform options with org unit, location, and role maps
      const transformOptions = await this.buildTransformOptions(options);

      this.reportProgress(
        onProgress,
        "initializing",
        "Lookup maps ready",
        1,
        1,
        getStats(),
        startTime,
        0,
      );

      // Pass 1: Fetch users from Graph
      this.logger.info("Pass 1: Fetching users from Microsoft Graph");
      this.reportProgress(
        onProgress,
        "fetching-users",
        "Fetching users from Microsoft Graph...",
        0,
        1,
        getStats(),
        startTime,
        -1,
      );

      const graphUsers = await this.graphService.fetchAllUsers({
        includeDisabled: options?.includeDisabled,
        includeGuests: options?.includeGuests,
      });

      this.logger.info("Fetched users from Graph", {
        count: graphUsers.length,
      });

      this.reportProgress(
        onProgress,
        "fetching-users",
        `Fetched ${graphUsers.length} users from Microsoft Graph`,
        1,
        1,
        getStats(),
        startTime,
        0,
      );

      // Reset for syncing phase
      lastReported = -1;
      const totalUsers = graphUsers.length;

      // Process each user
      for (let i = 0; i < graphUsers.length; i++) {
        const graphUser = graphUsers[i];

        // Report progress (batched every 10 users)
        lastReported = this.reportProgress(
          onProgress,
          "syncing-users",
          `Syncing users [${i + 1}/${totalUsers}]`,
          i + 1,
          totalUsers,
          getStats(),
          startTime,
          lastReported,
        );

        try {
          // Transform Graph user to Person data with automatic org unit, location, and role assignment
          const personData = transformGraphUserToPerson(
            graphUser,
            transformOptions,
          );

          // Find existing person by azureAdId (NOT by email!)
          const existingPerson = await this.personRepository.findByAzureAdId(
            personData.azureAdId,
          );

          if (existingPerson) {
            // Update existing person (including email, org unit, location which may change)
            if (!options?.dryRun) {
              existingPerson.update({
                firstName: personData.firstName,
                lastName: personData.lastName,
                email: personData.email, // Email CAN change!
                phone: personData.phone,
                mobile: personData.mobile,
                employeeId: personData.employeeId,
                title: personData.title,
                department: personData.department,
                office: personData.office,
                isActive: personData.isActive,
                hireDate: personData.hireDate,
                // Update org unit based on department mapping
                orgUnitId: personData.orgUnitId,
                // Update location based on office mapping
                locationId: personData.locationId,
              });

              // Auto-exclude users without department (service accounts, system accounts)
              // If department becomes null/empty, exclude from TechHub
              // If department is set, include in TechHub
              const hasDepartment = !!personData.department?.trim();
              if (!hasDepartment && !existingPerson.isExcluded) {
                existingPerson.exclude();
                result.excluded++;
                this.logger.debug("Auto-excluding user without department", {
                  azureAdId: personData.azureAdId,
                  email: personData.email,
                });
              } else if (hasDepartment && existingPerson.isExcluded) {
                existingPerson.include();
                this.logger.debug("Auto-including user with department", {
                  azureAdId: personData.azureAdId,
                  email: personData.email,
                  department: personData.department,
                });
              }

              await this.personRepository.update(existingPerson);
            }
            result.updated++;
          } else {
            // Create new person
            if (!options?.dryRun) {
              const newPerson = Person.create({
                azureAdId: personData.azureAdId,
                firstName: personData.firstName,
                lastName: personData.lastName,
                email: personData.email,
                phone: personData.phone,
                mobile: personData.mobile,
                employeeId: personData.employeeId,
                title: personData.title,
                department: personData.department,
                office: personData.office,
                hireDate: personData.hireDate,
                orgUnitId: personData.orgUnitId,
                locationId: personData.locationId,
                primaryRoleId: personData.primaryRoleId,
              });

              // Auto-exclude new users without department (service accounts, system accounts)
              const hasDepartment = !!personData.department?.trim();
              if (!hasDepartment) {
                newPerson.exclude();
                result.excluded++;
                this.logger.debug(
                  "Auto-excluding new user without department",
                  {
                    azureAdId: personData.azureAdId,
                    email: personData.email,
                  },
                );
              }

              await this.personRepository.create(newPerson);
            }
            result.created++;
          }
        } catch (error) {
          result.errors.push({
            azureAdId: graphUser.id,
            email: graphUser.mail || graphUser.userPrincipalName,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.warn("Failed to sync user", {
            azureAdId: graphUser.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Pass 2: Link managers (using azureAdId for lookups)
      if (!options?.skipManagerLinking) {
        this.logger.info("Pass 2: Linking managers");
        this.reportProgress(
          onProgress,
          "linking-managers",
          "Linking manager relationships...",
          0,
          totalUsers,
          getStats(),
          startTime,
          -1,
        );

        await this.linkManagers(
          graphUsers.map((u) => u.id),
          options?.dryRun,
          onProgress,
          startTime,
          getStats,
        );

        this.reportProgress(
          onProgress,
          "linking-managers",
          "Manager relationships linked",
          totalUsers,
          totalUsers,
          getStats(),
          startTime,
          0,
        );
      }

      // Pass 3: Deactivate users no longer in Graph
      if (options?.deactivateMissing !== false) {
        this.logger.info("Pass 3: Deactivating removed users");
        this.reportProgress(
          onProgress,
          "deactivating-removed",
          "Checking for removed users...",
          0,
          1,
          getStats(),
          startTime,
          -1,
        );

        const deactivatedCount = await this.deactivateRemovedUsers(
          graphUsers.map((u) => u.id),
          options?.dryRun,
        );
        result.deactivated = deactivatedCount;

        this.reportProgress(
          onProgress,
          "deactivating-removed",
          `Deactivated ${deactivatedCount} removed users`,
          1,
          1,
          getStats(),
          startTime,
          0,
        );
      }

      // Report completion
      this.reportProgress(
        onProgress,
        "complete",
        "Sync complete",
        1,
        1,
        getStats(),
        startTime,
        0,
      );

      this.logger.info("User sync completed", {
        created: result.created,
        updated: result.updated,
        deactivated: result.deactivated,
        excluded: result.excluded,
        errors: result.errors.length,
      });
      return result;
    } catch (error) {
      this.logger.error(
        "User sync failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  /**
   * Build transform options: maps for org units, locations, and roles
   */
  private async buildTransformOptions(
    options?: SyncUsersOptions,
  ): Promise<TransformGraphUserOptions> {
    // Get all org units and build code → ID map
    const allOrgUnits = await this.orgUnitRepository.findAll();
    if (allOrgUnits.length === 0) {
      throw new Error(
        "No organization units found. Please create at least one organization unit before syncing.",
      );
    }

    const orgUnitCodeToIdMap = new Map<string, string>();
    let defaultOrgUnitId = options?.defaultOrgUnitId;

    for (const orgUnit of allOrgUnits) {
      if (orgUnit.code) {
        orgUnitCodeToIdMap.set(orgUnit.code, orgUnit.id);
      }
    }

    // Use UNASSIGNED org unit as fallback for unmapped departments
    if (!defaultOrgUnitId) {
      const unassignedId = orgUnitCodeToIdMap.get("UNASSIGNED");
      if (unassignedId) {
        defaultOrgUnitId = unassignedId;
      } else {
        // Final fallback: use first org unit if UNASSIGNED doesn't exist
        defaultOrgUnitId = allOrgUnits[0]?.id;
      }
    }

    this.logger.info("Built org unit code to ID map", {
      orgUnitCount: orgUnitCodeToIdMap.size,
      codes: Array.from(orgUnitCodeToIdMap.keys()),
    });

    // Get all locations and build code → ID map
    const allLocations = await this.locationRepository.findAll();
    const locationCodeToIdMap = new Map<string, string>();

    for (const location of allLocations) {
      if (location.code) {
        locationCodeToIdMap.set(location.code, location.id);
      }
    }

    this.logger.info("Built location code to ID map", {
      locationCount: locationCodeToIdMap.size,
      codes: Array.from(locationCodeToIdMap.keys()),
    });

    // Build role map: roleName → roleId
    const roleMap = new Map<string, string>();
    const allRoles = await this.roleRepository.findAll({
      includeInactive: false,
    });

    if (allRoles.length === 0) {
      throw new Error(
        "No roles found. Please create at least one role before syncing.",
      );
    }

    for (const role of allRoles) {
      roleMap.set(role.name, role.id);
    }

    this.logger.info("Built role map for automatic assignment", {
      roleCount: roleMap.size,
      roles: Array.from(roleMap.keys()),
    });

    return {
      defaultOrgUnitId: defaultOrgUnitId!,
      roleMap,
      orgUnitCodeToIdMap,
      locationCodeToIdMap,
    };
  }

  /**
   * Link managers using Azure AD IDs
   */
  private async linkManagers(
    graphUserIds: string[],
    dryRun?: boolean,
    onProgress?: GraphSyncProgressCallback,
    startTime?: number,
    getStats?: () => GraphSyncProgress["stats"],
  ): Promise<void> {
    const managerMap = await this.graphService.fetchAllManagers(graphUserIds);

    let linkedCount = 0;
    let lastReported = -1;
    const totalManagers = managerMap.size;
    let currentIndex = 0;

    for (const [userAzureId, managerAzureId] of managerMap) {
      currentIndex++;

      // Report progress every 20 manager links
      if (onProgress && startTime && getStats) {
        lastReported = this.reportProgress(
          onProgress,
          "linking-managers",
          `Linking managers [${currentIndex}/${totalManagers}]`,
          currentIndex,
          totalManagers,
          getStats(),
          startTime,
          lastReported,
          20,
        );
      }

      try {
        // Find both person and manager by their Azure AD IDs
        const person = await this.personRepository.findByAzureAdId(userAzureId);
        const manager =
          await this.personRepository.findByAzureAdId(managerAzureId);

        if (person && manager && person.managerId !== manager.id) {
          if (!dryRun) {
            person.update({ managerId: manager.id });
            await this.personRepository.update(person);
          }
          linkedCount++;
        }
      } catch (error) {
        this.logger.warn("Failed to link manager", {
          userAzureId,
          managerAzureId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.logger.info("Manager linking completed", { linkedCount });
  }

  /**
   * Deactivate persons no longer in Graph
   */
  private async deactivateRemovedUsers(
    currentGraphIds: string[],
    dryRun?: boolean,
  ): Promise<number> {
    const graphIdSet = new Set(currentGraphIds);

    // Get all persons that have been synced from Graph (have azureAdId)
    const syncedPersons = await this.personRepository.findAllWithAzureAdId();

    let deactivatedCount = 0;
    for (const person of syncedPersons) {
      // If person has azureAdId but is not in current Graph data, deactivate
      if (
        person.azureAdId &&
        !graphIdSet.has(person.azureAdId) &&
        person.isActive
      ) {
        if (!dryRun) {
          person.update({
            isActive: false,
            terminationDate: new Date(),
          });
          await this.personRepository.update(person);
        }
        deactivatedCount++;
      }
    }

    this.logger.info("Deactivation completed", {
      deactivatedCount,
    });
    return deactivatedCount;
  }
}
