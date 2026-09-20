/**
 * IPersonRepository Interface
 * Data access contract for persons (organizational people)
 */

import type { Person } from "../domain/entities/person.entity";

export interface PersonWithoutUserView {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  employeeId: string | null;
  title: string | null;
  department: string | null;
  isActive: boolean;
  orgUnit: {
    id: string;
    name: string;
  } | null;
}

export interface IPersonRepository {
  /**
   * Create a new person
   */
  create(person: Person): Promise<Person>;

  /**
   * Find person by ID
   */
  findById(id: string): Promise<Person | null>;

  /**
   * Find person by Azure AD ID (Microsoft Graph ID)
   * Used for user sync from Microsoft Entra ID
   */
  findByAzureAdId(azureAdId: string): Promise<Person | null>;

  /**
   * Find all persons that have been synced from Azure AD
   * (i.e., have a non-null azureAdId)
   */
  findAllWithAzureAdId(): Promise<Person[]>;

  /**
   * Find all persons without Azure AD ID
   * Used for backfill operations
   */
  findAllWithoutAzureAdId(): Promise<Person[]>;

  /**
   * Find person by email
   */
  findByEmail(email: string): Promise<Person | null>;

  /**
   * Find person by employee ID
   */
  findByEmployeeId(employeeId: string): Promise<Person | null>;

  /**
   * Find person by user ID
   */
  findByUserId(userId: string): Promise<Person | null>;

  /**
   * Find all persons in an organization unit
   */
  findByOrgUnitId(
    orgUnitId: string,
    options?: {
      activeOnly?: boolean;
    },
  ): Promise<Person[]>;

  /**
   * Find persons whose legacy primary role matched the specified role.
   * Returns an empty array now that primaryRole is removed.
   */
  findByPrimaryRoleId(roleId: string): Promise<Person[]>;

  /**
   * Find active persons
   */
  findActive(options?: { skip?: number; take?: number }): Promise<Person[]>;

  /**
   * Find inactive persons
   */
  findInactive(options?: { skip?: number; take?: number }): Promise<Person[]>;

  /**
   * Find excluded persons (TechHub-specific exclusion, e.g., service accounts)
   */
  findExcluded(options?: { skip?: number; take?: number }): Promise<Person[]>;

  /**
   * Find persons linked to user accounts
   */
  findLinkedToUsers(): Promise<Person[]>;

  /**
   * Find persons not linked to user accounts
   */
  findNotLinkedToUsers(): Promise<Person[]>;

  /**
   * Find persons without linked user accounts including org unit and primary role display info
   */
  findNotLinkedToUsersWithDetails(): Promise<PersonWithoutUserView[]>;

  /**
   * Find unlinked persons matching email (case-insensitive) for linking workflows
   */
  findNotLinkedToUsersByEmail(email: string): Promise<PersonWithoutUserView[]>;

  /**
   * Find all persons
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "fullName" | "email" | "employeeId" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Person[]>;

  /**
   * Search persons by name or email
   */
  search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      activeOnly?: boolean;
    },
  ): Promise<Person[]>;

  /**
   * Count all persons
   */
  count(): Promise<number>;

  /**
   * Count persons in org unit
   */
  countByOrgUnitId(orgUnitId: string): Promise<number>;

  /**
   * Count active persons in org unit
   */
  countActiveByOrgUnitId(orgUnitId: string): Promise<number>;

  /**
   * Update person
   */
  update(person: Person): Promise<Person>;

  /**
   * Delete person
   */
  delete(id: string): Promise<void>;

  /**
   * Soft delete person (mark inactive + deletedAt)
   */
  updateSoftDelete(id: string): Promise<void>;

  /**
   * Check if email exists (for uniqueness validation)
   */
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if employee ID exists (for uniqueness validation)
   */
  existsByEmployeeId(employeeId: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if user ID is linked (for uniqueness validation)
   */
  existsByUserId(userId: string, excludeId?: string): Promise<boolean>;

  /**
   * Find persons by email addresses (batch lookup for import)
   * Used for duplicate detection in data import
   */
  findByEmails(emails: string[]): Promise<Person[]>;

  // ==========================================
  // Employee Directory Methods
  // ==========================================

  /**
   * Find all employees for directory with resolved relations
   * Optimized query for the employee directory feature
   */
  findAllForDirectory(options?: {
    search?: string;
    orgUnitIds?: string[];
    locationIds?: string[];
    isActive?: boolean;
    isExcluded?: boolean;
    hasManager?: boolean;
    managerId?: string;
    skip?: number;
    take?: number;
  }): Promise<PersonWithDirectoryRelations[]>;

  /**
   * Count employees matching directory filters without loading rows
   */
  countForDirectory(options?: {
    search?: string;
    orgUnitIds?: string[];
    locationIds?: string[];
    isActive?: boolean;
    isExcluded?: boolean;
    hasManager?: boolean;
    managerId?: string;
  }): Promise<number>;

  /**
   * Find direct reports for a specific person
   */
  findDirectReports(managerId: string): Promise<Person[]>;

  /**
   * Count employees by org unit for directory stats
   */
  countByOrgUnits(): Promise<Map<string, number>>;

  /**
   * Count employees by location for directory stats
   */
  countByLocations(): Promise<Map<string, number>>;

  /**
   * Find reporting chain for a person using recursive CTE
   * Returns the chain from the top (CEO) down to the specified person
   * Efficient upward traversal using PostgreSQL WITH RECURSIVE
   */
  findReportingChain(personId: string): Promise<PersonWithDirectoryRelations[]>;

  /**
   * Find direct reports for a manager with directory relations
   * Used for lazy loading in org chart
   */
  findDirectReportsForDirectory(
    managerId: string,
  ): Promise<PersonWithDirectoryRelations[]>;

  /**
   * Find root employees (those without a manager or whose manager is inactive/not in system)
   * Used for org chart initial load
   */
  findRootEmployeesForDirectory(): Promise<PersonWithDirectoryRelations[]>;
}

/**
 * Person with resolved directory relations
 * Used for optimized directory queries
 */
export interface PersonWithDirectoryRelations {
  person: Person;
  orgUnit: { id: string; name: string; code: string | null } | null;
  location: { id: string; name: string; city: string | null } | null;
  manager: { id: string; firstName: string; lastName: string } | null;
  directReportsCount: number;
}
