/**
 * Get Person Use Case
 *
 * Business logic for retrieving a single person by ID.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";

@injectable()
export class GetPersonUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  /**
   * Execute get person use case
   *
   * @param id - Person ID
   * @returns Person or null if not found
   */
  async execute(id: string): Promise<Person | null> {
    return await this.personRepository.findById(id);
  }
}
