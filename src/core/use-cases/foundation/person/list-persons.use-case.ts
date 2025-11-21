/**
 * List Persons Use Case
 *
 * Business logic for listing persons with optional filtering.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface ListPersonsOptions {
  skip?: number;
  take?: number;
  orderBy?: "fullName" | "email" | "employeeId" | "createdAt";
  order?: "asc" | "desc";
  orgUnitId?: string;
  primaryRoleId?: string;
  isActive?: boolean;
  linkedToUser?: boolean;
}

@injectable()
export class ListPersonsUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute list persons use case
   *
   * @param options - Optional filter options
   * @returns Array of persons
   */
  async execute(options?: ListPersonsOptions): Promise<Person[]> {
    if (options?.orgUnitId) {
      return await this.personRepository.findByOrgUnitId(options.orgUnitId, {
        activeOnly: options.isActive,
      });
    }

    if (options?.primaryRoleId) {
      return await this.personRepository.findByPrimaryRoleId(
        options.primaryRoleId,
      );
    }

    if (options?.linkedToUser === true) {
      return await this.personRepository.findLinkedToUsers();
    }

    if (options?.linkedToUser === false) {
      return await this.personRepository.findNotLinkedToUsers();
    }

    if (options?.isActive === true) {
      return await this.personRepository.findActive(options);
    }

    if (options?.isActive === false) {
      return await this.personRepository.findInactive(options);
    }

    return await this.personRepository.findAll(options);
  }
}
