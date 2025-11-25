/**
 * Microsoft Graph Module - DI Bindings
 *
 * This module configures all Microsoft Graph integration dependencies:
 * - Microsoft Graph Service (API client)
 * - Sync Users Use Case
 *
 * Used for synchronizing users from Microsoft Entra ID (Azure AD).
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Service Interface
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";

// Service Implementation
import { MicrosoftGraphService } from "@/infrastructure/services/microsoft-graph.service";

// Use Case
import { SyncUsersFromGraphUseCase } from "@/core/use-cases/foundation/person/sync-users-from-graph.use-case";

const diLogger = logger.scope("DI");

/**
 * Binds all Microsoft Graph dependencies to the container
 */
export function bindMicrosoftGraphDependencies(container: Container): void {
  // ==========================================
  // Microsoft Graph Service
  // ==========================================

  container
    .bind<IMicrosoftGraphService>(IMicrosoftGraphService)
    .to(MicrosoftGraphService)
    .inSingletonScope();

  // ==========================================
  // Sync Use Case
  // ==========================================

  container
    .bind<SyncUsersFromGraphUseCase>(DI_TOKENS.SyncUsersFromGraphUseCase)
    .to(SyncUsersFromGraphUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindMicrosoftGraphDependencies",
    "Microsoft Graph dependencies bound successfully",
  );
}
