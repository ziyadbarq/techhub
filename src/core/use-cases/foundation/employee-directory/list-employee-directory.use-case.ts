/**
 * List Employee Directory Use Case
 * Fetches employees with resolved relations for the directory feature
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { PersonWithDirectoryRelations } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface ListEmployeeDirectoryInput {
  search?: string;
  orgUnitIds?: string[];
  locationIds?: string[];
  isActive?: boolean;
  isExcluded?: boolean;
  hasManager?: boolean;
  managerId?: string;
}

export interface ListEmployeeDirectoryOutput {
  employees: PersonWithDirectoryRelations[];
  total: number;
}

@injectable()
export class ListEmployeeDirectoryUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: ListEmployeeDirectoryInput = {},
  ): Promise<ListEmployeeDirectoryOutput> {
    this.logger.debug("Fetching employees for directory", { filters: input });

    // Default to active employees only
    const filters = {
      ...input,
      isActive: input.isActive ?? true,
    };

    const employees = await this.personRepository.findAllForDirectory(filters);

    this.logger.debug("Employee directory fetch complete", {
      count: employees.length,
    });

    return {
      employees,
      total: employees.length,
    };
  }
}
