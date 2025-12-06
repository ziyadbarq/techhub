/**
 * Get Two-Factor Authentication Status Use Case
 *
 * Returns whether a user has 2FA enabled and backup codes count.
 *
 * Business Rules:
 * - User must be authenticated
 * - Returns status even if 2FA is not enabled
 *
 * Layer: Application (Use Cases)
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ITwoFactorRepository } from "@/core/repositories/two-factor.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface TwoFactorStatusResult {
  enabled: boolean;
  remainingBackupCodes?: number;
  createdAt?: Date;
}

@injectable()
export class GetTwoFactorStatusUseCase {
  constructor(
    @inject(DI_TOKENS.ITwoFactorRepository)
    private readonly twoFactorRepository: ITwoFactorRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("two-factor.get-status")
  async execute(userId: string): Promise<TwoFactorStatusResult> {
    this.logger.debug("Checking 2FA status", { userId });

    const config = await this.twoFactorRepository.findByUserId(userId);

    if (!config) {
      this.logger.debug("2FA not enabled", { userId });
      return {
        enabled: false,
      };
    }

    this.logger.debug("2FA enabled", {
      userId,
      backupCodes: config.remainingBackupCodesCount(),
    });

    return {
      enabled: true,
      remainingBackupCodes: config.remainingBackupCodesCount(),
      createdAt: config.createdAt,
    };
  }
}
