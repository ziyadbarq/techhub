/**
 * Role Detail Query Composer
 *
 * Aggregates role detail data from multiple sources with efficient batching.
 * Prevents N+1 queries by fetching related data in parallel.
 */

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import {
  presentRole,
  type RoleDTO,
} from "@/interface-adapters/presenters/role.presenter";

/**
 * Person assignment with enriched person data
 */
export interface PersonAssignmentDTO {
  id: string; // Assignment ID
  personId: string;
  personName: string; // firstName + lastName
  personEmail: string;
  primaryRole: string; // Person's primary role display name
  startDate: Date;
  endDate: Date | null;
  isActive: boolean; // Computed: current date is between startDate and endDate
}

/**
 * Role hierarchy data
 */
export interface RoleHierarchyDTO {
  parent: RoleDTO | null;
  children: RoleDTO[];
}

/**
 * Role statistics
 */
export interface RoleStatsDTO {
  peopleCount: number; // Total people assigned (all time)
  activeAssignmentsCount: number; // Currently active assignments
  childrenCount: number;
  permissionsCount: number;
}

/**
 * Complete role detail data
 */
export interface RoleDetailData {
  role: RoleDTO;
  peopleAssigned: PersonAssignmentDTO[];
  hierarchy: RoleHierarchyDTO;
  stats: RoleStatsDTO;
}

/**
 * Fetch complete role detail data with efficient batching
 */
export async function getRoleDetailData(
  roleId: string,
): Promise<RoleDetailData> {
  const container = getContainer();
  const roleRepository = container.get<IRoleRepository>(
    DI_TOKENS.IRoleRepository,
  );
  const assignmentRepository = container.get<IPersonRoleAssignmentRepository>(
    DI_TOKENS.IPersonRoleAssignmentRepository,
  );
  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  // Fetch role, assignments, people with primary role, and permissions in parallel
  const [role, assignments, peopleWithPrimaryRole, permissions] =
    await Promise.all([
      roleRepository.findById(roleId),
      assignmentRepository.findByRoleId(roleId),
      personRepository.findByPrimaryRoleId(roleId),
      roleRepository.getRolePermissions(roleId),
    ]);

  if (!role) {
    throw new Error(`Role not found: ${roleId}`);
  }

  // Fetch parent role
  const parent = role.parentId
    ? await roleRepository.findById(role.parentId)
    : null;

  // Fetch all roles and filter for children
  const allRoles = await roleRepository.findAll({ includeInactive: false });
  const children = allRoles.filter((r) => r.parentId === roleId);

  // Create person lookup map from primary role holders
  const personMap = new Map(peopleWithPrimaryRole.map((p) => [p.id, p]));

  // Add people from assignments to the map
  const assignmentPersonIds = assignments.map((a) => a.personId);
  const assignmentPersons = await Promise.all(
    assignmentPersonIds.map((id) => personRepository.findById(id)),
  );
  assignmentPersons.forEach((p) => {
    if (p) personMap.set(p.id, p);
  });

  // Fetch primary roles for all people to populate the primaryRole column
  const allPrimaryRoleIds = Array.from(
    new Set(Array.from(personMap.values()).map((p) => p.primaryRoleId)),
  );
  const primaryRoles = await Promise.all(
    allPrimaryRoleIds.map((id) => roleRepository.findById(id)),
  );
  const primaryRoleMap = new Map(
    primaryRoles
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((r) => [r.id, r.displayName]),
  );

  // Build combined list: start with role assignments
  const now = new Date();
  const peopleAssigned: PersonAssignmentDTO[] = [];

  // Add people from explicit role assignments
  assignments.forEach((assignment) => {
    const person = personMap.get(assignment.personId);
    const isActive =
      assignment.startDate <= now &&
      (assignment.endDate === null || assignment.endDate >= now);

    peopleAssigned.push({
      id: assignment.id,
      personId: assignment.personId,
      personName: person ? `${person.firstName} ${person.lastName}` : "Unknown",
      personEmail: person?.email ?? "",
      primaryRole: person
        ? (primaryRoleMap.get(person.primaryRoleId) ?? "")
        : "",
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      isActive,
    });
  });

  // Add people with this role as their primary role (if not already added via assignment)
  const assignmentPersonIdSet = new Set(assignmentPersonIds);
  peopleWithPrimaryRole.forEach((person) => {
    if (!assignmentPersonIdSet.has(person.id)) {
      // Add as an implicit "ongoing" assignment based on their primary role
      peopleAssigned.push({
        id: `primary-${person.id}`, // Synthetic ID for primary role assignments
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        personEmail: person.email,
        primaryRole: primaryRoleMap.get(person.primaryRoleId) ?? "",
        startDate: person.createdAt, // Use person's creation date as start
        endDate: null, // Primary roles are ongoing
        isActive: person.isActive, // Active if person is active
      });
    }
  });

  // Calculate stats
  const activeAssignmentsCount = peopleAssigned.filter(
    (a) => a.isActive,
  ).length;

  const stats: RoleStatsDTO = {
    peopleCount: peopleAssigned.length,
    activeAssignmentsCount,
    childrenCount: children.length,
    permissionsCount: permissions.length,
  };

  // Transform to DTOs
  const roleDTO = presentRole(role);
  const hierarchy: RoleHierarchyDTO = {
    parent: parent ? presentRole(parent) : null,
    children: children.map(presentRole),
  };

  return {
    role: roleDTO,
    peopleAssigned,
    hierarchy,
    stats,
  };
}

/**
 * Fetch only people assigned to a role (lightweight)
 */
export async function getRolePeopleData(
  roleId: string,
): Promise<PersonAssignmentDTO[]> {
  const container = getContainer();
  const assignmentRepository = container.get<IPersonRoleAssignmentRepository>(
    DI_TOKENS.IPersonRoleAssignmentRepository,
  );
  const personRepository = container.get<IPersonRepository>(
    DI_TOKENS.IPersonRepository,
  );

  // Fetch assignments and people with primary role in parallel
  const [assignments, peopleWithPrimaryRole] = await Promise.all([
    assignmentRepository.findByRoleId(roleId),
    personRepository.findByPrimaryRoleId(roleId),
  ]);

  // Create person lookup map from primary role holders
  const personMap = new Map(peopleWithPrimaryRole.map((p) => [p.id, p]));

  // Add people from assignments to the map
  const assignmentPersonIds = assignments.map((a) => a.personId);
  const assignmentPersons = await Promise.all(
    assignmentPersonIds.map((id) => personRepository.findById(id)),
  );
  assignmentPersons.forEach((p) => {
    if (p) personMap.set(p.id, p);
  });

  // Fetch primary roles for all people
  const container2 = getContainer();
  const roleRepository = container2.get<IRoleRepository>(
    DI_TOKENS.IRoleRepository,
  );
  const allPrimaryRoleIds = Array.from(
    new Set(Array.from(personMap.values()).map((p) => p.primaryRoleId)),
  );
  const primaryRoles = await Promise.all(
    allPrimaryRoleIds.map((id) => roleRepository.findById(id)),
  );
  const primaryRoleMap = new Map(
    primaryRoles
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((r) => [r.id, r.displayName]),
  );

  // Build combined list
  const now = new Date();
  const peopleAssigned: PersonAssignmentDTO[] = [];

  // Add people from explicit role assignments
  assignments.forEach((assignment) => {
    const person = personMap.get(assignment.personId);
    const isActive =
      assignment.startDate <= now &&
      (assignment.endDate === null || assignment.endDate >= now);

    peopleAssigned.push({
      id: assignment.id,
      personId: assignment.personId,
      personName: person ? `${person.firstName} ${person.lastName}` : "Unknown",
      personEmail: person?.email ?? "",
      primaryRole: person
        ? (primaryRoleMap.get(person.primaryRoleId) ?? "")
        : "",
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      isActive,
    });
  });

  // Add people with this role as their primary role (if not already added)
  const assignmentPersonIdSet = new Set(assignmentPersonIds);
  peopleWithPrimaryRole.forEach((person) => {
    if (!assignmentPersonIdSet.has(person.id)) {
      peopleAssigned.push({
        id: `primary-${person.id}`,
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        personEmail: person.email,
        primaryRole: primaryRoleMap.get(person.primaryRoleId) ?? "",
        startDate: person.createdAt,
        endDate: null,
        isActive: person.isActive,
      });
    }
  });

  return peopleAssigned;
}

/**
 * Fetch role hierarchy data (lightweight)
 */
export async function getRoleHierarchyData(
  roleId: string,
): Promise<RoleHierarchyDTO> {
  const container = getContainer();
  const roleRepository = container.get<IRoleRepository>(
    DI_TOKENS.IRoleRepository,
  );

  // Fetch role to get parentId
  const role = await roleRepository.findById(roleId);
  if (!role) {
    throw new Error(`Role not found: ${roleId}`);
  }

  // Fetch parent role
  const parent = role.parentId
    ? await roleRepository.findById(role.parentId)
    : null;

  // Fetch all roles and filter for children
  const allRoles = await roleRepository.findAll({ includeInactive: false });
  const children = allRoles.filter((r) => r.parentId === roleId);

  return {
    parent: parent ? presentRole(parent) : null,
    children: children.map(presentRole),
  };
}
