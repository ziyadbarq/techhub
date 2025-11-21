/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";

export interface SendReminderNotificationsRequest {
  daysBeforeStart: number;
}

export interface SendReminderNotificationsResponse {
  notificationsSent: number;
  reservationIds: string[];
}

/**
 * Background job use case that sends reminder notifications
 * for upcoming reservations
 */
@injectable()
export class SendReminderNotificationsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(
    request: SendReminderNotificationsRequest,
  ): Promise<SendReminderNotificationsResponse> {
    const now = new Date();
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + request.daysBeforeStart);

    const endDate = new Date(reminderDate);
    endDate.setHours(23, 59, 59, 999);

    const upcomingReservations =
      await this.reservationRepository.findInDateRange(reminderDate, endDate);

    // Filter for confirmed or pending reservations only
    const reservationsToNotify = upcomingReservations.filter(
      (res) => res.status === "CONFIRMED" || res.status === "PENDING",
    );

    const reservationIds: string[] = [];

    for (const reservation of reservationsToNotify) {
      // TODO: Implement actual notification sending (email, SMS, push, etc.)
      // For now, just track which reservations would receive notifications
      reservationIds.push(reservation.id);
    }

    return {
      notificationsSent: reservationIds.length,
      reservationIds,
    };
  }
}
