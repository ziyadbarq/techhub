/**
 * Create Person Use Case
 *
 * Business logic for creating a new person.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface CreatePersonProps {
  userId?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  employeeId?: string | null;
  orgUnitId: string;
  primaryRoleId: string;
  managerId?: string | null;
  title?: string | null;
  locationId?: string | null;
  department?: string | null;
  hireDate?: Date | null;
  terminationDate?: Date | null;
  metadata?: Record<string, unknown> | null;
}

@injectable()
export class CreatePersonUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute create person use case
   *
   * @param props - Person creation properties
   * @returns Created person
   * @throws Error if email or employee ID already exists
   */
  async execute(props: CreatePersonProps): Promise<Person> {
    // Check for duplicate email
    const existsByEmail = await this.personRepository.existsByEmail(
      props.email,
    );
    if (existsByEmail) {
      throw new Error(`Person with email "${props.email}" already exists`);
    }

    // Check for duplicate employee ID if provided
    if (props.employeeId) {
      const existsByEmployeeId = await this.personRepository.existsByEmployeeId(
        props.employeeId,
      );
      if (existsByEmployeeId) {
        throw new Error(
          `Person with employee ID "${props.employeeId}" already exists`,
        );
      }
    }

    const person = Person.create(props);
    const created = await this.personRepository.create(person);
    return created;
  }
}
