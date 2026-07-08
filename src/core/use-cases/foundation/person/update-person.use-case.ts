/**
 * Update Person Use Case
 *
 * Business logic for updating an existing person.
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface UpdatePersonProps {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  email?: string;
  phone?: string | null;
  mobile?: string | null;
  employeeId?: string | null;
  orgUnitId?: string;
  managerId?: string | null;
  title?: string | null;
  locationId?: string | null;
  department?: string | null;
  hireDate?: Date | null;
  terminationDate?: Date | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class UpdatePersonUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute update person use case
   *
   * @param props - Update properties
   * @returns Updated person
   * @throws NotFoundError if person not found
   * @throws Error if email or employee ID already exists
   */
  async execute(props: UpdatePersonProps): Promise<Person> {
    // Fetch existing person
    const person = await this.personRepository.findById(props.id);
    if (!person) {
      throw new NotFoundError("Person not found", "Person", props.id);
    }

    // Check for duplicate email if changing
    if (props.email !== undefined && props.email !== person.email) {
      const existsByEmail = await this.personRepository.existsByEmail(
        props.email,
        props.id,
      );
      if (existsByEmail) {
        throw new ConflictError(
          `Person with email "${props.email}" already exists`,
        );
      }
    }

    // Check for duplicate employee ID if changing
    if (
      props.employeeId !== undefined &&
      props.employeeId !== null &&
      props.employeeId !== person.employeeId
    ) {
      const existsByEmployeeId = await this.personRepository.existsByEmployeeId(
        props.employeeId,
        props.id,
      );
      if (existsByEmployeeId) {
        throw new ConflictError(
          `Person with employee ID "${props.employeeId}" already exists`,
        );
      }
    }

    // Update using entity's update method (includes validation)
    person.update({
      firstName: props.firstName,
      lastName: props.lastName,
      middleName: props.middleName,
      email: props.email,
      phone: props.phone,
      mobile: props.mobile,
      employeeId: props.employeeId,
      orgUnitId: props.orgUnitId,
      managerId: props.managerId,
      title: props.title,
      locationId: props.locationId,
      department: props.department,
      hireDate: props.hireDate,
      terminationDate: props.terminationDate,
      metadata: props.metadata,
    });

    // Persist changes
    return await this.personRepository.update(person);
  }
}
