/**
 * Intune Module - DI Bindings
 *
 * Binds repositories and use cases for Intune device management and compliance tracking.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type {
  IIntuneDeviceRepository,
  IIntuneComplianceHistoryRepository,
} from "@/core/repositories/intune-device.repository.interface";
import {
  PrismaIntuneDeviceRepository,
  PrismaIntuneComplianceHistoryRepository,
} from "@/infrastructure/repositories/prisma-intune-device.repository";

// Use Cases
import { SyncDevicesFromIntuneUseCase } from "@/core/use-cases/intune/sync-devices-from-intune.use-case";
import { GetIntuneDeviceUseCase } from "@/core/use-cases/intune/get-intune-device.use-case";
import { ListIntuneDevicesUseCase } from "@/core/use-cases/intune/list-intune-devices.use-case";
import { GetIntuneComplianceStatsUseCase } from "@/core/use-cases/intune/get-intune-compliance-stats.use-case";
import { LinkIntuneDeviceToAssetUseCase } from "@/core/use-cases/intune/link-intune-device-to-asset.use-case";
import { UnlinkIntuneDeviceFromAssetUseCase } from "@/core/use-cases/intune/unlink-intune-device-from-asset.use-case";
import { LinkIntuneDeviceToPersonUseCase } from "@/core/use-cases/intune/link-intune-device-to-person.use-case";
import { UnlinkIntuneDeviceFromPersonUseCase } from "@/core/use-cases/intune/unlink-intune-device-from-person.use-case";

const diLogger = logger.scope("DI:IntuneModule");

export function bindIntuneDependencies(container: Container): void {
  diLogger.debug("bindIntuneDependencies", "Binding Intune dependencies...");

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IIntuneDeviceRepository>(DI_TOKENS.IIntuneDeviceRepository)
    .to(PrismaIntuneDeviceRepository)
    .inSingletonScope();

  container
    .bind<IIntuneComplianceHistoryRepository>(
      DI_TOKENS.IIntuneComplianceHistoryRepository,
    )
    .to(PrismaIntuneComplianceHistoryRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases
  // ==========================================

  // Sync Use Case
  container
    .bind<SyncDevicesFromIntuneUseCase>(DI_TOKENS.SyncDevicesFromIntuneUseCase)
    .to(SyncDevicesFromIntuneUseCase)
    .inTransientScope();

  // Query Use Cases
  container
    .bind<GetIntuneDeviceUseCase>(DI_TOKENS.GetIntuneDeviceUseCase)
    .to(GetIntuneDeviceUseCase)
    .inTransientScope();

  container
    .bind<ListIntuneDevicesUseCase>(DI_TOKENS.ListIntuneDevicesUseCase)
    .to(ListIntuneDevicesUseCase)
    .inTransientScope();

  container
    .bind<GetIntuneComplianceStatsUseCase>(
      DI_TOKENS.GetIntuneComplianceStatsUseCase,
    )
    .to(GetIntuneComplianceStatsUseCase)
    .inTransientScope();

  // Link/Unlink to Asset Use Cases
  container
    .bind<LinkIntuneDeviceToAssetUseCase>(
      DI_TOKENS.LinkIntuneDeviceToAssetUseCase,
    )
    .to(LinkIntuneDeviceToAssetUseCase)
    .inTransientScope();

  container
    .bind<UnlinkIntuneDeviceFromAssetUseCase>(
      DI_TOKENS.UnlinkIntuneDeviceFromAssetUseCase,
    )
    .to(UnlinkIntuneDeviceFromAssetUseCase)
    .inTransientScope();

  // Link/Unlink to Person Use Cases
  container
    .bind<LinkIntuneDeviceToPersonUseCase>(
      DI_TOKENS.LinkIntuneDeviceToPersonUseCase,
    )
    .to(LinkIntuneDeviceToPersonUseCase)
    .inTransientScope();

  container
    .bind<UnlinkIntuneDeviceFromPersonUseCase>(
      DI_TOKENS.UnlinkIntuneDeviceFromPersonUseCase,
    )
    .to(UnlinkIntuneDeviceFromPersonUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindIntuneDependencies",
    "Intune dependencies bound successfully",
  );
}
