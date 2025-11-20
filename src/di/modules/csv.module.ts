/**
 * CSV Service Module
 *
 * Binds CSV service dependencies to the DI container.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { PapaParseCSVService } from "@/infrastructure/services/csv/papaparse-csv.service";
import type { ICSVService } from "@/core/services/csv.service.interface";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Bind CSV service dependencies
 *
 * @param container - InversifyJS container instance
 */
export function bindCSVServiceDependencies(container: Container): void {
  // Bind CSV service implementation
  container
    .bind<ICSVService>(DI_TOKENS.ICSVService)
    .to(PapaParseCSVService)
    .inSingletonScope();

  diLogger.debug(
    "bindCSVServiceDependencies",
    "CSV service dependencies bound",
  );
}
