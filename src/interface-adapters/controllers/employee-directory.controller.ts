/**
 * Employee Directory Controller
 * Server actions for the employee directory feature
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  EmployeeDirectoryFilterSchema,
  type EmployeeDirectoryFilterDTO,
} from "../dtos/generated/employee-directory.dto";
import {
  presentEmployeesDirectory,
  buildOrgHierarchy,
  getReportingChain,
  type EmployeeDirectoryDTO,
  type OrgHierarchyNodeDTO,
} from "../presenters/employee-directory.presenter";
import type { ListEmployeeDirectoryUseCase } from "@/core/use-cases/foundation/employee-directory";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";

/**
 * List employees for directory with optional filters
 */
export async function listEmployeeDirectoryAction(
  filters?: EmployeeDirectoryFilterDTO,
): Promise<
  ActionResponse<{ employees: EmployeeDirectoryDTO[]; total: number }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const validated = filters
      ? EmployeeDirectoryFilterSchema.parse(filters)
      : { isActive: true };

    const container = getContainer();
    const useCase = container.get<ListEmployeeDirectoryUseCase>(
      DI_TOKENS.ListEmployeeDirectoryUseCase,
    );

    const result = await useCase.execute({
      search: validated.search,
      orgUnitIds: validated.orgUnitIds,
      locationIds: validated.locationIds,
      isActive: validated.isActive,
      hasManager: validated.hasManager,
      managerId: validated.managerId,
    });

    const employees = presentEmployeesDirectory(result.employees);

    return {
      success: true,
      data: {
        employees,
        total: result.total,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listEmployeeDirectoryAction" },
      "Failed to list employees for directory",
    );
  }
}

/**
 * Get organization hierarchy grouped by department heads
 */
export async function getOrgHierarchyAction(): Promise<
  ActionResponse<OrgHierarchyNodeDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListEmployeeDirectoryUseCase>(
      DI_TOKENS.ListEmployeeDirectoryUseCase,
    );

    // Get all active employees
    const result = await useCase.execute({ isActive: true });
    const employees = presentEmployeesDirectory(result.employees);

    // Build hierarchy from flat list
    const hierarchy = buildOrgHierarchy(employees);

    return {
      success: true,
      data: hierarchy,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getOrgHierarchyAction" },
      "Failed to get organization hierarchy",
    );
  }
}

/**
 * Get reporting chain for a specific employee
 * Returns the chain from CEO/top down to (but not including) the selected employee
 */
export async function getReportingChainAction(
  personId: string,
): Promise<ActionResponse<{ chain: EmployeeDirectoryDTO[] }>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!personId) {
      return {
        success: false,
        error: "Person ID is required",
      };
    }

    const container = getContainer();
    const useCase = container.get<ListEmployeeDirectoryUseCase>(
      DI_TOKENS.ListEmployeeDirectoryUseCase,
    );

    // Get all active employees to build the chain
    const result = await useCase.execute({ isActive: true });
    const employees = presentEmployeesDirectory(result.employees);

    // Get the full reporting chain
    const fullChain = getReportingChain(personId, employees);

    if (fullChain.length === 0) {
      return {
        success: false,
        error: "Employee not found",
      };
    }

    // Remove the selected employee from the chain (last element)
    // We only want the managers above them
    const chain = fullChain.slice(0, -1);

    return {
      success: true,
      data: { chain },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getReportingChainAction" },
      "Failed to get reporting chain",
    );
  }
}

/**
 * Get filter options (departments and locations)
 */
export async function getDirectoryFilterOptionsAction(): Promise<
  ActionResponse<{
    departments: Array<{ id: string; name: string; code: string | null }>;
    locations: Array<{ id: string; name: string; city: string | null }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const container = getContainer();

    // Get organization units (departments)
    const orgUnitRepo = container.get<IOrganizationUnitRepository>(
      DI_TOKENS.IOrganizationUnitRepository,
    );
    const orgUnits = await orgUnitRepo.findAll();

    // Get locations
    const locationRepo = container.get<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
    );
    const locations = await locationRepo.findAll();

    return {
      success: true,
      data: {
        departments: orgUnits.map((ou) => ({
          id: ou.id,
          name: ou.name,
          code: ou.code,
        })),
        locations: locations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          city: loc.city,
        })),
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getDirectoryFilterOptionsAction" },
      "Failed to get filter options",
    );
  }
}
