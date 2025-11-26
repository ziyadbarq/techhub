/**
 * Employee Directory Presenter
 * Transforms Person entities with relations into directory-specific DTOs
 */

import type { Person } from "@/core/domain/entities/person.entity";

/**
 * DTO for employee directory views
 * Includes resolved relations for org unit, location, and manager
 */
export interface EmployeeDirectoryDTO {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  email: string;
  title: string | null;
  department: string | null;
  office: string | null;
  phone: string | null;
  mobile: string | null;
  employeeId: string | null;
  hireDate: string | null;
  isActive: boolean;
  // Resolved relations
  orgUnitId: string;
  orgUnitName: string;
  orgUnitCode: string | null;
  locationId: string | null;
  locationName: string | null;
  locationCity: string | null;
  managerId: string | null;
  managerName: string | null;
  directReportsCount: number;
}

/**
 * Raw data structure from Prisma query with includes
 */
export interface PersonWithRelations {
  person: Person;
  orgUnit: { id: string; name: string; code: string | null } | null;
  location: { id: string; name: string; city: string | null } | null;
  manager: { id: string; firstName: string; lastName: string } | null;
  directReportsCount: number;
}

/**
 * Generate initials from first and last name
 */
function generateInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Generate full name from person
 */
function generateFullName(
  firstName: string,
  lastName: string,
  middleName?: string | null,
): string {
  if (middleName) {
    return `${firstName} ${middleName} ${lastName}`;
  }
  return `${firstName} ${lastName}`;
}

/**
 * Present a single employee for directory
 */
export function presentEmployeeDirectory(
  data: PersonWithRelations,
): EmployeeDirectoryDTO {
  const { person, orgUnit, location, manager, directReportsCount } = data;

  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    fullName: generateFullName(
      person.firstName,
      person.lastName,
      person.middleName,
    ),
    initials: generateInitials(person.firstName, person.lastName),
    email: person.email,
    title: person.title,
    department: person.department,
    office: person.office,
    phone: person.phone,
    mobile: person.mobile,
    employeeId: person.employeeId,
    hireDate: person.hireDate ? person.hireDate.toISOString() : null,
    isActive: person.isActive,
    // Resolved relations
    orgUnitId: person.orgUnitId,
    orgUnitName: orgUnit?.name ?? "Unknown",
    orgUnitCode: orgUnit?.code ?? null,
    locationId: person.locationId,
    locationName: location?.name ?? null,
    locationCity: location?.city ?? null,
    managerId: person.managerId,
    managerName: manager
      ? generateFullName(manager.firstName, manager.lastName)
      : null,
    directReportsCount,
  };
}

/**
 * Present multiple employees for directory
 */
export function presentEmployeesDirectory(
  data: PersonWithRelations[],
): EmployeeDirectoryDTO[] {
  return data.map(presentEmployeeDirectory);
}

// NOTE: buildOrgHierarchy and getReportingChain functions have been moved to use cases:
// - GetReportingChainUseCase: Uses efficient recursive CTE for chain fetching
// - GetRootEmployeesUseCase + GetDirectReportsUseCase: For lazy loading org chart
