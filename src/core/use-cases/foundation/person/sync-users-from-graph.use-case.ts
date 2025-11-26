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

    this.logger.info("Starting user sync from Microsoft Graph", { options });

    try {
      // Build transform options with org unit, location, and role maps
      const transformOptions = await this.buildTransformOptions(options);

      // Pass 1: Fetch and sync all users
      this.logger.info("Pass 1: Fetching users from Microsoft Graph");
      const graphUsers = await this.graphService.fetchAllUsers({
        includeDisabled: options?.includeDisabled,
        includeGuests: options?.includeGuests,
      });
      this.logger.info("Fetched users from Graph", {
        count: graphUsers.length,
      });

      // Process each user
      for (const graphUser of graphUsers) {
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
        await this.linkManagers(
          graphUsers.map((u) => u.id),
          options?.dryRun,
        );
      }

      // Pass 3: Deactivate users no longer in Graph
      if (options?.deactivateMissing !== false) {
        this.logger.info("Pass 3: Deactivating removed users");
        const deactivatedCount = await this.deactivateRemovedUsers(
          graphUsers.map((u) => u.id),
          options?.dryRun,
        );
        result.deactivated = deactivatedCount;
      }

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
  ): Promise<void> {
    const managerMap = await this.graphService.fetchAllManagers(graphUserIds);

    let linkedCount = 0;
    for (const [userAzureId, managerAzureId] of managerMap) {
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
