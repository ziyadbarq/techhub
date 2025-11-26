/**
 * Toggle Person Exclusion Use Case
 *
 * Business logic for excluding/including a person from TechHub.
 * Excluded persons (service accounts, etc.) are hidden from searches, dropdowns,
 * and directory views, but remain active in Azure AD.
 *
 * Note: This is different from isActive which is managed by MS Graph sync.
 * isExcluded is TechHub-specific for hiding service accounts from app activities.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface TogglePersonExclusionProps {
  id: string;
  isExcluded: boolean;
}

@injectable()
export class TogglePersonExclusionUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute toggle person exclusion use case
   *
   * @param props - Toggle properties (id and desired exclusion status)
   * @returns Updated person
   * @throws NotFoundError if person not found
   */
  async execute(props: TogglePersonExclusionProps): Promise<Person> {
    const person = await this.personRepository.findById(props.id);
    if (!person) {
      throw new NotFoundError("Person not found", "Person", props.id);
    }

    // Use entity methods for clean state transitions
    if (props.isExcluded) {
      person.exclude();
    } else {
      person.include();
    }

    return await this.personRepository.update(person);
  }
}
