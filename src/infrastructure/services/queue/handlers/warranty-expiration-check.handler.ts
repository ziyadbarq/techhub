/**
 * Warranty Expiration Check Handler
 *
 * Processes warranty expiration check jobs.
 * Scans warranties expiring soon and logs alerts.
 * Can be extended to send email notifications.
 */

import type { Job } from "bullmq";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CheckWarrantyExpirationUseCase } from "@/core/use-cases/asset/warranty";
import type { ILoggerService } from "@/core/services";

/**
 * Job data type for warranty expiration check
 */
export interface WarrantyExpirationCheckJobData {
  // No specific data needed - runs as a scheduled job
  triggeredAt?: string;
}

/**
 * Handles warranty expiration check job.
 *
 * Responsibilities:
 * - Check for warranties expiring in the next 90 days
 * - Categorize alerts by severity (critical, warning, info)
 * - Log alert summary
 * - (Future) Send email notifications to asset managers
 *
 * @param job - BullMQ job instance
 */
export async function handleWarrantyExpirationCheck(
  job: Job<WarrantyExpirationCheckJobData>,
): Promise<void> {
  // Get services from DI container
  const container = getContainer();
  const checkWarrantyExpirationUseCase =
    container.get<CheckWarrantyExpirationUseCase>(
      DI_TOKENS.CheckWarrantyExpirationUseCase,
    );
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting warranty expiration check", {
    jobId: job.id,
    triggeredAt: job.data.triggeredAt,
  });

  await job.updateProgress(10);

  try {
    // Execute warranty expiration check
    const alerts = await checkWarrantyExpirationUseCase.execute();

    await job.updateProgress(70);

    // Log summary
    const summary = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };

    logger.info("Warranty expiration check completed", {
      jobId: job.id,
      summary,
    });

    // Log critical alerts
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      logger.warn("Critical warranty expirations detected", {
        jobId: job.id,
        count: criticalAlerts.length,
        alerts: criticalAlerts.map((a) => ({
          assetId: a.assetId,
          warrantyId: a.warranty.id,
          policyReference: a.warranty.policyReference,
          daysRemaining: a.daysUntilExpiration,
          endDate: a.warranty.endDate.toISOString(),
        })),
      });
    }

    /**
     * TODO: Send email notifications
     *
     * Implementation steps:
     * 1. Get asset details for each warranty (asset name, tag, etc.)
     * 2. Identify asset managers/owners for notifications
     * 3. Group alerts by recipient
     * 4. Send templated emails using IEmailService
     *
     * Example:
     * ```typescript
     * for (const alert of criticalAlerts) {
     *   const asset = await assetRepository.findById(alert.assetId);
     *   // Send email to asset manager
     *   await emailService.sendTemplatedEmail(
     *     assetManager.email,
     *     "warranty-expiration-alert",
     *     {
     *       assetName: asset.assetTag,
     *       daysRemaining: alert.daysUntilExpiration,
     *       endDate: alert.warranty.endDate,
     *       severity: alert.severity,
     *     }
     *   );
     * }
     * ```
     */

    await job.updateProgress(100);

    logger.info("Warranty expiration check job completed successfully", {
      jobId: job.id,
    });
  } catch (error) {
    logger.error(
      "Warranty expiration check failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        jobId: job.id,
      },
    );
    throw error; // Let BullMQ handle retries
  }
}
