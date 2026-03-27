/**
 * OCI Sync Module - DI Bindings
 *
 * Binds services, repositories, and use cases for OCI Cloud resource sync.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Services
import type { IOciWebhookService } from "@/core/services/oci-webhook.service.interface";
import { OciWebhookService } from "@/infrastructure/services/oci/oci-webhook.service";

// Repositories
import type { IOciSyncLogRepository } from "@/core/repositories/oci-sync-log.repository.interface";
import { PrismaOciSyncLogRepository } from "@/infrastructure/repositories/prisma-oci-sync-log.repository";

// Use Cases
import { SyncOciResourcesUseCase } from "@/core/use-cases/oci-sync/sync-oci-resources.use-case";
import { GetOciSyncLogsUseCase } from "@/core/use-cases/oci-sync/get-oci-sync-logs.use-case";

const diLogger = logger.scope("DI:OciSyncModule");

export function bindOciSyncDependencies(container: Container): void {
  // Guard against duplicate bindings (can happen with concurrent module loading)
  if (container.isBound(DI_TOKENS.IOciWebhookService)) {
    diLogger.debug(
      "bindOciSyncDependencies",
      "OCI Sync dependencies already bound, skipping",
    );
    return;
  }

  diLogger.debug("bindOciSyncDependencies", "Binding OCI Sync dependencies...");

  // ==========================================
  // Services
  // ==========================================

  container
    .bind<IOciWebhookService>(DI_TOKENS.IOciWebhookService)
    .to(OciWebhookService)
    .inSingletonScope();

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IOciSyncLogRepository>(DI_TOKENS.IOciSyncLogRepository)
    .to(PrismaOciSyncLogRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases
  // ==========================================

  container
    .bind<SyncOciResourcesUseCase>(DI_TOKENS.SyncOciResourcesUseCase)
    .to(SyncOciResourcesUseCase)
    .inTransientScope();

  container
    .bind<GetOciSyncLogsUseCase>(DI_TOKENS.GetOciSyncLogsUseCase)
    .to(GetOciSyncLogsUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindOciSyncDependencies",
    "OCI Sync dependencies bound successfully",
  );
}
