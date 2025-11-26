/**
 * Toggle Person Status Use Case
 *
 * Business logic for enabling/disabling a person.
 * Disabled persons are hidden from searches, dropdowns, and directory views.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

export interface TogglePersonStatusProps {
  id: string;
  isActive: boolean;
}

@injectable()
export class TogglePersonStatusUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute toggle person status use case
   *
   * @param props - Toggle properties (id and desired status)
   * @returns Updated person
   * @throws NotFoundError if person not found
   */
  async execute(props: TogglePersonStatusProps): Promise<Person> {
    const person = await this.personRepository.findById(props.id);
    if (!person) {
      throw new NotFoundError("Person not found", "Person", props.id);
    }

    // Use entity methods for clean state transitions
    if (props.isActive) {
      person.activate();
    } else {
      person.deactivate();
    }

    return await this.personRepository.update(person);
  }
}
