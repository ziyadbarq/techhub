/**
 * Person Presenter
 * Transforms Person domain entities into DTOs for the UI layer
 */

import type { Person } from "@/core/domain/entities/person.entity";

export interface PersonDTO {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string | null;
  employeeId: string | null;
  organizationUnitId: string;
  primaryRoleId: string;
  locationId: string | null;
  managerId: string | null;
  jobTitle: string | null;
  department: string | null;
  hireDate: string | null;
  terminationDate: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentPerson(person: Person): PersonDTO {
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    middleName: person.middleName,
    email: person.email,
    phone: person.phone,
    employeeId: person.employeeId,
    organizationUnitId: person.orgUnitId,
    primaryRoleId: person.primaryRoleId,
    locationId: person.locationId,
    managerId: person.managerId,
    jobTitle: person.title,
    department: person.department,
    hireDate: person.hireDate ? person.hireDate.toISOString() : null,
    terminationDate: person.terminationDate
      ? person.terminationDate.toISOString()
      : null,
    isActive: person.isActive,
    metadata: person.metadata,
    createdAt: person.createdAt.toISOString(),
    updatedAt: person.updatedAt.toISOString(),
  };
}

export function presentPersons(persons: Person[]): PersonDTO[] {
  return persons.map(presentPerson);
}
