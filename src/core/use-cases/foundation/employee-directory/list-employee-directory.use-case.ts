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
  skip?: number;
  take?: number;
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
      skip: input.skip ?? 0,
      take: input.take ?? 100,
    };

    const countFilters = {
      search: filters.search,
      orgUnitIds: filters.orgUnitIds,
      locationIds: filters.locationIds,
      isActive: filters.isActive,
      isExcluded: filters.isExcluded,
      hasManager: filters.hasManager,
      managerId: filters.managerId,
    };

    const [employees, total] = await Promise.all([
      this.personRepository.findAllForDirectory(filters),
      this.personRepository.countForDirectory(countFilters),
    ]);

    this.logger.debug("Employee directory fetch complete", {
      count: employees.length,
      total,
    });

    return {
      employees,
      total,
    };
  }
}
