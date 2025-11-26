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
  presentEmployeeDirectory,
  type EmployeeDirectoryDTO,
} from "../presenters/employee-directory.presenter";
import type {
  ListEmployeeDirectoryUseCase,
  GetReportingChainUseCase,
  GetDirectReportsUseCase,
  GetRootEmployeesUseCase,
} from "@/core/use-cases/foundation/employee-directory";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

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
 * Get root employees for org chart initial load
 * Returns employees without a manager or with inactive manager
 */
export async function getRootEmployeesAction(): Promise<
  ActionResponse<{ employees: EmployeeDirectoryDTO[] }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const container = getContainer();
    const useCase = container.get<GetRootEmployeesUseCase>(
      DI_TOKENS.GetRootEmployeesUseCase,
    );

    const result = await useCase.execute();
    const employees = result.rootEmployees.map((r) =>
      presentEmployeeDirectory(r),
    );

    return {
      success: true,
      data: { employees },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getRootEmployeesAction" },
      "Failed to get root employees",
    );
  }
}

/**
 * Get direct reports for a manager (lazy loading for org chart)
 */
export async function getDirectReportsAction(
  managerId: string,
): Promise<ActionResponse<{ directReports: EmployeeDirectoryDTO[] }>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    if (!managerId) {
      return {
        success: false,
        error: "Manager ID is required",
      };
    }

    const container = getContainer();
    const useCase = container.get<GetDirectReportsUseCase>(
      DI_TOKENS.GetDirectReportsUseCase,
    );

    const result = await useCase.execute({ managerId });
    const directReports = result.directReports.map((r) =>
      presentEmployeeDirectory(r),
    );

    return {
      success: true,
      data: { directReports },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getDirectReportsAction" },
      "Failed to get direct reports",
    );
  }
}

/**
 * Get reporting chain for a specific employee
 * Returns the chain from CEO/top down to (but not including) the selected employee
 * Uses efficient recursive CTE query instead of fetching all employees
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
    const useCase = container.get<GetReportingChainUseCase>(
      DI_TOKENS.GetReportingChainUseCase,
    );

    // Use efficient recursive CTE to get just the chain
    const result = await useCase.execute({
      personId,
      excludeTarget: true, // Exclude the target employee, only return managers above
    });

    const chain = result.chain.map((r) => presentEmployeeDirectory(r));

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
 * Only returns org units and locations that have active employees assigned
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

    // Get person repository to check which org units/locations have employees
    const personRepo = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    // Get counts by org unit and location
    const [orgUnitCounts, locationCounts] = await Promise.all([
      personRepo.countByOrgUnits(),
      personRepo.countByLocations(),
    ]);

    // Get organization units (departments) - filter to only those with employees
    const orgUnitRepo = container.get<IOrganizationUnitRepository>(
      DI_TOKENS.IOrganizationUnitRepository,
    );
    const orgUnits = await orgUnitRepo.findAll();

    // Get locations - filter to only those with employees
    const locationRepo = container.get<ILocationRepository>(
      DI_TOKENS.ILocationRepository,
    );
    const locations = await locationRepo.findAll();

    return {
      success: true,
      data: {
        departments: orgUnits
          .filter((ou) => orgUnitCounts.has(ou.id))
          .map((ou) => ({
            id: ou.id,
            name: ou.name,
            code: ou.code,
          })),
        locations: locations
          .filter((loc) => locationCounts.has(loc.id))
          .map((loc) => ({
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
