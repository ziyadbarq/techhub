/**
 * CheckWarrantyExpiration Use Case
 * Business Logic: Check for expiring warranties and prepare notification data
 * Used by background jobs to send expiration alerts
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";

export interface WarrantyExpirationAlert {
  warranty: Warranty;
  assetId: string;
  daysUntilExpiration: number;
  severity: "critical" | "warning" | "info";
}

@injectable()
export class CheckWarrantyExpirationUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(): Promise<WarrantyExpirationAlert[]> {
    const alerts: WarrantyExpirationAlert[] = [];

    // Check different time windows
    const criticalDays = 7; // 7 days or less - critical
    const warningDays = 30; // 8-30 days - warning
    const infoDays = 90; // 31-90 days - info

    try {
      // Get all warranties expiring in the next 90 days
      const expiringWarranties =
        await this.warrantyRepository.findExpiringSoon(infoDays);

      this.logger.info("Checking warranty expirations", {
        context: "CheckWarrantyExpirationUseCase",
        count: expiringWarranties.length,
      });

      for (const warranty of expiringWarranties) {
        const daysRemaining = warranty.getDaysRemaining();

        let severity: "critical" | "warning" | "info";
        if (daysRemaining <= criticalDays) {
          severity = "critical";
        } else if (daysRemaining <= warningDays) {
          severity = "warning";
        } else {
          severity = "info";
        }

        alerts.push({
          warranty,
          assetId: warranty.assetId,
          daysUntilExpiration: daysRemaining,
          severity,
        });
      }

      this.logger.info("Warranty expiration check completed", {
        context: "CheckWarrantyExpirationUseCase",
        totalAlerts: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        warning: alerts.filter((a) => a.severity === "warning").length,
        info: alerts.filter((a) => a.severity === "info").length,
      });

      return alerts;
    } catch (error) {
      this.logger.error(
        "Failed to check warranty expirations",
        error instanceof Error ? error : new Error(String(error)),
        {
          context: "CheckWarrantyExpirationUseCase",
        },
      );
      throw error;
    }
  }
}
