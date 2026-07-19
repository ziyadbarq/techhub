/**
 * Delete Person Use Case
 *
 * Business logic for deleting a person.
 */

import { inject, injectable } from "inversify";
import { ValidationError } from "@/core/domain/errors/validation.error";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

@injectable()
export class DeletePersonUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute delete person use case
   *
   * @param id - Person ID to delete
   * @throws NotFoundError if person not found
   * @throws Error if person is linked to user account
   */
  async execute(id: string): Promise<void> {
    // Check if exists
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundError("Person not found", "Person", id);
    }

    // Check if linked to user
    if (person.userId) {
      throw new ValidationError(
        "Cannot delete person because it is linked to a user account. Unlink the user first.",
      );
    }

    await this.personRepository.delete(id);
  }
}
