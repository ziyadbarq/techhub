/**
 * Get Direct Reports Use Case
 * Fetches direct reports for a manager with directory relations
 * Used for lazy loading in the org chart
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { PersonWithDirectoryRelations } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface GetDirectReportsInput {
  managerId: string;
}

export interface GetDirectReportsOutput {
  directReports: PersonWithDirectoryRelations[];
  total: number;
}

@injectable()
export class GetDirectReportsUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GetDirectReportsInput): Promise<GetDirectReportsOutput> {
    this.logger.debug("Fetching direct reports", {
      managerId: input.managerId,
    });

    const directReports =
      await this.personRepository.findDirectReportsForDirectory(
        input.managerId,
      );

    this.logger.debug("Direct reports fetch complete", {
      managerId: input.managerId,
      count: directReports.length,
    });

    return {
      directReports,
      total: directReports.length,
    };
  }
}
