/**
 * Get Reporting Chain Use Case
 * Efficiently fetches the reporting chain for an employee using recursive CTE
 * Returns the chain from top (CEO) down to the specified employee
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { PersonWithDirectoryRelations } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface GetReportingChainInput {
  personId: string;
  /** If true, excludes the target person from the chain (returns only managers above) */
  excludeTarget?: boolean;
}

export interface GetReportingChainOutput {
  chain: PersonWithDirectoryRelations[];
  /** Total depth of the chain */
  depth: number;
}

@injectable()
export class GetReportingChainUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    input: GetReportingChainInput,
  ): Promise<GetReportingChainOutput> {
    this.logger.debug("Fetching reporting chain", { personId: input.personId });

    const chain = await this.personRepository.findReportingChain(
      input.personId,
    );

    // If excludeTarget is true, remove the last person (the target)
    const finalChain =
      input.excludeTarget && chain.length > 0 ? chain.slice(0, -1) : chain;

    this.logger.debug("Reporting chain fetch complete", {
      personId: input.personId,
      chainLength: finalChain.length,
    });

    return {
      chain: finalChain,
      depth: finalChain.length,
    };
  }
}
