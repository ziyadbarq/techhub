/**
 * Search Module
 *
 * Binds global search dependencies to the DI container.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { PrismaSearchRepository } from "@/infrastructure/repositories/prisma-search.repository";
import type { ISearchRepository } from "@/core/repositories/search.repository.interface";
import { GlobalSearchUseCase } from "@/core/use-cases/search/global-search";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Bind search dependencies
 *
 * @param container - InversifyJS container instance
 */
export function bindSearchDependencies(container: Container): void {
  // Bind Search Repository
  container
    .bind<ISearchRepository>(DI_TOKENS.ISearchRepository)
    .to(PrismaSearchRepository)
    .inSingletonScope();

  // Bind Global Search Use Case
  container
    .bind<GlobalSearchUseCase>(DI_TOKENS.GlobalSearchUseCase)
    .to(GlobalSearchUseCase)
    .inSingletonScope();

  diLogger.debug("bindSearchDependencies", "Search dependencies bound");
}
