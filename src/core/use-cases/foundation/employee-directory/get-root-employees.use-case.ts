/**
 * Get Root Employees Use Case
 * Fetches root employees (those without a manager or with inactive manager)
 * Used for org chart initial load
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { PersonWithDirectoryRelations } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface GetRootEmployeesOutput {
  rootEmployees: PersonWithDirectoryRelations[];
  total: number;
}

@injectable()
export class GetRootEmployeesUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<GetRootEmployeesOutput> {
    this.logger.debug("Fetching root employees for org chart");

    const rootEmployees =
      await this.personRepository.findRootEmployeesForDirectory();

    this.logger.debug("Root employees fetch complete", {
      count: rootEmployees.length,
    });

    return {
      rootEmployees,
      total: rootEmployees.length,
    };
  }
}
