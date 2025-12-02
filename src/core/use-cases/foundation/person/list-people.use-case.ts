/**
 * List People Use Case
 *
 * Business logic for listing people with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface ListPeopleOptions {
  skip?: number;
  take?: number;
  orderBy?: "fullName" | "email" | "employeeId" | "createdAt";
  order?: "asc" | "desc";
  orgUnitId?: string;
  isActive?: boolean;
  linkedToUsers?: boolean;
}

@injectable()
export class ListPeopleUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute list people use case
   *
   * @param options - Optional filter options
   * @returns Array of people
   */
  async execute(options?: ListPeopleOptions): Promise<Person[]> {
    if (options?.orgUnitId) {
      return await this.personRepository.findByOrgUnitId(options.orgUnitId, {
        activeOnly: options.isActive,
      });
    }

    if (options?.linkedToUsers === true) {
      return await this.personRepository.findLinkedToUsers();
    }

    if (options?.linkedToUsers === false) {
      return await this.personRepository.findNotLinkedToUsers();
    }

    if (options?.isActive !== undefined) {
      if (options.isActive) {
        return await this.personRepository.findActive(options);
      } else {
        return await this.personRepository.findInactive(options);
      }
    }

    return await this.personRepository.findAll(options);
  }
}
