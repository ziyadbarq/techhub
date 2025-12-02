/**
 * Reservations Module - DI Bindings
 *
 * This module configures all Asset Reservations dependencies:
 * - Repositories (reservations, conflicts)
 * - Use cases (reservation management, conflict detection/resolution, availability checking)
 *
 * Reservations module enables booking assets for future dates with
 * conflict detection, calendar views, and automated status management
 * through background jobs.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Asset Reservation Repository
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import { PrismaAssetReservationRepository } from "@/infrastructure/repositories/prisma-asset-reservation.repository";

// Asset Reservation Conflict Repository
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import { PrismaAssetReservationConflictRepository } from "@/infrastructure/repositories/prisma-asset-reservation-conflict.repository";

// Reservation Use Cases
import {
  CreateReservationUseCase,
  GetReservationUseCase,
  ListReservationsUseCase,
  UpdateReservationUseCase,
  CancelReservationUseCase,
  ConfirmReservationUseCase,
  StartReservationUseCase,
  CompleteReservationUseCase,
  DetectConflictsUseCase,
  ResolveConflictUseCase,
  ListConflictsUseCase,
  CheckAvailabilityUseCase,
  ListAvailableAssetsUseCase,
  ActivateReadyReservationsUseCase,
  CompleteExpiredReservationsUseCase,
  SendReminderNotificationsUseCase,
} from "@/core/use-cases/reservations";

// Query Layer
import { AssetReservationsTableQuery } from "@/interface-adapters/queries";

const diLogger = logger.scope("DI");

/**
 * Load reservations module into DI container
 */
export function loadReservationsModule(container: Container): void {
  diLogger.debug("loadReservationsModule", "Loading Reservations module...");

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IAssetReservationRepository>(DI_TOKENS.IAssetReservationRepository)
    .to(PrismaAssetReservationRepository)
    .inSingletonScope();

  container
    .bind<IAssetReservationConflictRepository>(
      DI_TOKENS.IAssetReservationConflictRepository,
    )
    .to(PrismaAssetReservationConflictRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Reservation Management
  // ==========================================

  container
    .bind<CreateReservationUseCase>(DI_TOKENS.CreateReservationUseCase)
    .to(CreateReservationUseCase)
    .inSingletonScope();

  container
    .bind<GetReservationUseCase>(DI_TOKENS.GetReservationUseCase)
    .to(GetReservationUseCase)
    .inSingletonScope();

  container
    .bind<ListReservationsUseCase>(DI_TOKENS.ListReservationsUseCase)
    .to(ListReservationsUseCase)
    .inSingletonScope();

  container
    .bind<UpdateReservationUseCase>(DI_TOKENS.UpdateReservationUseCase)
    .to(UpdateReservationUseCase)
    .inSingletonScope();

  container
    .bind<CancelReservationUseCase>(DI_TOKENS.CancelReservationUseCase)
    .to(CancelReservationUseCase)
    .inSingletonScope();

  container
    .bind<ConfirmReservationUseCase>(DI_TOKENS.ConfirmReservationUseCase)
    .to(ConfirmReservationUseCase)
    .inSingletonScope();

  container
    .bind<StartReservationUseCase>(DI_TOKENS.StartReservationUseCase)
    .to(StartReservationUseCase)
    .inSingletonScope();

  container
    .bind<CompleteReservationUseCase>(DI_TOKENS.CompleteReservationUseCase)
    .to(CompleteReservationUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Conflict Management
  // ==========================================

  container
    .bind<DetectConflictsUseCase>(DI_TOKENS.DetectConflictsUseCase)
    .to(DetectConflictsUseCase)
    .inSingletonScope();

  container
    .bind<ResolveConflictUseCase>(DI_TOKENS.ResolveConflictUseCase)
    .to(ResolveConflictUseCase)
    .inSingletonScope();

  container
    .bind<ListConflictsUseCase>(DI_TOKENS.ListConflictsUseCase)
    .to(ListConflictsUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Availability Checking
  // ==========================================

  container
    .bind<CheckAvailabilityUseCase>(DI_TOKENS.CheckAvailabilityUseCase)
    .to(CheckAvailabilityUseCase)
    .inSingletonScope();

  container
    .bind<ListAvailableAssetsUseCase>(DI_TOKENS.ListAvailableAssetsUseCase)
    .to(ListAvailableAssetsUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Background Jobs
  // ==========================================

  container
    .bind<ActivateReadyReservationsUseCase>(
      DI_TOKENS.ActivateReadyReservationsUseCase,
    )
    .to(ActivateReadyReservationsUseCase)
    .inSingletonScope();

  container
    .bind<CompleteExpiredReservationsUseCase>(
      DI_TOKENS.CompleteExpiredReservationsUseCase,
    )
    .to(CompleteExpiredReservationsUseCase)
    .inSingletonScope();

  container
    .bind<SendReminderNotificationsUseCase>(
      DI_TOKENS.SendReminderNotificationsUseCase,
    )
    .to(SendReminderNotificationsUseCase)
    .inSingletonScope();

  // ==========================================
  // Query Layer - Asset Reservations
  // ==========================================

  container
    .bind<AssetReservationsTableQuery>(DI_TOKENS.AssetReservationsTableQuery)
    .to(AssetReservationsTableQuery)
    .inTransientScope();

  diLogger.debug(
    "loadReservationsModule",
    "Reservations module loaded successfully",
  );
}
