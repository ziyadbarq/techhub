import { injectable, inject } from "inversify";
import { format } from "date-fns";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface SendReminderNotificationsRequest {
  daysBeforeStart: number;
}

export interface SendReminderNotificationsResponse {
  notificationsSent: number;
  notificationsFailed: number;
  reservationIds: string[];
}

/**
 * Background job use case that sends reminder notifications
 * for upcoming reservations via email
 */
@injectable()
export class SendReminderNotificationsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
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
    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const reservation of reservationsToNotify) {
      try {
        // Only send to person reservations (org unit reservations don't have individual emails)
        if (!reservation.reservedForPersonId) {
          continue;
        }

        // Fetch person details to get email
        const person = await this.personRepository.findById(
          reservation.reservedForPersonId,
        );
        if (!person || !person.email) {
          this.logger.warn("Person not found or no email for reservation", {
            reservationId: reservation.id,
            personId: reservation.reservedForPersonId,
          });
          continue;
        }

        // Fetch asset details to get asset tag
        const asset = await this.assetRepository.findById(reservation.assetId);
        if (!asset) {
          this.logger.warn("Asset not found for reservation", {
            reservationId: reservation.id,
            assetId: reservation.assetId,
          });
          continue;
        }

        // Send email notification
        const result = await this.emailService.sendTemplatedEmail(
          person.email,
          "reservation-reminder",
          {
            reservedForName: person.fullName,
            assetTag: asset.assetTag,
            startDate: format(reservation.startDate, "PPP"),
            endDate: format(reservation.endDate, "PPP"),
            purpose: reservation.purpose || "Not specified",
            reservationLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/asset-reservations`,
          },
        );

        if (result.success) {
          notificationsSent++;
          reservationIds.push(reservation.id);
          this.logger.info("Reservation reminder sent", {
            reservationId: reservation.id,
            email: person.email,
          });
        } else {
          notificationsFailed++;
          this.logger.error(
            "Failed to send reservation reminder",
            new Error(result.error || "Unknown error"),
            {
              reservationId: reservation.id,
              email: person.email,
            },
          );
        }
      } catch (error) {
        notificationsFailed++;
        this.logger.error(
          "Error sending reservation reminder",
          error instanceof Error ? error : new Error(String(error)),
          {
            reservationId: reservation.id,
          },
        );
      }
    }

    return {
      notificationsSent,
      notificationsFailed,
      reservationIds,
    };
  }
}
